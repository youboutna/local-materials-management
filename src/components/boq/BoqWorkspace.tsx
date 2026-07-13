/**
 * BoqWorkspace — composant mutualisé de gestion BOQ pour 3 contextes existants :
 *  - Projet DQE prévisionnel      (source='dqe' | 'quantity_takeoff', mode='planning')
 *  - Portail fournisseur / Devis  (source='tender_estimate',           mode='bid')
 *  - Portail fournisseur / Factures (source='supplier_bid',            mode='invoice')
 *
 * Fournit dans un seul bloc, sans ouvrir de nouvelle page/onglet :
 *   • Saisie manuelle inline (formulaire compact + createLine)
 *   • Import multi-format PDF/Excel/CSV via BoqImportDialog (parseur unifié)
 *   • Édition / suppression inline via BoqLineTable (updateLine / deleteLine)
 *   • Récap fiscal HT / TVA / RAS / TTC via BoqCalculatorService
 *   • Génération devis/facture CSV via DevisGenerator + téléchargement
 *   • Envoi par email via edge function send-email-notification
 *   • Alignement planification via TenderToPlanningService (mode planning/bid)
 *
 * N'accède jamais à supabase.from() directement. Toute écriture passe par
 * useBoqDocument (hexagonal).
 */
import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, Plus, Download, ArrowRightCircle, Loader2, Send, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { BoqLineTable } from './BoqLineTable';
import { BoqImportDialog } from './BoqImportDialog';
import { BoqDevisDialog, type BoqDevisMode } from './BoqDevisDialog';

import { useBoqDocument } from '@/hooks/hexagonal/useBoqDocument';
import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import { DevisGenerator } from '@/application/services/boq/DevisGenerator';
import { tenderToPlanningService } from '@/application/services/tender/TenderToPlanningService';
import { supabase } from '@/integrations/supabase/client';
import { useMaterialsHex } from '@/hooks/hexagonal/useMaterialsHex';
import { BOQ_FISCAL_PROFILES, getFiscalProfile } from '@/config/referentials/boq/default-values.referential';
import type { BoqSource, BoqResourceType } from '@/domain/boq/BoqLine';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { ReferentialType } from '@/config/referentials';

type ManualCategory = 'material' | 'labour' | 'equipment' | 'overhead';
const catToResource = (c: ManualCategory): BoqResourceType =>
  c === 'labour' ? 'labor' : c === 'equipment' ? 'equipment' : 'material';
const UNITS = ['u', 'ml', 'm2', 'm3', 'kg', 'h', 'j', 'ff', 'ens', 'lot'];


export type BoqWorkspaceMode = 'planning' | 'bid' | 'invoice';

interface Props {
  source: BoqSource;
  contextId: string;
  projectId?: string;
  mode: BoqWorkspaceMode;
  referentialCode?: ReferentialType;
  /** cible d'alignement planification (mode bid uniquement) */
  estimateId?: string;
  emptyLabel?: string;
  importLabel?: string;
  /** email destinataire par défaut pour "envoyer devis" */
  defaultEmail?: string;
}

const LABELS: Record<BoqWorkspaceMode, { import: string; empty: string; devis: string; docPrefix: string }> = {
  planning: { import: 'Importer un DQE',      empty: 'Aucune ligne DQE. Importez, saisissez ou calculez.',    devis: 'Exporter DQE',    docPrefix: 'dqe' },
  bid:      { import: 'Importer un chiffrage', empty: 'Aucune ligne de devis. Importez ou saisissez.',         devis: 'Générer devis',   docPrefix: 'devis' },
  invoice:  { import: 'Analyser une facture',  empty: 'Aucune facture analysée. Importez un PDF/Excel/CSV.',    devis: 'Générer facture', docPrefix: 'facture' },
};

