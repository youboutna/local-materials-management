/**
 * src/components/boq/BoqWorkflowStepper.tsx
 * BoqWorkflowStepper — Zone 2 du DQE : stepper documentaire ÉTENDU et interactif.
 *
 * Jalons (référentiel `document-lifecycle`) :
 *   Besoin (DQE) → Publication AO → Devis → Contrat → Décompte
 *   → Validation technique → Facture finale
 *
 * Interactivité : cliquer sur un jalon déjà franchi propose la transition
 * INVERSE autorisée (REOPEN / UNPUBLISH / REVIEW) pour redéverrouiller les
 * lignes en mode brouillon. Les permissions viennent du référentiel + rôles.
 *
 * Codes techniques anglais MAJUSCULES, jamais affichés : libellés via i18n.
 */
import React, { useMemo, useState } from 'react';
import { Check, CircleDashed, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { DocumentLifecycleService } from '@/application/services/documents/DocumentLifecycleService';
import {
  LIFECYCLE_STAGES,
  type ReverseTransitionDef,
} from '@/config/referentials/documents/document-lifecycle.referential';
import {
  resolveInvoiceDocumentType,
  type InvoiceDocumentType,
} from '@/config/referentials/invoices/invoice-document-types.referential';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqSource } from '@/domain/entities/boq/BoqLine';

const REVERSIBLE_ROLES = ['admin', 'director', 'manager'];

export interface BoqWorkflowStepperProps {
  lines: BoqLineDTO[];
  /** Étape documentaire (déduite des lignes si absente). */
  documentType?: InvoiceDocumentType;
  source?: BoqSource;
  /** Masque les jalons postérieurs au contrat (contextes prévisionnels). */
  compact?: boolean;
  /** Notifie le parent après une transition inverse persistée. */
  onReversed?: (status: string) => void;
  className?: string;
}

export const BoqWorkflowStepper: React.FC<BoqWorkflowStepperProps> = ({
  lines,
  documentType,
  source,
  compact,
  onReversed,
  className,
}) => {
  const { t, translateStatus, language } = useI18n();
  const { hasAnyRole } = useAuth();
  const [pending, setPending] = useState<ReverseTransitionDef | null>(null);
  const [busy, setBusy] = useState(false);

  const safeLines = lines ?? [];
  const type = useMemo<InvoiceDocumentType>(() => {
    if (documentType) return documentType;
    return resolveInvoiceDocumentType({
      source: source ?? safeLines[0]?.source,
      documentType: safeLines[0]?.documentType,
      dqeType: safeLines[0]?.dqeType,
    }).code;
  }, [documentType, source, safeLines]);

  const state = useMemo(
    () => DocumentLifecycleService.resolveFromLines(type, safeLines),
    [type, safeLines],
  );

  const roles = useMemo(
    () => REVERSIBLE_ROLES.filter((r) => hasAnyRole?.([r])),
    [hasAnyRole],
  );

  const stages = compact ? LIFECYCLE_STAGES.slice(0, 4) : LIFECYCLE_STAGES;
  const lang = (language ?? 'fr') as 'fr' | 'ar' | 'en';

  const stageLabel = (code: string) => {
    const stage = LIFECYCLE_STAGES.find((s) => s.code === code);
    if (!stage) return code;
    const translated = t(stage.labelKey);
    return translated && !translated.includes(stage.labelKey) ? translated : stage.labels[lang] ?? stage.labels.fr;
  };

  const handleClick = (stageCode: string, reachable: boolean) => {
    if (!reachable || state.frozen) return;
    const transition = DocumentLifecycleService.reverseActionForStage({
      documentType: type,
      status: state.status,
      stageCode,
      actor: { roles },
    });
    if (!transition) {
      toast({
        title: t('dqe.reverse.unavailable') || 'Retour arrière indisponible',
        description: t('dqe.reverse.unavailable_hint') || 'Statut ou rôle insuffisant pour déverrouiller ce document.',
      });
      return;
    }
    setPending(transition);
  };

  const confirmReverse = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const result = await DocumentLifecycleService.applyReverse({ transition: pending, lines: safeLines });
      toast({
        title: t('dqe.reverse.done') || 'Document déverrouillé',
        description: `${translateStatus(result.status)} · ${result.updated}`,
      });
      onReversed?.(result.status);
      setPending(null);
    } catch (error) {
      toast({
        title: t('dqe.reverse.failed') || 'Retour arrière impossible',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ol className={cn('flex flex-wrap items-center gap-1 text-xs', className)} aria-label="workflow">
        {stages.map((stage, index) => {
          const done = index < state.stageIndex;
          const active = index === state.stageIndex;
          const reachable = index <= state.stageIndex;
          return (
            <li key={stage.code} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleClick(stage.code, reachable)}
                disabled={!reachable || state.frozen}
                aria-current={active ? 'step' : undefined}
                title={reachable && !state.frozen ? t('dqe.reverse.hint') || 'Cliquer pour revenir à cette étape' : undefined}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-2 py-1 font-medium transition-colors',
                  done && 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20',
                  active && 'border-primary bg-primary text-primary-foreground',
                  !done && !active && 'border-border text-muted-foreground',
                  (!reachable || state.frozen) && 'cursor-default opacity-70',
                  stage.kind === 'gate' && 'italic',
                )}
              >
                {done ? <Check className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
                {stageLabel(stage.code)}
                {done && !state.frozen && roles.length > 0 ? <Undo2 className="h-3 w-3 opacity-60" /> : null}
              </button>
              {index < stages.length - 1 ? <span className="text-muted-foreground">›</span> : null}
            </li>
          );
        })}
        <li className="ml-1">
          <Badge variant={state.editable ? 'secondary' : 'outline'}>{translateStatus(state.status)}</Badge>
        </li>
      </ol>

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending ? (t(pending.labelKey) || pending.labels[lang] || pending.labels.fr) : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('dqe.reverse.confirm') ||
                'Les lignes du document repasseront en édition. Cette action est tracée dans le cycle de vie.'}
              {pending ? ` → ${translateStatus(pending.targetStatus)}` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('common.cancel') || 'Annuler'}</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void confirmReverse(); }} disabled={busy}>
              {t('common.confirm') || 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/** Statut documentaire = statut métier le plus avancé porté par les lignes. */
export function resolveDocumentStatus(lines: BoqLineDTO[]): string {
  const type = resolveInvoiceDocumentType({
    source: lines?.[0]?.source,
    documentType: lines?.[0]?.documentType,
    dqeType: lines?.[0]?.dqeType,
  }).code;
  return DocumentLifecycleService.resolveFromLines(type, lines ?? []).status;
}

export default BoqWorkflowStepper;
