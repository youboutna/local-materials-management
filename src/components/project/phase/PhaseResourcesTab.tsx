/**
 * PhaseResourcesTab
 * Onglet unique « Ressources » d'une phase : matériaux, équipements et main
 * d'œuvre. Source de vérité = la chaîne DQE → Appel d'offres → Devis accepté,
 * exposée par `usePhaseResourceLinkHex` (PhaseResourceLinkService).
 *
 * Quand la phase est alimentée par la chaîne (`linkedToBoq`), les listes sont en
 * lecture seule : la saisie manuelle est masquée. Sinon, on retombe sur les
 * assignations manuelles (PhaseMaterials / équipe).
 * Aucun accès direct à Supabase (mem://constraints/no-direct-supabase-in-react).
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HardHat, Package, Users, Wrench, Link2 } from 'lucide-react';
import PhaseMaterials from '@/components/project/PhaseMaterials';
import { usePhaseEmployeesHex } from '@/hooks/hexagonal/usePhaseEmployeesHex';
import { usePhaseResourceLinkHex } from '@/hooks/hexagonal/usePhaseResourceLinkHex';
import { formatAmount2, formatNumber2 } from '@/utils/reportNumbers';
import { T } from '@/components/i18n/T';
import { TranslatedUnit } from '@/components/i18n/TranslatedBadges';
import type { PhaseResourceBucketDTO } from '@/dtos/entities/PhasePlannedResourcesDTO';

interface PhaseResourcesTabProps {
  phaseId: string;
  projectId: string;
  /** Navigation vers l'onglet Équipe (gestion des membres internes). */
  onOpenTeam?: () => void;
}

type ResourceFilter = 'all' | 'material' | 'equipment' | 'labor';

const BucketList: React.FC<{
  bucket: PhaseResourceBucketDTO;
  title: React.ReactNode;
  icon: React.ReactNode;
}> = ({ bucket, title, icon }) => (
  <Card>
    <CardHeader className="py-3">
      <CardTitle className="text-base flex items-center gap-2">
        {icon}
        {title} ({bucket.count})
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {bucket.lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <T k="phase.resources.empty" fallback="Aucune ressource pour cette famille." />
        </p>
      ) : (
        bucket.lines.map((line) => (
          <div key={line.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm">
            <div className="min-w-0">
              <div className="truncate font-medium">{line.designation}</div>
              <div className="text-xs text-muted-foreground">
                {formatNumber2(line.quantity)} <TranslatedUnit code={line.unit} /> ·{' '}
                {formatAmount2(line.unitPrice)} MRU
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {line.origin === 'quote' ? (
                  <T k="phase.resources.origin_quote" fallback="Devis" />
                ) : line.origin === 'takeoff' ? (
                  <T k="phase.resources.origin_takeoff" fallback="Métré" />
                ) : (
                  <T k="phase.resources.origin_dqe" fallback="DQE" />
                )}
              </Badge>
              <Badge variant="secondary">{formatAmount2(line.totalHt)} MRU</Badge>
            </div>
          </div>
        ))
      )}
    </CardContent>
  </Card>
);

