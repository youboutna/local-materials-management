/**
 * DqeWorkspace — coquille mutualisée Liste ↔ Détail pour les 4 contextes :
 *   • project-dqe       (Expression de besoin / DQE projet)
 *   • tender-estimate   (DQE Appel d'offres)
 *   • supplier-bid      (Devis fournisseur)
 *   • supplier-invoice  (Décompte / Facture)
 *
 * Vue Liste : agrégation des lignes par `document_id` (BoqDocumentList).
 * Vue Détail : BoqWorkspace + BoqActionsBar pour un document précis.
 *
 * Aucune requête directe Supabase — tout passe par les hooks hexagonaux.
 */
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileSpreadsheet, GitCompare, LayoutDashboard } from 'lucide-react';
import { BoqWorkspace, type BoqWorkspaceMode } from './BoqWorkspace';
import { BoqActionsBar } from './BoqActionsBar';
import { BoqDocumentList } from './BoqDocumentList';
import { BoqComparisonTable } from './BoqComparisonTable';
import { BoqBudgetDashboard } from './BoqBudgetDashboard';
import { useBoqDocument } from '@/hooks/hexagonal/useBoqDocument';
import { BoqContextService, type BoqRouteContext } from '@/application/services/boq/BoqContextService';
import type { ReferentialType } from '@/config/referentials';

interface Props {
  routeContext: BoqRouteContext;
  projectId?: string;
  projectName?: string;
  tenderId?: string;
  submissionId?: string;
  senderId?: string;
  referentialCode?: ReferentialType;
  recipientEmail?: string;
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
  const ctx = useMemo(() => BoqContextService.resolve({
    routeContext: props.routeContext,
    projectId: props.projectId,
    tenderId: props.tenderId,
    submissionId: props.submissionId,
    senderId: props.senderId,
  }), [props.routeContext, props.projectId, props.tenderId, props.submissionId, props.senderId]);

  const mode = MODE_BY_ROUTE[props.routeContext];
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  // Détail : lignes du document courant (pour la BoqActionsBar).
  const doc = useBoqDocument({
    source: ctx.source,
    contextId: ctx.contextId,
    projectId: props.projectId,
    documentId: selectedDocumentId ?? undefined,
  });

  // Comparaison optionnelle (projet uniquement).
  const dqeCompare = useBoqDocument({
    source: 'dqe',
    contextId: props.projectId ?? ctx.contextId,
    projectId: props.projectId,
    documentId: selectedDocumentId ?? undefined,
  });

  // ------------------------------------------------------------- Vue Liste
  if (!selectedDocumentId) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <BoqDocumentList
            source={ctx.source}
            contextId={ctx.contextId}
            projectId={props.projectId}
            title={ctx.title}
            docPrefix={ctx.docPrefix}
            onOpen={(id) => setSelectedDocumentId(id)}
            onCreate={(id) => setSelectedDocumentId(id)}
          />
        </CardContent>
      </Card>
    );
  }

  // ------------------------------------------------------------ Vue Détail
  const actionableLines = (doc.lines ?? []).filter((line) => line.status !== 'draft');
  const noActionableLines = actionableLines.length === 0;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedDocumentId(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour à la liste
            </Button>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {ctx.title}
            </CardTitle>
          </div>
          <BoqActionsBar
            ctx={ctx}
            lines={actionableLines}
            recipientEmail={props.recipientEmail}
            disabled={doc.isLoading || noActionableLines}
            onAttachToSubmission={props.onAttachToSubmission}
            onSubmitInvoice={props.onSubmitInvoice}
            onDistribute={props.onDistribute}
            onPublish={props.onPublish}
          />
        </CardHeader>
        <CardContent className="p-0">
          <BoqWorkspace
            source={ctx.source}
            contextId={ctx.contextId}
            projectId={props.projectId}
            projectName={props.projectName}
            mode={mode}
            referentialCode={props.referentialCode}
            defaultEmail={props.recipientEmail}
            documentId={selectedDocumentId}
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
