/**
 * BoqActionsBar — barre d'actions unique conditionnée par BoqContext.
 * Les actions non autorisées sont MASQUÉES (pas juste désactivées).
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Mail, PenTool, Send, Download, Paperclip, FileCheck2, Loader2 } from 'lucide-react';
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

export const BoqActionsBar: React.FC<Props> = ({
  ctx,
  lines,
  recipientEmail,
  disabled = false,
  onAttachToSubmission,
  onSubmitInvoice,
  onDistribute,
  onPublish,
}) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
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
  };

  const handleGenerate = () => withGuard('pdf', async () => {
    const { blob, filename } = await DocumentService.generate(lines, baseDocCtx);
    DocumentService.download(blob, filename);
    toast({ title: 'PDF généré', description: filename });
  });

  const handleEmail = () => withGuard('email', async () => {
    const res = await DocumentService.email(lines, { ...baseDocCtx, recipientEmail });
    if (res.ok) toast({ title: 'Email envoyé' });
    else toast({ title: 'Envoi échoué', description: res.message, variant: 'destructive' });
  });

  const handleSign = () => withGuard('sign', async () => {
    const res = await DocumentService.sign(lines, baseDocCtx);
    toast({ title: res.ok ? 'Signé' : 'Signature échouée', description: res.message, variant: res.ok ? 'default' : 'destructive' });
  });

  const handleDownload = () => withGuard('download', async () => {
    const { blob, filename } = await DocumentService.generate(lines, baseDocCtx);
    DocumentService.download(blob, filename);
  });

  const iconOf = (k: string) => (busy === k ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null);

  return (
    <div className="flex flex-wrap gap-2">
      {can('generatePdf') && (
        <Button size="sm" variant="outline" onClick={handleGenerate} disabled={disabled || busy !== null}>
          {iconOf('pdf') ?? <FileDown className="h-4 w-4 mr-2" />}
          Générer PDF
        </Button>
      )}
      {can('sign') && (
        <Button size="sm" variant="outline" onClick={handleSign} disabled={disabled || busy !== null}>
          {iconOf('sign') ?? <PenTool className="h-4 w-4 mr-2" />}
          Signer
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
      {can('attachToSubmission') && onAttachToSubmission && (
        <Button size="sm" onClick={onAttachToSubmission} disabled={disabled || busy !== null}>
          <Paperclip className="h-4 w-4 mr-2" />
          Joindre à ma soumission
        </Button>
      )}
      {can('submitInvoice') && onSubmitInvoice && (
        <Button size="sm" onClick={onSubmitInvoice} disabled={disabled || busy !== null}>
          <FileCheck2 className="h-4 w-4 mr-2" />
          Soumettre pour paiement
        </Button>
      )}
      {can('publish') && onPublish && (
        <Button size="sm" onClick={onPublish} disabled={disabled || busy !== null}>
          <Send className="h-4 w-4 mr-2" />
          Publier
        </Button>
      )}
    </div>
  );
};