const PhaseResourcesTab: React.FC<PhaseResourcesTabProps> = ({ phaseId, projectId, onOpenTeam }) => {
  const [filter, setFilter] = useState<ResourceFilter>('all');

  const { resources, isLoading } = usePhaseResourceLinkHex(projectId, phaseId);
  const { employees = [], totalLaborCost = 0 } = usePhaseEmployeesHex(phaseId);

  const linked = Boolean(resources?.linkedToBoq);

  const counts = useMemo(
    () => ({
      material: resources?.materials.count ?? 0,
      equipment: resources?.equipment.count ?? 0,
      labor: linked ? resources?.labor.count ?? 0 : employees.length,
    }),
    [resources, linked, employees.length],
  );

  const totals = useMemo(() => {
    const materialsCost = resources?.materials.plannedCost ?? 0;
    const equipmentsCost = resources?.equipment.plannedCost ?? 0;
    const laborCost = linked ? resources?.labor.plannedCost ?? 0 : totalLaborCost;
    return {
      materialsCost,
      equipmentsCost,
      laborCost,
      total: materialsCost + equipmentsCost + laborCost,
      engaged: resources?.totals.engagedCost ?? 0,
    };
  }, [resources, linked, totalLaborCost]);

  const filters: Array<{ id: ResourceFilter; label: React.ReactNode; count: number }> = [
    {
      id: 'all',
      label: <T k="auto.phaseresources.tous" fallback="Tous" />,
      count: counts.material + counts.equipment + counts.labor,
    },
    { id: 'material', label: <T k="auto.phaseresources.materiaux" fallback="Matériaux" />, count: counts.material },
    { id: 'equipment', label: <T k="auto.phaseresources.equipements" fallback="Équipements" />, count: counts.equipment },
    { id: 'labor', label: <T k="phase.resources.labor" fallback="Main d'œuvre" />, count: counts.labor },
  ];

  const showMaterials = filter === 'all' || filter === 'material';
  const showEquipments = filter === 'all' || filter === 'equipment';
  const showLabor = filter === 'all' || filter === 'labor';

  return (
    <div className="space-y-4">
      {/* Indicateurs de quantité / coût */}
      <Card>
        <CardContent className="py-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">
            <T k="auto.phaseresources.synthese" fallback="Synthèse" /> :
          </span>
          <Badge variant="outline" className="gap-1">
            <Package className="h-3 w-3" />
            {counts.material} <T k="auto.phaseresources.materiaux" fallback="Matériaux" /> ·{' '}
            {formatAmount2(totals.materialsCost)} MRU
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Wrench className="h-3 w-3" />
            {counts.equipment} <T k="auto.phaseresources.equipements" fallback="Équipements" /> ·{' '}
            {formatAmount2(totals.equipmentsCost)} MRU
          </Badge>
          <Badge variant="outline" className="gap-1">
            <HardHat className="h-3 w-3" />
            {counts.labor} <T k="phase.resources.labor" fallback="Main d'œuvre" /> ·{' '}
            {formatAmount2(totals.laborCost)} MRU
          </Badge>
          <Badge className="gap-1">
            <T k="auto.phaseresources.total" fallback="Total" /> : {formatAmount2(totals.total)} MRU
          </Badge>
          {totals.engaged > 0 && (
            <Badge variant="secondary" className="gap-1">
              <T k="phase.resources.engaged" fallback="Engagé" /> : {formatAmount2(totals.engaged)} MRU
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* État de la chaîne DQE → AO → Devis */}
      {resources && (
        <div className="flex flex-wrap items-center gap-2">
          {linked && (
            <Badge variant="secondary" className="gap-1">
              <Link2 className="h-3 w-3" />
              <T k="phase.resources.linked_boq" fallback="Alimenté par le DQE / devis" />
            </Badge>
          )}
          <Badge variant={resources.chain.dqeValidated ? 'secondary' : 'outline'}>
            <T k="phase.chain.dqe_validated" fallback="DQE validé" />
            {resources.chain.dqeValidated ? ' ✓' : ' —'}
          </Badge>
          <Badge variant={resources.chain.tenderPublished ? 'secondary' : 'outline'}>
            <T k="dqe.badge.tender_published" fallback="Appel d'offres publié" />
            {resources.chain.tenderPublished ? ' ✓' : ' —'}
          </Badge>
          <Badge variant={resources.chain.quoteAccepted ? 'secondary' : 'outline'}>
            <T k="phase.chain.quote_accepted" fallback="Devis accepté" />
            {resources.chain.quoteAccepted ? ' ✓' : ` (${resources.chain.quotesReceived})`}
          </Badge>
        </div>
      )}

      {/* Filtres par type de ressource */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? 'default' : 'outline'}
            onClick={() => setFilter(f.id)}
          >
            {f.label} ({f.count})
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          <T k="common.loading" fallback="Chargement…" />
        </p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {showMaterials &&
            (linked && resources ? (
              <BucketList
                bucket={resources.materials}
                title={<T k="auto.phaseresources.materiaux" fallback="Matériaux" />}
                icon={<Package className="h-4 w-4 text-primary" />}
              />
            ) : (
              <PhaseMaterials phaseId={phaseId} projectId={projectId} kind="material" title="Matériaux" />
            ))}

          {showEquipments &&
            (linked && resources ? (
              <BucketList
                bucket={resources.equipment}
                title={<T k="auto.phaseresources.equipements" fallback="Équipements" />}
                icon={<Wrench className="h-4 w-4 text-primary" />}
              />
            ) : (
              <PhaseMaterials
                phaseId={phaseId}
                projectId={projectId}
                kind="equipment"
                title="Équipements"
                addLabel="Ajouter un équipement"
              />
            ))}

          {showLabor &&
            (linked && resources && resources.labor.count > 0 ? (
              <BucketList
                bucket={resources.labor}
                title={<T k="phase.resources.labor" fallback="Main d'œuvre" />}
                icon={<HardHat className="h-4 w-4 text-primary" />}
              />
            ) : (
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <HardHat className="h-4 w-4 text-primary" />
                      <T k="phase.resources.labor" fallback="Main d'œuvre" /> ({employees.length})
                    </CardTitle>
                    {onOpenTeam && (
                      <Button size="sm" variant="outline" onClick={onOpenTeam}>
                        <Users className="h-4 w-4 mr-2" />
                        <T k="auto.phaseresources.gerer_equipe" fallback="Gérer l'équipe" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {employees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      <T k="phase.resources.empty" fallback="Aucune ressource pour cette famille." />
                    </p>
                  ) : (
                    employees.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between border rounded-lg p-2 text-sm"
                      >
                        <div>
                          <div className="font-medium">{emp.employeeName}</div>
                          <div className="text-xs text-muted-foreground">{emp.employeeRole}</div>
                        </div>
                        {emp.dailyRate != null && (
                          <Badge variant="secondary">
                            {formatNumber2(emp.dailyRate)} MRU/<TranslatedUnit code="day" />
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default PhaseResourcesTab;
