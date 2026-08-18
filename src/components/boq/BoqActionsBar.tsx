/**
 * BoqActionsBar — barre d'actions unique conditionnée par BoqContext.
 * Actions non autorisées MASQUÉES. Signature avec saisie signataire.
 * « Transférer » route vers l'étape suivante du workflow métier :
 *   Expression de besoin (project-dqe) → validation hiérarchie
 *   DQE AO (tender-estimate)           → portail fournisseur
 *   Devis fournisseur (supplier-bid)   → joindre à soumission
 *   Décompte facture (supplier-invoice) → paiement
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Mail, PenTool, Send, Download, Paperclip, FileCheck2, Loader2, ArrowRightCircle, Layers, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

interface Props {
  ctx: BoqContext;
  lines: BoqLineDTO[];
  recipientEmail?: string;
  disabled?: boolean;
  onAttachToSubmission?: () => void;
  onSubmitInvoice?: () => void;
  onDistribute?: () => void;
  onPublish?: () => void;
}

const TRANSFER_LABEL: Record<BoqContext['routeContext'], string> = {
  'project-dqe':      'Soumettre pour validation',
  'tender-estimate':  'Publier vers fournisseurs',
  'supplier-bid':     'Joindre à ma soumission',
  'supplier-invoice': 'Soumettre pour paiement',
};

// Labels contextualisés par type de document — évite les ambiguïtés métier
// (ex. ne pas afficher "Générer PDF DQE" quand on est sur une facture).
const DOC_LABELS: Record<BoqContext['routeContext'], { pdf: string; email: string; download: string; sign: string }> = {
  'project-dqe':      { pdf: "Générer PDF de l'expression de besoin", email: "Envoyer l'expression de besoin", download: "Télécharger l'expression",   sign: "Signer l'expression"   },
  'tender-estimate':  { pdf: 'Générer PDF du DQE AO',                 email: 'Envoyer le DQE',                 download: 'Télécharger le DQE',          sign: 'Signer le DQE'          },
  'supplier-bid':     { pdf: 'Générer PDF du devis',                  email: 'Envoyer le devis',               download: 'Télécharger le devis',        sign: 'Signer le devis'        },
  'supplier-invoice': { pdf: 'Générer PDF de la facture',             email: 'Envoyer la facture',             download: 'Télécharger la facture',      sign: 'Signer la facture'      },
};

export const BoqActionsBar: React.FC<Props> = ({
  ctx, lines, recipientEmail, disabled = false,
  onAttachToSubmission, onSubmitInvoice, onDistribute, onPublish,
}) => {
  const { toast } = useToast();
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

  const baseDocCtx = {
    docPrefix: ctx.docPrefix,
    title: ctx.title,
    source: ctx.source,
    contextId: ctx.contextId,
    projectId: ctx.projectId,
    tenderId: ctx.tenderId,
    submissionId: ctx.submissionId,
    signed: !!signedInfo,
    signedBy: signedInfo?.by,
    signedAt: signedInfo?.at,
  };

  const handleGenerate = () => withGuard('pdf', async () => {
    const { blob, filename } = await DocumentService.generate(lines, baseDocCtx);
    DocumentService.download(blob, filename);
    toast({ title: 'PDF généré', description: filename });
  });

  const handleDownload = () => withGuard('download', async () => {
    const { blob, filename } = await DocumentService.generate(lines, baseDocCtx);
    DocumentService.download(blob, filename);
  });

  const handleEmail = () => withGuard('email', async () => {
    const res = await DocumentService.email(lines, { ...baseDocCtx, recipientEmail });
    if (res.ok) toast({ title: 'Email envoyé' });
    else toast({ title: 'Envoi échoué', description: res.message, variant: 'destructive' });
  });

  const confirmSign = async () => {
    if (!signer.trim()) { toast({ title: 'Signataire requis', variant: 'destructive' }); return; }
    setBusy('sign');
    try {
      const res = await DocumentService.sign(lines, { ...baseDocCtx, signedBy: signer.trim() });
      if (res.ok) {
        setSignedInfo({ by: signer.trim(), at: new Date().toLocaleString('fr-FR') });
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
    // Route contextuel : dispatch d'un event que la page hôte peut intercepter
    window.dispatchEvent(new CustomEvent('boq-transfer-next', { detail: {
      routeContext: ctx.routeContext,
      projectId: ctx.projectId,
      tenderId: ctx.tenderId,
      submissionId: ctx.submissionId,
      contextId: ctx.contextId,
      signed: !!signedInfo,
      lineCount: lines.length,
    } }));
    toast({ title: TRANSFER_LABEL[ctx.routeContext], description: `${lines.length} ligne(s) transférée(s).` });
  });

  // Étape explicite « DQE -> WBS » : phases, jalons, tâches et ressources.
  const handleDispatch = () => withGuard('dispatch', async () => {
    window.dispatchEvent(new CustomEvent('boq-dispatch-wbs', {
      detail: { projectId: ctx.projectId, contextId: ctx.contextId, lineCount: lines.length },
    }));
  });

  // Workflow de validation : alerte budgétaire + options A/B/C.
  const handleRequestValidation = () => withGuard('validation', async () => {
    window.dispatchEvent(new CustomEvent('boq-request-validation', {
      detail: { projectId: ctx.projectId, contextId: ctx.contextId, lineCount: lines.length },
    }));
  });

  const isProjectDqe = ctx.routeContext === 'project-dqe';

  const iconOf = (k: string) => (busy === k ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null);
  const L = DOC_LABELS[ctx.routeContext];


  return (
    <>
      <div className="flex flex-wrap gap-2">
        {can('generatePdf') && (
          <Button size="sm" variant="outline" onClick={handleGenerate} disabled={disabled || busy !== null} title={L.pdf}>
            {iconOf('pdf') ?? <FileDown className="h-4 w-4 mr-2" />}
            Générer PDF
          </Button>
        )}
        {can('sign') && (
          <Button size="sm" variant={signedInfo ? 'default' : 'outline'} onClick={() => setSignOpen(true)} disabled={disabled || busy !== null} title={L.sign}>
            {iconOf('sign') ?? <PenTool className="h-4 w-4 mr-2" />}
            {signedInfo ? 'Signé ✓' : 'Signer'}
          </Button>
        )}
        {can('email') && (
          <Button size="sm" variant="outline" onClick={handleEmail} disabled={disabled || busy !== null} title={L.email}>
            {iconOf('email') ?? <Mail className="h-4 w-4 mr-2" />}
            Envoyer
          </Button>
        )}
        {can('download') && (
          <Button size="sm" variant="outline" onClick={handleDownload} disabled={disabled || busy !== null} title={L.download}>
            {iconOf('download') ?? <Download className="h-4 w-4 mr-2" />}
            Télécharger
          </Button>
        )}
        {can('distribute') && onDistribute && (
          <Button size="sm" variant="outline" onClick={onDistribute} disabled={disabled || busy !== null}>
            <Send className="h-4 w-4 mr-2" />
            Diffuser
          </Button>
        )}
        {isProjectDqe && (
          <>
            <Button size="sm" variant="outline" onClick={handleDispatch}
              disabled={disabled || busy !== null || !gate.allowed}
              title={gate.allowed
                ? 'Créer les phases, jalons, tâches et ressources depuis les lignes DQE'
                : gate.reasons.join(' ')}>
              {iconOf('dispatch') ?? <Layers className="h-4 w-4 mr-2" />}
              Transférer vers les phases
            </Button>
            <Button size="sm" variant="outline" onClick={handleRequestValidation} disabled={disabled || busy !== null}
              title="Créer le workflow de validation (alerte budgétaire, options A/B/C)">
              {iconOf('validation') ?? <ShieldCheck className="h-4 w-4 mr-2" />}
              Demander validation
            </Button>
          </>
        )}
        {gateKind && !gate.allowed && (
          <>
            <Badge variant="destructive" className="self-center">
              {BOQ_INJECTION_GATE_REFERENTIAL.gates[gateKind].label} — validation requise
            </Badge>
            {canValidateGate && (
              <Button size="sm" onClick={handleApproveInjection} disabled={disabled || busy !== null}
                title={BOQ_INJECTION_GATE_REFERENTIAL.gates[gateKind].blockedMessage}>
                {iconOf('gate') ?? <ShieldCheck className="h-4 w-4 mr-2" />}
                Valider pour injection
              </Button>
            )}
          </>
        )}
        {gateKind && gate.allowed && (
          <Badge variant="outline" className="self-center">
            {BOQ_INJECTION_GATE_REFERENTIAL.gates[gateKind].label} validé
          </Badge>
        )}
        {can('transfer') && (
          <Button size="sm" onClick={handleTransfer} disabled={disabled || busy !== null}>
            {iconOf('transfer') ?? <ArrowRightCircle className="h-4 w-4 mr-2" />}
            {TRANSFER_LABEL[ctx.routeContext]}
          </Button>
        )}

        {ctx.routeContext === 'supplier-bid' && (
          <Button size="sm" variant="outline" onClick={() => setDecompteOpen(true)} disabled={disabled || busy !== null || !lines.length}
            title="Créer un décompte / facture depuis ce devis">
            {iconOf('decompte') ?? <FileCheck2 className="h-4 w-4 mr-2" />}
            Créer un décompte
          </Button>
        )}
        {can('attachToSubmission') && onAttachToSubmission && (
          <Button size="sm" variant="outline" onClick={onAttachToSubmission} disabled={disabled || busy !== null}>
            <Paperclip className="h-4 w-4 mr-2" />
            Joindre à ma soumission
          </Button>
        )}
        {can('submitInvoice') && onSubmitInvoice && (
          <Button size="sm" variant="outline" onClick={onSubmitInvoice} disabled={disabled || busy !== null}>
            <FileCheck2 className="h-4 w-4 mr-2" />
            Soumettre pour paiement
          </Button>
        )}
        {can('publish') && onPublish && (
          <Button size="sm" variant="outline" onClick={onPublish} disabled={disabled || busy !== null}>
            <Send className="h-4 w-4 mr-2" />
            Publier
          </Button>
        )}
      </div>

      <Dialog open={decompteOpen} onOpenChange={setDecompteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un décompte depuis le devis</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Avancement facturé (%)</Label>
              <Input type="number" min={1} max={100} value={decomptePct}
                onChange={(e) => setDecomptePct(Number(e.target.value) || 0)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Les quantités du devis sont proratisées puis enregistrées comme lignes de facture (onglet « Factures »).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecompteOpen(false)}>Annuler</Button>
            <Button onClick={confirmDecompte} disabled={busy !== null}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={signOpen} onOpenChange={setSignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signer le document</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nom du signataire</Label>
              <Input value={signer} onChange={(e) => setSigner(e.target.value)} placeholder="Ex. Directeur Technique" />
            </div>
            <p className="text-xs text-muted-foreground">
              La signature sera intégrée au PDF (bloc de validation) et horodatée. Le document peut être signé avant ou après la génération du PDF.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignOpen(false)}>Annuler</Button>
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
