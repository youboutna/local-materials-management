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
} from "lucide-react";

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
import UnifiedMilestoneManager from "./milestones/UnifiedMilestoneManager";
import PhaseMonitoringDashboard from "./monitoring/PhaseMonitoringDashboard";

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

// Phase Steps Component
const PhaseStepsView: React.FC<{ steps: PhaseStepDTO[] }> = ({ steps }) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune étape définie pour cette phase
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <Card key={step.id} className="border-l-4 border-l-primary">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                  {index + 1}
                </span>
                <div>
                  <CardTitle className="text-base">{step.name}</CardTitle>
                  {step.description && (
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(step.status)}>
                  {getStatusLabel(step.status)}
                </Badge>
                <div className="w-24">
                  <Progress value={step.progress} className="h-2" />
                </div>
                <span className="text-sm font-medium">{step.progress}%</span>
              </div>
            </div>
          </CardHeader>
          {step.tasks.length > 0 && (
            <CardContent className="py-2 border-t">
              <div className="space-y-2">
                {step.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      {task.status === "completed" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                      )}
                      <span className="text-sm">{task.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(task.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
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

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Phase Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description détaillée</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    {phase.description || "Aucune description."}
                  </p>
                </CardContent>
              </Card>

              {/* Quick Steps Preview */}
              {phase.steps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5" />
                      Aperçu des étapes ({metrics.completedSteps}/{metrics.stepsCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {phase.steps.slice(0, 3).map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{index + 1}.</span>
                            <span className="text-sm">{step.name}</span>
                          </div>
                          <Badge variant={step.status === "completed" ? "default" : "outline"}>
                            {step.progress}%
                          </Badge>
                        </div>
                      ))}
                      {phase.steps.length > 3 && (
                        <Button
                          variant="link"
                          className="w-full"
                          onClick={() => setActiveTab("steps")}
                        >
                          Voir toutes les étapes ({phase.steps.length})
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Phase Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Statut</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(phase.status)}
                      <span>{getStatusLabel(phase.status)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Durée estimée</p>
                    <p>{phase.estimated_duration_days || "Non définie"} jours</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coût estimé</p>
                    <p>{formatCurrency(phase.estimated_cost)}</p>
                  </div>
                  {phase.actual_cost !== undefined && phase.actual_cost > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Coût réel</p>
                      <p>{formatCurrency(phase.actual_cost)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date de création</p>
                    <p className="text-sm">{formatDate(phase.created_at)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Échéancier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Début</span>
                      <span className="text-sm font-medium">{formatDate(phase.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Fin prévue</span>
                      <span className="text-sm font-medium">{formatDate(phase.end_date)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm">Jours restants</span>
                      <span className="text-sm font-medium">
                        {calculateRemainingDays(phase.end_date)} jours
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Steps Tab */}
        <TabsContent value="steps">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Étapes et tâches de la phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhaseStepsView steps={phase.steps} />
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

        {/* Monitoring & Milestones Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          {/* Unified Milestone Manager - Reference Model */}
          <UnifiedMilestoneManager
            projectId={projectId!}
            phaseId={phaseId!}
            phaseName={phase.phase_name || 'Phase'}
            defaultView="timeline"
            onMilestoneClick={(milestoneId) => {
              console.log('Milestone clicked:', milestoneId);
            }}
          />

          {/* Phase Monitoring Dashboard */}
          <PhaseMonitoringDashboard 
            phaseId={phaseId!} 
            projectId={projectId!}
            phaseName={phase.phase_name || undefined}
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
