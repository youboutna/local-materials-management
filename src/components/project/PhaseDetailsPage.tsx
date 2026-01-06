import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart,
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
  Info,
  Layers,
  ListChecks,
  Package,
  PieChart,
  RefreshCw,
  Shield,
  Target,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Services and hooks
import { usePhaseDetails } from "@/hooks/usePhaseDetails";
import { MilestoneService } from "@/services/MilestoneService";

import { PhaseDTO, PhaseStatus } from "@/types/phase-dto";
import { getCompletionBlockReasons, validateCompletionReadiness } from "@/utils/completionValidation";
import { useQuery } from "@tanstack/react-query";

// Import existing components
import { ProjectDataCalculations } from "../../utils/projectDataCalculations";
import PhaseCompliance from "./PhaseCompliance";
import PhaseDocuments from "./PhaseDocuments";
import PhaseEmployees from "./PhaseEmployees";
import PhaseInspections from "./PhaseInspections";
import PhaseMaterials from "./PhaseMaterials";
import PhasePayments from "./PhasePayments";
import PhaseTasks from "./PhaseTasks";
import UnifiedPhaseWorkflow from "./monitoring/UnifiedPhaseWorkflow";
import PhaseStepsManager from "./phase/PhaseStepsManager";

// Helper functions
const getStatusColor = (status: PhaseStatus | string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "delayed":
      return "bg-red-100 text-red-800 border-red-200";
    case "pending":
    case "on_hold":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "cancelled":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

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

const getStatusLabel = (status: PhaseStatus | string) => {
  const labels: Record<string, string> = {
    completed: "Terminé",
    in_progress: "En cours",
    delayed: "En retard",
    pending: "En attente",
    cancelled: "Annulé",
    not_started: "Non commencé",
  };
  return labels[status] || status;
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "Non définie";
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Date invalide";
  }
};

const formatCurrency = (amount?: number | null) => {
  if (!amount) return "0 MRU";
  return `${amount.toLocaleString("fr-FR")} MRU`;
};

