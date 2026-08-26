/**
 * PhaseTeamTab
 * Onglet « Équipe » d'une phase.
 *
 * Source unique : PhaseAggregateDTO (main d'œuvre du bordereau DQE/Devis +
 * saisies `phase_employees`). La saisie manuelle est masquée dès que la phase
 * est alimentée par un bordereau (`linkedToBoq`) afin d'éviter les doublons.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileSpreadsheet, PencilLine } from 'lucide-react';
import PhaseEmployees from '@/components/project/PhaseEmployees';
import { T } from '@/components/i18n/T';
import { formatCurrency } from '@/utils/phaseDisplayHelpers';
import { usePhaseAggregateHex } from '@/hooks/hexagonal/usePhaseAggregateHex';

interface PhaseTeamTabProps {
  phaseId: string;
  projectId: string;
  /** Budget déclaré de la phase (repli si aucun DQE validé). */
  declaredBudget?: number;
}

const PhaseTeamTab: React.FC<PhaseTeamTabProps> = ({ phaseId, projectId, declaredBudget = 0 }) => {
  const { aggregate, isLoading } = usePhaseAggregateHex({ projectId, phaseId, declaredBudget });
  const { team, linkedToBoq } = aggregate;
  const laborCost = team.reduce((sum, member) => sum + (member.totalCost || 0), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex flex-wrap items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <T k="phase.team.title" fallback="Main d'œuvre de la phase" />
            <Badge variant="outline">{team.length}</Badge>
            {linkedToBoq ? (
              <Badge variant="secondary" className="gap-1">
                <FileSpreadsheet className="h-3 w-3" />
                <T k="phase.team.sourceBoq" fallback="Issue du bordereau (DQE / Devis)" />
              </Badge>
            ) : null}
            {laborCost > 0 ? (
              <span className="ml-auto text-sm font-semibold">{formatCurrency(laborCost)}</span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : team.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              <T
                k="phase.team.empty"
                fallback="Aucune main d'œuvre : elle sera alimentée automatiquement par les lignes de personnel du DQE validé, ou saisie manuellement ci-dessous."
              />
            </p>
          ) : (
            team.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  {member.quantity ? (
                    <span className="text-xs text-muted-foreground">
                      {member.quantity} {member.unit ?? ''}
                    </span>
                  ) : null}
                  {member.totalCost > 0 ? (
                    <span className="text-sm font-semibold">{formatCurrency(member.totalCost)}</span>
                  ) : null}
                  <Badge variant={member.origin === 'dqe' ? 'secondary' : 'outline'} className="gap-1">
                    {member.origin === 'dqe' ? (
                      <>
                        <FileSpreadsheet className="h-3 w-3" />
                        <T k="phase.team.origin.dqe" fallback="Bordereau" />
                      </>
                    ) : (
                      <>
                        <PencilLine className="h-3 w-3" />
                        <T k="phase.team.origin.manual" fallback="Saisie" />
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Saisie manuelle : uniquement si la phase n'est pas pilotée par un bordereau. */}
      {!linkedToBoq ? (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PencilLine className="h-4 w-4 text-primary" />
              <T k="phase.team.manual" fallback="Membres internes saisis" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PhaseEmployees phaseId={phaseId} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default PhaseTeamTab;
