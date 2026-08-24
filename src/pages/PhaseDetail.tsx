/**
 * PhaseDetail — Lifecycle-grouped tabs (Planification / Exécution / Contrôle / Clôture).
 * Cross-module navigation buttons link to inspections, payments, documents and reports.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkspaceTabsList } from '@/components/common/WorkspaceTabsList';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePhaseDetails } from '@/hooks/usePhaseDetails';
import { PhaseStatus } from '@/dtos/entities/PhaseDTO';
import type { PhaseDTO, PhaseStepDTO, PhaseTaskDTO } from '@/dtos/types/phase-dto';
import PhaseTasks from '@/components/project/PhaseTasks';
import PhaseDocuments from '@/components/project/PhaseDocuments';
import PhasePayments from '@/components/project/PhasePayments';
import PhaseInspections from '@/components/project/PhaseInspections';
import PhaseMilestones from '@/components/project/PhaseMilestones';
import PhaseStepsManager from '@/components/project/phase/PhaseStepsManager';
import PhaseResourcesTab from '@/components/project/phase/PhaseResourcesTab';
import PhaseQuantityTakeoffTab from '@/components/project/phase/PhaseQuantityTakeoffTab';
import PhaseStakeholdersTab from '@/components/project/phase/PhaseStakeholdersTab';
import PhaseFinancesTab from '@/components/project/phase/PhaseFinancesTab';
import PhaseEditDialog from '@/components/project/phase/PhaseEditDialog';
import PhaseEditWorkflowDialog from '@/components/project/phase/PhaseEditWorkflowDialog';
import PhasePlanningQuickEdit from '@/components/project/phase/PhasePlanningQuickEdit';
import { toPhaseEditDraft, type PhaseEditDraft } from '@/components/project/phase/PhaseEditDraft';
import { GanttChart, PERTDiagram, CriticalPathView } from '@/components/planning';
import { AppLayout } from '@/components/layout/AppLayout';
import DeviationBadges from '@/components/common/DeviationBadges';
import { toPhaseViewModel } from '@/utils/phaseViewModel';
import { PhaseMetricsService } from '@/application/services/PhaseMetricsService';
import {
  getPhaseLifecycleStage,
  getLifecycleStageMeta,
  getStatusColor,
  getStatusLabel,
} from '@/utils/phaseHelpers';
import { formatAmount2, formatNumber2, formatPercent2 } from '@/utils/reportNumbers';
import {
  ArrowLeft, Calendar, DollarSign, MapPin, Users, Package, FileText, BarChart3,
  Target, Layers, ClipboardCheck, CreditCard, Flag, Compass, HardHat, ShieldCheck,
  ExternalLink, AlertTriangle, Edit, Calculator, Building2, Wallet,
} from 'lucide-react';
import { T } from '@/components/i18n/T';


const PhaseDetail: React.FC = () => {
  const { projectId, phaseId } = useParams<{ projectId: string; phaseId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  useLanguage();

  const {
    phase,
    isLoading: loading,
    error,
    updatePhaseAsync,
    isUpdatingPhase,
    addStep,
    updateStep,
    deleteStep,
    addTask,
    updateTask,
    deleteTask,
    isUpdating,
    metrics,
  } = usePhaseDetails(phaseId);

  const [isEditing, setIsEditing] = useState(false);
  const [isWorkflowEditing, setIsWorkflowEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PhaseDTO>>({});

  const steps = useMemo(
    () => ((phase as unknown as { steps?: PhaseStepDTO[] })?.steps ?? []) as PhaseStepDTO[],
    [phase]
  );


  const vm = useMemo(() => (phase ? toPhaseViewModel(phase as unknown as Record<string, unknown>) : null), [phase]);

  const stage = useMemo(
    () => (vm ? getPhaseLifecycleStage({ type: vm.type, status: vm.status }) : 'PLANIFICATION'),
    [vm]
  );
  const stageMeta = getLifecycleStageMeta(stage);

  const defaultStageTab = (searchParams.get('stage') as string) || stage.toLowerCase();

  const onStageChange = (v: string) => {
    setSearchParams((sp) => {
      sp.set('stage', v);
      return sp;
    });
  };

  /** Hydratation du formulaire d'édition depuis la phase persistée. */
  useEffect(() => {
    if (!vm) return;
    setEditForm({
      name: vm.title,
      description: vm.description,
      startDate: vm.startDate,
      endDate: vm.endDate,
      estimatedCost: vm.budget,
      status: vm.status as unknown as PhaseDTO['status'],
      progress: vm.progress,
    } as Partial<PhaseDTO>);
  }, [vm]);

  const handleSaveEdit = async () => {
    try {
      await updatePhaseAsync(editForm as Record<string, unknown>);
      setIsEditing(false);
    } catch {
      /* toast géré par usePhaseDetails */
    }
  };

  /** Brouillon partagé par les deux modes d'édition (onglet + workflow). */
  const editDraft: PhaseEditDraft = useMemo(
    () =>
      vm
        ? toPhaseEditDraft(vm)
        : { name: '', description: '', startDate: '', endDate: '', estimatedCost: 0, progress: 0, status: 'pending' },
    [vm]
  );

  /** Mode 1 — sauvegarde partielle (onglet) : persiste uniquement les champs fournis. */
  const handlePartialSave = async (partial: Partial<PhaseEditDraft>) => {
    try {
      await updatePhaseAsync(partial as Record<string, unknown>);
    } catch {
      /* toast géré par usePhaseDetails */
    }
  };

  /** Mode 2 — sauvegarde globale (workflow) : persiste l'ensemble du brouillon. */
  const handleWorkflowSave = async (draft: PhaseEditDraft) => {
    try {
      await updatePhaseAsync(draft as unknown as Record<string, unknown>);
    } catch {
      /* toast géré par usePhaseDetails */
    }
  };




  if (loading) {
    return (
      <AppLayout pageTitle="Phase">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-label="Chargement" />
        </div>
      </AppLayout>
    );
  }

  if (!vm) {
    return (
      <AppLayout pageTitle="Phase">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2"><T k="auto.phasedetail.phase_non_trouvee" fallback="Phase non trouvée" /></h1>
          {error && <p className="text-sm text-muted-foreground mb-4">{(error as Error).message}</p>}
          <Button onClick={() => navigate(`/projects/${projectId}`)}><T k="auto.phasedetail.retour_au_projet" fallback="Retour au projet" /></Button>
        </div>
      </AppLayout>
    );
  }

  const { title, description, budget: storedBudget, estimatedDuration, startDate, endDate, location } = vm;

  // Source unique de vérité : PhaseMetricsService (aucun calcul dans l'UI)
  const progressResult = PhaseMetricsService.computeProgress({
    storedProgress: vm.progress,
    totalTasks: metrics.totalTasks,
    completedTasks: metrics.completedTasks,
    stepsCount: metrics.stepsCount,
    completedSteps: metrics.completedSteps,
  });
  const progress = progressResult.value;

  const financials = PhaseMetricsService.computeFinancials({
    estimatedCost: storedBudget,
    actualCost: vm.actualCost,
    paymentAmounts: [metrics.totalPaymentAmount],
  });
  const budget = financials.budget;

  const completion = PhaseMetricsService.computeCompletionReadiness({
    progress,
    totalTasks: metrics.totalTasks,
    completedTasks: metrics.completedTasks,
    stepsCount: metrics.stepsCount,
    completedSteps: metrics.completedSteps,
  });

  const isClosed = vm.status === PhaseStatus.COMPLETED;

  const handleClosePhase = async () => {
    try {
      await updatePhaseAsync({ status: PhaseStatus.COMPLETED, progress: 100 } as Record<string, unknown>);
    } catch (e) {
      // Toast d'erreur déjà géré par usePhaseDetails
    }
  };

  /** Aligne la progression persistée sur la progression dérivée des faits. */
  const handleAlignProgress = async () => {
    if (progressResult.derivedValue == null) return;
    try {
      await updatePhaseAsync({ progress: progressResult.derivedValue } as Record<string, unknown>);
    } catch (e) {
      /* toast géré par usePhaseDetails */
    }
  };


  return (
    <AppLayout pageTitle={title} pageDescription={stageMeta.description}>
      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}`)}
              className="flex items-center gap-2"
              aria-label="Retour au projet"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> <T k="auto.phasedetail.retour" fallback="Retour" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{title}</h1>
              {description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>}
            </div>
          </div>
          {/* Barre d'actions unifiée (une seule zone d'actions pour la phase) */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={stageMeta.tokenClass} variant="outline">
              {stageMeta.label}
            </Badge>
            <Badge className={getStatusColor(vm.status)} variant="outline">
              {getStatusLabel(vm.status)}
            </Badge>
            {/* Mode 2 : workflow d'édition complet */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsWorkflowEditing(true)}
              aria-label="Modifier la phase (workflow complet)"
            >
              <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> <T k="auto.phasedetail.modifier" fallback="Modifier" />
            </Button>
            {/* Édition rapide (formulaire simple) */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              aria-label="Édition rapide de la phase"
            >
              <T k="auto.phasedetail.edition_rapide" fallback="Édition rapide" />
            </Button>
            {progressResult.isDivergent && progressResult.derivedValue != null && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAlignProgress}
                disabled={isUpdatingPhase}
                aria-label="Aligner la progression sur les faits"
              >
                <BarChart3 className="h-4 w-4 mr-1" aria-hidden="true" />
                <T k="auto.phasedetail.aligner_progression" fallback="Aligner la progression" /> ({progressResult.derivedValue}%)
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleClosePhase}
              disabled={isClosed || isUpdatingPhase}
              aria-label="Clôturer la phase"
            >
              <Flag className="h-4 w-4 mr-1" aria-hidden="true" />
              {isClosed ? (
                <T k="auto.phasedetail.phase_cloturee" fallback="Phase clôturée" />
              ) : (
                <T k="auto.phasedetail.cloturer_la_phase" fallback="Clôturer la phase" />
              )}
            </Button>
          </div>

        </div>

        {/* Overview KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
              <CardTitle className="text-xs font-medium"><T k="auto.phasedetail.progression" fallback="Progression" /></CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">{formatPercent2(progress)}</div>
              <Progress value={progress} className="mt-1.5 h-1.5" />
              <p className="text-[11px] text-muted-foreground mt-1">
                {metrics.completedTasks}/{metrics.totalTasks} <T k="auto.phasedetail.taches" fallback="Tâches" />
                {metrics.stepsCount > 0 && ` · ${metrics.completedSteps}/${metrics.stepsCount} étapes`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
              <CardTitle className="text-xs font-medium"><T k="auto.phasedetail.budget" fallback="Budget" /></CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">{formatAmount2(budget)}</div>
              <p className="text-[11px] text-muted-foreground truncate">
                <T k="auto.phasedetail.reste" fallback="Reste" /> : {formatAmount2(financials.remaining)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
              <CardTitle className="text-xs font-medium"><T k="auto.phasedetail.depense" fallback="Dépensé" /></CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className={`text-xl font-bold ${financials.isOverBudget ? 'text-destructive' : ''}`}>
                {formatAmount2(financials.spent)}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {formatPercent2(financials.consumptionRate)} · {metrics.totalPayments} <T k="auto.phasedetail.paiements" fallback="Paiements" />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
              <CardTitle className="text-xs font-medium"><T k="auto.phasedetail.duree" fallback="Durée" /></CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">{estimatedDuration} j</div>
              <p className="text-[11px] text-muted-foreground truncate">{startDate} → {endDate}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
              <CardTitle className="text-xs font-medium"><T k="auto.phasedetail.localisation" fallback="Localisation" /></CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-sm font-medium truncate">{location || 'Non spécifiée'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Résumés liés (tâches, paiements, documents, équipe, inspections) */}
        <Card>
          <CardContent className="py-3 px-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">
              <T k="auto.phasedetail.resume" fallback="Résumé :" />
            </span>
            <Badge variant="outline" className="flex items-center gap-1">
              <ClipboardCheck className="h-3 w-3" /> {metrics.completedTasks}/{metrics.totalTasks} <T k="auto.phasedetail.taches" fallback="Tâches" />
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> {metrics.totalPayments} <T k="auto.phasedetail.paiements" fallback="Paiements" /> · {formatAmount2(metrics.totalPaymentAmount)}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <FileText className="h-3 w-3" /> {metrics.totalDocuments} <T k="auto.phasedetail.documents" fallback="Documents" />
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {metrics.totalEmployees} <T k="auto.phasedetail.equipe" fallback="Équipe" />
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> {metrics.passedInspections}/{metrics.totalInspections} <T k="auto.phasedetail.inspections" fallback="Inspections" />
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Package className="h-3 w-3" /> {metrics.totalMaterials} <T k="auto.phasedetail.ressources" fallback="Ressources" />
            </Badge>
          </CardContent>
        </Card>


        {/* Écarts planifié vs réalisé (DeviationEngine + deviation-rules) */}
        <Card>
          <CardContent className="py-3 px-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1"><T k="auto.phasedetail.ecarts" fallback="Écarts :" /></span>
            <DeviationBadges
              scope="phase"
              input={{
                plannedEndDate: endDate,
                actualEndDate: vm.actualEndDate,
                plannedBudget: budget,
                actualCost: vm.actualCost,
                plannedProgress: vm.plannedProgress,
                actualProgress: progress,
              }}
            />
          </CardContent>
        </Card>

        {/* Cross-module quick navigation */}
        <Card>
          <CardContent className="py-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-2"><T k="auto.phasedetail.navigation_rapide" fallback="Navigation rapide :" /></span>
            <Button size="sm" variant="ghost" aria-label="Voir les inspections de la phase" onClick={() => navigate(`/inspection-monitoring?phase=${phaseId}&project=${projectId}`)}>
              <ClipboardCheck className="h-4 w-4 mr-1" aria-hidden="true" /> <T k="auto.phasedetail.inspections" fallback="Inspections" /> <ExternalLink className="h-3 w-3 ml-1" aria-hidden="true" />
            </Button>
            <Button size="sm" variant="ghost" aria-label="Voir les paiements de la phase" onClick={() => navigate(`/payment-control?phase=${phaseId}&project=${projectId}`)}>
              <CreditCard className="h-4 w-4 mr-1" aria-hidden="true" /> <T k="auto.phasedetail.paiements" fallback="Paiements" /> <ExternalLink className="h-3 w-3 ml-1" aria-hidden="true" />
            </Button>
            <Button size="sm" variant="ghost" aria-label="Voir les documents de la phase" onClick={() => navigate(`/documents?phase=${phaseId}&project=${projectId}`)}>
              <FileText className="h-4 w-4 mr-1" aria-hidden="true" /> <T k="auto.phasedetail.documents" fallback="Documents" /> <ExternalLink className="h-3 w-3 ml-1" aria-hidden="true" />
            </Button>
            <Button size="sm" variant="ghost" aria-label="Voir les rapports liés à la phase" onClick={() => navigate(`/monitoring?phase=${phaseId}&project=${projectId}`)}>
              <BarChart3 className="h-4 w-4 mr-1" aria-hidden="true" /> <T k="auto.phasedetail.rapports" fallback="Rapports" /> <ExternalLink className="h-3 w-3 ml-1" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>

        {/* Lifecycle stage tabs */}
        <Tabs value={defaultStageTab} onValueChange={onStageChange} className="space-y-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-4">
            <TabsTrigger value="planification" className="flex items-center gap-2">
              <Compass className="h-4 w-4" /> <span className="hidden sm:inline"><T k="auto.phasedetail.planification" fallback="Planification" /></span>
            </TabsTrigger>
            <TabsTrigger value="execution" className="flex items-center gap-2">
              <HardHat className="h-4 w-4" /> <span className="hidden sm:inline"><T k="auto.phasedetail.execution" fallback="Exécution" /></span>
            </TabsTrigger>
            <TabsTrigger value="controle" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> <span className="hidden sm:inline"><T k="auto.phasedetail.controle" fallback="Contrôle" /></span>
            </TabsTrigger>
            <TabsTrigger value="cloture" className="flex items-center gap-2">
              <Flag className="h-4 w-4" /> <span className="hidden sm:inline"><T k="auto.phasedetail.cloture" fallback="Clôture" /></span>
            </TabsTrigger>
          </TabsList>

          {/* Planification: étapes/tâches, métré DQE, planning, jalons, ressources */}
          <TabsContent value="planification" className="space-y-6">
            {/* Mode 1 : édition/sauvegarde partielle de l'onglet Planification */}
            <PhasePlanningQuickEdit
              value={editDraft}
              isSaving={isUpdatingPhase}
              disabled={isClosed}
              onSave={handlePartialSave}
            />
            <Tabs defaultValue="steps" className="space-y-4">
              <WorkspaceTabsList variant="underline">
                <TabsTrigger value="steps"><Layers className="h-3 w-3 mr-1" /><T k="auto.phasedetail.etapes" fallback="Étapes" /></TabsTrigger>
                <TabsTrigger value="tasks"><T k="auto.phasedetail.taches" fallback="Tâches" /></TabsTrigger>
                <TabsTrigger value="metre"><Calculator className="h-3 w-3 mr-1" />Métré & DQE</TabsTrigger>
                <TabsTrigger value="resources"><Package className="h-3 w-3 mr-1" /><T k="auto.phasedetail.ressources" fallback="Ressources" /></TabsTrigger>
                <TabsTrigger value="stakeholders"><Building2 className="h-3 w-3 mr-1" /><T k="auto.phasedetail.intervenants" fallback="Intervenants" /></TabsTrigger>
                <TabsTrigger value="gantt"><T k="auto.phasedetail.gantt" fallback="Gantt" /></TabsTrigger>
                <TabsTrigger value="pert"><T k="auto.phasedetail.pert" fallback="PERT" /></TabsTrigger>
                <TabsTrigger value="critical"><T k="auto.phasedetail.chemin_critique" fallback="Chemin critique" /></TabsTrigger>
                <TabsTrigger value="milestones"><Target className="h-3 w-3 mr-1" /><T k="auto.phasedetail.jalons" fallback="Jalons" /></TabsTrigger>
                <TabsTrigger value="team"><Users className="h-3 w-3 mr-1" /><T k="auto.phasedetail.equipe" fallback="Équipe" /></TabsTrigger>
              </WorkspaceTabsList>
              <TabsContent value="steps">
                <PhaseStepsManager
                  steps={steps}
                  onAddStep={(step) => addStep(step as Omit<PhaseStepDTO, 'id'>)}
                  onUpdateStep={(stepId, updates) => updateStep(stepId, updates)}
                  onDeleteStep={(stepId) => deleteStep(stepId)}
                  onAddTask={(stepId, task) => addTask(stepId, task as Omit<PhaseTaskDTO, 'id'>)}
                  onUpdateTask={(stepId, taskId, updates) => updateTask(stepId, taskId, updates)}
                  onDeleteTask={(stepId, taskId) => deleteTask(stepId, taskId)}
                  isUpdating={isUpdating}
                  projectId={projectId!}
                  phaseId={phaseId!}
                />
              </TabsContent>
              <TabsContent value="tasks"><PhaseTasks phaseId={phaseId!} projectId={projectId!} /></TabsContent>
              <TabsContent value="metre">
                <PhaseQuantityTakeoffTab phaseId={phaseId!} projectId={projectId!} phaseName={title} />
              </TabsContent>
              <TabsContent value="resources">
                <PhaseResourcesTab phaseId={phaseId!} projectId={projectId!} />
              </TabsContent>
              <TabsContent value="stakeholders">
                <PhaseStakeholdersTab projectId={projectId!} phaseId={phaseId!} />
              </TabsContent>
              <TabsContent value="gantt">
                <GanttChart
                  projectId={projectId!}
                  phaseId={phaseId}
                  projectData={{
                    id: projectId,
                    startDate,
                    endDate,
                    phases: [{
                      id: phaseId,
                      name: title,
                      startDate,
                      endDate,
                      progress,
                      budget,
                      actualCost: vm.actualCost,
                      status: vm.status,
                    }],
                  }}
                />
              </TabsContent>
              <TabsContent value="pert"><PERTDiagram projectId={projectId!} phaseId={phaseId} /></TabsContent>
              <TabsContent value="critical"><CriticalPathView projectId={projectId!} phaseId={phaseId} /></TabsContent>
              <TabsContent value="milestones"><PhaseMilestones phaseId={phaseId!} projectId={projectId!} /></TabsContent>
              <TabsContent value="team"><PhaseResourcesTab phaseId={phaseId!} projectId={projectId!} /></TabsContent>
            </Tabs>
          </TabsContent>

          {/* Exécution: ressources consommées, finances, livrables, échéances */}
          <TabsContent value="execution" className="space-y-6">
            <Tabs defaultValue="resources" className="space-y-4">
              <WorkspaceTabsList variant="underline">
                <TabsTrigger value="resources"><Package className="h-3 w-3 mr-1" /><T k="auto.phasedetail.ressources" fallback="Ressources" /></TabsTrigger>
                <TabsTrigger value="finances"><Wallet className="h-3 w-3 mr-1" /><T k="auto.phasedetail.finances" fallback="Finances" /></TabsTrigger>
                <TabsTrigger value="documents"><FileText className="h-3 w-3 mr-1" /><T k="auto.phasedetail.livrables" fallback="Livrables" /></TabsTrigger>
                <TabsTrigger value="payments"><CreditCard className="h-3 w-3 mr-1" /><T k="auto.phasedetail.echeances" fallback="Échéances" /></TabsTrigger>
              </WorkspaceTabsList>
              <TabsContent value="resources">
                <PhaseResourcesTab phaseId={phaseId!} projectId={projectId!} />
              </TabsContent>
              <TabsContent value="finances">
                <PhaseFinancesTab
                  phase={phase as unknown as PhaseDTO}
                  projectId={projectId!}
                  phaseId={phaseId!}
                />
              </TabsContent>
              <TabsContent value="documents"><PhaseDocuments phaseId={phaseId!} projectId={projectId!} /></TabsContent>
              <TabsContent value="payments"><PhasePayments phaseId={phaseId!} projectId={projectId!} phaseName={title} phaseBudget={budget} /></TabsContent>
            </Tabs>
          </TabsContent>


          {/* Contrôle: inspections + conformité */}
          <TabsContent value="controle" className="space-y-6">
            <PhaseInspections phaseId={phaseId!} projectId={projectId!} />
          </TabsContent>

          {/* Clôture: réception, archives */}
          <TabsContent value="cloture" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" /> <T k="auto.phasedetail.cloture_de_la_phase" fallback="Clôture de la phase" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!completion.canComplete && (
                  <div className="flex items-start gap-2 p-3 bg-warning/10 dark:bg-amber-950/30 border border-warning/30 dark:border-amber-900 rounded-md text-sm">
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium">
                        <T k="auto.phasedetail.cloture_conditions" fallback="Conditions de clôture non réunies" /> ({formatPercent2(progress)})
                      </p>
                      <ul className="list-disc pl-4 text-xs text-muted-foreground">
                        {completion.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                      {progressResult.derivedValue != null && progressResult.isDivergent && (
                        <Button size="sm" variant="outline" onClick={handleAlignProgress} disabled={isUpdatingPhase}>
                          <T k="auto.phasedetail.aligner_progression" fallback="Aligner la progression" /> ({progressResult.derivedValue}%)
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                <PhaseDocuments phaseId={phaseId!} projectId={projectId!} />
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleClosePhase}
                    disabled={isClosed || isUpdatingPhase}
                    aria-label="Clôturer la phase"
                  >
                    <Flag className="h-4 w-4 mr-2" aria-hidden="true" />
                    {isClosed ? 'Phase clôturée' : isUpdatingPhase ? 'Clôture en cours…' : 'Clôturer la phase'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <PhaseEditDialog
          isOpen={isEditing}
          onOpenChange={setIsEditing}
          editForm={editForm}
          setEditForm={setEditForm}
          onSave={handleSaveEdit}
          isUpdating={isUpdatingPhase}
          phaseName={title}
          completionValidation={{
            canComplete: completion.canComplete,
            pendingCheckpoints: [],
            completedCheckpoints: [],
            totalCheckpoints: metrics.totalTasks,
            completedCount: metrics.completedTasks,
            message: completion.reasons.join(' · '),
            progressMet: completion.progressMet,
            currentProgress: completion.currentProgress,
            requiredProgress: completion.requiredProgress,
            progressMessage: completion.reasons[0] ?? '',
          }}
        />

      </div>

    </AppLayout>
  );
};

export default PhaseDetail;
