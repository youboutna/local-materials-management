/**
 * ProjectDqeTab — DQE global à l'échelle projet.
 * - Compose des lignes BOQ (source = 'dqe') éditables via import.
 * - Compare l'expression de besoin (quantity_takeoff) avec le DQE.
 * Flux hexagonal : UI → useBoqDocument (hook hex) → boqRepository (adapter).
 * Aucun accès direct à supabase.from().
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListTree, GitCompare, FileSpreadsheet } from 'lucide-react';
import {
  BoqLineTable,
  BoqImportDialog,
  BoqComparisonTable,
  BoqBudgetDashboard,
  useBoqDocument,
} from '@/components/boq';
import type { ReferentialType } from '@/config/referentials';


interface Props {
  projectId: string;
  referentialCode?: ReferentialType;
}

const ProjectDqeTab: React.FC<Props> = ({ projectId, referentialCode }) => {
  const dqe = useBoqDocument({ source: 'dqe', contextId: projectId, projectId });
  const takeoff = useBoqDocument({
    source: 'quantity_takeoff',
    contextId: projectId,
    projectId,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ListTree className="h-5 w-5" />
            DQE global (Détail Quantitatif Estimatif)
          </CardTitle>
          <BoqImportDialog
            source="dqe"
            contextId={projectId}
            projectId={projectId}
            defaultReferentialCode={referentialCode}
            title="Importer un DQE"
            trigger={
              <button className="inline-flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 hover:bg-accent">
                <FileSpreadsheet className="h-4 w-4" /> Importer
              </button>
            }
            onImported={() => dqe.refetch()}
          />
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="lines" className="space-y-4">
            <TabsList>
              <TabsTrigger value="lines">Lignes DQE</TabsTrigger>
              <TabsTrigger value="compare">
                <GitCompare className="h-4 w-4 mr-1" /> Comparaison besoin ↔ DQE
              </TabsTrigger>
              <TabsTrigger value="budget">Suivi budget</TabsTrigger>
            </TabsList>


            <TabsContent value="lines">
              {dqe.isLoading ? (
                <div className="text-sm text-muted-foreground">Chargement…</div>
              ) : (
                <BoqLineTable
                  lines={dqe.lines}
                  emptyLabel="Aucune ligne DQE. Importez un fichier pour démarrer."
                />
              )}
            </TabsContent>

            <TabsContent value="compare">
              {takeoff.isLoading || dqe.isLoading ? (
                <div className="text-sm text-muted-foreground">Chargement…</div>
              ) : (
                <BoqComparisonTable
                  reference={takeoff.lines}
                  candidate={dqe.lines}
                  labels={{ reference: 'Expression de besoin', candidate: 'DQE' }}
                />
              )}
            </TabsContent>

            <TabsContent value="budget">
              {takeoff.isLoading || dqe.isLoading ? (
                <div className="text-sm text-muted-foreground">Chargement…</div>
              ) : (
                <BoqBudgetDashboard planned={takeoff.lines} actual={dqe.lines} />
              )}
            </TabsContent>
          </Tabs>

        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDqeTab;
