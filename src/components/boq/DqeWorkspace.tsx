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
import React, { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileSpreadsheet, GitCompare, LayoutDashboard } from 'lucide-react';
import { BoqWorkspace, type BoqWorkspaceMode } from './BoqWorkspace';
import { BoqActionsBar } from './BoqActionsBar';
import { InvoiceWorkflowActions } from '@/components/invoices/InvoiceWorkflowActions';
import { resolveInvoiceDocumentType } from '@/config/referentials/invoices/invoice-document-types.referential';
import { BoqDocumentList } from './BoqDocumentList';
import { BoqComparisonTable } from './BoqComparisonTable';
import { BoqBudgetDashboard } from './BoqBudgetDashboard';
import { useBoqDocument } from '@/hooks/hexagonal/useBoqDocument';
import { useProjectPhasesHex } from '@/hooks/hexagonal';
import { useMilestonesHex } from '@/hooks/hexagonal/useMilestonesHex';
import { BoqContextService, type BoqRouteContext } from '@/application/services/boq/BoqContextService';
import { getBoqDispatchService } from '@/application/services/boq/BoqDispatchService';
import { toast } from '@/hooks/use-toast';
import type { ReferentialType } from '@/config/referentials';
import { T } from '@/components/i18n/T';
import { Badge } from '@/components/ui/badge';
import { useProcurementConsistency } from '@/hooks/hexagonal/useProcurementChainHex';

interface Props {
  routeContext: BoqRouteContext;
  projectId?: string;
  projectName?: string;
  tenderId?: string;
  submissionId?: string;
  senderId?: string;
  referentialCode?: ReferentialType;
  /** Budget restant du projet, utilisé pour l'alerte d'écart lors de la demande de validation. */
  remainingBudget?: number | null;

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
  const { phases } = useProjectPhasesHex(props.projectId);
  const { milestones } = useMilestonesHex(props.projectId);
  const phaseLabels = useMemo(
    () => Object.fromEntries((phases ?? []).map((p) => [p.id, p.name || p.phaseName || 'Phase'])),
    [phases],
  );
  const milestoneLabels = useMemo(
    () => Object.fromEntries((milestones ?? []).map((m) => [m.id, m.title])),
    [milestones],
  );
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Détail : lignes du document courant (pour la BoqActionsBar).
  const doc = useBoqDocument({
    source: ctx.source,
    contextId: ctx.contextId,
    projectId: props.projectId,
    documentId: selectedDocumentId ?? undefined,
  });