const calculateRemainingDays = (endDate?: string | null) => {
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

const getFinancialHealthColor = (health: string) => {
  switch (health) {
    case 'excellent': return 'text-green-600 bg-green-100 border-green-200';
    case 'good': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
    case 'warning': return 'text-amber-600 bg-amber-100 border-amber-200';
    case 'critical': return 'text-red-600 bg-red-100 border-red-200';
    default: return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

const getFinancialHealthLabel = (health: string) => {
  switch (health) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Bon';
    case 'warning': return 'Attention';
    case 'critical': return 'Critique';
    default: return 'Inconnu';
  }
};

const getFinancialHealthIcon = (health: string) => {
  switch (health) {
    case 'excellent': return <CheckCircle className="h-4 w-4" />;
    case 'good': return <TrendingUp className="h-4 w-4" />;
    case 'warning': return <AlertTriangle className="h-4 w-4" />;
    case 'critical': return <AlertTriangle className="h-4 w-4" />;
    default: return <Info className="h-4 w-4" />;
  }
};

// Financial Analysis Component
const FinancialAnalysisCard: React.FC<{ phaseId: string; projectId: string }> = ({ phaseId, projectId }) => {
  const { data: phaseCosts, isLoading: loadingCosts } = useQuery({
    queryKey: ['phase-costs', projectId, phaseId],
    queryFn: () => ProjectDataCalculations.calculatePhaseCosts(projectId, phaseId),
    enabled: !!projectId && !!phaseId,
  });

  if (loadingCosts) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Analyse financière</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!phaseCosts) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Analyse financière</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune donnée financière disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Analyse financière</span>

          
          <Badge variant="outline" className={getFinancialHealthColor(phaseCosts.financialHealth)}>
            {getFinancialHealthIcon(phaseCosts.financialHealth)}
            <span className="ml-1">{getFinancialHealthLabel(phaseCosts.financialHealth)}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Budget estimé</span>
            <span className="font-medium">{formatCurrency(phaseCosts.estimatedCost)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total dépensé</span>
            <span className={cn(
              "font-medium",
              phaseCosts.isOverBudget ? "text-red-600" : "text-green-600"
            )}>
              {formatCurrency(phaseCosts.totalSpent)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Écart budgétaire</span>
            <span className={cn(
              "font-medium",
              phaseCosts.costVariance > 0 ? "text-red-600" : "text-green-600"
            )}>
              {phaseCosts.costVariance > 0 ? "+" : ""}{formatCurrency(phaseCosts.costVariance)}
            </span>
          </div>
        </div>
        
        <Progress 
          value={Math.min(100, phaseCosts.budgetUtilization)} 
          className={cn(
            "h-2",
            phaseCosts.budgetUtilization > 90 
              ? "bg-red-100 [&>div]:bg-red-600" 
              : phaseCosts.budgetUtilization > 75
              ? "bg-amber-100 [&>div]:bg-amber-600"
              : "bg-green-100 [&>div]:bg-green-600"
          )}
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Utilisation: {phaseCosts.budgetUtilization.toFixed(1)}%</span>
          <span>Restant: {formatCurrency(phaseCosts.remainingBudget)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Resource Utilization Card
const ResourceUtilizationCard: React.FC<{ phaseId: string; projectId: string }> = ({ phaseId, projectId }) => {
  const { data: resources, isLoading } = useQuery({
    queryKey: ['phase-resources', projectId, phaseId],
    queryFn: () => ProjectDataCalculations.calculatePhaseResourceUtilization(projectId, phaseId),
    enabled: !!projectId && !!phaseId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Utilisation ressources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!resources) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Utilisation ressources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune donnée de ressources disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Utilisation ressources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Équipe</span>
            </div>
            <p className="text-2xl font-bold">{resources.totalEmployees}</p>
            <p className="text-xs text-muted-foreground">personnes assignées</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Matériaux</span>
            </div>
            <p className="text-2xl font-bold">{resources.totalMaterials}</p>
            <p className="text-xs text-muted-foreground">unités utilisées</p>
          </div>
        </div>
        
        {resources.hasResourceIssues && (
          <Alert className="py-2 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-700">
              Ressources limitées détectées
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Main Component
const PhaseDetailsPage: React.FC = () => {
  const { projectId, phaseId } = useParams<{
    projectId: string;
    phaseId: string;
  }>();
  const navigate = useNavigate();

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
    addStep,
    updateStep,
    deleteStep,
    addTask,
    updateTask,
    deleteTask,
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

  // Validate if phase can be marked as completed (checkpoints + progress)
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
              <span>
                {formatDate(phase.start_date)} → {formatDate(phase.end_date)}
              </span>
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
                {getFinancialHealthIcon(phaseCosts.financialHealth)}
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1.5 py-2.5">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-1.5 py-2.5 relative">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Workflow Unifié</span>
            {/* Indicator for active workflow */}
            {metrics.completedSteps < phase.steps.length && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse"></span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-1.5 py-2.5">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Ressources</span>
          </TabsTrigger>
          <TabsTrigger value="finances" className="flex items-center gap-1.5 py-2.5 relative">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Finances</span>
            {phaseCosts?.isOverBudget && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping"></span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1.5 py-2.5">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Enhanced Design */}
        <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Progress Card */}
            <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className={getStatusColor(phase.status)}>
                    {getStatusLabel(phase.status)}
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-bold">{progressMetrics?.overallProgress || phase.progress}%</p>
                  <p className="text-sm text-muted-foreground">Progression globale</p>
                </div>
                <Progress value={progressMetrics?.overallProgress || phase.progress} className="h-1.5 mt-3" />
                {progressMetrics && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {progressMetrics.completedSteps}/{progressMetrics.totalSteps} étapes • {progressMetrics.completedTasks}/{progressMetrics.totalTasks} tâches
                  </p>
                )}
              </div>
            </Card>

            {/* Budget Card - Enhanced with Real Costs */}
            <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  {loadingCosts ? (
                    <Skeleton className="h-5 w-16" />
                ) : phaseCosts?.costVariance !== undefined && phaseCosts.costVariance !== 0 && (
                    <Badge variant={(phaseCosts.costVariance ?? 0) > 0 ? "destructive" : "default"}>
                      {(phaseCosts.costVariance ?? 0) > 0 ? "+" : ""}
                      {formatCurrency(phaseCosts.costVariance)}
                    </Badge>
                  )}
                </div>
                
                <div className="mt-3">
                  <p className="text-2xl font-bold">{formatCurrency(phase.estimated_cost)}</p>
                  <p className="text-sm text-muted-foreground">Budget estimé</p>
                </div>
                
                {/* Real Costs Breakdown */}
                {loadingCosts ? (
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : phaseCosts ? (
                  <div className="mt-3 pt-3 border-t border-green-200/30 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payé aux contractants:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(phaseCosts.totalPayments)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Dépenses internes:</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(phaseCosts.totalExpenses)}
                      </span>
                    </div>
                    
                    <Separator className="my-1" />
                    
                    <div className="flex justify-between font-medium">
                      <span>Total dépensé:</span>
                      <span className={cn(
                        "font-bold",
                        phaseCosts.totalSpent > (phase.estimated_cost || 0) 
                          ? "text-red-600" 
                          : "text-green-600"
                      )}>
                        {formatCurrency(phaseCosts.totalSpent)}
                      </span>
                    </div>
                    
                    {phase.estimated_cost && phase.estimated_cost > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Utilisation budget:</span>
                        <span className={cn(
                          "font-medium",
                          (phaseCosts.totalSpent / phase.estimated_cost) > 1 
                            ? "text-red-600" 
                            : "text-green-600"
                        )}>
                          {((phaseCosts.totalSpent / phase.estimated_cost) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-3">Aucune donnée financière disponible</p>
                )}
              </div>
            </Card>

            {/* Timeline Card */}
            <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-blue-500/10">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{calculateRemainingDays(phase.end_date)}</p>
                  <p className="text-sm text-muted-foreground">Jours restants</p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Fin: {formatDate(phase.end_date)}
                </p>
              </div>
            </Card>

            {/* Workflow Card (formerly Steps) */}
            <Card 
              className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setActiveTab("workflow")}
            >
              <div className="p-4 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-500/10">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{metrics.completedSteps}/{metrics.stepsCount}</p>
                  <p className="text-sm text-muted-foreground">Workflow</p>
                </div>
                <Progress 
                  value={metrics.stepsCount > 0 ? (metrics.completedSteps / metrics.stepsCount) * 100 : 0} 
                  className="h-1.5 mt-3" 
                />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Phase Description */}
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

              {/* Quick Steps Preview - Enhanced */}
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
                      {phase.steps.slice(0, 4).map((step, index) => {
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
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                isCompleted && "bg-green-500 text-white",
                                isInProgress && "bg-blue-500 text-white",
                                !isCompleted && !isInProgress && "bg-muted text-muted-foreground"
                              )}>
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-medium truncate">{step.name}</span>
                                {step.tasks.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    {step.tasks.filter(t => t.status === 'completed').length}/{step.tasks.length} tâches
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-16">
                                <Progress value={step.progress} className="h-1.5" />
                              </div>
                              <span className={cn(
                                "text-sm font-bold w-10 text-right",
                                isCompleted && "text-green-600",
                                isInProgress && "text-blue-600"
                              )}>
                                {step.progress}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {phase.steps.length > 4 && (
                      <Button
                        variant="ghost"
                        className="w-full mt-4"
                        onClick={() => setActiveTab("workflow")}
                      >
                        Voir workflow complet ({phase.steps.length} étapes)
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Detailed Metrics Section */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-indigo-500/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-indigo-600" />
                    Métriques détaillées
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-100">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <ListChecks className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">Tâches</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">
                        {metrics.completedTasks}/{metrics.totalTasks}
                      </p>
                      <Progress value={metrics.taskCompletionRate} className="mt-2 h-1.5" />
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/30 border border-green-100">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-600">Inspections</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700">
                        {metrics.passedInspections}/{metrics.totalInspections}
                      </p>
                      <Progress value={metrics.inspectionPassRate} className="mt-2 h-1.5" />
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-100">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Package className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-medium text-amber-600">Matériaux</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-700">{phaseResources?.totalMaterials || metrics.totalMaterials}</p>
                      <p className="text-xs text-amber-600/80 mt-1">
                        {formatCurrency((phaseResources?.materialMetrics?.estimatedCost) || 0)}
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/30 border border-purple-100">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600">Employés</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-700">{phaseResources?.totalEmployees || metrics.totalEmployees}</p>
                      <p className="text-xs text-purple-600/80 mt-1">assignés</p>
                    </div>
                  </div>

                  {/* Financial & Progress Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-transparent border border-emerald-100">
                      <h4 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Performance financière
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total des paiements</span>
                          <span className="font-semibold">{formatCurrency(phaseCosts?.totalPayments || metrics.totalPaymentAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Dépenses internes</span>
                          <span className="font-semibold">{formatCurrency(phaseCosts?.totalExpenses || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Documents attachés</span>
                          <span className="font-semibold">{metrics.totalDocuments}</span>
                        </div>
                        {phaseCosts && (
                          <div className="flex justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground">Transactions</span>
                            <span className="font-semibold">
                              {phaseCosts.paymentsCount + phaseCosts.expensesCount} total
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-transparent border border-violet-100">
                      <h4 className="text-sm font-semibold text-violet-700 mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Progression des étapes
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progression totale</span>
                          <span className="font-semibold">{phase.progress}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Étapes terminées</span>
                          <span className="font-semibold">{metrics.completedSteps}/{metrics.stepsCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progression étapes</span>
                          <span className="font-semibold">{metrics.milestoneProgress.toFixed(1)}%</span>
                        </div>
                        {progressMetrics && (
                          <div className="flex justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground">Tâches terminées</span>
                            <span className="font-semibold">
                              {progressMetrics.completedTasks}/{progressMetrics.totalTasks}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Enhanced Info Cards */}
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
                    <>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm text-muted-foreground">Dépensé</span>
                        <span className="font-medium text-amber-600">{formatCurrency(phaseCosts.totalSpent)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm text-muted-foreground">Santé financière</span>
                        <Badge variant="outline" className={getFinancialHealthColor(phaseCosts.financialHealth)}>
                          {getFinancialHealthLabel(phaseCosts.financialHealth)}
                        </Badge>
                      </div>
                    </>
                  )}
                  {referentialInfo && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">Référentiel</span>
                      <Badge variant="outline">{referentialInfo.referential.name?.fr || referentialInfo.referential.code}</Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Créée le</span>
                    <span className="text-sm">{formatDate(phase.created_at)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Card - Enhanced */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/5 to-transparent">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Échéancier
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="relative">
                    {/* Timeline line */}
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

              {/* Analysis Cards */}
              <FinancialAnalysisCard phaseId={phaseId!} projectId={projectId!} />
              <ResourceUtilizationCard phaseId={phaseId!} projectId={projectId!} />
            </div>
          </div>
        </TabsContent>

        {/* Unified Workflow Tab - Fusion des Étapes et Suivi */}
        <TabsContent value="workflow" className="space-y-6 animate-in fade-in duration-300">
          {/* Workflow Summary Header */}
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

          {/* Unified Workflow Component with Milestone & Stage Integration */}
          <UnifiedPhaseWorkflow
            projectId={projectId!}
            phaseId={phaseId!}
            phaseName={phase.phase_name || 'Phase'}
            stages={phase.steps?.map((stage: any, index: number) => ({
              id: stage.id || `stage-${index}`,
              name: stage.name || stage.step_name || `Étape ${index + 1}`,
              description: stage.description || stage.step_description,
              status: stage.status || 'pending',
              progress: stage.progress || 0
            })) || []}
            phaseProgress={phase.progress || 0}
            phaseBudget={phase.estimated_cost || 0}
          />

          {/* Gestion des étapes intégrée */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10">
                    <Layers className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Gestion des Étapes</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Ajoutez, modifiez ou supprimez des étapes et tâches
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <PhaseStepsManager
                steps={phase.steps}
                onAddStep={addStep}
                onUpdateStep={updateStep}
                onDeleteStep={deleteStep}
                onAddTask={addTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                isUpdating={isUpdating}
              />
            </CardContent>
          </Card>

          {/* Sous-sections pour détails (Tâches, Inspections, Paiements, Conformité) */}
          <Card className="border-0 shadow-md overflow-hidden">
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid grid-cols-4 bg-muted/50 p-1 m-2 rounded-lg">
                <TabsTrigger value="tasks" className="flex items-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <ListChecks className="h-4 w-4" />
                  <span className="hidden sm:inline">Tâches</span>
                </TabsTrigger>
                <TabsTrigger value="inspections" className="flex items-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Inspections</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Paiements</span>
                </TabsTrigger>
                <TabsTrigger value="compliance" className="flex items-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Conformité</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks" className="p-6">
                <PhaseTasks 
                  phaseId={phaseId!} 
                  projectId={projectId!} 
                />
              </TabsContent>
              
              <TabsContent value="inspections" className="p-6">
                <PhaseInspections 
                  phaseId={phaseId!} 
                  projectId={projectId!} 
                />
              </TabsContent>
              
              <TabsContent value="payments" className="p-6">
                <PhasePayments 
                  phaseId={phaseId!} 
                  projectId={projectId!} 
                />
              </TabsContent>
              
              <TabsContent value="compliance" className="p-6">
                <PhaseCompliance 
                  phaseId={phaseId!} 
                  projectId={projectId!} 
                />
              </TabsContent>
            </Tabs>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="animate-in fade-in duration-300">
          <div className="space-y-6">
            <PhaseMaterials phaseId={phaseId!} projectId={projectId!} />
            <PhaseEmployees phaseId={phaseId!} />
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="animate-in fade-in duration-300">
          <PhaseDocuments phaseId={phaseId!} projectId={projectId!} />
        </TabsContent>

        {/* Finances Tab - Nouvel onglet */}
        <TabsContent value="finances" className="space-y-6 animate-in fade-in duration-300">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Estimated vs Actual */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Budget vs Réel</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCosts ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : phaseCosts ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Estimé:</span>
                      <span className="font-medium">{formatCurrency(phase.estimated_cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Engagé:</span>
                      <span className="font-medium text-amber-600">
                        {formatCurrency(phaseCosts.totalSpent)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Écart:</span>
                      <span className={cn(
                        phaseCosts.costVariance > 0 
                          ? "text-red-600" 
                          : "text-green-600"
                      )}>
                        {formatCurrency(phaseCosts.costVariance)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Budget restant:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(phaseCosts.remainingBudget)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée financière</p>
                )}
              </CardContent>
            </Card>
            
            {/* Cost Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Répartition coûts</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCosts ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : phaseCosts ? (
                  <div className="space-y-3">
                    {phaseCosts.totalPayments > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-sm">Contractants</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatCurrency(phaseCosts.totalPayments)}</span>
                            <span className="text-xs text-muted-foreground">
                              {phaseCosts.totalSpent > 0 
                                ? `${((phaseCosts.totalPayments / phaseCosts.totalSpent) * 100).toFixed(1)}%`
                                : '0%'}
                            </span>
                          </div>
                        </div>
                        <Progress 
                          value={phaseCosts.totalSpent > 0 ? (phaseCosts.totalPayments / phaseCosts.totalSpent) * 100 : 0} 
                          className="h-1 bg-blue-100 [&>div]:bg-blue-500"
                        />
                      </div>
                    )}
                    
                    {phaseCosts.totalExpenses > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500" />
                            <span className="text-sm">Dépenses internes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatCurrency(phaseCosts.totalExpenses)}</span>
                            <span className="text-xs text-muted-foreground">
                              {phaseCosts.totalSpent > 0 
                                ? `${((phaseCosts.totalExpenses / phaseCosts.totalSpent) * 100).toFixed(1)}%`
                                : '0%'}
                            </span>
                          </div>
                        </div>
                        <Progress 
                          value={phaseCosts.totalSpent > 0 ? (phaseCosts.totalExpenses / phaseCosts.totalSpent) * 100 : 0} 
                          className="h-1 bg-orange-100 [&>div]:bg-orange-500"
                        />
                      </div>
                    )}
                    
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Transactions:</span>
                        <span className="font-medium">
                          {phaseCosts.paymentsCount + phaseCosts.expensesCount} total
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune répartition disponible</p>
                )}
              </CardContent>
            </Card>
            
            {/* Financial Health */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Santé financière</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCosts ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : phaseCosts ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Utilisation budget:</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium",
                          phaseCosts.budgetUtilization > 90 
                            ? "text-red-600" 
                            : phaseCosts.budgetUtilization > 75
                            ? "text-amber-600"
                            : "text-green-600"
                        )}>
                          {phaseCosts.budgetUtilization.toFixed(1)}%
                        </span>
                        <Badge variant="outline" className={getFinancialHealthColor(phaseCosts.financialHealth)}>
                          {getFinancialHealthLabel(phaseCosts.financialHealth)}
                        </Badge>
                      </div>
                    </div>
                    
                    <Progress 
                      value={Math.min(100, phaseCosts.budgetUtilization)}
                      className={cn(
                        "h-2",
                        phaseCosts.budgetUtilization > 90 
                          ? "bg-red-100 [&>div]:bg-red-600" 
                          : phaseCosts.budgetUtilization > 75
                          ? "bg-amber-100 [&>div]:bg-amber-600"
                          : "bg-green-100 [&>div]:bg-green-600"
                      )}
                    />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Statut:</span>
                        <span className={cn(
                          "font-medium",
                          phaseCosts.isOverBudget ? "text-red-600" : "text-green-600"
                        )}>
                          {phaseCosts.isOverBudget ? "Dépassement" : "Dans le budget"}
                        </span>
                      </div>
                      {phaseCosts.remainingBudget > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Disponible:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(phaseCosts.remainingBudget)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune analyse disponible</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Detailed Cost Analysis */}
          {(phaseCosts && (phaseCosts.paymentsCount > 0 || phaseCosts.expensesCount > 0)) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Distribution */}
              {Object.keys(phaseCosts.paymentDistribution).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      Distribution par contractant
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(phaseCosts.paymentDistribution)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([contractorId, amount]) => (
                          <div key={contractorId} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-sm truncate">Contractant {contractorId.slice(0, 8)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-sm">{formatCurrency(amount as number)}</span>
                              <span className="text-xs text-muted-foreground">
                                {(((amount as number) / phaseCosts.totalPayments) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Expense Distribution */}
              {Object.keys(phaseCosts.expenseDistribution).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-orange-600" />
                      Dépenses par catégorie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(phaseCosts.expenseDistribution)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([category, amount]) => (
                          <div key={category} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span className="text-sm truncate">{category}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-sm">{formatCurrency(amount as number)}</span>
                              <span className="text-xs text-muted-foreground">
                                {(((amount as number) / phaseCosts.totalExpenses) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {/* Resource Cost Analysis */}
          {phaseResources && (phaseResources.totalEmployees > 0 || (phaseResources.materialMetrics?.estimatedCost ?? 0) > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Coûts des ressources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Employees Analysis */}
                  {phaseResources.totalEmployees > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        Équipe ({phaseResources.totalEmployees} personnes)
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(phaseResources.employeesByPosition)
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .slice(0, 5)
                          .map(([position, count]) => (
                            <div key={position} className="flex justify-between items-center">
                              <span className="text-sm truncate">{position}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{count as number}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {(((count as number) / phaseResources.totalEmployees) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Materials Analysis */}
                  {phaseResources.totalMaterials > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4 text-amber-600" />
                        Matériaux ({phaseResources.totalMaterials} unités)
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Coût total matériaux</span>
                          <span className="font-medium text-amber-600">
                            {formatCurrency(phaseResources.materialMetrics?.estimatedCost ?? 0)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(phaseResources.materialsByCategory)
                            .sort(([,a], [,b]) => (b as number) - (a as number))
                            .slice(0, 5)
                            .map(([category, quantity]) => (
                              <div key={category} className="flex justify-between items-center">
                                <span className="text-sm truncate">{category}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{quantity as number}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {(((quantity as number) / phaseResources.totalMaterials) * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>

      {/* Edit Dialog - Improved Design */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              Modifier la phase
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Modifiez les informations de la phase "{phase.phase_name}"
            </p>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Section: Informations générales */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building className="h-4 w-4" />
                Informations générales
              </div>
              
              <div className="grid gap-4 pl-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Nom de la phase <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={editForm.phase_name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phase_name: e.target.value })
                    }
                    placeholder="Ex: Fondations et terrassement"
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <Textarea
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    placeholder="Décrivez les objectifs et le contenu de cette phase..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section: Planification */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Planification
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date de début</Label>
                  <Input
                    type="date"
                    value={editForm.start_date || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, start_date: e.target.value })
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date de fin</Label>
                  <Input
                    type="date"
                    value={editForm.end_date || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, end_date: e.target.value })
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-medium">Durée estimée</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      value={editForm.estimated_duration_days || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          estimated_duration_days: parseInt(e.target.value) || undefined,
                        })
                      }
                      className="h-10 pr-14"
                      placeholder="30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      jours
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section: Budget */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Budget
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Coût estimé</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      value={editForm.estimated_cost || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          estimated_cost: parseFloat(e.target.value) || undefined,
                        })
                      }
                      className="h-10 pr-14"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      MRU
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section: État et progression */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target className="h-4 w-4" />
                État et progression
              </div>
              
              {/* Completion Validation Warning */}
              {!completionValidation.canComplete && (
                <Alert className="ml-6 border-warning/50 bg-warning/5">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-sm">
                    <span className="font-medium">Impossible de marquer comme terminé</span>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      {getCompletionBlockReasons(completionValidation).map((reason, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-warning" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Statut</Label>
                  <Select
                    value={editForm.status || "pending"}
                    onValueChange={(value) => {
                      // Prevent selecting 'completed' if validation fails
                      if (value === 'completed' && !completionValidation.canComplete) {
                        return;
                      }
                      setEditForm({ ...editForm, status: value as PhaseStatus });
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500" />
                          En attente
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          En cours
                        </div>
                      </SelectItem>
                      <SelectItem 
                        value="completed"
                        disabled={!completionValidation.canComplete}
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "h-2 w-2 rounded-full",
                                  !completionValidation.canComplete 
                                    ? "bg-gray-300" 
                                    : "bg-green-500"
                                )} />
                                Terminé
                                {!completionValidation.canComplete && (
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </TooltipTrigger>
                            {!completionValidation.canComplete && (
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="font-medium mb-1">Conditions requises</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {getCompletionBlockReasons(completionValidation).map((reason, idx) => (
                                    <li key={idx}>• {reason}</li>
                                  ))}
                                </ul>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </SelectItem>
                      <SelectItem value="delayed">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          En retard
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-500" />
                          Annulé
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Progression: {editForm.progress || 0}%
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={editForm.progress || 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          progress: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-2 flex-1"
                    />
                    <span className={cn(
                      "text-sm font-bold min-w-[3rem] text-right",
                      (editForm.progress || 0) === 100 && "text-green-600",
                      (editForm.progress || 0) > 0 && (editForm.progress || 0) < 100 && "text-primary",
                      (editForm.progress || 0) === 0 && "text-muted-foreground"
                    )}>
                      {editForm.progress || 0}%
                    </span>
                  </div>
                  <Progress value={editForm.progress || 0} className="h-2" />
                </div>
              </div>
            </div>

            {/* Section: Classification (optionnel) */}
            {(phase.construction_phase || phase.construction_stage) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    Classification
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Code de phase</Label>
                      <Input
                        value={editForm.construction_phase || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, construction_phase: e.target.value })
                        }
                        placeholder="Ex: PRE_FEASIBILITY"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Étape</Label>
                      <Input
                        value={editForm.construction_stage || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, construction_stage: e.target.value })
                        }
                        placeholder="Ex: Étude préliminaire"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              className="min-w-[100px]"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isUpdating || !editForm.phase_name?.trim()}
              className="min-w-[120px]"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhaseDetailsPage;