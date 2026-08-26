/**
 * BoqActionsBar — barre d'actions unique conditionnée par BoqContext.
 * Actions non autorisées MASQUÉES. Signature avec saisie signataire.
 * « Transférer » route vers l'étape suivante du workflow métier :
 *   Expression de besoin (project-dqe) → validation hiérarchie
 *   DQE AO (tender-estimate)           → portail fournisseur
 *   Devis fournisseur (supplier-bid)   → joindre à soumission
 *   Décompte facture (supplier-invoice) → paiement
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Mail, PenTool, Send, Download, Paperclip, FileCheck2, Loader2, ArrowRightCircle, Layers, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BoqContextService, type BoqContext } from '@/application/services/boq/BoqContextService';
import { DocumentService } from '@/application/services/boq/DocumentService';
import { BoqInvoiceService } from '@/application/services/boq/BoqInvoiceService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { BoqInjectionGateService } from '@/application/services/boq/BoqInjectionGateService';
import { BOQ_INJECTION_GATE_REFERENTIAL } from '@/config/referentials/boq/boq-injection-gate.referential';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { useProjectConsultantHex } from '@/hooks/hexagonal/useProjectConsultantHex';
import { Badge } from '@/components/ui/badge';
import { BoqTransferService } from '@/application/services/boq/BoqTransferService';
import { BoqPartyResolverService, partyHintsFromLines } from '@/application/services/boq/BoqPartyResolverService';
import { useOwnerOrganization } from '@/hooks/useOwnerOrganization';
import { T } from '@/components/i18n/T';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { getDqeActionLabelKey, DQE_TRANSFER_LABEL_KEYS } from '@/config/referentials/boq/dqe-actions.referential';
import { DocumentPartiesDialog, type DocumentPartiesValue } from './DocumentPartiesDialog';
import { DocumentHeaderService } from '@/application/services/boq/DocumentHeaderService';
import { useProcurementChain } from '@/hooks/hexagonal/useProcurementChainHex';
import { ProcurementChainService } from '@/application/services/procurement/ProcurementChainService';
import { Rocket } from 'lucide-react';
import { Pencil } from 'lucide-react';

interface Props {
  ctx: BoqContext;
  lines: BoqLineDTO[];
  /** Libellé métier du projet porté dans l'entête documentaire (D1). */
  projectName?: string;
  recipientEmail?: string;
  disabled?: boolean;
  onAttachToSubmission?: () => void;
  onSubmitInvoice?: () => void;
  onDistribute?: () => void;
  onPublish?: () => void;
  /** Actions principales additionnelles (groupe 1). */
  primarySlot?: React.ReactNode;
  /** Actions de workflow / validation additionnelles (groupe 2). */
  workflowSlot?: React.ReactNode;
  /** Badges d'information additionnels (groupe 3). */
  badgesSlot?: React.ReactNode;
}


// Un seul libellé de transfert par contexte, résolu depuis le référentiel
// d'actions DQE (plus de doublons « Transférer / Transporter en devis »).