export function BoqWorkspace({
  source, contextId, projectId, mode,
  referentialCode, estimateId,
  emptyLabel, importLabel, defaultEmail,
}: Props) {
  const doc = useBoqDocument({ source, contextId, projectId });
  const { toast } = useToast();
  const labels = LABELS[mode];

  // ---- Saisie manuelle inline (alignée sur TenderEstimatorForm) --------------
  const [openManual, setOpenManual] = useState(false);
  const { materials } = useMaterialsHex();
  const [fiscalCode, setFiscalCode] = useState<string>('MR_STANDARD');
  const [category, setCategory] = useState<ManualCategory>('material');
  const [materialId, setMaterialId] = useState<string>('');
  const [form, setForm] = useState<Partial<BoqLineDTO>>({
    designation: '', unit: 'u', quantity: 1, unitPrice: 0,
  });
  const resetForm = () => {
    setForm({ designation: '', unit: 'u', quantity: 1, unitPrice: 0 });
    setMaterialId(''); setCategory('material');
  };

  const onPickMaterial = (id: string) => {
    setMaterialId(id);
    const m = materials.find((x) => x.id === id);
    if (m) {
      setForm((f) => ({
        ...f,
        designation: m.name,
        unit: m.unit || f.unit || 'u',
        unitPrice: m.pricePerUnit ?? f.unitPrice ?? 0,
      }));
    }
  };

  const manualPreview = useMemo(() => {
    const q = Number(form.quantity) || 0;
    const pu = Number(form.unitPrice) || 0;
    const ht = q * pu;
    const profile = getFiscalProfile(fiscalCode);
    const tva = ht * profile.vatRate;
    return { ht, tva, ttc: ht + tva, ras: ht * profile.withholdingRate };
  }, [form.quantity, form.unitPrice, fiscalCode]);

  const handleCreate = async () => {
    if (!form.designation?.trim()) {
      toast({ title: 'Désignation requise', variant: 'destructive' });
      return;
    }
    const profile = getFiscalProfile(fiscalCode);
    try {
      await doc.createLine({
        source, contextId,
        designation: form.designation!,
        unit: form.unit || 'u',
        quantity: Number(form.quantity) || 0,
        unitPrice: Number(form.unitPrice) || 0,
        resourceType: catToResource(category),
        materialId: materialId || null,
        phaseId: form.phaseId ?? null,
        vatRate: profile.vatRate,
        note: category === 'overhead' ? 'Frais généraux' : null,
        sourceType: 'rapide',
      });
      toast({ title: 'Ligne ajoutée' });
      resetForm();
      setOpenManual(false);
    } catch (e) {
      toast({ title: 'Échec ajout', description: String(e instanceof Error ? e.message : e), variant: 'destructive' });
    }
  };

  // ---- Édition inline --------------------------------------------------------
  const handlePatch = async (index: number, patch: Partial<BoqLineDTO>) => {
    const line = doc.lines[index];
    if (!line?.id) return;
    try { await doc.updateLine(line.id, patch); } catch (e) {
      toast({ title: 'Échec mise à jour', description: String(e instanceof Error ? e.message : e), variant: 'destructive' });
    }
  };
  const handleRemove = async (index: number) => {
    const line = doc.lines[index];
    if (!line?.id) return;
    try { await doc.deleteLine(line.id, source); } catch (e) {
      toast({ title: 'Échec suppression', variant: 'destructive' });
    }
  };

  // ---- Récap fiscal ----------------------------------------------------------
  const totals = useMemo(() => BoqCalculatorService.aggregate(doc.lines), [doc.lines]);

  // ---- Devis / Facture : PDF + e-signature + email via BoqDevisDialog --------
  const devisMode: BoqDevisMode = mode === 'invoice' ? 'facture' : mode === 'bid' ? 'devis' : 'dqe';

  const buildCsv = () => {
    const devis = DevisGenerator.aggregate(doc.lines, 'phaseId');
    return DevisGenerator.toCsv(devis);
  };
  const csvFileName = () => `${labels.docPrefix}_${contextId.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.csv`;

  const downloadCsv = () => {
    const csv = buildCsv();
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFileName();
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast({ title: 'Export CSV téléchargé' });
  };

  // ---- Envoyer CSV par email (sans PDF, léger) -------------------------------
  const [csvEmailOpen, setCsvEmailOpen] = useState(false);
  const [csvEmailTo, setCsvEmailTo] = useState(defaultEmail ?? '');
  const [csvEmailSubject, setCsvEmailSubject] = useState(`${labels.devis} — ${contextId.slice(0, 8)}`);
  const [csvSending, setCsvSending] = useState(false);
  const sendCsvEmail = async () => {
    if (!csvEmailTo) { toast({ title: 'Email destinataire requis', variant: 'destructive' }); return; }
    setCsvSending(true);
    try {
      const csv = buildCsv();
      const b64 = btoa(unescape(encodeURIComponent(`\uFEFF${csv}`)));
      const { error } = await supabase.functions.invoke('send-email-notification', {
        body: JSON.stringify({
          to: csvEmailTo,
          subject: csvEmailSubject,
          html: `<p>Bonjour,</p><p>Veuillez trouver ci-joint le fichier CSV <strong>${csvEmailSubject}</strong> (${doc.lines.length} lignes).</p><p>Total HT : ${totals.totalHt.toLocaleString('fr-FR')} MRU — TTC : ${totals.totalTtc.toLocaleString('fr-FR')} MRU</p>`,
          attachments: [{ filename: csvFileName(), content: b64, contentType: 'text/csv', encoding: 'base64' }],
        }),
      });
      if (error) throw error;
      toast({ title: 'CSV envoyé', description: csvEmailTo });
      setCsvEmailOpen(false);
    } catch (e) {
      toast({ title: 'Envoi CSV échoué', description: String(e instanceof Error ? e.message : e), variant: 'destructive' });
    } finally { setCsvSending(false); }
  };

  // ---- Diffusion contextuelle (offre technique/commerciale, EB, BC, décompte)
  type DiffusePreset = { key: string; label: string; title: string; notes: string; email?: string };
  const diffusePresets: DiffusePreset[] = useMemo(() => {
    const shortId = contextId.slice(0, 8);
    if (mode === 'bid') {
      return [
        { key: 'offre-tech', label: 'Joindre à l\'offre technique', title: `Offre technique — ${shortId}`, notes: 'Pièce jointe au dossier d\'offre technique (chiffrage détaillé HT/TVA/TTC).' },
        { key: 'offre-com',  label: 'Joindre à l\'offre commerciale', title: `Offre commerciale — ${shortId}`, notes: 'Pièce jointe à l\'offre commerciale : prix unitaires, quantités, totaux TTC.' },
      ];
    }
    if (mode === 'planning') {
      return [
        { key: 'eb',  label: 'Expression de besoin (co-équipier)', title: `Expression de besoin — ${shortId}`, notes: 'Merci de valider les quantités et matériaux listés avant lancement des achats.' },
        { key: 'bc',  label: 'Bon de commande fournisseur',         title: `Bon de commande — ${shortId}`, notes: 'Bon de commande pour décompte projet. Merci de confirmer disponibilité, délais et prix.' },
        { key: 'dec', label: 'Décompte projet (interne)',            title: `Décompte projet — ${shortId}`, notes: 'Décompte des quantités et coûts par phase pour suivi budgétaire.' },
      ];
    }
    return [
      { key: 'dec-fact', label: 'Décompte facture (validation)', title: `Décompte facture — ${shortId}`, notes: 'Analyse détaillée de la facture pour validation comptable et rapprochement projet.' },
    ];
  }, [mode, contextId]);

  const [diffuseOpen, setDiffuseOpen] = useState(false);
  const [diffusePreset, setDiffusePreset] = useState<DiffusePreset | null>(null);
  const openDiffuse = (p: DiffusePreset) => { setDiffusePreset(p); setDiffuseOpen(true); };



  // ---- Alignement planification (mode bid → project planning) ----------------
  const [aligning, setAligning] = useState(false);
  const handleAlignPlanning = async () => {
    if (!projectId || !estimateId) {
      toast({ title: 'Contexte incomplet', description: 'projectId + estimateId requis', variant: 'destructive' });
      return;
    }
    setAligning(true);
    try {
      const res = await tenderToPlanningService.convert({ estimateId, projectId });
      toast({ title: 'Aligné à la planification', description: `${res.linesCopied} lignes → ${res.distinctPhases.length} phases` });
      window.dispatchEvent(new CustomEvent('boq-kpi-refresh'));
    } catch (e) {
      toast({ title: 'Échec alignement', description: String(e instanceof Error ? e.message : e), variant: 'destructive' });
    } finally { setAligning(false); }
  };

  // ---- Render ---------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {doc.lines.length} ligne(s)
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={openManual} onOpenChange={setOpenManual}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Saisie manuelle</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Ajouter une ligne</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Désignation</Label>
                  <Input value={form.designation ?? ''} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                </div>
                <div>
                  <Label>Unité</Label>
                  <Input value={form.unit ?? ''} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.resourceType ?? 'material'} onValueChange={(v) => setForm({ ...form, resourceType: v as BoqResourceType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Matériau</SelectItem>
                      <SelectItem value="labor">Main-d'œuvre</SelectItem>
                      <SelectItem value="equipment">Équipement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantité</Label>
                  <Input type="number" value={form.quantity ?? 0} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>PU (MRU)</Label>
                  <Input type="number" value={form.unitPrice ?? 0} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenManual(false)}>Annuler</Button>
                <Button onClick={handleCreate} disabled={doc.isPending}>
                  {doc.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <BoqImportDialog
            source={source}
            contextId={contextId}
            projectId={projectId}
            defaultReferentialCode={referentialCode}
            title={importLabel ?? labels.import}
            trigger={
              <Button size="sm" variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-1" />{importLabel ?? labels.import}
              </Button>
            }
            onImported={() => doc.refetch()}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" disabled={!doc.lines.length} title="Export CSV et envoi par email">
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadCsv}>
                <Download className="h-4 w-4 mr-2" />Télécharger CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCsvEmailOpen(true)}>
                <Mail className="h-4 w-4 mr-2" />Envoyer CSV par email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <BoqDevisDialog
            lines={doc.lines}
            mode={devisMode}
            contextId={contextId}
            defaultTitle={`${labels.devis} — ${contextId.slice(0, 8)}`}
            defaultEmail={defaultEmail}
            triggerLabel={labels.devis}
          />

          {/* Diffusion contextuelle : PDF signé + CSV joint */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={!doc.lines.length}>
                <Send className="h-4 w-4 mr-1" />Diffuser
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Joindre PDF signé + CSV à…</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {diffusePresets.map((p) => (
                <DropdownMenuItem key={p.key} onClick={() => openDiffuse(p)}>
                  <Send className="h-4 w-4 mr-2" />{p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dialog contrôlé pour la diffusion contextuelle (PDF + CSV joints) */}
          {diffusePreset && (
            <BoqDevisDialog
              lines={doc.lines}
              mode={devisMode}
              contextId={contextId}
              defaultTitle={diffusePreset.title}
              defaultEmail={diffusePreset.email ?? defaultEmail}
              defaultNotes={diffusePreset.notes}
              attachCsv
              csvContent={buildCsv()}
              hideTrigger
              open={diffuseOpen}
              onOpenChange={setDiffuseOpen}
            />
          )}

          {mode === 'bid' && projectId && estimateId && (
            <Button size="sm" onClick={handleAlignPlanning} disabled={aligning}>
              {aligning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ArrowRightCircle className="h-4 w-4 mr-1" />}
              Aligner à la planification
            </Button>
          )}
        </div>
      </div>

      {/* Dialog Envoyer CSV par email */}
      <Dialog open={csvEmailOpen} onOpenChange={setCsvEmailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Envoyer le CSV par email</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Destinataire</Label>
              <Input type="email" value={csvEmailTo} onChange={(e) => setCsvEmailTo(e.target.value)} placeholder="destinataire@example.com" />
            </div>
            <div>
              <Label>Objet</Label>
              <Input value={csvEmailSubject} onChange={(e) => setCsvEmailSubject(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCsvEmailOpen(false)}>Annuler</Button>
            <Button onClick={sendCsvEmail} disabled={csvSending}>
              {csvSending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Récap fiscal */}
      <div className="rounded-md border bg-muted/30 p-3 text-sm grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><div className="text-muted-foreground">Total HT</div><div className="font-medium">{totals.totalHt.toLocaleString('fr-FR')} MRU</div></div>
        <div><div className="text-muted-foreground">TVA</div><div className="font-medium">{totals.totalTva.toLocaleString('fr-FR')} MRU</div></div>
        {'totalRas' in totals && (totals as { totalRas?: number }).totalRas ? (
          <div><div className="text-muted-foreground">RAS</div><div className="font-medium">{(totals as { totalRas: number }).totalRas.toLocaleString('fr-FR')} MRU</div></div>
        ) : <div />}
        <div><div className="text-muted-foreground">Total TTC</div><div className="font-semibold">{totals.totalTtc.toLocaleString('fr-FR')} MRU</div></div>
      </div>


      {/* Tableau éditable */}
      {doc.isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement…</div>
      ) : (
        <BoqLineTable
          lines={doc.lines}
          emptyLabel={emptyLabel ?? labels.empty}
          editable
          referentialCode={referentialCode}
          onChange={handlePatch}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}
