import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  Layers,
  BarChart,
  Building,
  Edit,
  Download,
  MapPin,
  Target,
  ListChecks,
  GitBranch,
  RefreshCw,
  TrendingUp,
  Users,
  FileText,
  CreditCard,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Services and hooks
import { usePhaseDetails, PhaseMetrics } from "@/hooks/usePhaseDetails";
import { referentialService } from "@/services/ReferentialService";
import { PhaseDTO, PhaseStatus, PhaseStepDTO } from "@/types/phase-dto";

// Import existing components
import PhaseMaterials from "./PhaseMaterials";
import PhaseEmployees from "./PhaseEmployees";
import PhaseDocuments from "./PhaseDocuments";
import PhasePayments from "./PhasePayments";
import PhaseInspections from "./PhaseInspections";
import PhaseTasks from "./PhaseTasks";
import PhaseCompliance from "./PhaseCompliance";
import UnifiedPhaseMonitoring from "./monitoring/UnifiedPhaseMonitoring";

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

// Phase Steps Component - Enhanced Design
const PhaseStepsView: React.FC<{ 
  steps: PhaseStepDTO[];
  onStepClick?: (stepId: string) => void;
}> = ({ steps, onStepClick }) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
          <Layers className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground">Aucune étape définie pour cette phase</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Ajoutez des étapes depuis un référentiel ou manuellement
        </p>
      </div>
    );
  }

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const totalProgress = steps.reduce((sum, s) => sum + s.progress, 0) / steps.length;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">{steps.length} Étapes</p>
            <p className="text-sm text-muted-foreground">
              {completedCount} terminées • {Math.round(totalProgress)}% progression moyenne
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {completedCount}
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
            <RefreshCw className="h-3 w-3 mr-1" />
            {steps.filter(s => s.status === 'in_progress').length}
          </Badge>
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
            <Clock className="h-3 w-3 mr-1" />
            {steps.filter(s => s.status === 'pending').length}
          </Badge>
        </div>
      </div>

      {/* Timeline View */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-muted" />
        
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = step.status === 'completed';
            const isInProgress = step.status === 'in_progress';
            const isDelayed = step.status === 'delayed';
            
            return (
              <div 
                key={step.id} 
                className="relative pl-16 cursor-pointer group"
                onClick={() => onStepClick?.(step.id)}
              >
                {/* Step indicator */}
                <div className={cn(
                  "absolute left-3 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  isCompleted && "bg-green-500 text-white shadow-lg shadow-green-500/30",
                  isInProgress && "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20",
                  isDelayed && "bg-destructive text-white shadow-lg shadow-destructive/30",
                  !isCompleted && !isInProgress && !isDelayed && "bg-muted text-muted-foreground border-2 border-muted-foreground/30"
                )}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                
                {/* Step Card */}
                <Card className={cn(
                  "transition-all border-2 group-hover:shadow-lg group-hover:scale-[1.01]",
                  isCompleted && "border-green-200 bg-green-50/50",
                  isInProgress && "border-primary/40 bg-primary/5",
                  isDelayed && "border-destructive/40 bg-destructive/5",
                  !isCompleted && !isInProgress && !isDelayed && "border-transparent hover:border-muted-foreground/20"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{step.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "shrink-0",
                              getStatusColor(step.status)
                            )}
                          >
                            {getStatusIcon(step.status)}
                            <span className="ml-1">{getStatusLabel(step.status)}</span>
                          </Badge>
                        </div>
                        {step.description && (
                          <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                        )}
                        
                        {/* Progress bar */}
                        <div className="flex items-center gap-3">
                          <Progress value={step.progress} className="flex-1 h-2" />
                          <span className={cn(
                            "text-sm font-bold min-w-[3rem] text-right",
                            step.progress === 100 && "text-green-600",
                            step.progress > 0 && step.progress < 100 && "text-primary",
                            step.progress === 0 && "text-muted-foreground"
                          )}>
                            {step.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tasks */}
                    {step.tasks.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {step.tasks.filter(t => t.status === 'completed').length}/{step.tasks.length} tâches
                        </p>
                        <div className="grid gap-2">
                          {step.tasks.map((task) => (
                            <div
                              key={task.id}
                              className={cn(
                                "flex items-center justify-between p-2.5 rounded-lg transition-colors",
                                task.status === 'completed' 
                                  ? "bg-green-100/50" 
                                  : task.status === 'in_progress'
                                  ? "bg-blue-100/50"
                                  : "bg-muted/50"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {task.status === "completed" ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                ) : task.status === "in_progress" ? (
                                  <RefreshCw className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                                )}
                                <span className={cn(
                                  "text-sm truncate",
                                  task.status === 'completed' && "line-through text-muted-foreground"
                                )}>
                                  {task.name}
                                </span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs shrink-0 ml-2",
                                  task.status === 'completed' && "border-green-300 text-green-700",
                                  task.status === 'in_progress' && "border-blue-300 text-blue-700"
                                )}
                              >
                                {getStatusLabel(task.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
  } = usePhaseDetails(phaseId);

  // Get referential info for this phase
  const referentialInfo = useMemo(() => {
    if (!phase?.construction_phase) return null;
    return getReferentialInfo(phase.construction_phase);
  }, [phase?.construction_phase, getReferentialInfo]);

  // Get referential options for dropdown
  const referentialOptions = useMemo(() => {
    return referentialService.getReferentialOptions();
  }, []);

  // Initialize edit form when phase loads
  React.useEffect(() => {
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
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au projet
            </Button>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Phase: {phase.phase_name}</h1>
                <p className="text-sm text-muted-foreground">
                  {referentialInfo?.referential?.name?.fr || phase.construction_phase || "Standard"} 
                  • ID: {phase.id.slice(0, 8)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Badge className={`${getStatusColor(phase.status)} flex items-center gap-1`}>
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
              <Badge variant="outline" className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {phase.steps.length} étapes
              </Badge>
            )}
          </div>
          <div className="w-48">
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="steps">Étapes</TabsTrigger>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
          <TabsTrigger value="resources">Ressources</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            Suivi & Jalons
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Enhanced Design */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Progress Card */}
            <Card className="overflow-hidden border-0 shadow-md">
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
                  <p className="text-3xl font-bold">{phase.progress}%</p>
                  <p className="text-sm text-muted-foreground">Progression</p>
                </div>
                <Progress value={phase.progress} className="h-1.5 mt-3" />
              </div>
            </Card>

            {/* Budget Card */}
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="p-4 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{formatCurrency(phase.estimated_cost)}</p>
                  <p className="text-sm text-muted-foreground">Budget estimé</p>
                </div>
                {phase.actual_cost !== undefined && phase.actual_cost > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    Réel: {formatCurrency(phase.actual_cost)}
                  </p>
                )}
              </div>
            </Card>

            {/* Timeline Card */}
            <Card className="overflow-hidden border-0 shadow-md">
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

            {/* Steps Card */}
            <Card 
              className="overflow-hidden border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveTab("steps")}
            >
              <div className="p-4 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-500/10">
                    <Layers className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{metrics.completedSteps}/{metrics.stepsCount}</p>
                  <p className="text-sm text-muted-foreground">Étapes</p>
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
                  <p className="text-muted-foreground leading-relaxed">
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
                        Aperçu des étapes
                      </CardTitle>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        {metrics.completedSteps}/{metrics.stepsCount}
                      </Badge>
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
                              "flex items-center justify-between p-3 rounded-xl border-2 transition-all hover:shadow-sm",
                              isCompleted && "bg-green-50/50 border-green-200",
                              isInProgress && "bg-blue-50/50 border-blue-200",
                              !isCompleted && !isInProgress && "bg-muted/30 border-transparent"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
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
                              <div>
                                <span className="text-sm font-medium">{step.name}</span>
                                {step.tasks.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    {step.tasks.filter(t => t.status === 'completed').length}/{step.tasks.length} tâches
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
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
                        onClick={() => setActiveTab("steps")}
                      >
                        Voir toutes les étapes ({phase.steps.length})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-3 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-transparent">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Tâches</span>
                  </div>
                  <p className="text-lg font-bold mt-1">
                    {metrics.completedTasks}/{metrics.totalTasks}
                  </p>
                </Card>
                <Card className="p-3 border-0 shadow-sm bg-gradient-to-br from-green-50 to-transparent">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">Inspections</span>
                  </div>
                  <p className="text-lg font-bold mt-1">
                    {metrics.passedInspections}/{metrics.totalInspections}
                  </p>
                </Card>
                <Card className="p-3 border-0 shadow-sm bg-gradient-to-br from-orange-50 to-transparent">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-muted-foreground">Paiements</span>
                  </div>
                  <p className="text-lg font-bold mt-1">{metrics.totalPayments}</p>
                </Card>
                <Card className="p-3 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-transparent">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-xs text-muted-foreground">Employés</span>
                  </div>
                  <p className="text-lg font-bold mt-1">{metrics.totalEmployees}</p>
                </Card>
              </div>
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
            </div>
          </div>
        </TabsContent>


        {/* Steps Tab - Enhanced */}
        <TabsContent value="steps">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10">
                    <Layers className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <span>Étapes de la phase</span>
                    <p className="text-sm font-normal text-muted-foreground mt-0.5">
                      {phase.phase_name}
                    </p>
                  </div>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {metrics.completedSteps} terminées
                  </Badge>
                  <Badge variant="outline">
                    {metrics.stepsCount} total
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <PhaseStepsView steps={phase.steps} onStepClick={(stepId) => console.log('Step clicked:', stepId)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Métriques détaillées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">
                      {metrics.completedTasks}/{metrics.totalTasks}
                    </p>
                    <p className="text-sm text-muted-foreground">Tâches</p>
                    <Progress value={metrics.taskCompletionRate} className="mt-2" />
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">
                      {metrics.passedInspections}/{metrics.totalInspections}
                    </p>
                    <p className="text-sm text-muted-foreground">Inspections</p>
                    <Progress value={metrics.inspectionPassRate} className="mt-2" />
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{metrics.totalMaterials}</p>
                    <p className="text-sm text-muted-foreground">Matériaux</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(metrics.materialCost)}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{metrics.totalEmployees}</p>
                    <p className="text-sm text-muted-foreground">Employés</p>
                    <p className="text-xs text-muted-foreground">assignés</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Performance financière</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total des paiements</span>
                          <span className="font-semibold">
                            {formatCurrency(metrics.totalPaymentAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nombre de paiements</span>
                          <span className="font-semibold">{metrics.totalPayments}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Documents attachés</span>
                          <span className="font-semibold">{metrics.totalDocuments}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Progression des étapes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Progression totale</span>
                          <span className="font-semibold">{phase.progress}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Étapes terminées</span>
                          <span className="font-semibold">
                            {metrics.completedSteps}/{metrics.stepsCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Progression étapes</span>
                          <span className="font-semibold">
                            {metrics.milestoneProgress.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <div className="space-y-6">
            <PhaseMaterials phaseId={phaseId!} projectId={projectId!} />
            <PhaseEmployees phaseId={phaseId!} />
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <PhaseDocuments phaseId={phaseId!} projectId={projectId!} />
        </TabsContent>

        {/* Monitoring & Milestones Tab - Unified View */}
        <TabsContent value="monitoring" className="space-y-6">
          {/* Unified Phase Monitoring - Combines Dashboard + Milestones */}
          <UnifiedPhaseMonitoring
            projectId={projectId!}
            phaseId={phaseId!}
            phaseName={phase.phase_name || 'Phase'}
          />

          {/* Compliance */}
          <PhaseCompliance phaseId={phaseId!} projectId={projectId!} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la phase: {phase.phase_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom de la phase *</Label>
              <Input
                value={editForm.phase_name || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, phase_name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.description || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={editForm.start_date || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={editForm.end_date || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, end_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Coût estimé (MRU)</Label>
                <Input
                  type="number"
                  value={editForm.estimated_cost || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      estimated_cost: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label>Durée estimée (jours)</Label>
                <Input
                  type="number"
                  value={editForm.estimated_duration_days || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      estimated_duration_days: parseInt(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statut</Label>
                <Select
                  value={editForm.status || "pending"}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, status: value as PhaseStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="delayed">En retard</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Progression (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.progress || 0}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      progress: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phase de construction</Label>
                <Select
                  value={editForm.construction_phase || ""}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, construction_phase: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {referentialOptions.map((ref) => (
                      <SelectItem key={ref.value} value={ref.value}>
                        {ref.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Étape de construction</Label>
                <Input
                  value={editForm.construction_stage || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, construction_stage: e.target.value })
                  }
                  placeholder="Ex: Fondation, Structure..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhaseDetailsPage;
