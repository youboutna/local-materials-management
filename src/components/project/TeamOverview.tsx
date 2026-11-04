/**
 * TeamOverview — onglet « Affectations ».
 *
 * Lecture seule des ressources planifiées. Toute nouvelle ressource naît d'une
 * ligne DQE : le bouton renvoie vers l'onglet DQE, où la ligne est validée puis
 * transférée (BoqDispatchService -> BoqResourcePropagationService) qui la
 * répartit par type (matériaux, main d'œuvre, équipements).
 * Les ressources saisies hors DQE restent affichées, marquées « Hors DQE ».
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, User, Wrench, Package, AlertCircle } from 'lucide-react';
import { useProjectResourcesCrudHex } from '@/hooks/hexagonal/useProjectResourcesCrudHex';
import { useProjectPhasesForTasks } from '@/hooks/hexagonal/useEnhancedTasksHex';
import { T } from '@/components/i18n/T';

interface ResourceView {
  id?: string;
  name?: string;
  type?: string;
  notes?: string | null;
  unit?: string | null;
  quantity?: number | null;
  costPerUnit?: number | null;
  cost_per_unit?: number | null;
}

interface TeamOverviewProps {
  resources?: ResourceView[];
  setResources?: (resources: ResourceView[]) => void;
  projectId: string;
  phases?: unknown[];
}

/** Une ressource issue du DQE porte la référence « DQE <code> » posée par la propagation. */
export const isFromDqe = (resource: ResourceView): boolean =>
  /^DQE\b/.test(String(resource.notes ?? '').trim());

const ResourceSection: React.FC<{
  icon: React.ReactNode;
  titleKey: string;
  title: string;
  emptyKey: string;
  empty: string;
  items: ResourceView[];
}> = ({ icon, titleKey, title, emptyKey, empty, items }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {icon}
        <T k={titleKey} fallback={title} /> ({items.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-4"><T k={emptyKey} fallback={empty} /></p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((resource, index) => {
            const fromDqe = isFromDqe(resource);
            const unitCost = resource.costPerUnit ?? resource.cost_per_unit ?? 0;
            return (
              <div key={resource.id ?? index} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium">{resource.name}</h4>
                  <Badge variant={fromDqe ? 'secondary' : 'destructive'}>
                    {fromDqe
                      ? <T k="auto.teamoverview.origine_dqe" fallback="DQE" />
                      : <T k="auto.teamoverview.hors_dqe" fallback="Hors DQE" />}
                  </Badge>
                </div>
                {resource.notes && <p className="text-sm text-muted-foreground">{resource.notes}</p>}
                <div className="flex justify-between items-center mt-2">
                  <Badge variant="outline">{unitCost} MRU/{resource.unit || '—'}</Badge>
                  <span className="text-xs text-muted-foreground">
                    <T k="auto.teamoverview.qte" fallback="Qté" />: {resource.quantity ?? 0}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardContent>
  </Card>
);

const TeamOverview: React.FC<TeamOverviewProps> = ({ resources: propResources, projectId, phases: propPhases }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { resources: fetchedResources, isLoading } = useProjectResourcesCrudHex(projectId, !propResources);
  const { data: fetchedPhases = [] } = useProjectPhasesForTasks(projectId);

  const currentResources = (propResources || fetchedResources || []) as ResourceView[];
  const currentPhases = propPhases || fetchedPhases || [];

  const openDqe = () => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'dqe');
    setSearchParams(next);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (currentPhases.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">
            <T k="auto.teamoverview.aucune_phase_trouvee" fallback="Aucune phase trouvée" />
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            <T k="auto.teamoverview.creer_phases_avant" fallback="Créez d'abord les phases du projet, puis ajoutez les ressources dans le DQE." />
          </p>
        </CardContent>
      </Card>
    );
  }

  const byType = (type: string) => currentResources.filter((r) => r.type === type);
  const outsideDqe = currentResources.filter((r) => !isFromDqe(r)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            <T k="auto.teamoverview.equipe_et_ressources_delegation_publique" fallback="Équipe et ressources (délégation publique)" />
          </h3>
          <p className="text-sm text-muted-foreground">
            <T k="auto.teamoverview.ressources_via_dqe" fallback="Les ressources sont ajoutées dans le DQE, puis réparties par type après validation." />
          </p>
          {outsideDqe > 0 && (
            <p className="text-sm text-destructive">
              {outsideDqe} <T k="auto.teamoverview.ressources_hors_dqe" fallback="ressource(s) saisie(s) hors DQE" />
            </p>
          )}
        </div>
        <Button size="sm" onClick={openDqe}>
          <Plus className="h-4 w-4 mr-2" />
          <T k="auto.teamoverview.ajouter_via_dqe" fallback="Ajouter via le DQE" />
        </Button>
      </div>

      <ResourceSection icon={<User className="h-5 w-5" />} titleKey="auto.teamoverview.ressources_humaines" title="Ressources humaines"
        emptyKey="auto.teamoverview.aucune_ressource_humaine_assignee" empty="Aucune ressource humaine assignée" items={byType('human')} />
      <ResourceSection icon={<Wrench className="h-5 w-5" />} titleKey="auto.teamoverview.equipements" title="Équipements"
        emptyKey="auto.teamoverview.aucun_equipement_assigne" empty="Aucun équipement assigné" items={byType('equipment')} />
      <ResourceSection icon={<Package className="h-5 w-5" />} titleKey="auto.teamoverview.materiaux" title="Matériaux"
        emptyKey="auto.teamoverview.aucun_materiau_assigne" empty="Aucun matériau assigné" items={byType('material')} />
    </div>
  );
};

export default TeamOverview;
