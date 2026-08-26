/**
 * BoqWorkflowStepper — Zone 2 du redesign DQE : stepper visuel du cycle de vie
 * documentaire DRAFT → SUBMITTED → VALIDATED (→ INVOICED → PAID).
 *
 * Purement présentationnel : le statut courant est déduit des lignes du document
 * (statut le plus avancé), les libellés proviennent du référentiel i18n. Les
 * codes techniques restent en anglais MAJUSCULES, jamais affichés.
 */
import React, { useMemo } from 'react';
import { Check, CircleDashed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/useI18n';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqStatus } from '@/application/services/boq/BoqWorkflowService';

/** Ordre canonique du workflow documentaire (codes techniques). */
const FLOW: BoqStatus[] = ['draft', 'submitted', 'validated', 'invoiced', 'paid'];
const RANK: Record<string, number> = {
  draft: 0, signed: 0, rejected: 0,
  submitted: 1, validated: 2, invoiced: 3, paid: 4,
};

export interface BoqWorkflowStepperProps {
  lines: BoqLineDTO[];
  /** Masque les étapes de facturation (contextes purement prévisionnels). */
  compact?: boolean;
  className?: string;
}

/** Statut documentaire = statut le plus avancé porté par les lignes. */
export function resolveDocumentStatus(lines: BoqLineDTO[]): BoqStatus {
  let best: BoqStatus = 'draft';
  let bestRank = -1;
  for (const line of lines) {
    const code = String(line.status ?? 'draft').toLowerCase();
    const rank = RANK[code] ?? 0;
    if (rank > bestRank) { bestRank = rank; best = (code as BoqStatus) ?? 'draft'; }
  }
  return best;
}

export const BoqWorkflowStepper: React.FC<BoqWorkflowStepperProps> = ({ lines, compact, className }) => {
  const { translateStatus } = useI18n();
  const current = useMemo(() => resolveDocumentStatus(lines ?? []), [lines]);
  const steps = compact ? FLOW.slice(0, 3) : FLOW;
  const currentRank = RANK[current] ?? 0;
  const rejected = current === 'rejected';

  return (
    <ol className={cn('flex flex-wrap items-center gap-1 text-xs', className)} aria-label="workflow">
      {steps.map((step, index) => {
        const rank = RANK[step];
        const done = rank < currentRank;
        const active = rank === currentRank;
        return (
          <li key={step} className="flex items-center gap-1">
            <span
              className={cn(
                'flex items-center gap-1 rounded-full border px-2 py-1 font-medium',
                done && 'border-primary/40 bg-primary/10 text-primary',
                active && !rejected && 'border-primary bg-primary text-primary-foreground',
                active && rejected && 'border-destructive bg-destructive text-destructive-foreground',
                !done && !active && 'border-border text-muted-foreground',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {done ? <Check className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
              {translateStatus(rejected && active ? 'rejected' : step)}
            </span>
            {index < steps.length - 1 ? <span className="text-muted-foreground">›</span> : null}
          </li>
        );
      })}
    </ol>
  );
};

export default BoqWorkflowStepper;
