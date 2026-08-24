/**
 * PhaseResourcesTab
 * Onglet unique « Ressources » d'une phase : matériaux, équipements et
 * main d'œuvre, avec indicateurs de quantité et filtres par type.
 * Réutilise les composants existants (PhaseMaterials) et les hooks hexagonaux
 * (aucun accès direct à Supabase — voir mem://constraints/no-direct-supabase-in-react).
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HardHat, Package, Users, Wrench } from 'lucide-react';
import PhaseMaterials from '@/components/project/PhaseMaterials';
import { usePhaseMaterialsHex } from '@/hooks/hexagonal';
import { usePhaseEmployeesHex } from '@/hooks/hexagonal/usePhaseEmployeesHex';
import { getMaterialResourceKind } from '@/utils/resourceKind';
import { formatAmount2, formatNumber2 } from '@/utils/reportNumbers';
import { T } from '@/components/i18n/T';
import { TranslatedUnit } from '@/components/i18n/TranslatedBadges';

interface PhaseResourcesTabProps {
  phaseId: string;
  projectId: string;
  /** Navigation vers l'onglet Équipe (gestion des membres internes). */
  onOpenTeam?: () => void;
}

type ResourceFilter = 'all' | 'material' | 'equipment' | 'labor';

const PhaseResourcesTab: React.FC<PhaseResourcesTabProps> = ({ phaseId, projectId, onOpenTeam }) => {
  const [filter, setFilter] = useState<ResourceFilter>('all');

  const { phaseMaterials = [] } = usePhaseMaterialsHex(phaseId, projectId);
  const { employees = [], totalLaborCost = 0 } = usePhaseEmployeesHex(phaseId);

  const split = useMemo(() => {
    const materials = phaseMaterials.filter(
      (pm) => getMaterialResourceKind(pm.material?.category) === 'material'
    );
    const equipments = phaseMaterials.filter(
      (pm) => getMaterialResourceKind(pm.material?.category) === 'equipment'
    );
    const cost = (rows: typeof phaseMaterials) =>
      rows.reduce((sum, pm) => sum + pm.quantity * (pm.material?.price_per_unit || 0), 0);
    return {
      materials,
      equipments,
      materialsCost: cost(materials),
      equipmentsCost: cost(equipments),
    };
  }, [phaseMaterials]);

  const totalCost = split.materialsCost + split.equipmentsCost + totalLaborCost;

  const filters: Array<{ id: ResourceFilter; label: React.ReactNode; count: number }> = [
    {
      id: 'all',
      label: <T k="auto.phaseresources.tous" fallback="Tous" />,
      count: split.materials.length + split.equipments.length + employees.length,
    },
    {
      id: 'material',
      label: <T k="auto.phaseresources.materiaux" fallback="Matériaux" />,
      count: split.materials.length,
    },
    {
      id: 'equipment',
      label: <T k="auto.phaseresources.equipements" fallback="Équipements" />,
      count: split.equipments.length,
    },
    { id: 'labor', label: "Main d'œuvre", count: employees.length },
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
            {split.materials.length} <T k="auto.phaseresources.materiaux" fallback="Matériaux" /> ·{' '}
            {formatAmount2(split.materialsCost)} MRU
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Wrench className="h-3 w-3" />
            {split.equipments.length} <T k="auto.phaseresources.equipements" fallback="Équipements" /> ·{' '}
            {formatAmount2(split.equipmentsCost)} MRU
          </Badge>
          <Badge variant="outline" className="gap-1">
            <HardHat className="h-3 w-3" />
            {employees.length} Main d'œuvre · {formatAmount2(totalLaborCost)} MRU
          </Badge>
          <Badge className="gap-1">
            <T k="auto.phaseresources.total" fallback="Total" /> : {formatAmount2(totalCost)} MRU
          </Badge>
        </CardContent>
      </Card>

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {showMaterials && (
          <PhaseMaterials
            phaseId={phaseId}
            projectId={projectId}
            kind="material"
            title="Matériaux"
            emptyLabel="Aucun matériau assigné à cette phase (alimenté par le métré / DQE)."
          />
        )}

        {showEquipments && (
          <PhaseMaterials
            phaseId={phaseId}
            projectId={projectId}
            kind="equipment"
            title="Équipements"
            addLabel="Ajouter un équipement"
            emptyLabel="Aucun équipement affecté à cette phase."
          />
        )}

        {showLabor && (
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <HardHat className="h-4 w-4 text-primary" />
                  Main d'œuvre ({employees.length})
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
                  Aucune main d'œuvre affectée. Ajoutez les membres depuis l'onglet Équipe.
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
        )}
      </div>
    </div>
  );
};

export default PhaseResourcesTab;
