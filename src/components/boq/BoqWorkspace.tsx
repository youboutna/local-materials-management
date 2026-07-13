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
import { FileSpreadsheet, Plus, Download, ArrowRightCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BoqLineTable } from './BoqLineTable';
import { BoqImportDialog } from './BoqImportDialog';
import { BoqDevisDialog, type BoqDevisMode } from './BoqDevisDialog';

import { useBoqDocument } from '@/hooks/hexagonal/useBoqDocument';
import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import { DevisGenerator } from '@/application/services/boq/DevisGenerator';
import { tenderToPlanningService } from '@/application/services/tender/TenderToPlanningService';
import type { BoqSource, BoqResourceType } from '@/domain/boq/BoqLine';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { ReferentialType } from '@/config/referentials';


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

  // ---- Saisie manuelle inline ------------------------------------------------
  const [openManual, setOpenManual] = useState(false);
  const [form, setForm] = useState<Partial<BoqLineDTO>>({
    designation: '', unit: 'u', quantity: 1, unitPrice: 0, resourceType: 'material',
  });
  const resetForm = () => setForm({ designation: '', unit: 'u', quantity: 1, unitPrice: 0, resourceType: 'material' });

  const handleCreate = async () => {
    if (!form.designation?.trim()) {
      toast({ title: 'Désignation requise', variant: 'destructive' });
      return;
    }
    try {
      await doc.createLine({
        source, contextId,
        designation: form.designation!,
        unit: form.unit || 'u',
        quantity: Number(form.quantity) || 0,
        unitPrice: Number(form.unitPrice) || 0,
        resourceType: (form.resourceType as BoqResourceType) ?? 'material',
        phaseId: form.phaseId ?? null,
        vatRate: 0.16,
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

  const downloadCsv = () => {
    const devis = DevisGenerator.aggregate(doc.lines, 'phaseId');
    const csv = DevisGenerator.toCsv(devis);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${labels.docPrefix}_${contextId.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast({ title: 'Export CSV téléchargé' });
  };


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

          <Button size="sm" variant="ghost" onClick={downloadCsv} disabled={!doc.lines.length} title="Export CSV brut">
            <Download className="h-4 w-4 mr-1" />CSV
          </Button>

          <BoqDevisDialog
            lines={doc.lines}
            mode={devisMode}
            contextId={contextId}
            defaultTitle={`${labels.devis} — ${contextId.slice(0, 8)}`}
            defaultEmail={defaultEmail}
            triggerLabel={labels.devis}
          />


          {mode === 'bid' && projectId && estimateId && (
            <Button size="sm" onClick={handleAlignPlanning} disabled={aligning}>
              {aligning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ArrowRightCircle className="h-4 w-4 mr-1" />}
              Aligner à la planification
            </Button>
          )}
        </div>
      </div>

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
