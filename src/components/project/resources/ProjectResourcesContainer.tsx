/**
 * ProjectResourcesContainer — conteneur sémantique « Ressources » du projet.
 *
 * Onglets internes (les tables ne sont pas des onglets de premier niveau) :
 *  - Vue d'ensemble       : planifié vs consommé, toutes familles
 *  - Ressources humaines  : planifié (phases/DQE main d'œuvre) vs consommé
 *  - Matériaux            : planifié (DQE / matériaux de phase) vs livré / consommé
 *  - Matériel & équipement: planifié vs mobilisé
 *  - Affectations         : table d'exécution existante (TeamOverview)
 */
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Package, Wrench, LayoutGrid, ClipboardList } from 'lucide-react';
import TeamOverview from '@/components/project/TeamOverview';
import { getProjectResourceAggregatorService } from '@/application/services/ProjectResourceAggregatorService';
import type {
  ResourceFamilyBucketDTO,
  ResourceLineDTO,
} from '@/dtos/entities/ProjectResourceContainerDTO';

interface ProjectResourcesContainerProps {
  projectId: string;
  phases?: Array<Record<string, unknown>>;
  boqLines?: Array<Record<string, unknown>>;
  executedResources?: Array<Record<string, unknown>>;
  executedMaterials?: Array<Record<string, unknown>>;
  /** Ressources d'exécution passées à TeamOverview (compat existante). */
  resources?: any[];
  setResources?: (resources: any[]) => void;
}

const money = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} MRU`;

const originLabel: Record<ResourceLineDTO['origin'], string> = {
  dqe: 'DQE',
  phase: 'Phase',
  execution: 'Exécution',
};

const BucketSummary: React.FC<{ bucket: ResourceFamilyBucketDTO }> = ({ bucket }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div className="p-3 border rounded-lg">
      <p className="text-xs text-muted-foreground">Planifié</p>
      <p className="font-semibold">{money(bucket.plannedCost)}</p>
    </div>
    <div className="p-3 border rounded-lg">
      <p className="text-xs text-muted-foreground">Consommé</p>
      <p className="font-semibold">{money(bucket.actualCost)}</p>
    </div>
    <div className="p-3 border rounded-lg">
      <p className="text-xs text-muted-foreground">Écart</p>
      <p className={`font-semibold ${bucket.costVariance > 0 ? 'text-destructive' : 'text-primary'}`}>
        {money(bucket.costVariance)}
      </p>
    </div>
    <div className="p-3 border rounded-lg">
      <p className="text-xs text-muted-foreground">Taux de consommation</p>
      <p className="font-semibold">{bucket.consumptionRate}%</p>
      <Progress value={Math.min(bucket.consumptionRate, 100)} className="h-1.5 mt-1" />
    </div>
  </div>
);

const BucketTable: React.FC<{ bucket: ResourceFamilyBucketDTO }> = ({ bucket }) => {
  if (bucket.lines.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Aucune ressource de type « {bucket.label.toLowerCase()} » planifiée ni consommée.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Désignation</TableHead>
            <TableHead>Origine</TableHead>
            <TableHead>Unité</TableHead>
            <TableHead className="text-right">Qté planifiée</TableHead>
            <TableHead className="text-right">Coût planifié</TableHead>
            <TableHead className="text-right">Qté consommée</TableHead>
            <TableHead className="text-right">Coût consommé</TableHead>
            <TableHead className="text-right">Écart</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bucket.lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell className="font-medium">
                {line.name}
                {line.phaseName && (
                  <span className="block text-xs text-muted-foreground">{line.phaseName}</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{originLabel[line.origin]}</Badge>
              </TableCell>
              <TableCell>{line.unit ?? '—'}</TableCell>
              <TableCell className="text-right">{line.plannedQuantity.toLocaleString('fr-FR')}</TableCell>
              <TableCell className="text-right">{money(line.plannedCost)}</TableCell>
              <TableCell className="text-right">{line.actualQuantity.toLocaleString('fr-FR')}</TableCell>
              <TableCell className="text-right">{money(line.actualCost)}</TableCell>
              <TableCell
                className={`text-right ${line.costVariance > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {money(line.costVariance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ProjectResourcesContainer: React.FC<ProjectResourcesContainerProps> = ({
  projectId,
  phases = [],
  boqLines = [],
  executedResources = [],
  executedMaterials = [],
  resources,
  setResources,
}) => {
  const container = useMemo(
    () =>
      getProjectResourceAggregatorService().aggregate({
        projectId,
        phases,
        boqLines,
        executedResources: executedResources.length > 0 ? executedResources : (resources ?? []),
        executedMaterials,
      }),
    [projectId, phases, boqLines, executedResources, executedMaterials, resources],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Ressources du projet
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {container.totals.lineCount} ligne(s) — planifié {money(container.totals.plannedCost)} / consommé{' '}
            {money(container.totals.actualCost)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="human" className="text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5 mr-1" /> Humaines
            </TabsTrigger>
            <TabsTrigger value="materials" className="text-xs sm:text-sm">
              <Package className="h-3.5 w-3.5 mr-1" /> Matériaux
            </TabsTrigger>
            <TabsTrigger value="equipment" className="text-xs sm:text-sm">
              <Wrench className="h-3.5 w-3.5 mr-1" /> Équipements
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-xs sm:text-sm">
              <ClipboardList className="h-3.5 w-3.5 mr-1" /> Affectations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {[container.human, container.materials, container.equipment].map((bucket) => (
              <div key={bucket.family} className="space-y-2">
                <h4 className="font-medium text-sm">{bucket.label}</h4>
                <BucketSummary bucket={bucket} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="human" className="mt-4 space-y-4">
            <BucketSummary bucket={container.human} />
            <BucketTable bucket={container.human} />
          </TabsContent>

          <TabsContent value="materials" className="mt-4 space-y-4">
            <BucketSummary bucket={container.materials} />
            <BucketTable bucket={container.materials} />
          </TabsContent>

          <TabsContent value="equipment" className="mt-4 space-y-4">
            <BucketSummary bucket={container.equipment} />
            <BucketTable bucket={container.equipment} />
          </TabsContent>

          <TabsContent value="assignments" className="mt-4">
            <TeamOverview
              resources={resources}
              setResources={setResources}
              projectId={projectId}
              phases={phases as any[]}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProjectResourcesContainer;