  // Étape explicite « Transférer vers les phases » : phases + jalons + tâches + ressources.
  useEffect(() => {
    if (props.routeContext !== 'project-dqe' || !props.projectId) return;

    const invalidate = () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['project-phases'] }),
      queryClient.invalidateQueries({ queryKey: ['phase-resource-counts'] }),
      queryClient.invalidateQueries({ queryKey: ['project-resources'] }),
      queryClient.invalidateQueries({ queryKey: ['phase-materials-hex'] }),
      queryClient.invalidateQueries({ queryKey: ['phase-employees'] }),
      queryClient.invalidateQueries({ queryKey: ['project-milestones'] }),
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] }),
      queryClient.invalidateQueries({ queryKey: ['project-metrics'] }),
      queryClient.invalidateQueries({ queryKey: ['quantity-takeoffs'] }),
    ]);

    const dispatchHandler = async (event: Event) => {
      const detail = (event as CustomEvent).detail as { projectId?: string } | undefined;
      if (detail?.projectId && detail.projectId !== props.projectId) return;
      try {
        const result = await getBoqDispatchService().dispatchToWbs(props.projectId as string, doc.lines ?? []);
        await invalidate();
        window.dispatchEvent(new CustomEvent('boq-kpi-refresh'));
        toast({
          title: 'DQE transféré vers le découpage des travaux',
          description: `${result.phasesCreated} phase(s) créée(s), ${result.phasesReused} réutilisée(s), ${result.milestonesCreated} jalon(s), ${result.tasksCreated} tâche(s), ${result.phaseMaterials} matériau(x), ${result.phaseEmployees} rôle(s), ${result.projectResources} ressource(s) projet.`,
        });
      } catch (error) {
        toast({
          title: 'Transfert impossible',
          description: error instanceof Error ? error.message : 'Erreur inconnue',
          variant: 'destructive',
        });
      }
    };

    const validationHandler = async (event: Event) => {
      const detail = (event as CustomEvent).detail as { projectId?: string } | undefined;
      if (detail?.projectId && detail.projectId !== props.projectId) return;
      try {
        const result = await getBoqDispatchService().requestValidation(
          props.projectId as string,
          doc.lines ?? [],
          props.remainingBudget,
        );
        await queryClient.invalidateQueries({ queryKey: ['project-alerts'] });
        toast({
          title: 'Demande de validation créée',
          description: result.alertId
            ? `Écart budgétaire ${result.discrepancy.toFixed(2)} MRU (${(result.ratio * 100).toFixed(2)} %) — arbitrage A/B/C requis dans l'onglet Contrôle.`
            : 'Aucun écart budgétaire significatif : validation en attente du responsable.',
        });
      } catch (error) {
        toast({
          title: 'Demande de validation impossible',
          description: error instanceof Error ? error.message : 'Erreur inconnue',
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('boq-dispatch-wbs', dispatchHandler);
    window.addEventListener('boq-request-validation', validationHandler);
    return () => {
      window.removeEventListener('boq-dispatch-wbs', dispatchHandler);
      window.removeEventListener('boq-request-validation', validationHandler);
    };
  }, [props.routeContext, props.projectId, props.remainingBudget, doc.lines, queryClient]);



  // Transfert vers l'étape suivante (tous contextes) : rafraîchir les vues dépendantes.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { contextId?: string } | undefined;
      if (detail?.contextId && detail.contextId !== ctx.contextId) return;
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['boq'] }),
        queryClient.invalidateQueries({ queryKey: ['boq-documents'] }),
        queryClient.invalidateQueries({ queryKey: ['boq-list'] }),
        queryClient.invalidateQueries({ queryKey: ['project-alerts'] }),
        queryClient.invalidateQueries({ queryKey: ['payment-requests'] }),
      ]);
    };
    window.addEventListener('boq-transfer-next', handler);
    window.addEventListener('boq-injection-validated', handler);
    window.addEventListener('boq-decompte-created', handler);
    return () => {
      window.removeEventListener('boq-transfer-next', handler);
      window.removeEventListener('boq-injection-validated', handler);
      window.removeEventListener('boq-decompte-created', handler);
    };
  }, [ctx.contextId, queryClient]);

  // Comparaison optionnelle (projet uniquement).
  const dqeCompare = useBoqDocument({
    source: 'dqe',
    contextId: props.projectId ?? ctx.contextId,
    projectId: props.projectId,
    documentId: selectedDocumentId ?? undefined,
  });

  // Les brouillons persistés sont actionnables : le transfert métier les fait
  // passer à l'état soumis. Seules les lignes locales non sauvegardées sont exclues.
  const actionableLines = doc.lines ?? [];

  // Cohérence de la chaîne « DQE → planification → appel d'offres » : hook appelé
  // inconditionnellement (avant toute sortie anticipée) pour un ordre de hooks stable.
  const consistency = useProcurementConsistency(
    props.routeContext === 'project-dqe' ? props.projectId : undefined,
    actionableLines,
    selectedDocumentId,
  );

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
  // Étape documentaire courante déduite du référentiel via le `dqeType` des lignes.
  // La `source` BOQ fait foi : un DQE reste un DQE (jamais un devis).
  const invoiceDef = resolveInvoiceDocumentType({
    source: ctx.source,
    documentType: (doc.lines ?? [])[0]?.documentType,
    dqeType: (doc.lines ?? [])[0]?.dqeType,
  });
  const noActionableLines = actionableLines.length === 0;


  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedDocumentId(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> <T k="auto.dqeworkspace.retour_a_la_liste" fallback="Retour à la liste" />
            </Button>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {ctx.title}
            </CardTitle>
          </div>
          {/* Barre unique : G1 actions principales · G2 workflow · G3 badges. */}
          <BoqActionsBar
            ctx={ctx}
            lines={actionableLines}
            projectName={props.projectName}
            recipientEmail={props.recipientEmail}
            disabled={doc.isLoading || noActionableLines}
            onAttachToSubmission={props.onAttachToSubmission}
            onSubmitInvoice={props.onSubmitInvoice}
            onDistribute={props.onDistribute}
            onPublish={props.onPublish}
            badgesSlot={
              consistency.report ? (
                <>
                  <Badge variant={consistency.report.planningFed ? 'secondary' : 'outline'}>
                    <T k="dqe.badge.planning_fed" fallback="Planification alimentée" />
                    {consistency.report.planningFed ? ' ✓' : ' —'}
                  </Badge>
                  <Badge variant={consistency.report.tenderPublished ? 'secondary' : 'outline'}>
                    <T k="dqe.badge.tender_published" fallback="Appel d'offres publié" />
                    {consistency.report.tenderPublished ? ' ✓' : ' —'}
                  </Badge>
                  {consistency.report.issues.length > 0 && (
                    <Badge variant="destructive" title={consistency.report.issues.join(' · ')}>
                      <T k="dqe.badge.chain_issues" fallback="Chaîne à resynchroniser" />
                      {` (${consistency.report.issues.length})`}
                    </Badge>
                  )}
                </>
              ) : null
            }
            workflowSlot={
              <InvoiceWorkflowActions
                compact
                documentType={invoiceDef.code}
                actor={props.routeContext === 'project-dqe' || props.routeContext === 'tender-estimate' ? 'manager' : 'supplier'}
                lines={doc.lines ?? []}
                contextId={ctx.contextId ?? ''}
                targetSource={ctx.source}
                projectId={props.projectId}
                projectName={props.projectName}
                tenderId={props.tenderId}
                sellerName={props.projectName}
                buyerName={props.recipientEmail}
                recipientEmail={props.recipientEmail}
                docPrefix={ctx.docPrefix}
                projectBudget={props.remainingBudget ?? null}
                disabled={doc.isLoading}
                onTransformed={() => doc.refetch?.()}
              />
            }
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
                <TabsTrigger value="budget"><LayoutDashboard className="h-4 w-4 mr-1" /> <T k="auto.dqeworkspace.suivi_budget" fallback="Suivi budget" /></TabsTrigger>
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
                  <BoqBudgetDashboard
                    planned={doc.lines ?? []}
                    actual={dqeCompare.lines ?? []}
                    phaseLabels={phaseLabels}
                    milestoneLabels={milestoneLabels}
                  />
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
