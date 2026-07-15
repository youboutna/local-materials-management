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
  BoqWorkspace,
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTree className="h-5 w-5" />
            DQE global (Détail Quantitatif Estimatif)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="workspace" className="space-y-4">
            <TabsList>
              <TabsTrigger value="workspace">
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Lignes DQE
              </TabsTrigger>
              <TabsTrigger value="compare">
                <GitCompare className="h-4 w-4 mr-1" /> Comparaison besoin ↔ DQE
              </TabsTrigger>
              <TabsTrigger value="budget">Suivi budget</TabsTrigger>
            </TabsList>

            <TabsContent value="workspace">
              {/*
                BoqWorkspace mutualise : saisie manuelle + import multi-format + édition inline
                + récap fiscal HT/TVA/TTC + génération PDF signé + export CSV + envoi email
                + diffusion contextuelle (expression de besoin, bon de commande, décompte).
              */}
              {/*
                Phase 2.3 / 3.3 : contexte "planification" projet → persistance dans
                quantity_takeoffs (planned_lines), pas tender_estimate_items.
                Évite l'erreur RLS "new row violates RLS for tender_estimate_items"
                car cette table exige un estimate_id lié à un tender_estimates du user.
              */}
              <BoqWorkspace
                source="quantity_takeoff"
                contextId={projectId}
                projectId={projectId}
                mode="planning"
                referentialCode={referentialCode}
              />
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
