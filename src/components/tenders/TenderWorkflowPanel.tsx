/**
 * TenderWorkflowPanel — Fil conducteur unique du cycle DDE
 * Source unique : docs/config/referentials/tender/tender-workflow.referential.ts
 *  - TENDER_WIZARD_STEPS   (Identification → Cadre&Lots → DPAO → Planning → Publication)
 *  - TENDER_STATUSES        (statuts métier)
 *  - getAllowedTransitions (transitions autorisées + gardes)
 */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Lock, ArrowRight } from 'lucide-react';
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
  const currentStep = STATUS_TO_STEP[status] ?? 0;
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

  return (
    <div className="space-y-6">
      {/* Barre d'actions sticky : cycle de vie de l'AO uniquement */}
      <div className="sticky top-0 z-20 -mx-6 border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Cycle de vie de l'AO</span>
            {statusDef && (
              <Badge variant="outline">{statusDef.label}</Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {primaryTransitions.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">Aucune action disponible</span>
            ) : (
              primaryTransitions.map((t) => (
                <Button
                  key={`sticky-${t.from}-${t.to}`}
                  size="sm"
                  variant={t.blockedReason ? 'outline' : 'default'}
                  disabled={!!t.blockedReason || !onTransition}
                  title={t.blockedReason || t.label}
                  onClick={() => onTransition?.(t.to)}
                >
                  {t.blockedReason && <Lock className="mr-1 h-3 w-3" />}
                  {t.label}
                </Button>
              ))
            )}
          </div>
        </div>
      </div>


      {/* Statut courant + transitions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Cycle de vie & transitions</CardTitle>
          {statusDef && (
            <Badge variant="outline" className="capitalize">
              {statusDef.label}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {statusDef && (
            <p className="text-sm text-muted-foreground">{statusDef.description}</p>
          )}

          {transitions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Aucune transition disponible depuis « {status} ».</p>
          ) : (
            <div className="grid gap-2">
              {transitions.map((t) => (
                <div
                  key={`${t.from}-${t.to}`}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="uppercase">
                      {t.to}
                    </Badge>
                    <span className="text-sm font-medium">{t.label}</span>
                    {t.blockedReason && (
                      <span className="text-xs text-destructive flex items-center gap-1">
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

          <div className="text-xs text-muted-foreground pt-2 border-t">
            Contexte évalué : lots={String(ctx.hasLots)} · docs={String(ctx.hasDocuments)} · deadline={String(ctx.hasDeadline)} · soumissions={ctx.submissionsCount} · scores={String(ctx.hasEvaluationScores)} · lauréat={String(ctx.hasWinner)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TenderWorkflowPanel;
