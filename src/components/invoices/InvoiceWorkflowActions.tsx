/**
 * InvoiceWorkflowActions — barre d'actions du cycle documentaire unifié
 * DQE → Devis → Contrat → Décompte(%) → Facture finale.
 *
 * 100 % référentiel (`invoice-document-types.referential`) : les étapes, statuts
 * et TypeCode Factur-X ne sont jamais codés en dur. Les traitements passent par
 * `InvoiceWorkflowService` (transformation) et `InvoiceGenerationService`
 * (PDF + XML Factur-X).
 */
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowRightCircle, FileCode2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqSource } from '@/domain/entities/boq/BoqLine';
import { InvoiceWorkflowService } from '@/application/services/invoice/InvoiceWorkflowService';
import { InvoiceGenerationService } from '@/application/services/invoice/InvoiceGenerationService';
import {
  getInvoiceDocumentType,
  type InvoiceActor,
  type InvoiceDocumentType,
} from '@/config/referentials/invoices/invoice-document-types.referential';

interface Props {
  documentType: InvoiceDocumentType;
  actor: InvoiceActor;
  lines: BoqLineDTO[];
  contextId: string;
  targetSource?: BoqSource;
  projectId?: string;
  tenderId?: string;
  sellerName?: string;
  buyerName?: string;
  fiscalProfileCode?: string | null;
  docPrefix?: string;
  disabled?: boolean;
  onTransformed?: (documentId: string, type: InvoiceDocumentType) => void;
}

export const InvoiceWorkflowActions: React.FC<Props> = ({
  documentType,
  actor,
  lines,
  contextId,
  targetSource,
  projectId,
  tenderId,
  sellerName,
  buyerName,
  fiscalProfileCode,
  docPrefix,
  disabled,
  onTransformed,
}) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [pctOpen, setPctOpen] = useState(false);
  const [percentage, setPercentage] = useState(30);

  const def = useMemo(() => getInvoiceDocumentType(documentType), [documentType]);
  const nextType = InvoiceWorkflowService.nextType(documentType);
  const nextDef = nextType ? getInvoiceDocumentType(nextType) : null;
  const allowed = nextDef ? nextDef.actors.includes(actor) : false;
  const noLines = lines.length === 0;

  const runTransform = async (pct?: number) => {
    setBusy('transform');
    try {
      const res = await InvoiceWorkflowService.transform({
        fromType: documentType,
        lines,
        sourceContextId: contextId,
        targetSource,
        projectId,
        tenderId,
        percentage: pct,
        actor,
        title: nextDef?.label,
      });
      toast({
        title: `${nextDef?.label} créé`,
        description: `${res.lines.length} ligne(s) — ${res.totalHt.toLocaleString('fr-FR')} HT — TypeCode ${res.facturxTypeCode} — statut « ${res.status} »`,
      });
      window.dispatchEvent(
        new CustomEvent('boq-transfer-next', { detail: { contextId, documentId: res.documentId, stage: res.documentType } }),
      );
      onTransformed?.(res.documentId, res.documentType);
      setPctOpen(false);
    } catch (e) {
      toast({
        title: 'Transformation impossible',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const handleFacturX = async () => {
    setBusy('facturx');
    try {
      await InvoiceGenerationService.generateAndDownload({
        documentType,
        lines,
        fiscalProfileCode: fiscalProfileCode ?? null,
        percentage: null,
        seller: { name: sellerName || 'Émetteur', country: 'MR' },
        buyer: { name: buyerName || 'Destinataire', country: 'MR' },
        documentContext: {
          title: def.label,
          docPrefix: docPrefix ?? def.code,
          projectId,
          tenderId,
          contextId,
        },
      });
      toast({ title: 'PDF + XML Factur-X générés', description: `TypeCode ${def.facturxTypeCode}` });
    } catch (e) {
      toast({
        title: 'Génération impossible',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const spinner = (k: string) => (busy === k ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="self-center">
          {def.label} · Factur-X {def.facturxTypeCode}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={handleFacturX}
          disabled={disabled || noLines || busy !== null}
          title="Générer le PDF contextuel et le XML Factur-X (EN 16931)"
        >
          {spinner('facturx') ?? <FileCode2 className="h-4 w-4 mr-2" />}
          PDF + Factur-X
        </Button>
        {nextDef && allowed && (
          <Button
            size="sm"
            onClick={() => (nextDef.requiresPercentage ? setPctOpen(true) : runTransform())}
            disabled={disabled || noLines || busy !== null}
            title={getInvoiceDocumentType(documentType).nextActionLabel}
          >
            {spinner('transform') ?? <ArrowRightCircle className="h-4 w-4 mr-2" />}
            {def.nextActionLabel ?? `Transformer en ${nextDef.label}`}
          </Button>
        )}
      </div>

      <Dialog open={pctOpen} onOpenChange={setPctOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{nextDef?.label}</DialogTitle>
            <DialogDescription>
              Les quantités sont proratisées selon l'avancement facturé, conformément au référentiel documentaire.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="invoice-workflow-pct">Avancement facturé (%)</Label>
            <Input
              id="invoice-workflow-pct"
              type="number"
              min={1}
              max={100}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value) || 0)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPctOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => runTransform(percentage)} disabled={busy !== null}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceWorkflowActions;
