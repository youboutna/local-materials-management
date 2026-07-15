/**
 * DqeWorkspace — coquille mutualisée pour DQE projet / estimation tender /
 * devis fournisseur / facture fournisseur. Compose :
 *   • Un seul conteneur document (pas une liste d'enregistrements)
 *   • BoqActionsBar conditionnée par l'état réel du document
 *   • BoqWorkspace (saisie/import/fiscal/WBS/grille) dans le même bloc
 *   • Analyses optionnelles sous le document, sans casser l'UX de saisie
 *
 * Aucune requête directe supabase. Toutes les lectures passent par useBoqDocument.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, GitCompare, LayoutDashboard } from 'lucide-react';
import { BoqWorkspace, type BoqWorkspaceMode } from './BoqWorkspace';
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

  const actionableLines = (doc.lines ?? []).filter((line) => line.status !== 'draft');
  const hasDocument = actionableLines.length > 0;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {ctx.title}
          </CardTitle>
          {hasDocument && (
            <BoqActionsBar
              ctx={ctx}
              lines={actionableLines}
              recipientEmail={props.recipientEmail}
              disabled={doc.isLoading}
              onAttachToSubmission={props.onAttachToSubmission}
              onSubmitInvoice={props.onSubmitInvoice}
              onDistribute={props.onDistribute}
              onPublish={props.onPublish}
            />
          )}
        </CardHeader>
        <CardContent className="p-4">
          <BoqWorkspace
            source={workspaceSource}
            contextId={ctx.contextId}
            projectId={props.projectId}
            mode={mode}
            referentialCode={props.referentialCode}
            defaultEmail={props.recipientEmail}
          />
        </CardContent>
      </Card>

          {props.showComparison ? (
        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue="compare" className="space-y-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="compare"><GitCompare className="h-4 w-4 mr-1" /> Comparaison besoin ↔ DQE</TabsTrigger>
                <TabsTrigger value="budget"><LayoutDashboard className="h-4 w-4 mr-1" /> Suivi budget</TabsTrigger>
              </TabsList>
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
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default DqeWorkspace;
