/**
 * DecompteTrackingPanel — suivi financier canonique (doctrine dépensé/décompte).
 *
 * Dépensé = Σ décomptes validés (factures acceptées) ; les lignes DQE et devis
 * ne sont affichées que comme « engagé prévisionnel ».
 */
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { T } from '@/components/i18n/T';
import { formatCurrency } from '@/utils/phaseDisplayHelpers';
import {
  useProjectDecomptesHex,
  usePhaseDecomptesHex,
} from '@/hooks/hexagonal/useDecomptesHex';
import type { DecompteRecordDTO, DecompteStatus } from '@/dtos/entities/DecompteRecordDTO';
import { FileText, Wallet, Clock, PiggyBank } from 'lucide-react';

interface Props {
  scope: 'project' | 'phase';
  /** ID du projet (scope=project) ou de la phase (scope=phase). */
  entityId?: string | null;
  /** Budget initial du périmètre. */
  initialBudget?: number;
  /** Engagements prévisionnels (lignes DQE / ressources) — informatif. */
  engaged?: number;
  className?: string;
}

const STATUS_BADGE: Record<DecompteStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; labelKey: string; fallback: string }> = {
  draft: { variant: 'outline', labelKey: 'decompte.status.draft', fallback: 'Brouillon' },
  submitted: { variant: 'secondary', labelKey: 'decompte.status.submitted', fallback: 'Soumis' },
  validated: { variant: 'default', labelKey: 'decompte.status.validated', fallback: 'Accepté' },
  paid: { variant: 'default', labelKey: 'decompte.status.paid', fallback: 'Payé' },
  rejected: { variant: 'destructive', labelKey: 'decompte.status.rejected', fallback: 'Rejeté' },
};

const DecompteRow: React.FC<{ decompte: DecompteRecordDTO; index: number }> = ({ decompte, index }) => {
  const badge = STATUS_BADGE[decompte.status];
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {decompte.decompteNumber || `#${index + 1}`}
          {decompte.invoiceNumber ? (
            <span className="ml-2 text-xs text-muted-foreground">
              <T k="decompte.invoice" fallback="Facture" /> {decompte.invoiceNumber}
            </span>
          ) : null}
        </p>
        {decompte.workDescription ? (
          <p className="truncate text-xs text-muted-foreground">{decompte.workDescription}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">
          {formatCurrency(decompte.validatedAmount || decompte.amount)}
        </span>
        <Badge variant={badge.variant}>
          <T k={badge.labelKey} fallback={badge.fallback} />
        </Badge>
      </div>
    </div>
  );
};

export const DecompteTrackingPanel: React.FC<Props> = ({
  scope,
  entityId,
  initialBudget = 0,
  engaged = 0,
  className,
}) => {
  const projectQuery = useProjectDecomptesHex(scope === 'project' ? entityId : null, {
    initialBudget,
    engaged,
  });
  const phaseQuery = usePhaseDecomptesHex(scope === 'phase' ? entityId : null, {
    initialBudget,
    engaged,
  });
  const { decomptes, summary, isLoading } = scope === 'project' ? projectQuery : phaseQuery;

  if (isLoading) {
    return <Skeleton className={`h-56 w-full ${className ?? ''}`} />;
  }

  const spent = summary?.decomptedValidated ?? 0;
  const paid = summary?.paid ?? 0;
  const remainingToPay = summary?.remainingToPay ?? 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          <T k="decompte.tracking.title" fallback="Suivi des décomptes" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <PiggyBank className="h-3 w-3" />
              <T k="decompte.initialBudget" fallback="Budget initial" />
            </p>
            <p className="text-lg font-semibold">{formatCurrency(initialBudget)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wallet className="h-3 w-3" />
              <T k="decompte.spent" fallback="Dépensé (décomptes validés)" />
            </p>
            <p className="text-lg font-semibold">{formatCurrency(spent)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <T k="decompte.remainingToPay" fallback="Reste à payer" />
            </p>
            <p className="text-lg font-semibold">{formatCurrency(remainingToPay)}</p>
            <p className="text-xs text-muted-foreground">
              <T k="decompte.paid" fallback="Payé" /> : {formatCurrency(paid)}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">
              <T k="decompte.engaged" fallback="Engagé prévisionnel (DQE)" />
            </p>
            <p className="text-lg font-semibold">{formatCurrency(engaged)}</p>
            <p className="text-xs text-muted-foreground">
              <T k="decompte.engaged.hint" fallback="Non compté comme dépensé" />
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            <T k="decompte.list" fallback="Décomptes" /> ({decomptes.length})
          </p>
          {decomptes.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              <T
                k="decompte.empty"
                fallback="Aucun décompte : le dépensé reste à 0 jusqu'à la validation d'une facture."
              />
            </p>
          ) : (
            decomptes.map((d, i) => <DecompteRow key={d.id} decompte={d} index={i} />)
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DecompteTrackingPanel;
