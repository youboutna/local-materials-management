/**
 * PhaseTeamTab
 * Onglet « Équipe » d'une phase. Source unique : PhaseAggregateDTO.
 *  - Main d'œuvre planifiée : lignes de main d'œuvre du bordereau (DQE / devis accepté).
 *  - Saisie manuelle (phase_employees) : uniquement si la phase n'est pas rattachée
 *    à un bordereau — principe `linkedToBoq` appliqué aussi à l'équipe.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, HardHat, Info } from 'lucide-react';
import PhaseEmployees from '@/components/project/PhaseEmployees';
import { T } from '@/components/i18n/T';
import { usePhaseAggregateHex } from '@/hooks/hexagonal/usePhaseAggregateHex';
import { useI18n } from '@/hooks/useI18n';

interface PhaseTeamTabProps {
  phaseId: string;
  projectId: string;
  /** Budget déclaré de la phase (repli si aucun DQE validé). */
  declaredBudget?: number | null;
}

const PhaseTeamTab: React.FC<PhaseTeamTabProps> = ({ phaseId, projectId, declaredBudget }) => {
  const { formatCurrency } = useI18n() as unknown as { formatCurrency?: (v: number) => string };
  const { aggregate, isLoading } = usePhaseAggregateHex({ projectId, phaseId, declaredBudget });

  const money = (value: number) =>
    formatCurrency ? formatCurrency(value) : `${new Intl.NumberFormat('fr-FR').format(value)} MRU`;

  const planned = aggregate.team.filter((m) => m.origin === 'dqe');
  const manual = aggregate.team.filter((m) => m.origin === 'manuel');
  const laborCost = planned.reduce((sum, m) => sum + m.totalCost, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <HardHat className="h-4 w-4 text-primary" />
              <T k="auto.phaseteam.main_doeuvre_planifiee" fallback="Main d’œuvre planifiée (bordereau)" />
              <Badge variant="secondary">{planned.length}</Badge>
            </span>
            {laborCost > 0 && (
              <span className="text-sm font-normal text-muted-foreground">{money(laborCost)}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">
              <T k="auto.phaseteam.chargement" fallback="Chargement de la main d’œuvre…" />
            </p>
          ) : planned.length === 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <T
                  k="auto.phaseteam.empty_labor"
                  fallback="Aucune main d’œuvre planifiée pour cette phase. Elle sera alimentée automatiquement par les lignes « main d’œuvre » du DQE ou du devis accepté rattaché à la phase."
                />
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">Poste</th>
                    <th className="py-2 text-right font-medium">Quantité</th>
                    <th className="py-2 text-right font-medium">Coût unitaire</th>
                    <th className="py-2 text-right font-medium">Total</th>
                    <th className="py-2 text-right font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {planned.map((member) => (
                    <tr key={member.id} className="border-b last:border-0">
                      <td className="py-2 pr-2">{member.name}</td>
                      <td className="py-2 text-right tabular-nums">
                        {member.quantity ?? '—'} {member.unit ?? ''}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {member.dailyRate != null ? money(member.dailyRate) : '—'}
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">{money(member.totalCost)}</td>
                      <td className="py-2 text-right">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {aggregate.source === 'devis' ? 'Devis' : 'DQE'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <T k="auto.phaseteam.membres_internes" fallback="Membres internes de la phase" />
            <Badge variant="secondary">{manual.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aggregate.linkedToBoq ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  <T
                    k="auto.phaseteam.locked_by_boq"
                    fallback="Cette phase est rattachée à un bordereau : la composition de l’équipe est pilotée par le DQE / devis. La saisie manuelle est désactivée pour préserver la cohérence des coûts."
                  />
                </span>
              </div>
              {manual.length > 0 && (
                <ul className="text-sm divide-y">
                  {manual.map((member) => (
                    <li key={member.id} className="flex items-center justify-between py-2">
                      <span>{member.name}</span>
                      <span className="text-muted-foreground text-xs">{member.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <PhaseEmployees phaseId={phaseId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PhaseTeamTab;
