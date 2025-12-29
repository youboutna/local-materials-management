import React, { useState, useEffect } from "react";
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
  Users,
  Package,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Layers,
  BarChart,
  Building,
  Edit,
  Download,
  MapPin,
  Target,
  Shield,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Import existing components
import PhaseMaterials from "./PhaseMaterials";
import PhaseEmployees from "./PhaseEmployees";
import PhaseDocuments from "./PhaseDocuments";
import PhasePayments from "./PhasePayments";
import PhaseInspections from "./PhaseInspections";
import PhaseTasks from "./PhaseTasks";
import PhaseCompliance from "./PhaseCompliance";
import PhaseMilestones from "./PhaseMilestones";

// Interface based on your actual database structure from logs
interface PhaseDetails {
  id: string;
  project_id: string;
  phase_name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  estimated_cost?: number | null;
  estimated_duration?: number | null;
  actual_cost?: number | null;
  status: "not_started" | "in_progress" | "completed" | "delayed" | "on_hold";
  progress: number;
  location?: string | null;
  notes?: string | null;
  phase_type?: string | null;
  construction_phase?: string | null;
  construction_stage?: string | null;
  custom_phase_data?: any;
  milestones?: string | null; // JSON string
  materials?: string | null; // JSON string
  human_resources?: string | null; // JSON string
  suppliers?: string | null; // JSON string
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  weight?: number | null;
  dependencies?: string | null; // JSON string
}

interface PhaseMetrics {
  materialCost: number;
  totalMaterials: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  totalInspections: number;
  passedInspections: number;
  inspectionPassRate: number;
  totalEmployees: number;
  totalPayments: number;
  totalPaymentAmount: number;
  totalDocuments: number;
  milestoneProgress?: number;
}

