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
import { FileDown, Mail, PenTool, Send, Download, Paperclip, FileCheck2, Loader2, ArrowRightCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BoqContextService, type BoqContext } from '@/application/services/boq/BoqContextService';
import { DocumentService } from '@/application/services/boq/DocumentService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

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

export const BoqActionsBar: React.FC<Props> = ({
  ctx, lines, recipientEmail, disabled = false,
  onAttachToSubmission, onSubmitInvoice, onDistribute, onPublish,
}) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const [signer, setSigner] = useState('');
  const [signedInfo, setSignedInfo] = useState<{ by: string; at: string } | null>(null);
  const can = (a: Parameters<typeof BoqContextService.can>[1]) => BoqContextService.can(ctx, a);

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
      const res = await DocumentService.sign(lines, baseDocCtx);
      if (res.ok) {
        setSignedInfo({ by: signer.trim(), at: new Date().toLocaleString('fr-FR') });
        toast({ title: 'Document signé', description: `Par ${signer.trim()}` });
        setSignOpen(false);
      } else toast({ title: 'Signature échouée', description: res.message, variant: 'destructive' });
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

  const iconOf = (k: string) => (busy === k ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {can('generatePdf') && (
          <Button size="sm" variant="outline" onClick={handleGenerate} disabled={disabled || busy !== null}>
            {iconOf('pdf') ?? <FileDown className="h-4 w-4 mr-2" />}
            Générer PDF
          </Button>
        )}
        {can('sign') && (
          <Button size="sm" variant={signedInfo ? 'default' : 'outline'} onClick={() => setSignOpen(true)} disabled={disabled || busy !== null}>
            {iconOf('sign') ?? <PenTool className="h-4 w-4 mr-2" />}
            {signedInfo ? 'Signé ✓' : 'Signer'}
          </Button>
        )}
        {can('email') && (
          <Button size="sm" variant="outline" onClick={handleEmail} disabled={disabled || busy !== null}>
            {iconOf('email') ?? <Mail className="h-4 w-4 mr-2" />}
            Envoyer email
          </Button>
        )}
        {can('download') && (
          <Button size="sm" variant="outline" onClick={handleDownload} disabled={disabled || busy !== null}>
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
        {can('transfer') && (
          <Button size="sm" onClick={handleTransfer} disabled={disabled || busy !== null}>
            {iconOf('transfer') ?? <ArrowRightCircle className="h-4 w-4 mr-2" />}
            {TRANSFER_LABEL[ctx.routeContext]}
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
