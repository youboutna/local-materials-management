/**
 * BoqDevisDialog — génération devis/facture PDF depuis BoqLineDTO[]
 * avec e-signature (dessin/upload) + téléchargement + envoi email.
 *
 * Réutilise DevisPDFDocument (@react-pdf/renderer) et l'edge function
 * send-email-notification. N'accède jamais à supabase.from() directement.
 */
import React, { useMemo, useRef, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileDown, Mail, Upload, CheckCircle, Loader2, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DevisPDFDocument } from '@/components/reports/pdf/DevisPDFDocument';
import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import { supabase } from '@/integrations/supabase/client';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { EstimateData, EstimateItem, ExportConfig } from '@/dtos/transforms/shared';

export type BoqDevisMode = 'devis' | 'facture' | 'dqe';

interface Props {
  lines: BoqLineDTO[];
  mode: BoqDevisMode;
  contextId: string;
  defaultTitle?: string;
  defaultEmail?: string;
  triggerLabel?: string;
  /** notes/HTML additionnel pré-rempli (ex. « Expression de besoin ») */
  defaultNotes?: string;
  /** joindre le CSV brut au mail en plus du PDF */
  attachCsv?: boolean;
  /** contenu CSV à joindre (ignoré si attachCsv=false) */
  csvContent?: string;
  /** contrôle externe de l'ouverture (préset diffusion) */
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  /** masque le bouton déclencheur si contrôle externe */
  hideTrigger?: boolean;
}

function lineToItem(l: BoqLineDTO): EstimateItem {
  const t = BoqCalculatorService.computeTotals(l);
  return {
    id: l.id,
    material_id: l.materialId ?? null,
    quantity: t.quantity,
    unit_price: l.unitPrice ?? 0,
    total_price: t.totalHt,
    description: l.designation,
    item_type: l.resourceType ?? 'material',
  };
}

