/**
 * InvoiceWorkflowActions — barre d'actions du cycle documentaire unifié
 * DQE → Devis → Contrat → Décompte(%) → Facture finale.
 *
 * 100 % référentiel (`invoice-document-types.referential`) : les étapes, statuts
 * et TypeCode Factur-X ne sont jamais codés en dur. Les traitements passent par
 * `InvoiceWorkflowService` (transformation + verrou budgétaire),
 * `InvoiceGenerationService` (PDF contextuel + XML Factur-X + email) et
 * `InvoiceDeviationService` (écarts via DeviationEngine).
 */
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, ArrowRightCircle, FileCode2, Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqSource } from '@/domain/entities/boq/BoqLine';
import { InvoiceWorkflowService } from '@/application/services/invoice/InvoiceWorkflowService';
import { InvoiceGenerationService } from '@/application/services/invoice/InvoiceGenerationService';
import { InvoiceBudgetGuardService } from '@/application/services/invoice/InvoiceBudgetGuardService';
import { InvoiceDeviationService } from '@/application/services/invoice/InvoiceDeviationService';
import { InvoiceLifecycleTimeline } from './InvoiceLifecycleTimeline';
import DeviationBadges from '@/components/common/DeviationBadges';
import {
  getInvoiceDocumentType,
  type InvoiceActor,
  type InvoiceDocumentType,
} from '@/config/referentials/invoices/invoice-document-types.referential';
import { T } from '@/components/i18n/T';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { getInvoiceDocumentTypeLabel } from '@/config/referentials/invoices/invoice-document-types.referential';

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
  recipientEmail?: string;
  fiscalProfileCode?: string | null;
  docPrefix?: string;
  disabled?: boolean;
  /** Plafonds du verrou budgétaire (T11). */
  projectBudget?: number | null;
  contractAmount?: number | null;
  alreadyInvoiced?: number | null;
  /** Avancement physique constaté, pour le calcul d'écarts (T12). */
  actualProgress?: number | null;
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
  recipientEmail,
  fiscalProfileCode,
  docPrefix,
  disabled,
  projectBudget,
  contractAmount,
  alreadyInvoiced,
  actualProgress,
  onTransformed,
}) => {
  const { toast } = useToast();
  const { t, language } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [pctOpen, setPctOpen] = useState(false);
  const [percentage, setPercentage] = useState(30);

  const def = useMemo(() => getInvoiceDocumentType(documentType), [documentType]);
  const nextType = InvoiceWorkflowService.nextType(documentType);
  const nextDef = nextType ? getInvoiceDocumentType(nextType) : null;
  const allowed = nextDef ? nextDef.actors.includes(actor) : false;
  const noLines = lines.length === 0;

  const businessStatus = lines[0]?.businessStatus ?? def.initialStatus;
  const billedPercentage = lines[0]?.billedPercentage ?? null;

  // Aperçu du verrou budgétaire pour l'étape suivante (informatif avant clic).
  const guardPreview = useMemo(() => {
    if (!nextDef) return null;
    const ratio = nextDef.requiresPercentage ? Math.min(100, Math.max(1, percentage)) / 100 : 1;
    const projected = lines.map((l) => ({
      ...l,
      quantity: Number(l.quantity ?? 0) * ratio,
      totalHt: l.totalHt != null ? Number(l.totalHt) * ratio : null,
    }));
    return InvoiceBudgetGuardService.evaluate({
      targetType: nextDef.code,
      lines: projected,
      projectBudget: projectBudget ?? null,
      contractAmount: contractAmount ?? null,
      alreadyInvoiced: alreadyInvoiced ?? null,
    });
  }, [nextDef, lines, percentage, projectBudget, contractAmount, alreadyInvoiced]);

  // Écarts planifié / facturé via le moteur générique.
  const deviationInput = useMemo(
    () =>
      InvoiceDeviationService.build({
        plannedBudget: projectBudget ?? contractAmount ?? null,
        invoicedLines: lines,
        alreadyInvoiced: alreadyInvoiced ?? null,
        actualProgress: actualProgress ?? null,
      }),
    [projectBudget, contractAmount, lines, alreadyInvoiced, actualProgress],
  );

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
        projectBudget: projectBudget ?? null,
        contractAmount: contractAmount ?? null,
        alreadyInvoiced: alreadyInvoiced ?? null,
      });
      toast({
        title: `${nextDef?.label} créé`,
        description: `${res.lines.length} ligne(s) — ${res.totalHt.toLocaleString('fr-FR')} HT — TypeCode ${res.facturxTypeCode} — statut « ${res.status} »`,
      });
      if (res.budget && res.budget.severity !== 'none') {
        toast({ title: res.budget.label ?? 'Contrôle budgétaire', description: res.budget.message ?? undefined });
      }
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

  const generationInput = () => ({
    documentType,
    lines,
    fiscalProfileCode: fiscalProfileCode ?? null,
    percentage: def.requiresPercentage ? billedPercentage ?? null : null,
    seller: { name: sellerName || 'Émetteur', country: 'MR' },
    buyer: { name: buyerName || recipientEmail || 'Destinataire', country: 'MR' },
    documentContext: {
      title: def.label,
      docPrefix: docPrefix ?? def.code,
      projectId,
      tenderId,
      contextId,
      businessStatus,
      recipientName: buyerName ?? recipientEmail,
      senderName: sellerName,
    },
  });

  const handleFacturX = async () => {
    setBusy('facturx');
    try {
      await InvoiceGenerationService.generateAndDownload(generationInput());
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

  const handleEmail = async () => {
    if (!recipientEmail) {
      toast({ title: 'Destinataire manquant', description: 'Aucune adresse email associée au document.', variant: 'destructive' });
      return;
    }
    setBusy('email');
    try {
      const res = await InvoiceGenerationService.generateAndEmail({ ...generationInput(), to: recipientEmail });
      toast({
        title: res.ok ? 'Document envoyé' : 'Envoi incomplet',
        description: `${def.label} — ${recipientEmail}`,
        variant: res.ok ? undefined : 'destructive',
      });
    } catch (e) {
      toast({
        title: 'Envoi impossible',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const spinner = (k: string) => (busy === k ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null);
  const blocked = guardPreview ? !guardPreview.allowed : false;

  return (
    <>
      <div className="flex w-full flex-col gap-2">
        <InvoiceLifecycleTimeline
          current={documentType}
          actor={actor}
          businessStatus={businessStatus}
          billedPercentage={billedPercentage}
        />

        <DeviationBadges input={deviationInput} scope="project" />

        {guardPreview && guardPreview.severity !== 'none' ? (
          <Alert variant={blocked ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <span className="font-medium">{guardPreview.label} — </span>
              {guardPreview.message}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="self-center" title={`Factur-X ${def.facturxTypeCode}`}>
            {getInvoiceDocumentTypeLabel(def.code, language)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={disabled || noLines || busy !== null}>
                {spinner('facturx') ?? spinner('email') ?? <FileCode2 className="h-4 w-4 mr-2" />}
                {t('dqe.actions.document_menu')}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => void handleFacturX()}>
                <FileCode2 className="h-4 w-4 mr-2" />
                {t('dqe.action.facturx')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void handleEmail()} disabled={!recipientEmail}>
                <Mail className="h-4 w-4 mr-2" />
                {t('dqe.action.email')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {nextDef && allowed && (
            <Button
              size="sm"
              onClick={() => (nextDef.requiresPercentage ? setPctOpen(true) : runTransform())}
              disabled={disabled || noLines || busy !== null || blocked}
              title={blocked ? guardPreview?.message ?? t('dqe.transform.blocked') : `${t('dqe.action.transform_to')} ${getInvoiceDocumentTypeLabel(nextDef.code, language)}`}
            >
              {spinner('transform') ?? <ArrowRightCircle className="h-4 w-4 mr-2" />}
              {`${t('dqe.action.transform_to')} ${getInvoiceDocumentTypeLabel(nextDef.code, language)}`}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={pctOpen} onOpenChange={setPctOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{nextDef ? getInvoiceDocumentTypeLabel(nextDef.code, language) : ''}</DialogTitle>
            <DialogDescription>
              Les quantités sont proratisées selon l'avancement facturé, conformément au référentiel documentaire.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="invoice-workflow-pct"><T k="auto.invoiceworkflowactions.avancement_facture" fallback="Avancement facturé (%)" /></Label>
            <Input
              id="invoice-workflow-pct"
              type="number"
              min={1}
              max={100}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value) || 0)}
            />
            {guardPreview && guardPreview.severity !== 'none' ? (
              <p className={`text-xs ${blocked ? 'text-destructive' : 'text-muted-foreground'}`}>
                {guardPreview.message}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPctOpen(false)}>
              <T k="auto.invoiceworkflowactions.annuler" fallback="Annuler" />
            </Button>
            <Button onClick={() => runTransform(percentage)} disabled={busy !== null || blocked}>
              <T k="auto.invoiceworkflowactions.creer" fallback="Créer" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceWorkflowActions;
