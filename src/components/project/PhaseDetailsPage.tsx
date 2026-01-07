/**
 * PhaseDetailsPage - Refactored Version
 * Main page component for phase details
 * Max 700 lines following architectural guidelines
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle,
  ChevronRight,
  ClipboardCheck,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  GitBranch,
  Layers,
  ListChecks,
  Package,
  RefreshCw,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Services and hooks
import { usePhaseDetails } from "@/hooks/usePhaseDetails";
import { MilestoneService } from "@/services/MilestoneService";
import { usePhaseWorkflow } from "@/hooks/usePhaseWorkflow";
import { useAuditEntries } from "@/hooks/useAuditEntries";

// Types
import { PhaseDTO, PhaseStatus } from "@/types/phase-dto";
import { validateCompletionReadiness } from "@/utils/completionValidation";
import { ProjectDataCalculations } from "@/utils/projectDataCalculations";

// Phase sub-components
import {
  PhaseOverviewMetrics,
  PhaseEditDialog,
  PhaseFinancesTab,
  ResourceUtilizationCard,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getFinancialHealthColor,
  getFinancialHealthLabel,
} from "./phase";

// Existing components
import PhaseCompliance from "./PhaseCompliance";
import PhaseDocuments from "./PhaseDocuments";
import PhaseEmployees from "./PhaseEmployees";
import PhaseInspections from "./PhaseInspections";
import PhaseMaterials from "./PhaseMaterials";
import PhasePayments from "./PhasePayments";
import PhaseTasks from "./PhaseTasks";
import PhaseWorkflowContainer from "./PhaseWorkflowContainer";

// Status Icons
const getStatusIcon = (status: PhaseStatus | string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4" />;
    case "in_progress":
      return <RefreshCw className="h-4 w-4" />;
    case "delayed":
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const calculateRemainingDays = (endDate?: string | null): number | string => {
  if (!endDate) return "N/A";
  try {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch {
    return "N/A";
  }
};

// Main Component
const PhaseDetailsPage: React.FC = () => {
  const { projectId, phaseId } = useParams<{
    projectId: string;
    phaseId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PhaseDTO>>({});

  // Use custom hook with services
  const {
    phase,
    isLoading,
    error,
    metrics,
    updatePhase,
    isUpdating,
    getReferentialInfo,
  } = usePhaseDetails(phaseId);

  // Fetch milestones for completion validation
  const { data: milestones = [] } = useQuery({
    queryKey: ['phase-milestones-validation', projectId, phaseId],
    queryFn: () => MilestoneService.getPhaseMilestones(projectId!, phaseId!),
    enabled: !!projectId && !!phaseId,
  });

  // Fetch phase financial data
  const { data: phaseCosts, isLoading: loadingCosts } = useQuery({
    queryKey: ['phase-costs', projectId, phaseId],
    queryFn: () => ProjectDataCalculations.calculatePhaseCosts(projectId!, phaseId!),
    enabled: !!projectId && !!phaseId,
  });

  // Fetch phase resource utilization
  const { data: phaseResources, isLoading: loadingResources } = useQuery({
    queryKey: ['phase-resources', projectId, phaseId],
    queryFn: () => ProjectDataCalculations.calculatePhaseResourceUtilization(projectId!, phaseId!),
    enabled: !!projectId && !!phaseId,
  });

  // Fetch phase progress metrics
  const { data: progressMetrics } = useQuery({
    queryKey: ['phase-progress-metrics', phaseId],
    queryFn: () => ProjectDataCalculations.calculatePhaseProgressMetrics(phaseId!),
    enabled: !!phaseId,
  });

  // Unified workflow hook
  const {
    latestApprovedInspection,
    workflowMetrics,
    refetch: refetchWorkflow,
  } = usePhaseWorkflow(projectId || '', phaseId || '', phase);

  // Audit entries for this phase/project
  const { auditEntries } = useAuditEntries(phaseId, projectId);

  const refreshWorkflowAndPhase = () => {
    try {
      if (typeof refetchWorkflow === 'function') refetchWorkflow();
    } catch { /* ignore */ }
    if (phaseId) {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-metrics', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-inspections', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-payments', phaseId] });
    }
  };

  // Validate if phase can be marked as completed
  const completionValidation = useMemo(() => {
    return validateCompletionReadiness(milestones, phase?.progress ?? 0, { progressThreshold: 100 });
  }, [milestones, phase?.progress]);

  // Get referential info for this phase
  const referentialInfo = useMemo(() => {
    if (!phase?.construction_phase) return null;
    return getReferentialInfo(phase.construction_phase);
  }, [phase?.construction_phase, getReferentialInfo]);

  // Initialize edit form when phase loads
  useEffect(() => {
    if (phase) {
      setEditForm({
        phase_name: phase.phase_name,
        description: phase.description,
        start_date: phase.start_date,
        end_date: phase.end_date,
        estimated_cost: phase.estimated_cost,
        estimated_duration_days: phase.estimated_duration_days,
        status: phase.status,
        progress: phase.progress,
        construction_phase: phase.construction_phase,
        construction_stage: phase.construction_stage,
      });
    }
  }, [phase]);

  const handleSave = () => {
    updatePhase(editForm);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !phase) {
    return (
      <div className="container mt-20 mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Impossible de charger les détails de la phase. Phase non trouvée
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au projet
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-14 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}`)}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au projet
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold truncate">Phase: {phase.phase_name}</h1>
                  {phaseCosts?.isOverBudget && (
                    <Badge variant="destructive" className="animate-pulse shrink-0">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Dépassement budgétaire
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {referentialInfo?.referential?.name?.fr || phase.construction_phase || "Standard"} 
                  • ID: {phase.id.slice(0, 8)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        {/* Status and Progress Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gradient-to-r from-muted/30 to-transparent rounded-lg border">
          <div className="flex items-center gap-4 flex-wrap">
            <Badge className={`${getStatusColor(phase.status)} flex items-center gap-1 shrink-0`}>
              {getStatusIcon(phase.status)}
              {getStatusLabel(phase.status)}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(phase.start_date)} → {formatDate(phase.end_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{formatCurrency(phase.estimated_cost)}</span>
            </div>
            {phase.steps.length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                <Layers className="h-3 w-3" />
                {phase.steps.length} étapes
              </Badge>
            )}
            {phaseCosts?.financialHealth && (
              <Badge variant="outline" className={cn(getFinancialHealthColor(phaseCosts.financialHealth), "shrink-0")}>
                <span className="ml-1">{getFinancialHealthLabel(phaseCosts.financialHealth)}</span>
              </Badge>
            )}
          </div>
          <div className="w-full md:w-48">
            <div className="flex justify-between text-sm mb-1">
              <span>Progression</span>
              <span>{phase.progress}%</span>
            </div>
            <Progress value={phase.progress} />
          </div>
        </div>
      </div>

      {/* Referential Info Card */}
      {referentialInfo && (
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-4">
              <GitBranch className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  Référentiel: {referentialInfo.referential.name?.fr || referentialInfo.referential.code}
                </p>
                <p className="text-xs text-muted-foreground">
                  {referentialInfo.phaseInfo?.label || 'Phase'} • {referentialInfo.phaseInfo?.steps?.length || 0} étapes prédéfinies
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1.5 py-2.5">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Tableau de bord</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-1.5 py-2.5 relative">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Workflow Unifié</span>
            {metrics.completedSteps < (phase.steps?.length || 0) && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse"></span>
            )}
          </TabsTrigger>
          <TabsTrigger value="finances" className="flex items-center gap-1.5 py-2.5 relative">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Finances & Décomptes</span>
            {phaseCosts?.isOverBudget && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping"></span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources_docs" className="flex items-center gap-1.5 py-2.5">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Ressources & Documents</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300">
          <PhaseOverviewMetrics
            phase={phase}
            phaseCosts={phaseCosts}
            progressMetrics={progressMetrics}
            metrics={metrics}
            loadingCosts={loadingCosts}
            onWorkflowClick={() => setActiveTab("workflow")}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Description and Workflow Preview */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {phase.description || "Aucune description disponible pour cette phase."}
                  </p>
                </CardContent>
              </Card>

              {/* Quick Steps Preview */}
              {phase.steps.length > 0 && (
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardHeader className="pb-3 bg-gradient-to-r from-purple-500/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-purple-600" />
                        Aperçu du Workflow
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("workflow")}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        Ouvrir Workflow
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {phase.steps.slice(0, 4).map((step) => {
                        const isCompleted = step.status === 'completed';
                        const isInProgress = step.status === 'in_progress';
                        
                        return (
                          <div
                            key={step.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-xl border-2 transition-all hover:shadow-sm cursor-pointer",
                              isCompleted && "bg-green-50/50 border-green-200",
                              isInProgress && "bg-blue-50/50 border-blue-200",
                              !isCompleted && !isInProgress && "bg-muted/30 border-transparent"
                            )}
                            onClick={() => setActiveTab("workflow")}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                isCompleted && "bg-green-500 text-white",
                                isInProgress && "bg-blue-500 text-white",
                                !isCompleted && !isInProgress && "bg-muted text-muted-foreground"
                              )}>
                                {step.order_index + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{step.name || `Étape ${step.order_index + 1}`}</p>
                                <p className="text-xs text-muted-foreground">
                                  {step.tasks?.length || 0} tâches
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={step.progress || 0} className="w-16 h-1.5" />
                              <span className="text-sm font-medium w-10 text-right">{step.progress || 0}%</span>
                            </div>
                          </div>
                        );
                      })}
                      {phase.steps.length > 4 && (
                        <Button
                          variant="ghost"
                          className="w-full text-muted-foreground"
                          onClick={() => setActiveTab("workflow")}
                        >
                          +{phase.steps.length - 4} autres étapes
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Info Cards */}
            <div className="space-y-6">
              {/* Phase Information */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-muted/50 to-transparent">
                  <CardTitle className="text-base">Informations clés</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <Badge className={getStatusColor(phase.status)}>
                      {getStatusIcon(phase.status)}
                      <span className="ml-1">{getStatusLabel(phase.status)}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Durée estimée</span>
                    <span className="font-medium">{phase.estimated_duration_days || "N/A"} jours</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Budget</span>
                    <span className="font-medium text-green-600">{formatCurrency(phase.estimated_cost)}</span>
                  </div>
                  {phaseCosts && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">Dépensé</span>
                      <span className="font-medium text-amber-600">{formatCurrency(phaseCosts.totalSpent)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Créée le</span>
                    <span className="text-sm">{formatDate(phase.created_at)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Card */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/5 to-transparent">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Échéancier
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="relative">
                    <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 to-muted" />
                    
                    <div className="space-y-4">
                      <div className="relative pl-8">
                        <div className="absolute left-1.5 w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100" />
                        <p className="text-xs text-muted-foreground">Début</p>
                        <p className="font-medium">{formatDate(phase.start_date)}</p>
                      </div>
                      <div className="relative pl-8">
                        <div className="absolute left-1.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                        <p className="text-xs text-muted-foreground">Fin prévue</p>
                        <p className="font-medium">{formatDate(phase.end_date)}</p>
                      </div>
                      <div className="relative pl-8">
                        <div className="absolute left-1.5 w-3 h-3 rounded-full bg-muted ring-4 ring-muted/50" />
                        <p className="text-xs text-muted-foreground">Restant</p>
                        <p className="font-bold text-lg text-primary">{calculateRemainingDays(phase.end_date)} jours</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ResourceUtilizationCard phaseId={phaseId!} projectId={projectId!} />
            </div>
          </div>
        </TabsContent>

        {/* Unified Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6 animate-in fade-in duration-300">
          <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Workflow Unifié</h2>
                    <p className="text-sm text-muted-foreground">
                      Planification • Exécution • Validation • Documentation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {metrics.completedSteps}/{metrics.stepsCount} étapes
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <ClipboardCheck className="h-3 w-3 mr-1" />
                    {metrics.passedInspections}/{metrics.totalInspections} inspections
                  </Badge>
                  <Badge variant="outline">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatCurrency(metrics.totalPaymentAmount)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {projectId && phaseId && (
            <PhaseWorkflowContainer
              rawPhaseData={phase}
              rawSteps={phase?.steps ?? undefined}
              rawMilestones={milestones}
              projectId={projectId}
              phaseId={phaseId}
              onAddStep={() => setIsEditing(true)}
              onActionComplete={() => refreshWorkflowAndPhase()}
              metrics={metrics}
              workflowMetrics={workflowMetrics}
              progressMetrics={progressMetrics}
              phaseCosts={phaseCosts}
              latestApprovedInspection={latestApprovedInspection}
              auditEntries={auditEntries}
            />
          )}

          {/* Sub-tabs for Tasks, Inspections, Payments, Compliance */}
          <Card className="border-0 shadow-md overflow-hidden">
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid grid-cols-4 bg-muted/50 p-1 m-2 rounded-lg">
                <TabsTrigger value="tasks" className="flex items-center gap-2 py-2">
                  <ListChecks className="h-4 w-4" />
                  <span className="hidden sm:inline">Tâches</span>
                </TabsTrigger>
                <TabsTrigger value="inspections" className="flex items-center gap-2 py-2">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Inspections</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2 py-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Paiements</span>
                </TabsTrigger>
                <TabsTrigger value="compliance" className="flex items-center gap-2 py-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Conformité</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks" className="p-6">
                <PhaseTasks phaseId={phaseId!} projectId={projectId!} />
              </TabsContent>
              
              <TabsContent value="inspections" className="p-6">
                <PhaseInspections phaseId={phaseId!} projectId={projectId!} />
              </TabsContent>
              
              <TabsContent value="payments" className="p-6">
                <PhasePayments phaseId={phaseId!} projectId={projectId!} />
              </TabsContent>
              
              <TabsContent value="compliance" className="p-6">
                <PhaseCompliance phaseId={phaseId!} projectId={projectId!} />
              </TabsContent>
            </Tabs>
          </Card>
        </TabsContent>

        {/* Resources & Documents Tab */}
        <TabsContent value="resources_docs" className="animate-in fade-in duration-300">
          <div className="space-y-6">
            <PhaseMaterials phaseId={phaseId!} projectId={projectId!} />
            <PhaseEmployees phaseId={phaseId!} />
            <PhaseDocuments phaseId={phaseId!} projectId={projectId!} />
          </div>
        </TabsContent>

        {/* Finances Tab */}
        <TabsContent value="finances" className="space-y-6 animate-in fade-in duration-300">
          <PhaseFinancesTab
            phase={phase}
            projectId={projectId!}
            phaseId={phaseId!}
            phaseCosts={phaseCosts}
            phaseResources={phaseResources}
            loadingCosts={loadingCosts}
            loadingResources={loadingResources}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <PhaseEditDialog
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSave}
        isUpdating={isUpdating}
        phaseName={phase.phase_name}
        completionValidation={completionValidation}
      />
    </div>
  );
};

export default PhaseDetailsPage;