export function BoqDevisDialog({ lines, mode, contextId, defaultTitle, defaultEmail, triggerLabel }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [signature, setSignature] = useState<string>('');

  const totals = useMemo(() => BoqCalculatorService.aggregate(lines), [lines]);

  const label = mode === 'facture' ? 'Facture' : mode === 'dqe' ? 'DQE' : 'Devis';
  const [config, setConfig] = useState<ExportConfig>({
    title: defaultTitle ?? `${label} — ${contextId.slice(0, 8)}`,
    includeCompanyHeader: true,
    includeItemDetails: true,
    includePriceBreakdown: true,
    includeTermsConditions: mode !== 'facture',
    includeSignature: false,
    termsConditions:
`CONDITIONS GÉNÉRALES:
1. Validité : 30 jours à compter de la date d'émission
2. Modalités de paiement : selon contrat
3. Prix fermes hors révision exceptionnelle
4. Conformité aux normes en vigueur`,
    recipientEmail: defaultEmail ?? '',
    notes: '',
    signatoryName: '',
    signatoryTitle: '',
    validityPeriod: 30,
  });

  // ---- Signature drawing ---
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; if (!c) return;
    setDrawing(true);
    const r = c.getBoundingClientRect();
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  };
  const doDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const c = canvasRef.current; if (!c) return;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke();
  };
  const stopDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    const c = canvasRef.current; if (c) setSignature(c.toDataURL());
  };
  const clearSig = () => {
    const c = canvasRef.current; if (!c) return;
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    setSignature('');
  };
  const uploadSig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setSignature(String(ev.target?.result ?? ''));
    r.readAsDataURL(f);
  };

  // ---- PDF generation ---
  const buildPdfBlob = async (): Promise<{ blob: Blob; fileName: string }> => {
    const estimate: EstimateData = {
      id: contextId,
      estimate_type: mode,
      total_materials_cost: lines.filter(l => l.resourceType === 'material').reduce((s, l) => s + (BoqCalculatorService.computeTotals(l).totalHt), 0),
      total_labor_cost: lines.filter(l => l.resourceType === 'labor').reduce((s, l) => s + (BoqCalculatorService.computeTotals(l).totalHt), 0),
      total_equipment_cost: lines.filter(l => l.resourceType === 'equipment').reduce((s, l) => s + (BoqCalculatorService.computeTotals(l).totalHt), 0),
      subtotal: totals.totalHt,
      tax_rate: lines[0]?.vatRate ? Math.round((lines[0].vatRate ?? 0) * 100) : 16,
      tax_amount: totals.totalTva,
      total_with_tax: totals.totalTtc,
      overhead_percentage: 0,
      overhead_amount: 0,
      profit_margin_percentage: 0,
      profit_margin_amount: 0,
      final_total: totals.totalTtc,
      currency: 'MRU',
      status: 'draft',
    };
    const items = lines.map(lineToItem);
    const pseudoTender = { title: config.title, projectReference: contextId };
    const doc = (
      <DevisPDFDocument
        estimate={estimate}
        estimateItems={items}
        tender={pseudoTender}
        config={config}
      />
    );
    const blob = await pdf(doc).toBlob();
    const fileName = `${mode}-${contextId.slice(0, 8)}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    return { blob, fileName };
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { blob, fileName } = await buildPdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast({ title: `${label} téléchargé` });
    } catch (e) {
      toast({ title: 'Erreur PDF', description: String(e instanceof Error ? e.message : e), variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleSendEmail = async () => {
    if (!config.recipientEmail) { toast({ title: 'Email destinataire requis', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const { blob, fileName } = await buildPdfBlob();
      const buf = await blob.arrayBuffer();
      let bin = ''; const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      const { error } = await supabase.functions.invoke('send-email-notification', {
        body: JSON.stringify({
          to: config.recipientEmail,
          subject: `${label} — ${config.title}`,
          html: `<p>Bonjour,</p>
                 <p>Veuillez trouver ci-joint le ${label.toLowerCase()} <strong>${config.title}</strong>.</p>
                 <p>Total HT : ${totals.totalHt.toLocaleString('fr-FR')} MRU<br/>
                 TVA : ${totals.totalTva.toLocaleString('fr-FR')} MRU<br/>
                 <strong>Total TTC : ${totals.totalTtc.toLocaleString('fr-FR')} MRU</strong></p>
                 ${config.includeSignature && signature ? `<p>Signé par : ${config.signatoryName ?? ''} ${config.signatoryTitle ? `(${config.signatoryTitle})` : ''}</p><img src="${signature}" style="max-height:80px" />` : ''}`,
          attachments: [{
            filename: fileName,
            content: b64,
            contentType: 'application/pdf',
            encoding: 'base64',
          }],
        }),
      });
      if (error) throw error;
      toast({ title: 'Email envoyé', description: config.recipientEmail });
      setOpen(false);
    } catch (e) {
      toast({ title: 'Envoi échoué', description: String(e instanceof Error ? e.message : e), variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={!lines.length}>
          <FileDown className="h-4 w-4 mr-1" />{triggerLabel ?? `Générer ${label}`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileDown className="h-5 w-5" />Générer {label} PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label>Titre</Label>
                <Input value={config.title} onChange={(e) => setConfig(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <Label>Validité (jours)</Label>
                <Input type="number" value={config.validityPeriod} onChange={(e) => setConfig(p => ({ ...p, validityPeriod: parseInt(e.target.value) || 30 }))} />
              </div>
              <div>
                <Label>Email destinataire (optionnel)</Label>
                <Input type="email" value={config.recipientEmail} onChange={(e) => setConfig(p => ({ ...p, recipientEmail: e.target.value }))} placeholder="client@example.com" />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Sections</Label>
              {[
                ['includeCompanyHeader', 'En-tête entreprise'],
                ['includeItemDetails', 'Détail des postes'],
                ['includePriceBreakdown', 'Récap financier'],
                ['includeTermsConditions', 'Conditions générales'],
                ['includeSignature', 'Signature'],
              ].map(([k, l]) => (
                <div key={k} className="flex items-center justify-between">
                  <Label className="text-sm">{l}</Label>
                  <Switch checked={(config as unknown as Record<string, unknown>)[k] as boolean} onCheckedChange={(v) => setConfig(p => ({ ...p, [k]: v }))} />
                </div>
              ))}
            </div>
          </div>

          {config.includeTermsConditions && (
            <div>
              <Label>Conditions générales</Label>
              <Textarea value={config.termsConditions} onChange={(e) => setConfig(p => ({ ...p, termsConditions: e.target.value }))} rows={4} />
            </div>
          )}

          <div>
            <Label>Notes complémentaires</Label>
            <Textarea value={config.notes} onChange={(e) => setConfig(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>

          {config.includeSignature && (
            <div className="space-y-3">
              <Separator />
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Nom signataire</Label>
                  <Input value={config.signatoryName} onChange={(e) => setConfig(p => ({ ...p, signatoryName: e.target.value }))} />
                </div>
                <div>
                  <Label>Fonction</Label>
                  <Input value={config.signatoryTitle} onChange={(e) => setConfig(p => ({ ...p, signatoryTitle: e.target.value }))} />
                </div>
              </div>
              <div className="border-2 border-dashed rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <PenTool className="h-4 w-4" />
                  <span className="text-sm font-medium">Signature électronique</span>
                  {signature && <Badge variant="default" className="ml-auto"><CheckCircle className="h-3 w-3 mr-1" />Signée</Badge>}
                </div>
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={140}
                  className="border rounded bg-background w-full cursor-crosshair"
                  onMouseDown={startDraw} onMouseMove={doDraw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  style={{ touchAction: 'none' }}
                />
                <div className="flex gap-2 mt-2">
                  <Button type="button" size="sm" variant="outline" onClick={clearSig}>Effacer</Button>
                  <input id="sig-upload" type="file" accept="image/*" className="hidden" onChange={uploadSig} />
                  <Button type="button" size="sm" variant="outline" asChild>
                    <label htmlFor="sig-upload" className="cursor-pointer"><Upload className="h-4 w-4 mr-1" />Importer</label>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button variant="outline" onClick={handleDownload} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}Télécharger PDF
            </Button>
            {config.recipientEmail && (
              <Button onClick={handleSendEmail} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}Envoyer par email
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
