/**
 * DqeWorkspace — coquille mutualisée pour DQE projet / estimation tender /
 * devis fournisseur / facture fournisseur. Compose :
 *   • BoqKpiHeader (Total HT · TVA · TTC · nb lignes)
 *   • BoqActionsBar (PDF · Signer · Email · Télécharger · Diffuser · …)
 *   • BoqWorkspace existant (saisie + import + fiscal + WBS)
 *   • Sous-onglets optionnels (Lignes / Comparaison / Suivi budget)
 *
 * Aucune requête directe supabase. Toutes les lectures passent par useBoqDocument.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, GitCompare, LayoutDashboard } from 'lucide-react';
import { BoqWorkspace, type BoqWorkspaceMode } from './BoqWorkspace';
import { BoqKpiHeader } from './BoqKpiHeader';
import { BoqActionsBar } from './BoqActionsBar';
import { BoqComparisonTable } from './BoqComparisonTable';
import { BoqBudgetDashboard } from './BoqBudgetDashboard';
import { useBoqDocument } from '@/hooks/hexagonal/useBoqDocument';
import { BoqContextService, type BoqRouteContext } from '@/application/services/boq/BoqContextService';
import type { ReferentialType } from '@/config/referentials';

interface Props {
  routeContext: BoqRouteContext;
  projectId?: string;
  tenderId?: string;
  submissionId?: string;
  senderId?: string;
  referentialCode?: ReferentialType;
  recipientEmail?: string;
  /** Active la comparaison Expression de besoin ↔ DQE et le suivi budget (projet seulement). */
  showComparison?: boolean;
  onAttachToSubmission?: () => void;
  onSubmitInvoice?: () => void;
  onDistribute?: () => void;
  onPublish?: () => void;
}

const MODE_BY_ROUTE: Record<BoqRouteContext, BoqWorkspaceMode> = {
  'project-dqe': 'planning',
  'tender-estimate': 'bid',
  'supplier-bid': 'bid',
  'supplier-invoice': 'invoice',
};

export const DqeWorkspace: React.FC<Props> = (props) => {
  const ctx = BoqContextService.resolve({
    routeContext: props.routeContext,
    projectId: props.projectId,
    tenderId: props.tenderId,
    submissionId: props.submissionId,
    senderId: props.senderId,
  });

  const workspaceSource = ctx.source;
  const doc = useBoqDocument({
    source: workspaceSource,
    contextId: ctx.contextId,
    projectId: props.projectId,
  });

  // Comparaison optionnelle (projet uniquement) : DQE canonique vs expression de besoin.
  const dqeCompare = useBoqDocument({
    source: 'dqe',
    contextId: props.projectId ?? ctx.contextId,
    projectId: props.projectId,
  });

  const mode = MODE_BY_ROUTE[props.routeContext];

  return (
    <div className="space-y-4">
      <BoqKpiHeader lines={doc.lines ?? []} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {ctx.title}
          </CardTitle>
          <BoqActionsBar
            ctx={ctx}
            lines={doc.lines ?? []}
            recipientEmail={props.recipientEmail}
            onAttachToSubmission={props.onAttachToSubmission}
            onSubmitInvoice={props.onSubmitInvoice}
            onDistribute={props.onDistribute}
            onPublish={props.onPublish}
          />
        </CardHeader>
        <CardContent>
          {props.showComparison ? (
            <Tabs defaultValue="lines" className="space-y-4">
              <TabsList>
                <TabsTrigger value="lines"><FileSpreadsheet className="h-4 w-4 mr-1" /> Lignes</TabsTrigger>
                <TabsTrigger value="compare"><GitCompare className="h-4 w-4 mr-1" /> Comparaison besoin ↔ DQE</TabsTrigger>
                <TabsTrigger value="budget"><LayoutDashboard className="h-4 w-4 mr-1" /> Suivi budget</TabsTrigger>
              </TabsList>
              <TabsContent value="lines">
                <BoqWorkspace
                  source={workspaceSource}
                  contextId={ctx.contextId}
                  projectId={props.projectId}
                  mode={mode}
                  referentialCode={props.referentialCode}
                  defaultEmail={props.recipientEmail}
                />
              </TabsContent>
              <TabsContent value="compare">
                {doc.isLoading || dqeCompare.isLoading ? (
                  <div className="text-sm text-muted-foreground">Chargement…</div>
                ) : (
                  <BoqComparisonTable
                    reference={doc.lines ?? []}
                    candidate={dqeCompare.lines ?? []}
                    labels={{ reference: 'Expression de besoin', candidate: 'DQE' }}
                  />
                )}
              </TabsContent>
              <TabsContent value="budget">
                {doc.isLoading || dqeCompare.isLoading ? (
                  <div className="text-sm text-muted-foreground">Chargement…</div>
                ) : (
                  <BoqBudgetDashboard planned={doc.lines ?? []} actual={dqeCompare.lines ?? []} />
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <BoqWorkspace
              source={workspaceSource}
              contextId={ctx.contextId}
              projectId={props.projectId}
              mode={mode}
              referentialCode={props.referentialCode}
              defaultEmail={props.recipientEmail}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DqeWorkspace;