const PhaseDetailsPage: React.FC = () => {
  const { projectId, phaseId } = useParams<{
    projectId: string;
    phaseId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PhaseDetails>>({});
  const [parsedMilestones, setParsedMilestones] = useState<any>(null);

  // Fetch phase details
  const {
    data: phase,
    isLoading,
    error,
  } = useQuery<PhaseDetails>({
    queryKey: ["phase-details", phaseId],
    queryFn: async () => {
      if (!phaseId) throw new Error("Phase ID is required");

      const { data: phaseData, error: phaseError } = await supabase
        .from("project_phases")
        .select("*")
        .eq("id", phaseId)
        .single();

      if (phaseError) throw phaseError;
      return phaseData as PhaseDetails;
    },
    enabled: !!phaseId,
  });

  // Parse milestones when phase loads
  useEffect(() => {
    if (phase?.milestones) {
      try {
        const parsed = JSON.parse(phase.milestones);
        setParsedMilestones(parsed);
      } catch (error) {
        console.error("Error parsing milestones:", error);
        setParsedMilestones(null);
      }
    }
  }, [phase]);

  // Fetch phase metrics
  const { data: metrics } = useQuery<PhaseMetrics>({
    queryKey: ["phase-metrics", phaseId],
    queryFn: async () => {
      if (!phaseId) {
        return {
          materialCost: 0,
          totalMaterials: 0,
          totalTasks: 0,
          completedTasks: 0,
          taskCompletionRate: 0,
          totalInspections: 0,
          passedInspections: 0,
          inspectionPassRate: 0,
          totalEmployees: 0,
          totalPayments: 0,
          totalPaymentAmount: 0,
          totalDocuments: 0,
          milestoneProgress: 0,
        };
      }

      try {
        // Fetch all metrics in parallel
        const [
          materialData,
          tasksData,
          inspectionsData,
          employeeData,
          paymentsData,
          documentsData,
        ] = await Promise.all([
          supabase
            .from("project_materials")
            .select("quantity, material_id")
            .eq("phase_id", phaseId),
          supabase
            .from("task_assignments")
            .select("status")
            .eq("phase_id", phaseId),
          supabase.from("inspections").select("status").eq("phase_id", phaseId),
          supabase.from("phase_employees").select("*").eq("phase_id", phaseId),
          supabase.from("payments").select("amount").eq("phase_id", phaseId),
          supabase
            .from("documents")
            .select("id, document_type")
            .eq("phase_id", phaseId),
        ]);

        // Calculate material cost
        const materialIds =
          materialData.data?.map((m) => m.material_id).filter(Boolean) || [];
        let materialCost = 0;

        if (materialIds.length > 0) {
          const { data: materials } = await supabase
            .from("materials")
            .select("id, price_per_unit")
            .in("id", materialIds);

          materialCost =
            materialData.data?.reduce((sum, pm) => {
              const material = materials?.find((m) => m.id === pm.material_id);
              return sum + (pm.quantity || 0) * (material?.price_per_unit || 0);
            }, 0) || 0;
        }

        // Calculate other metrics
        const totalTasks = tasksData.data?.length || 0;
        const completedTasks =
          tasksData.data?.filter((t) => t.status === "completed").length || 0;

        const totalInspections = inspectionsData.data?.length || 0;
        const passedInspections =
          inspectionsData.data?.filter(
            (i) => i.status === "approved" || i.status === "passed"
          ).length || 0;

        const totalPayments = paymentsData.data?.length || 0;
        const totalPaymentAmount =
          paymentsData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Try to parse milestones for progress calculation
        let milestoneProgress = 0;
        if (phase?.milestones) {
          try {
            const milestones = JSON.parse(phase.milestones);
            if (Array.isArray(milestones)) {
              const completed = milestones.filter(
                (m: any) => m.status === "completed"
              ).length;
              milestoneProgress =
                milestones.length > 0
                  ? (completed / milestones.length) * 100
                  : 0;
            }
          } catch (error) {
            console.error("Error calculating milestone progress:", error);
          }
        }

        return {
          materialCost,
          totalMaterials: materialData.data?.length || 0,
          totalTasks,
          completedTasks,
          taskCompletionRate:
            totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          totalInspections,
          passedInspections,
          inspectionPassRate:
            totalInspections > 0
              ? (passedInspections / totalInspections) * 100
              : 0,
          totalEmployees: employeeData.data?.length || 0,
          totalPayments,
          totalPaymentAmount,
          totalDocuments: documentsData.data?.length || 0,
          milestoneProgress,
        };
      } catch (error) {
        console.error("Error fetching metrics:", error);
        return {
          materialCost: 0,
          totalMaterials: 0,
          totalTasks: 0,
          completedTasks: 0,
          taskCompletionRate: 0,
          totalInspections: 0,
          passedInspections: 0,
          inspectionPassRate: 0,
          totalEmployees: 0,
          totalPayments: 0,
          totalPaymentAmount: 0,
          totalDocuments: 0,
          milestoneProgress: 0,
        };
      }
    },
    enabled: !!phaseId && !!phase,
  });

  // Update phase mutation
  const updatePhaseMutation = useMutation({
    mutationFn: async (updatedData: Partial<PhaseDetails>) => {
      if (!phaseId) throw new Error("Phase ID is required");

      // Create a properly typed update payload
      const updatePayload: any = {
        phase_name: updatedData.phase_name || null,
        description: updatedData.description || null,
        start_date: updatedData.start_date || null,
        end_date: updatedData.end_date || null,
        estimated_cost: updatedData.estimated_cost || null,
        estimated_duration: updatedData.estimated_duration || null,
        status: updatedData.status || null,
        progress: updatedData.progress || 0,
        location: updatedData.location || null,
        notes: updatedData.notes || null,
        phase_type: updatedData.phase_type || null,
        construction_phase: updatedData.construction_phase || null,
        construction_stage: updatedData.construction_stage || null,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values to avoid type conflicts
      Object.keys(updatePayload).forEach((key) => {
        if (updatePayload[key] === undefined) {
          updatePayload[key] = null;
        }
      });

      const { data, error } = await supabase
        .from("project_phases")
        .update(updatePayload)
        .eq("id", phaseId)
        .select()
        .single();

      if (error) throw error;
      return data as PhaseDetails;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-details", phaseId] });
      queryClient.invalidateQueries({
        queryKey: ["project-phases", projectId],
      });
      setIsEditing(false);
      toast({
        title: "Phase mise à jour",
        description: "Les modifications ont été enregistrées avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la phase.",
        variant: "destructive",
      });
    },
  });

  // Initialize edit form
  useEffect(() => {
    if (phase) {
      setEditForm({
        phase_name: phase.phase_name,
        description: phase.description,
        start_date: phase.start_date,
        end_date: phase.end_date,
        estimated_cost: phase.estimated_cost,
        estimated_duration: phase.estimated_duration,
        status: phase.status,
        progress: phase.progress,
        location: phase.location,
        notes: phase.notes,
        phase_type: phase.phase_type || "construction", // Default to "construction" if null
        construction_phase: phase.construction_phase,
        construction_stage: phase.construction_stage,
      });
    }
  }, [phase]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delayed":
        return "bg-red-100 text-red-800 border-red-200";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "delayed":
        return <AlertTriangle className="h-4 w-4" />;
      case "on_hold":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Terminé";
      case "in_progress":
        return "En cours";
      case "delayed":
        return "En retard";
      case "on_hold":
        return "En attente";
      default:
        return "Non commencé";
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Non définie";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
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
    } catch (error) {
      return "N/A";
    }
  };

  const getPhaseTypeLabel = (type?: string | null) => {
    switch (type) {
      case "construction":
        return "Construction";
      case "procurement":
        return "Marché Public";
      case "custom":
        return "Personnalisé";
      default:
        return type || "Non défini";
    }
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

  const statusInfo = getStatusLabel(phase.status);
  const statusIcon = getStatusIcon(phase.status);
  const statusColor = getStatusColor(phase.status);

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
                <h1 className="text-2xl font-bold">
                  Phase: {phase.phase_name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {getPhaseTypeLabel(phase.phase_type)} • ID:{" "}
                  {phase.id.slice(0, 8)}
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
            <Badge className={`${statusColor} flex items-center gap-1`}>
              {statusIcon}
              {statusInfo}
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{phase.location || "Non spécifiée"}</span>
            </div>
            {phase.phase_type && (
              <Badge variant="outline">
                {getPhaseTypeLabel(phase.phase_type)}
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
          <TabsTrigger value="resources">Ressources</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="monitoring">Suivi</TabsTrigger>
          <TabsTrigger value="advanced">Avancé</TabsTrigger>
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
                  <p className="text-gray-700">
                    {phase.description || "Aucune description."}
                  </p>
                  {phase.notes && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">Notes: </span>
                        {phase.notes}
                      </p>
                    </div>
                  )}
                  {phase.weight && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">Poids: </span>
                      <span>{phase.weight}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Milestones Preview */}
              {parsedMilestones && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Jalons
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Array.isArray(parsedMilestones) &&
                      parsedMilestones.length > 0 ? (
                        parsedMilestones
                          .slice(0, 3)
                          .map((milestone: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 border rounded"
                            >
                              <span className="text-sm">
                                {milestone.title || `Jalon ${index + 1}`}
                              </span>
                              <Badge
                                variant={
                                  milestone.status === "completed"
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {milestone.status === "completed"
                                  ? "Terminé"
                                  : "En attente"}
                              </Badge>
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Aucun jalon défini
                        </p>
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
                    <p className="text-sm font-medium text-muted-foreground">
                      Statut
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {statusIcon}
                      <span>{statusInfo}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Durée estimée
                    </p>
                    <p>{phase.estimated_duration || "Non définie"} jours</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Coût estimé
                    </p>
                    <p>{formatCurrency(phase.estimated_cost)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Date de création
                    </p>
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
                      <span className="text-sm font-medium">
                        {formatDate(phase.start_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Fin prévue</span>
                      <span className="text-sm font-medium">
                        {formatDate(phase.end_date)}
                      </span>
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
              {metrics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {metrics.completedTasks}/{metrics.totalTasks}
                      </p>
                      <p className="text-sm text-muted-foreground">Tâches</p>
                      <Progress
                        value={metrics.taskCompletionRate}
                        className="mt-2"
                      />
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {metrics.passedInspections}/{metrics.totalInspections}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Inspections
                      </p>
                      <Progress
                        value={metrics.inspectionPassRate}
                        className="mt-2"
                      />
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {metrics.totalMaterials}
                      </p>
                      <p className="text-sm text-muted-foreground">Matériaux</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(metrics.materialCost)}
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">
                        {metrics.totalEmployees}
                      </p>
                      <p className="text-sm text-muted-foreground">Employés</p>
                      <p className="text-xs text-muted-foreground">assignés</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Performance financière
                        </CardTitle>
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
                            <span className="font-semibold">
                              {metrics.totalPayments}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Documents attachés</span>
                            <span className="font-semibold">
                              {metrics.totalDocuments}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Progression des jalons
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Progression totale</span>
                            <span className="font-semibold">
                              {phase.progress}%
                            </span>
                          </div>
                          {metrics.milestoneProgress !== undefined && (
                            <div className="flex justify-between">
                              <span>Progression jalons</span>
                              <span className="font-semibold">
                                {metrics.milestoneProgress.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Chargement des métriques...
                </p>
              )}
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

        {/* Monitoring Tab */}
        <TabsContent value="monitoring">
          <div className="space-y-6">
            <PhaseTasks phaseId={phaseId!} projectId={projectId!} />
            <PhaseInspections phaseId={phaseId!} projectId={projectId!} />
            <PhasePayments phaseId={phaseId!} projectId={projectId!} />
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced">
          <div className="space-y-6">
            <PhaseCompliance phaseId={phaseId!} projectId={projectId!} />
            <PhaseMilestones phaseId={phaseId!} projectId={projectId!} />
          </div>
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
                      estimated_cost: parseFloat(e.target.value) || null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Durée estimée (jours)</Label>
                <Input
                  type="number"
                  value={editForm.estimated_duration || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      estimated_duration: parseInt(e.target.value) || null,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statut</Label>
                <Select
                  value={editForm.status || "not_started"}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, status: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Non commencé</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="delayed">En retard</SelectItem>
                    <SelectItem value="on_hold">En attente</SelectItem>
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
          <div>
  <Label>Type de phase</Label>
  <Select
    value={editForm.phase_type || "construction"} // Ensure it's never null
    onValueChange={(value) =>
      setEditForm({ ...editForm, phase_type: value })
    }
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="construction">Construction</SelectItem>
      <SelectItem value="procurement">Marché Public</SelectItem>
      <SelectItem value="custom">Personnalisé</SelectItem>
    </SelectContent>
  </Select>
</div>
            <div>
              <Label>Localisation</Label>
              <Input
                value={editForm.location || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => updatePhaseMutation.mutate(editForm)}
                disabled={updatePhaseMutation.isPending}
              >
                {updatePhaseMutation.isPending
                  ? "Sauvegarde..."
                  : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhaseDetailsPage;