export const BoqActionsBar: React.FC<Props> = ({
  ctx, lines, projectName, recipientEmail, disabled = false,
  onAttachToSubmission, onSubmitInvoice, onDistribute, onPublish,
  primarySlot, workflowSlot, badgesSlot,
}) => {


  const { toast } = useToast();
  const { t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const [signer, setSigner] = useState('');
  const [signedInfo, setSignedInfo] = useState<{ by: string; at: string } | null>(null);
  const [decompteOpen, setDecompteOpen] = useState(false);
  const [decomptePct, setDecomptePct] = useState(100);
  const can = (a: Parameters<typeof BoqContextService.can>[1]) => BoqContextService.can(ctx, a);

  // === Gouvernance d'injection (devis -> planification, décompte -> exécution) ===
  const { userRoles, currentUser } = useCurrentUserRoles();
  const { consultants } = useProjectConsultantHex(ctx.projectId);
  const isDesignatedConsultant = React.useMemo(() => {
    const uid = (currentUser as { userId?: string; id?: string } | null)?.userId
      ?? (currentUser as { id?: string } | null)?.id;
    if (!uid) return false;
    return consultants.some((c) => c.employeeId === uid || c.supplierId === uid);
  }, [consultants, currentUser]);

  const gate = React.useMemo(() => BoqInjectionGateService.evaluate(lines), [lines]);
  const gateActor = {
    userId: (currentUser as { userId?: string; id?: string } | null)?.userId
      ?? (currentUser as { id?: string } | null)?.id,
    roles: userRoles,
    isDesignatedConsultant,
  };
  const gateKind = gate.kinds[0] ?? null;
  const canValidateGate = gateKind ? BoqInjectionGateService.canValidate(gateKind, gateActor) : false;

  const handleApproveInjection = () => withGuard('gate', async () => {
    try {
      const res = await BoqInjectionGateService.approve(lines, gateActor);
      toast({
        title: 'Validation enregistrée',
        description: `${res.validated} ligne(s) ${res.kinds
          .map((k) => BOQ_INJECTION_GATE_REFERENTIAL.gates[k].label)
          .join(', ')} — injection autorisée.`,
      });
      window.dispatchEvent(new CustomEvent('boq-injection-validated', {
        detail: { contextId: ctx.contextId, kinds: res.kinds },
      }));
    } catch (e) {
      toast({
        title: 'Validation refusée',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    }
  });

  const withGuard = async (label: string, fn: () => Promise<void>) => {
    if (!lines.length) {
      toast({ title: 'Aucune ligne', description: 'Ajoutez ou importez des lignes.', variant: 'destructive' });
      return;
    }
    setBusy(label);
    try { await fn(); } finally { setBusy(null); }
  };

  // Parties prenantes contextualisées (expression de besoin / devis / décompte)
  const parties = React.useMemo(
    () => BoqPartyResolverService.resolve(ctx.routeContext, partyHintsFromLines(lines)),
    [ctx.routeContext, lines],
  );

  // Signature persistée : réhydratée depuis les lignes (metadata.signature)
  // → le document reste éditable tant qu'aucune signature n'existe.
  const persistedSignature = React.useMemo(() => {
    for (const l of lines) {
      const sig = (l.metadata as { signature?: { signedBy?: string; signedAt?: string } } | null)?.signature;
      if (sig?.signedAt) {
        return {
          by: sig.signedBy ?? '—',
          at: new Date(sig.signedAt).toISOString(),
        };
      }
    }
    return null;
  }, [lines]);
  React.useEffect(() => {
    if (persistedSignature) setSignedInfo(persistedSignature);
  }, [persistedSignature]);

  // En-tête PDF : côté gestionnaire c'est l'organisation propriétaire
  // (maître d'ouvrage) ; côté fournisseur c'est l'émetteur (fournisseur).
  const { organization: ownerOrg } = useOwnerOrganization();
  const isSupplierContext = ctx.routeContext === 'supplier-bid' || ctx.routeContext === 'supplier-invoice';
  const company = React.useMemo(() => {
    if (isSupplierContext) {
      return parties.senderName ? { name: parties.senderName } : undefined;
    }
    if (!ownerOrg) return undefined;
    return {
      name: ownerOrg.name,
      address: ownerOrg.address ?? undefined,
      phone: ownerOrg.phone ?? undefined,
      email: ownerOrg.email ?? undefined,
    };
  }, [isSupplierContext, parties.senderName, ownerOrg]);

  // === En-tête éditable (émetteur / destinataire) ===
  // Éditable tant que le document n'est pas signé ; les valeurs saisies
  // alimentent le PDF ET le XML Factur-X.
  const [partiesOpen, setPartiesOpen] = useState(false);
  const [partiesOverride, setPartiesOverride] = useState<DocumentPartiesValue | null>(null);

  const effectiveParties: DocumentPartiesValue = React.useMemo(() => ({
    senderName: partiesOverride?.senderName ?? company?.name ?? parties.senderName,
    senderAddress: partiesOverride?.senderAddress ?? company?.address,
    senderPhone: partiesOverride?.senderPhone ?? company?.phone,
    senderEmail: partiesOverride?.senderEmail ?? company?.email,
    recipientName: partiesOverride?.recipientName ?? parties.recipientName,
    recipientEmail: partiesOverride?.recipientEmail ?? recipientEmail,
    extraRecipients: partiesOverride?.extraRecipients ?? [],
    reference: partiesOverride?.reference,
    issueDate: partiesOverride?.issueDate,
    currency: partiesOverride?.currency,
    validityDays: partiesOverride?.validityDays,
  }), [partiesOverride, company, parties.senderName, parties.recipientName, recipientEmail]);

  const effectiveCompany = React.useMemo(() => (
    effectiveParties.senderName
      ? {
          name: effectiveParties.senderName,
          address: effectiveParties.senderAddress,
          phone: effectiveParties.senderPhone,
          email: effectiveParties.senderEmail,
        }
      : company
  ), [effectiveParties, company]);

  // En-tête canonique (DTO) : source unique du PDF, du XML Factur-X et de la
  // validation bloquante avant génération / signature / envoi.
  const header = React.useMemo(
    () => DocumentHeaderService.merge(
      {
        reference: effectiveParties.reference ?? null,
        issueDate: effectiveParties.issueDate ?? null,
        currency: effectiveParties.currency ?? null,
        validityDays: effectiveParties.validityDays ?? null,
        facturxTypeCode: null,
        sender: {
          name: effectiveParties.senderName ?? '',
          address: effectiveParties.senderAddress ?? null,
          phone: effectiveParties.senderPhone ?? null,
          email: effectiveParties.senderEmail ?? null,
        },
        recipients: [
          { name: effectiveParties.recipientName ?? '', email: effectiveParties.recipientEmail ?? null },
          ...(effectiveParties.extraRecipients ?? []).map((r) => ({ name: r.name, email: r.email ?? null })),
        ].filter((r) => r.name.trim().length > 0),
        notes: null,
      },
      {
        reference: effectiveParties.reference ?? null,
        issueDate: effectiveParties.issueDate ?? null,
        sender: { name: effectiveParties.senderName ?? '' },
        recipients: [{ name: effectiveParties.recipientName ?? '' }],
      },
    ),
    [effectiveParties],
  );

  const headerValidation = React.useMemo(
    () => DocumentHeaderService.validate(header, lines),
    [header, lines],
  );

  /** Bloque PDF / signature / envoi tant que l'en-tête est incomplet. */
  const requireValidHeader = React.useCallback((): boolean => {
    if (headerValidation.valid) return true;
    toast({
      title: t('dqe.header.error.title') || 'En-tête incomplet',
      description: headerValidation.issues
        .map((i) => t(i.messageKey) || i.fallback)
        .join(' · '),
      variant: 'destructive',
    });
    setPartiesOpen(true);
    return false;
  }, [headerValidation, t]);

  const baseDocCtx = {
    company: effectiveCompany,
    docPrefix: ctx.docPrefix,
    title: ctx.title,
    source: ctx.source,
    contextId: ctx.contextId,
    projectId: ctx.projectId,
    // D1 — libellé métier du projet (jamais l'identifiant technique).
    projectTitle: projectName,
    tenderId: ctx.tenderId,
    submissionId: ctx.submissionId,
    documentId: lines.find((l) => l.documentId)?.documentId ?? null,
    signed: !!signedInfo,
    signedBy: signedInfo?.by,
    signedAt: signedInfo?.at,
    senderName: header.sender.name,
    recipientName: header.recipients[0]?.name,
    recipientNames: header.recipients.map((r) => r.name),
    reference: header.reference ?? undefined,
    issueDate: header.issueDate ?? undefined,
    currency: header.currency ?? undefined,
    validityDays: header.validityDays ?? undefined,
    facturxTypeCode: header.facturxTypeCode ?? undefined,
  };



  const handleGenerate = () => {
    if (!requireValidHeader()) return;
    void withGuard('pdf', async () => {
      const { blob, filename } = await DocumentService.generate(lines, baseDocCtx);
      DocumentService.download(blob, filename);
      toast({ title: 'PDF généré', description: filename });
    });
  };

  const handleDownload = () => {
    if (!requireValidHeader()) return;
    void withGuard('download', async () => {
      const { blob, filename } = await DocumentService.generate(lines, baseDocCtx);
      DocumentService.download(blob, filename);
    });
  };

  const handleEmail = () => {
    if (!requireValidHeader()) return;
    void withGuard('email', async () => {
      const res = await DocumentService.email(lines, { ...baseDocCtx, recipientEmail: effectiveParties.recipientEmail ?? recipientEmail });
      if (res.ok) toast({ title: 'Email envoyé' });
      else toast({ title: 'Envoi échoué', description: res.message, variant: 'destructive' });
    });
  };

  const confirmSign = async () => {
    if (!signer.trim()) { toast({ title: 'Signataire requis', variant: 'destructive' }); return; }
    if (!requireValidHeader()) return;
    setBusy('sign');

    try {
      const res = await DocumentService.sign(lines, { ...baseDocCtx, signedBy: signer.trim() });
      if (res.ok) {
        setSignedInfo({ by: signer.trim(), at: new Date().toISOString() });
        toast({ title: 'Document signé', description: `Par ${signer.trim()}` });
        setSignOpen(false);
      } else toast({ title: 'Signature échouée', description: res.message, variant: 'destructive' });
    } finally { setBusy(null); }
  };

  /** Devis validé -> décompte / facture au pourcentage d'avancement. */
  const confirmDecompte = async () => {
    setBusy('decompte');
    try {
      const res = await BoqInvoiceService.createFromQuote({
        quoteLines: lines,
        quoteContextId: ctx.contextId,
        percentage: decomptePct,
        projectId: ctx.projectId,
        tenderId: ctx.tenderId,
        title: `Décompte ${decomptePct}% — ${ctx.title}`,
      });
      toast({ title: 'Décompte créé', description: `${res.lines.length} ligne(s) — ${res.totalHt.toLocaleString('fr-FR')} HT` });
      setDecompteOpen(false);
      window.dispatchEvent(new CustomEvent('boq-decompte-created', { detail: { contextId: ctx.contextId, percentage: decomptePct } }));
    } catch (e) {
      toast({ title: 'Création impossible', description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
    } finally { setBusy(null); }
  };

  const handleTransfer = () => withGuard('transfer', async () => {
    try {
      // Contexte projet : « Soumettre pour validation » englobe la demande de
      // validation (alerte budgétaire / arbitrage A/B/C) — action unique, plus
      // de bouton « Demander validation » en doublon.
      if (ctx.routeContext === 'project-dqe') {
        window.dispatchEvent(new CustomEvent('boq-request-validation', {
          detail: { projectId: ctx.projectId, contextId: ctx.contextId, lineCount: lines.length },
        }));
      }
      const res = await BoqTransferService.transfer({
        routeContext: ctx.routeContext,
        lines,
        actorName: signedInfo?.by ?? parties.senderName ?? null,
        submissionId: ctx.submissionId,
      });
      toast({ title: t(DQE_TRANSFER_LABEL_KEYS[ctx.routeContext]), description: `${res.transferred} ligne(s) — ${res.message}` });
      window.dispatchEvent(new CustomEvent('boq-transfer-next', { detail: {
        routeContext: ctx.routeContext,
        projectId: ctx.projectId,
        tenderId: ctx.tenderId,
        submissionId: ctx.submissionId,
        contextId: ctx.contextId,
        stage: res.stage,
        status: res.status,
        signed: !!signedInfo,
        lineCount: res.transferred,
      } }));
      // Callbacks métier optionnels de la page hôte (soumission, paiement, publication).
      if (ctx.routeContext === 'supplier-bid') onAttachToSubmission?.();
      if (ctx.routeContext === 'supplier-invoice') onSubmitInvoice?.();
      if (ctx.routeContext === 'tender-estimate') onPublish?.();
    } catch (e) {
      toast({
        title: 'Transfert impossible',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    }
  });

  // Raccourci clavier Ctrl+Entrée depuis le poste DQE -> soumettre pour validation.
  useEffect(() => {
    const onShortcut = () => { if (!disabled) handleTransfer(); };
    window.addEventListener('boq-shortcut-submit', onShortcut);
    return () => window.removeEventListener('boq-shortcut-submit', onShortcut);
  });

  // Chaîne complète : DQE validé -> planification -> prévisions -> AO -> portails.
  const { runChain, isPending: chainPending } = useProcurementChain();
  const dqeValidated = ProcurementChainService.isValidatedDqe(lines);
  const handleProcurementChain = () => withGuard('procurementChain', async () => {
    if (!ctx.projectId) throw new Error('Projet requis');
    const res = await runChain({
      projectId: ctx.projectId,
      documentId: lines.find((l) => l.documentId)?.documentId ?? null,
      lines,
      tenderTitle: projectName ?? null,
    });
    toast({
      title: t('dqe.action.procurement_chain'),
      description: [
        `${res.planning.phasesCreated + res.planning.phasesReused} phases`,
        `budget ${res.forecast.dqeTotal}`,
        res.tender.tenderId ? 'AO publié' : 'AO non créé',
        ...res.warnings,
      ].join(' · '),
    });
  });

  // Étape explicite « DQE -> WBS » : phases, jalons, tâches et ressources.
  const handleDispatch = () => withGuard('dispatch', async () => {
    window.dispatchEvent(new CustomEvent('boq-dispatch-wbs', {
      detail: { projectId: ctx.projectId, contextId: ctx.contextId, lineCount: lines.length },
    }));
  });


  const isProjectDqe = ctx.routeContext === 'project-dqe';

  const iconOf = (k: string) => (busy === k ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null);


  const docActions = [
    can('generatePdf') && { key: 'generatePdf', icon: <FileDown className="h-4 w-4 mr-2" />, onSelect: handleGenerate },
    can('email') && { key: 'email', icon: <Mail className="h-4 w-4 mr-2" />, onSelect: handleEmail },
    can('download') && { key: 'download', icon: <Download className="h-4 w-4 mr-2" />, onSelect: handleDownload },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; onSelect: () => void }[];

  const workflowActions = [
    can('distribute') && onDistribute && { key: 'distribute', icon: <Send className="h-4 w-4 mr-2" />, onSelect: onDistribute, disabled: false },
    isProjectDqe && {
      key: 'procurementChain',
      icon: chainPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />,
      onSelect: handleProcurementChain,
      disabled: !dqeValidated || chainPending || !ctx.projectId,
    },
    isProjectDqe && {
      key: 'dispatchWbs',
      icon: <Layers className="h-4 w-4 mr-2" />,
      onSelect: handleDispatch,
      disabled: !gate.allowed,
    },
    ctx.routeContext === 'supplier-bid' && {
      key: 'decompte',
      icon: <FileCheck2 className="h-4 w-4 mr-2" />,
      onSelect: () => setDecompteOpen(true),
      disabled: !lines.length,
    },
    can('attachToSubmission') && onAttachToSubmission && { key: 'attachToSubmission', icon: <Paperclip className="h-4 w-4 mr-2" />, onSelect: onAttachToSubmission, disabled: false },
    can('submitInvoice') && onSubmitInvoice && { key: 'submitInvoice', icon: <FileCheck2 className="h-4 w-4 mr-2" />, onSelect: onSubmitInvoice, disabled: false },
    can('publish') && onPublish && { key: 'publish', icon: <Send className="h-4 w-4 mr-2" />, onSelect: onPublish, disabled: false },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; onSelect: () => void; disabled?: boolean }[];

  return (
    <>
      {/* Zone 2 — barre de workflow en une seule ligne :
          gauche = actions principales du document · droite = actions secondaires
          (Document/PDF, Signer, Workflow) · dessous = badges d'information. */}
      <div className="flex w-full flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* --- Actions principales (gauche) --- */}
          <div className="flex flex-wrap items-center gap-2">
            {can('transfer') && (
              <Button size="sm" onClick={handleTransfer} disabled={disabled || busy !== null || !lines.length}>
                {iconOf('transfer') ?? <ArrowRightCircle className="h-4 w-4 mr-2" />}
                {t(DQE_TRANSFER_LABEL_KEYS[ctx.routeContext])}
              </Button>
            )}

            {primarySlot}
          </div>

          {/* --- Actions secondaires (droite) --- */}
          <div className="flex flex-wrap items-center gap-2">
          {docActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={disabled || busy !== null}>
                  {iconOf('generatePdf') ?? iconOf('email') ?? iconOf('download') ?? <FileDown className="h-4 w-4 mr-2" />}
                  {t('dqe.actions.document_menu')}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {docActions.map((a) => (
                  <DropdownMenuItem key={a.key} onSelect={() => a.onSelect()}>
                    {a.icon}
                    {t(getDqeActionLabelKey(a.key))}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPartiesOpen(true)}
            disabled={disabled || busy !== null}
            title={t('dqe.parties.edit_title')}
          >
            <Pencil className="h-4 w-4 mr-2" />
            {t('dqe.actions.parties_menu')}
          </Button>

          {can('sign') && !signedInfo && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSignOpen(true)}
              disabled={disabled || busy !== null}
              title={`${t('dqe.action.sign')} — ${ctx.title}`}
            >
              {iconOf('sign') ?? <PenTool className="h-4 w-4 mr-2" />}
              {t('dqe.action.sign')}
            </Button>
          )}

          {workflowActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={disabled || busy !== null}>
                  {iconOf('dispatch') ?? iconOf('decompte') ?? <Layers className="h-4 w-4 mr-2" />}
                  {t('dqe.actions.workflow_menu')}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {workflowActions.map((a) => (
                  <DropdownMenuItem key={a.key} disabled={a.disabled} onSelect={() => a.onSelect()}>
                    {a.icon}
                    {t(getDqeActionLabelKey(a.key))}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {gateKind && !gate.allowed && canValidateGate && (
            <Button size="sm" onClick={handleApproveInjection} disabled={disabled || busy !== null}
              title={BOQ_INJECTION_GATE_REFERENTIAL.gates[gateKind].blockedMessage}>
              {iconOf('gate') ?? <ShieldCheck className="h-4 w-4 mr-2" />}
              {t('dqe.action.validate_gate')}
            </Button>
          )}

          {workflowSlot}
          </div>
        </div>


        {/* --- G3 : badges d'information (jamais de boutons) --- */}
        <div className="flex flex-wrap items-center gap-2">
          {signedInfo && (
            <Badge variant="secondary" className="gap-1">
              <PenTool className="h-3 w-3" />
              {t('dqe.action.signed')} — {signedInfo.by}
            </Badge>
          )}
          {gateKind && (
            <Badge variant={gate.allowed ? 'outline' : 'destructive'}>
              {BOQ_INJECTION_GATE_REFERENTIAL.gates[gateKind].label} —{' '}
              {gate.allowed ? t('dqe.gate.validated') : t('dqe.gate.validation_required')}
            </Badge>
          )}
          {projectName && (
            <Badge variant="outline">
              {t('dqe.badge.project_ref')} · {projectName}
            </Badge>
          )}
          {badgesSlot}
        </div>
      </div>



      <DocumentPartiesDialog
        open={partiesOpen}
        onOpenChange={setPartiesOpen}
        value={effectiveParties}
        locked={!!signedInfo}
        onSave={(v) => setPartiesOverride(v)}
      />

      <Dialog open={decompteOpen} onOpenChange={setDecompteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><T k="auto.boqactionsbar.creer_un_decompte_depuis_le_devis" fallback="Créer un décompte depuis le devis" /></DialogTitle>
            <DialogDescription><T k="auto.boqactionsbar.les_quantites_du_devis_seront_proratisees_selon_" fallback="Les quantités du devis seront proratisées selon l'avancement facturé." /></DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label><T k="auto.boqactionsbar.avancement_facture" fallback="Avancement facturé (%)" /></Label>
              <Input type="number" min={1} max={100} value={decomptePct}
                onChange={(e) => setDecomptePct(Number(e.target.value) || 0)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Les quantités du devis sont proratisées puis enregistrées comme lignes de facture (onglet « Factures »).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecompteOpen(false)}><T k="auto.boqactionsbar.annuler" fallback="Annuler" /></Button>
            <Button onClick={confirmDecompte} disabled={busy !== null}><T k="auto.boqactionsbar.creer" fallback="Créer" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={signOpen} onOpenChange={setSignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><T k="auto.boqactionsbar.signer_le_document" fallback="Signer le document" /></DialogTitle>
            <DialogDescription><T k="auto.boqactionsbar.la_signature_est_horodatee_et_figee_sur_toutes_l" fallback="La signature est horodatée et figée sur toutes les lignes du document." /></DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label><T k="auto.boqactionsbar.nom_du_signataire" fallback="Nom du signataire" /></Label>
              <Input value={signer} onChange={(e) => setSigner(e.target.value)} placeholder="Ex. Directeur Technique" />
            </div>
            <p className="text-xs text-muted-foreground">
              La signature sera intégrée au PDF (bloc de validation) et horodatée. Le document peut être signé avant ou après la génération du PDF.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignOpen(false)}><T k="auto.boqactionsbar.annuler" fallback="Annuler" /></Button>
            <Button onClick={confirmSign} disabled={busy === 'sign'}>
              {busy === 'sign' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PenTool className="h-4 w-4 mr-2" />}
              Confirmer la signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
