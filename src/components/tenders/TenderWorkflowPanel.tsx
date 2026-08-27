/**
 * TenderWorkflowPanel — Fil conducteur unique du cycle DDE
 * Source unique : docs/config/referentials/tender/tender-workflow.referential.ts
 *  - TENDER_WIZARD_STEPS   (Identification → Cadre&Lots → DPAO → Planning → Publication)
 *  - TENDER_STATUSES        (statuts métier)
 *  - getAllowedTransitions (transitions autorisées + gardes)
 */
import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Lock } from 'lucide-react';

import {
  TENDER_WIZARD_STEPS,
  TENDER_STATUSES,
  TenderStatusCode,
  getAllowedTransitions,
  TenderTransitionContext,
} from '@/config/referentials/tender/tender-workflow.referential';
import { T } from '@/components/i18n/T';

interface TenderWorkflowPanelProps {
  tenderId: string;
  status: string;
  context: Partial<TenderTransitionContext>;
  onTransition?: (to: TenderStatusCode) => void;
}

// Correspondance statut → étape wizard active (heuristique).
const STATUS_TO_STEP: Record<string, number> = {
  draft: 2,               // encore en préparation
  published: 4,           // publication faite
  open: 4,
  under_evaluation: 4,
  awarded: 4,
  contracted: 4,
  closed: 4,
  cancelled: 4,
};

export function TenderWorkflowPanel({ tenderId, status, context, onTransition }: TenderWorkflowPanelProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const statusDef = TENDER_STATUSES[status as TenderStatusCode];


  const ctx: TenderTransitionContext = {
    hasLots: context.hasLots ?? false,
    hasDocuments: context.hasDocuments ?? false,
    hasDeadline: context.hasDeadline ?? false,
    submissionsCount: context.submissionsCount ?? 0,
    hasEvaluationScores: context.hasEvaluationScores ?? false,
    hasWinner: context.hasWinner ?? false,
    contractSigned: context.contractSigned ?? false,
  };

  const transitions = useMemo(
    () => getAllowedTransitions((status as TenderStatusCode) ?? 'draft', ctx),
    [status, ctx.hasLots, ctx.hasDocuments, ctx.hasDeadline, ctx.submissionsCount, ctx.hasEvaluationScores, ctx.hasWinner, ctx.contractSigned]
  );

  // Actions principales (max 4) exposées dans la barre sticky.
  const primaryTransitions = transitions.slice(0, 4);
  const secondaryTransitions = transitions.slice(4);


  return (
    <div className="space-y-3">
      {/* Barre d'actions sticky : cycle de vie de l'AO (source unique, sans redondance) */}
      <div className="sticky top-0 z-20 -mx-6 border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              <T k="auto.tenderworkflowpanel.cycle_de_vie_de_l_ao" fallback="Cycle de vie de l'AO" />
            </span>
            {statusDef && <Badge variant="outline">{statusDef.label}</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {primaryTransitions.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">
                <T k="auto.tenderworkflowpanel.aucune_action_disponible" fallback="Aucune action disponible" />
              </span>
            ) : (
              primaryTransitions.map((t) => {
                const blocked = !!t.blockedReason || !onTransition;
                return (
                  <Button
                    key={`sticky-${t.from}-${t.to}`}
                    size="sm"
                    variant={blocked ? 'secondary' : 'default'}
                    className={blocked ? 'text-muted-foreground' : 'bg-success text-success-foreground hover:bg-success/90'}
                    disabled={blocked}
                    title={t.blockedReason || t.label}
                    onClick={() => onTransition?.(t.to)}
                  >
                    {t.blockedReason && <Lock className="mr-1 h-3 w-3" />}
                    {t.label}
                  </Button>
                );
              })

            )}
          </div>
        </div>
      </div>

      {/* Détails (pliables) : description du statut, transitions secondaires et contexte évalué */}
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/40"
          >
            <span className="font-medium">
              <T k="auto.tenderworkflowpanel.details_du_cycle" fallback="Détails du cycle & transitions" />
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {statusDef && <p className="text-sm text-muted-foreground">{statusDef.description}</p>}

          {secondaryTransitions.length > 0 && (
            <div className="grid gap-2">
              {secondaryTransitions.map((t) => (
                <div key={`${t.from}-${t.to}`} className="flex items-center justify-between gap-3 rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t.label}</span>
                    {t.blockedReason && (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <Lock className="h-3 w-3" /> {t.blockedReason}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={t.blockedReason ? 'outline' : 'default'}
                    disabled={!!t.blockedReason || !onTransition}
                    onClick={() => onTransition?.(t.to)}
                  >
                    {t.label}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-2 text-xs text-muted-foreground">
            lots={String(ctx.hasLots)} · docs={String(ctx.hasDocuments)} · deadline={String(ctx.hasDeadline)} · soumissions={ctx.submissionsCount} · scores={String(ctx.hasEvaluationScores)} · lauréat={String(ctx.hasWinner)}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default TenderWorkflowPanel;

