import InteractiveMapGIS from "@/components/materials/InteractiveMapGIS";
import EnhancedRiskManager from "@/components/project/EnhancedRiskManager";
import EnhancedTaskManager from "@/components/project/EnhancedTaskManager";
import FinancialOverview from "@/components/project/FinaancialOverview";
import PhaseList from "@/components/project/PhaseList";
import ProjectGantt from "@/components/project/ProjectGantt";
import TeamOverview from "@/components/project/TeamOverview";
import { UnifiedMilestoneManager } from "@/components/project/milestones";
import UnifiedGanttChart from "@/components/project/UnifiedGanttChart";
import UnifiedPERTAnalysis from "@/components/project/UnifiedPERTAnalysis";
import ActionableProjectMilestones from "@/components/project/monitoring/ActionableProjectMilestones";
import { ReportManager } from "@/components/reports/ReportManager";
import { GanttChart, PERTDiagram, KanbanBoard, CriticalPathView, ProjectTimeline } from "@/components/planning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { ProjectAnalyticsService } from '@/application/services/ProjectAnalyticsService';
import { ProjectService } from '@/application/services/ProjectService';
import { MilestoneService } from '@/application/services/MilestoneService';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { ProjectDetailDTO, ProjectSummaryDTO } from "@/types/dto";
import { Dialog, DialogContent, DialogTrigger } from "@radix-ui/react-dialog";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileDown,
  FileText,
  MapPin,
  Package,
  Shield,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ElectricSpinner } from "../loading-page";
import { CompactProjectReportGenerator } from "../reports/CompactProjectReportGenerator";
import { ReferentialType } from "@/config/referentials";
import { referentialService } from '@/services/ReferentialService';
import {
  Dialog as DialogUI,
  DialogContent as DialogContentUI,
  DialogHeader as DialogHeaderUI,
  DialogTitle as DialogTitleUI,
} from "@/components/ui/dialog";
import ConstructionPhaseManager from "./ConstructionPhaseManager";
import ProjectCheckpointsDashboard from "./ProjectCheckpointsDashboard";
import { Label } from "../ui/label";
import { ProjectHeader, ProjectHierarchyView, ProjectMatrixView } from "./hierarchy";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "../ui/select";
import { useProjectPhasesHex } from "@/hooks/hexagonal";

interface ProjectDetailByDTOProps {
  projectId?: string;
  onEdit?: () => void;
  onClose?: () => void;
}
interface PhaseToSave {
  project_id: string;
  phase_name: string;
  description: string;
  start_date: string;
  end_date: string;
  estimated_duration: number;
  estimated_cost: number;
  status: string;
  progress: number;
  phase_type: string;
  construction_phase: string;
  custom_phase_data: any;
}
const ProjectDetailByDTO: React.FC<ProjectDetailByDTOProps> = ({
  projectId: propProjectId,
  onEdit,
  onClose,
}) => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const projectId = propProjectId || routeProjectId;
  const [selectedReferential, setSelectedReferential] =
    useState<ReferentialType | null>(null);
  const [showPhaseManager, setShowPhaseManager] = useState(false);
  const [phases, setPhases] = useState<any[]>([]);
  console.log("🔍 ProjectDetailByDTO render - projectId:", projectId);

  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const queryClient = useQueryClient();
  const projectService = new ProjectService(RepositoryFactory.getProjectRepository());

  // Fetch project data using ProjectService
  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery<ProjectSummaryDTO | undefined>({
    queryKey: ["project-summary", projectId],
    queryFn: async (): Promise<ProjectSummaryDTO | undefined> => {
      console.log("🔍 Query function starting for projectId:", projectId);
      if (!projectId) throw new Error(t("project.errors.missing_id"));

      console.log("🔍 Calling ProjectService.getProjectSummary...");
      const result = await projectService.getProjectSummary(projectId);
      console.log("🔍 ProjectService result:", result ? "SUCCESS" : "NULL");
      if (!result) throw new Error(t("project.errors.not_found"));
      return result;
    },
    enabled: !!projectId,
    retry: 1,
    staleTime: 30_000,
  });

  // Fetch detailed project data (includes plannedPhases, tasks, risks, inspections, etc.)
  const { data: projectDetail, isLoading: detailLoading } =
    useQuery<ProjectDetailDTO | null>({
      queryKey: ["project-detail", projectId],
      queryFn: async (): Promise<ProjectDetailDTO | null> => {
        if (!projectId) return null;
        return await projectService.getProjectWithDetails(projectId);
      },
      enabled: !!projectId,
      staleTime: 30_000,
    });

  // Analytics from ProjectService
  const projectAnalyticsQuery = useQuery({
    queryKey: ["project-analytics", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const analyticsService = new ProjectAnalyticsService();
      return await analyticsService.getProjectAnalytics(
        projectId
      );
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  // KPIs from ProjectAnalyticsService
  const { data: kpiMetrics } = useQuery({
    queryKey: ["project-kpis", projectId],
    queryFn: async () => {
      if (!projectId || !projectDetail) return null;
      
      // Get both analytics and metrics
      const analyticsService = new ProjectAnalyticsService();
      const [analytics, metrics, costAnalysis] = await Promise.all([
        analyticsService.getProjectAnalytics(projectDetail.id),
        analyticsService.getProjectMetrics(projectDetail.id),
        analyticsService.getProjectCostAnalysis(projectDetail.id)
      ]);

      // Combine all data into the expected format
      return {
        ...analytics,
        // Add missing properties from metrics
        completedTasks: metrics.completed_tasks,
        delayedTasks: metrics.overdue_tasks,
        totalTasks: metrics.total_tasks,
        pendingTasks: metrics.pending_tasks,
        totalMilestones: metrics.total_milestones,
        completedMilestones: metrics.completed_milestones,
        totalRisks: metrics.total_risks,
        highRisks: metrics.high_risks,
        mediumRisks: metrics.medium_risks,
        lowRisks: metrics.low_risks,
        totalIssues: metrics.total_issues,
        openIssues: metrics.open_issues,
        resolvedIssues: metrics.resolved_issues,
        criticalIssues: metrics.open_issues, // Using open_issues as critical issues
        // Add properties from cost analysis
        budgetUtilization: (costAnalysis.actual_cost / costAnalysis.total_budget) * 100,
        remainingBudget: costAnalysis.remaining_budget,
        cpi: costAnalysis.cost_performance_index,
        earnedValue: costAnalysis.actual_cost,
        costVariance: costAnalysis.cost_variance,
        // Add calculated properties
        spi: analytics.schedule_performance / 100, // Convert to decimal
        inspectionPassRate: analytics.quality_score,
        healthScore: Math.round(
          (analytics.progress_percentage + analytics.quality_score + analytics.schedule_performance) / 3
        ),
        remainingDays: Math.max(0, 30), // Mock calculation
        elapsedDays: 45, // Mock calculation
        overallProgress: analytics.progress_percentage,
        scheduleVariance: analytics.timeline_variance
      };
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });

  // Compliance data
  const { data: complianceData } = useQuery({
    queryKey: ["project-compliance", projectId],
    queryFn: async (): Promise<any> => {
      if (!projectId || !projectDetail) return null;
      const analyticsService = new ProjectAnalyticsService();
      return await analyticsService.getComplianceData(projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });

  // PERT Analysis
  const { data: pertAnalysis } = useQuery({
    queryKey: ["project-pert", projectId],
    queryFn: async (): Promise<any> => {
      if (!projectId || !projectDetail) return null;
      const { ProjectCalculationService } = await import(
        "@/services/ProjectCalculationService"
      );
      return ProjectCalculationService.calculatePERTAnalysis(projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });

  // Gantt Chart
  const { data: ganttChart } = useQuery({
    queryKey: ["project-gantt", projectId],
    queryFn: async (): Promise<any> => {
      if (!projectId || !projectDetail) return null;
      const { ProjectCalculationService } = await import(
        "@/services/ProjectCalculationService"
      );
      return ProjectCalculationService.generateGanttChart(projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });

  // Milestone count for dashboard
  const { data: milestoneProgress } = useQuery({
    queryKey: ["milestone-progress", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return await MilestoneService.getMilestoneProgress(projectId);
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  // Use data from ProjectDetailDTO
  const phasesSource = useMemo(() => {
    const phases = projectDetail?.plannedPhases || [];
    console.log('📊 Phases Source:', phases);
    console.log('📊 ProjectDetail:', projectDetail);
    return phases;
  }, [projectDetail]);
  
  const tasksSource = useMemo(() => {
    const tasks = projectDetail?.tasks || [];
    console.log('📊 Tasks Source:', tasks);
    return tasks;
  }, [projectDetail]);
  
  const risksSource = useMemo(() => {
    const risks = projectDetail?.risks || [];
    console.log('📊 Risks Source:', risks);
    return risks;
  }, [projectDetail]);
  
  const inspectionsSource = useMemo(() => {
    const inspections = projectDetail?.inspections || [];
    console.log('📊 Inspections Source:', inspections);
    return inspections;
  }, [projectDetail]);
  
  const paymentsSource = useMemo(() => {
    const expenses = projectDetail?.expenses || [];
    console.log('📊 Payments Source:', expenses);
    return expenses;
  }, [projectDetail]);

  // Calculate current phase and stage dynamically from phases
  const currentPhaseInfo = useMemo(() => {
    if (!phasesSource || phasesSource.length === 0) {
      return { currentPhase: null, currentStage: null };
    }

    // Find the first phase that is "in_progress"
    const inProgressPhase = phasesSource.find(
      (p: any) => p.status === "in_progress"
    );
    if (inProgressPhase) {
      return {
        currentPhase:
          inProgressPhase.phase_name ||
          inProgressPhase.construction_phase ||
          inProgressPhase.name,
        currentStage: inProgressPhase.construction_stage || null,
      };
    }

    // If no in_progress phase, find the first "pending" or "not_started"
    const pendingPhase = phasesSource.find(
      (p: any) =>
        p.status === "pending" ||
        p.status === "not_started" ||
        p.status === "planned"
    );
    if (pendingPhase) {
      return {
        currentPhase:
          pendingPhase.phase_name ||
          pendingPhase.construction_phase ||
          pendingPhase.name,
        currentStage: pendingPhase.construction_stage || null,
      };
    }

    // All phases completed - show last one
    const lastPhase = phasesSource[phasesSource.length - 1];
    return {
      currentPhase:
        lastPhase?.phase_name ||
        lastPhase?.construction_phase ||
        lastPhase?.name ||
        null,
      currentStage: lastPhase?.construction_stage || null,
    };
  }, [phasesSource]);

  // Calculate project methodology
  const projectMethodology = useMemo(() => {
    if (projectDetail?.methodology) {
      return projectDetail.methodology === "waterfall"
        ? "Standard (Cascade)"
        : projectDetail.methodology === "agile"
        ? "Agile"
        : projectDetail.methodology === "hybrid"
        ? "Hybride"
        : "Standard";
    }
    return "Standard";
  }, [projectDetail?.methodology, t]);

  // Compute derived data from DTO
  const [resources, setResources] = useState<Array<{id: string, name: string, type: string, cost?: number}>>([]);
  const [tasks, setTasks] = useState<Array<{id: string, name: string, status: string, progress?: number}>>([]);
  const [risks, setRisks] = useState<Array<{id: string, title: string, description: string, probability: number, impact: number}>>([]);

  useEffect(() => {
    const computeResources = () => {
      if (!projectDetail) return;
      
      // Use real resources from projectDetail instead of mock data
      const realResources = projectDetail.resources || [];
      
      // Transform real resources to the expected format
      const allResources = realResources.map((resource: any) => ({
        id: resource.id || `resource-${Math.random()}`,
        name: resource.name || resource.title || "Ressource sans nom",
        type: resource.type || "human",
        position: resource.position || resource.role || "Non spécifié",
        costPerHour: resource.costPerHour || resource.hourlyRate || 0,
        monthlyCost: resource.monthlyCost || 0,
        availability: resource.availability || 100,
        skills: resource.skills || [],
        department: resource.department || "Non spécifié"
      }));
      
      // Add project manager if exists and not already included
      if (projectDetail.projectResponsableId && !allResources.find(r => r.id.includes('manager'))) {
        // Try to get real manager data from contacts or stakeholders
        const managerContact = projectDetail.contacts?.find((c: any) => 
          c.role === 'project_manager' || c.role === 'chef de projet'
        );
        
        allResources.push({
          id: `manager-${projectDetail.projectResponsableId}`,
          name: managerContact?.name || "Chef de projet",
          type: "human",
          position: managerContact?.role || "Chef de projet",
          costPerHour: 0,
          monthlyCost: 0,
          availability: 100,
          skills: ["Management", "Coordination"],
          department: "Management"
        });
      }
      
      // Add main contractor if exists and not already included
      if (projectDetail.mainContractor && !allResources.find(r => r.id.includes('contractor'))) {
        // Try to get real contractor data from contacts or stakeholders
        const contractorContact = projectDetail.contacts?.find((c: any) => 
          c.role === 'contractor' || c.role === 'contractant principal'
        );
        
        allResources.push({
          id: `contractor-main`,
          name: projectDetail.mainContractor,
          type: "human", 
          position: contractorContact?.role || "Contractant principal",
          costPerHour: 0,
          monthlyCost: 0,
          availability: 100,
          skills: ["Construction"],
          department: "Construction"
        });
      }
      
      setResources(allResources);
    };
    if (projectDetail) {
      computeResources();
      setTasks(tasksSource);
      setRisks(risksSource);
    }
  }, [projectDetail, risksSource, tasksSource, t]);

  // Calculate realistic progress
  const [calculatedProgress, setCalculatedProgress] = useState<number>(0);

  useEffect(() => {
    const calculateProgress = async () => {
      if (projectDetail) {
        // const progress = ProgressCalculationService.calculateProjectProgress(
        //   projectDetail.plannedPhases || [],
        //   projectDetail.tasks || [],
        //   projectDetail.inspections || []
        // );
        // setCalculatedProgress(progress);
        setCalculatedProgress(projectDetail.progress || 0);
      }
    };
    calculateProgress();
  }, [projectDetail]);

  // Convert project data for compact report generator
  const projectDataForReport = useMemo(() => {
    if (!project || !projectDetail) return null;
    
    // Type guard to ensure project has all required properties
    const typedProject = project as ProjectSummaryDTO;
    
    return {
      id: typedProject.id,
      title: typedProject.title || 'Projet sans titre',
      description: typedProject.description || "Aucune description disponible",
      location: typedProject.location || "Localisation non spécifiée",
      status: typedProject.status || "en cours",
      progress: calculatedProgress || typedProject.progress || undefined,
      budget: typedProject.budget || undefined,
      startDate: typedProject.startDate || undefined,
      endDate: typedProject.endDate || undefined,
      teamSize: typedProject.teamSize || undefined,
      coordinates: typedProject.coordinates || undefined,
      financingSource: projectDetail?.financingSource || undefined,
      marketType: typedProject.marketType || undefined,
      mainContractor: projectDetail?.mainContractor || undefined,
      projectResponsableId: projectDetail?.projectResponsableId || undefined,
      allowsInitialPayment: typedProject.allowsInitialPayment || undefined,
      initialPaymentPercentage: typedProject.initialPaymentPercentage || undefined,
      // Add additional fields from projectDetail
      resources: resources,
      tasks: tasksSource,
      phases: phasesSource, // Ajouter les phases du projet
      inspections: inspectionsSource, // Ajouter les inspections
      expenses: paymentsSource, // Ajouter les dépenses/payments
      risks: risksSource.map((r: any) => ({
        id: r.id || `risk-${Date.now()}`,
        title: r.title || r.description || 'Risque sans titre',
        description: r.description || "Aucune description",
        probability: r.probability || undefined,
        impact: r.impact || undefined,
        mitigationPlan: r.mitigationPlan || undefined,
        status: r.status || "identified",
        relatedTasks: r.relatedTasks || [],
      })),
      contacts: projectDetail?.mainContractor
        ? [
            {
              id: `contractor-${projectDetail.mainContractor.replace(/\s+/g, '-').toLowerCase()}`,
              name: projectDetail.mainContractor,
              role: "contractor",
              email: "",
              isPrimary: true,
            },
          ]
        : undefined,
      stakeholders: projectDetail?.financingSource
        ? [
            {
              id: `stakeholder-${projectDetail.financingSource.replace(/\s+/g, '-').toLowerCase()}`,
              name: projectDetail.financingSource,
              email: "",
              phone: "",
              role: "bailleur",
              organization: projectDetail.financingSource,
              isPrimary: true,
            },
          ]
        : undefined,
      methodology: projectDetail?.methodology || undefined,
    } as any;
  }, [
    project,
    projectDetail,
    calculatedProgress,
    resources,
    tasksSource,
    risksSource,
    phasesSource,
    inspectionsSource,
    paymentsSource,
  ]);

  // Use data from DTO for all tabs
  const payments = paymentsSource;
  const documentsData: any[] = [];
  const bankGuaranteesData: any[] = [];
  const insuranceCertificatesData: any[] = [];

  const handleGeneratePhasesFromReferential = async () => {
    if (!selectedReferential || !projectId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un référentiel",
        variant: "destructive",
      });
      return;
    }

    try {
      const referentialPhases =
        referentialService.getPhasesForReferential(selectedReferential);

      if (referentialPhases.length === 0) {
        toast({
          title: "Aucune phase",
          description: "Ce référentiel ne contient pas de phases configurées",
          variant: "destructive",
        });
        return;
      }

      // Create typed array of phases to save
      const phasesToSave: PhaseToSave[] = [];
      let cumulativeStartDays = 0;

      for (const refPhase of referentialPhases) {
        // Calculate duration
        let phaseDuration = 0;

        for (const step of refPhase.steps || []) {
          let stepDuration = 0;
          for (const task of step.tasks || []) {
            stepDuration += task.estimatedDurationDays || 7;
          }
          if (stepDuration === 0) stepDuration = 14;
          phaseDuration += stepDuration;
        }

        if (phaseDuration === 0) phaseDuration = 30;

        // Calculate dates
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + cumulativeStartDays);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + phaseDuration);

        // Create custom phase data
        const customStages = (refPhase.steps || []).map((step, stepIdx) => ({
          id: `step-${Date.now()}-${stepIdx}`,
          name: step.label,
          order: step.order || stepIdx + 1,
          tasks: (step.tasks || []).map((task, taskIdx) => ({
            id: `task-${Date.now()}-${stepIdx}-${taskIdx}`,
            name: task.label,
            description: task.description || "",
            estimatedDurationDays: task.estimatedDurationDays || 7,
            requiresInspection: task.requiresInspection || false,
            requiresEngineerApproval: task.requiresEngineerApproval || false,
            status: "not_started",
          })),
        }));

        const phaseToSave: PhaseToSave = {
          project_id: projectId,
          phase_name: refPhase.label,
          description: refPhase.description || `Phase ${refPhase.label}`,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          estimated_duration: phaseDuration,
          estimated_cost: Math.floor(
            (project?.budget || 0) / referentialPhases.length
          ),
          status: "not_started",
          progress: 0,
          phase_type: "custom",
          construction_phase:
            refPhase.code || refPhase.label.toLowerCase().replace(/ /g, "_"),
          custom_phase_data: {
            id: `custom-${Date.now()}-${phasesToSave.length}`,
            name: refPhase.label,
            number: refPhase.order || phasesToSave.length + 1,
            customStages: customStages,
            description: refPhase.description || "",
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            budget: Math.floor(
              (project?.budget || 0) / referentialPhases.length
            ),
            status: "not_started",
            progress: 0,
          },
        };

        phasesToSave.push(phaseToSave);
        cumulativeStartDays += phaseDuration;
      }

      // Save all phases using hexagonal hook
      await createPhases(phasesToSave);

      toast({
        title: "Phases générées avec succès",
        description: `${phasesToSave.length} phase(s) ajoutées depuis le référentiel`,
      });
    } catch (error) {
      console.error("Error generating phases:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les phases",
        variant: "destructive",
      });
    }
  };

  // Use hexagonal hook for phases
  const { 
    phases: projectPhases, 
    refetch: refetchPhases, 
    createPhases,
    isLoading: phasesLoading 
  } = useProjectPhasesHex(projectId);

  // Normalized phases for UI
  const computedPhases = useMemo(() => {
    // Use directly fetched phases first, then fallback to plannedPhases
    const phasesSource = projectPhases || projectDetail?.plannedPhases || [];

    const normalize = (p: any) => ({
      id: p.id,
      phase:
        p.phase_name ||
        p.phase ||
        p.name ||
        p.construction_stage ||
        t("project.phase_label"),
      phase_name: p.phase_name || p.phase || p.name,
      status: p.status || "planned",
      progress: p.progress || 0,
      startDate: p.start_date || p.startDate || p.start || "",
      endDate: p.end_date || p.endDate || p.end || "",
      description: p.description,
      budget: p.estimated_cost || p.budget,
      stages: Array.isArray(p.stages)
        ? p.stages
        : p.custom_phase_data?.customStages
        ? p.custom_phase_data.customStages.map((s: any) => ({
            name: s.name,
            status: s.status || "pending",
            order: s.order,
          }))
        : p.construction_stage
        ? [{ name: p.construction_stage, status: p.status || "planned" }]
        : [],
    });

    return (phasesSource || []).map(normalize);
  }, [projectPhases, projectDetail?.plannedPhases, t]);

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
      case "planned":
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      case "planned":
        return <Target className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Calculate phases stats for header - MUST be before any early returns
  const phasesStats = useMemo(() => ({
    total: computedPhases.length || project?.phasesCount || 0,
    completed: computedPhases.filter((p: any) => p.status === "completed").length || 0,
    inProgress: computedPhases.filter((p: any) => p.status === "in_progress").length || 0,
  }), [computedPhases, project?.phasesCount]);

  const handleDelete = async (projectIdToDelete: string) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer cette projet  ? Cette action est irréversible.`
      )
    ) {
      return;
    }

    try {
      if (projectIdToDelete) {
        await projectService.deleteProject(projectIdToDelete);
        navigate("/projects");
      }

      toast({
        title: "Succès",
        description: "Le projet est supprimé avec succès",
      });
    } catch (error) {
      console.error("Error deleting projects:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de projet",
      });
    }
  };

  if (projectLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ElectricSpinner />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-2">
            {projectError?.message || "Impossible de charger le projet"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Vérifiez que l'ID du projet est correct ou que vous avez les
            permissions nécessaires.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Réessayer
            </Button>
            <Button onClick={() => navigate("/projects")}>
              Retour aux projets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* New Hierarchical Header with KPIs */}
      <ProjectHeader
        project={{
          id: project.id,
          title: project.title || "Projet sans titre",
          description: project.description,
          status: project.status || "en cours",
          progress: calculatedProgress,
          budget: project.budget || 0,
          currency: "MRU",
          location: project.location,
          startDate: project.startDate,
          endDate: project.endDate,
          teamSize: project.teamSize || resources.length,
        }}
        phasesStats={phasesStats}
        onEdit={onEdit}
        onDelete={() => handleDelete(project.id)}
      />

      {/* Report Actions */}
      <div className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Rapport compact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Générer un Rapport Compact</DialogTitle>
              <DialogDescription>
                Créez un rapport PDF compact avec les informations essentielles du projet.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto pr-1 max-h-[75vh]">
              {projectDataForReport && (
                <CompactProjectReportGenerator 
                  project={projectDataForReport}
                  useDirectData={true}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
        <ReportManager data={{ project }} reportType="project" />
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="phases">Planification</TabsTrigger>
          <TabsTrigger value="tasks">Exécution</TabsTrigger>
          <TabsTrigger value="financial">Financier</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
          <TabsTrigger value="map">Localisation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Date de début</p>
                  <p className="text-sm text-muted-foreground">
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString()
                      : "Non définie"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date de fin prévue</p>
                  <p className="text-sm text-muted-foreground">
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : "Non définie"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Source de financement</p>
                  <p className="text-sm text-muted-foreground">
                    {project.financingSource || "Non spécifiée"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Type de marché</p>
                  <p className="text-sm text-muted-foreground">
                    {project.marketType || "Non spécifié"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statut du projet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Phase actuelle</span>
                  <Badge
                    variant={
                      currentPhaseInfo.currentPhase ? "default" : "outline"
                    }
                  >
                    {currentPhaseInfo.currentPhase || "Aucune phase définie"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Étape actuelle</span>
                  <Badge
                    variant={
                      currentPhaseInfo.currentStage ? "secondary" : "outline"
                    }
                  >
                    {currentPhaseInfo.currentStage || "N/A"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Méthodologie</span>
                  <Badge variant="outline">{projectMethodology}</Badge>
                </div>
                <Progress value={calculatedProgress} className="mt-4" />
                <p className="text-xs text-center text-muted-foreground">
                  Progression globale calculée: {calculatedProgress}%
                </p>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Basée sur: {computedPhases.length} phases,{" "}
                  {tasksSource.length} tâches, {inspectionsSource.length}{" "}
                  inspections
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Checkpoint & Décompte Dashboard */}
          <ProjectCheckpointsDashboard
            projectId={projectId!}
            compact
            onPhaseClick={(phaseId) => navigate(`/projects/${projectId}/phases/${phaseId}`)}
          />

          {/* Actionable Project Milestones */}
          <ActionableProjectMilestones
            projectId={projectId!}
            maxItems={6}
            showHeader={true}
            onMilestoneClick={(milestoneId, phaseId) => {
              if (phaseId) {
                navigate(`/projects/${projectId}/phases/${phaseId}`);
              } else {
                setActiveTab('milestones');
              }
            }}
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Matériaux</p>
                    <p className="text-lg font-bold">
                      {computedPhases.reduce((total: number, phase: any) => {
                        const milestones = (phase as any).milestones || {};
                        const extra = Array.isArray((phase as any).materials)
                          ? (phase as any).materials.length
                          : 0;
                        return (
                          total + (milestones.materials?.length || 0) + extra
                        );
                      }, 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Jalons</p>
                    <p className="text-lg font-bold">
                      {milestoneProgress?.total_milestones || 0}
                    </p>
                    {milestoneProgress && milestoneProgress.total_milestones > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {milestoneProgress.completed_milestones}/{milestoneProgress.total_milestones} terminés
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">Documents</p>
                    <p className="text-lg font-bold">{documentsData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <FinancialOverview
            budget={project.budget || 0}
            spent={0}
            phases={phasesSource || []}
            financialMetrics={{}}
          />
        </TabsContent>

        <TabsContent value="phases" className="mt-6">
          <div className="space-y-4">
            {/* Phase generation controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Génération des phases</span>
                  <Button
                    onClick={() => setShowPhaseManager(true)}
                    variant="outline"
                  >
                    Gestion avancée des phases
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Référentiel</Label>
                    <Select
                      value={selectedReferential || ""}
                      onValueChange={(value) =>
                        setSelectedReferential(value as ReferentialType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un référentiel" />
                      </SelectTrigger>
                      <SelectContent>
                        {referentialService
                          .getReferentialOptions()
                          .map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-8">
                    <Button
                      onClick={handleGeneratePhasesFromReferential}
                      disabled={!selectedReferential}
                    >
                      Générer les phases
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    • Sélectionnez un référentiel pour générer automatiquement
                    les phases du projet
                  </p>
                  <p>
                    • Les phases incluront les étapes et tâches définies dans le
                    référentiel
                  </p>
                  <p>
                    • Vous pouvez également utiliser la gestion avancée des
                    phases pour un contrôle manuel
                  </p>
                </div>
              </CardContent>
            </Card>
            {/* Display existing phases */}
            <PhaseList
              phases={computedPhases}
              projectId={projectId!}
              onPhaseUpdate={() => {
                refetchPhases();
                queryClient.invalidateQueries({
                  queryKey: ["project-detail", projectId],
                });
              }}
            />{" "}
          </div>

          {/* Enhanced Phase Manager Dialog */}
          <DialogUI open={showPhaseManager} onOpenChange={setShowPhaseManager}>
            <DialogContentUI className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeaderUI>
                <DialogTitleUI>Gestion avancée des phases</DialogTitleUI>
              </DialogHeaderUI>
              <ConstructionPhaseManager
                phases={phases}
                onChange={setPhases}
                projectBudget={project?.budget || 0}
                projectId={projectId}
              />
            </DialogContentUI>
          </DialogUI>
        </TabsContent>

        {/* New Planning Tab with Gantt, PERT, Kanban, Critical Path */}
        <TabsContent value="planning" className="mt-6">
          <Tabs defaultValue="gantt" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="gantt">Gantt</TabsTrigger>
              <TabsTrigger value="pert">PERT</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="critical">Chemin Critique</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="gantt">
              <GanttChart projectId={projectId!} />
            </TabsContent>

            <TabsContent value="pert">
              <PERTDiagram projectId={projectId!} />
            </TabsContent>

            <TabsContent value="kanban">
              <KanbanBoard projectId={projectId!} />
            </TabsContent>

            <TabsContent value="critical">
              <CriticalPathView projectId={projectId!} />
            </TabsContent>

            <TabsContent value="timeline">
              <ProjectTimeline projectId={projectId!} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Unified Milestones Tab with Gantt & PERT */}
        <TabsContent value="milestones" className="mt-6">
          <Tabs defaultValue="timeline" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timeline">Timeline & Liste</TabsTrigger>
              <TabsTrigger value="gantt">Diagramme Gantt</TabsTrigger>
              <TabsTrigger value="pert">Analyse PERT</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <UnifiedMilestoneManager 
                projectId={projectId!}
                defaultView="timeline"
                onMilestoneClick={(milestoneId, phaseId) => {
                  if (phaseId) {
                    navigate(`/projects/${projectId}/phases/${phaseId}`);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="gantt">
              {projectDetail ? (
                <UnifiedGanttChart
                  projectId={projectId!}
                  projectDetail={projectDetail}
                  onMilestoneClick={(milestoneId, phaseId) => {
                    if (phaseId) {
                      navigate(`/projects/${projectId}/phases/${phaseId}`);
                    }
                  }}
                />
              ) : (
                <ProjectGantt
                  project={project as any}
                  phases={(computedPhases || []).map((p: any) => ({
                    id: p.id,
                    name: p.phase,
                    startDate: new Date(p.startDate || new Date()),
                    endDate: new Date(p.endDate || new Date()),
                    progress: p.progress || 0,
                    status: (p.status || "planned") as any,
                  }))}
                />
              )}
            </TabsContent>

            <TabsContent value="pert">
              {projectDetail ? (
                <UnifiedPERTAnalysis
                  projectId={projectId!}
                  projectDetail={projectDetail}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Analyse PERT</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pertAnalysis ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Durée attendue totale
                            </p>
                            <p className="text-2xl font-bold">
                              {pertAnalysis.totalExpectedDuration.toFixed(1)} jours
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Écart-type total
                            </p>
                            <p className="text-2xl font-bold">
                              {pertAnalysis.variances
                                ? Math.sqrt(
                                    Object.values(pertAnalysis.variances).reduce(
                                      (sum: number, variance: number) =>
                                        sum + variance,
                                      0
                                    )
                                  ).toFixed(1)
                                : "0.0"}{" "}
                              jours
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Tâches sur chemin critique
                            </p>
                            <p className="text-2xl font-bold">
                              {pertAnalysis.criticalPath?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Chargement de l'analyse PERT...
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <EnhancedTaskManager
            projectId={projectId!}
            tasks={tasks}
            setTasks={setTasks}
            phases={computedPhases}
          />
        </TabsContent>

        <TabsContent value="risks" className="mt-6">
          <EnhancedRiskManager
            projectId={projectId!}
            risks={risks}
            setRisks={setRisks}
            phases={computedPhases}
          />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <TeamOverview
            resources={resources}
            setResources={setResources}
            projectId={projectId!}
            phases={computedPhases}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Échéancier de paiements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.allowsInitialPayment && (
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h4 className="font-medium">Avance initiale autorisée</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.initialPaymentPercentage}% du montant total
                    </p>
                    <p className="font-semibold text-green-700">
                      {(
                        ((project.budget || 0) *
                          (project.initialPaymentPercentage || 0)) /
                        100
                      ).toLocaleString()}{" "}
                      MRU
                    </p>
                  </div>
                )}
                {payments.length > 0 ? (
                  <div className="grid gap-4">
                    {payments.map((payment: any) => (
                      <div key={payment.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {payment.description || "Paiement"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Date:{" "}
                              {new Date(
                                payment.payment_date
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Progression: {payment.progress_at_payment}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {(payment.amount || 0).toLocaleString()} MRU
                            </p>
                            <Badge
                              variant={
                                payment.status === "approved"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                payment.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : ""
                              }
                            >
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Aucun paiement enregistré
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis" className="mt-6">
          {kpiMetrics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Progress KPIs */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Progression
                        </p>
                        <p className="text-2xl font-bold">
                          {kpiMetrics.progress_percentage}% ({kpiMetrics.milestone_completion}% jalons)
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.completedTasks} tâches terminées /{" "}
                      {kpiMetrics.delayedTasks} en retard
                    </p>
                  </CardContent>
                </Card>

                {/* Budget KPIs */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Utilisation Budget
                        </p>
                        <p className="text-2xl font-bold">
                          {((kpiMetrics.actual_cost / kpiMetrics.total_budget) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Reste: {kpiMetrics.remainingBudget.toLocaleString()} MRU
                    </p>
                  </CardContent>
                </Card>

                {/* EVM - CPI */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          CPI (Coût)
                        </p>
                        <p className="text-2xl font-bold">
                          {kpiMetrics.cost_efficiency.toFixed(2)}
                        </p>
                      </div>
                      <TrendingUp
                        className={`h-8 w-8 ${
                          kpiMetrics.cost_efficiency >= 1
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.cost_efficiency >= 1
                        ? "En dessous du budget"
                        : "Au-dessus du budget"}
                    </p>
                  </CardContent>
                </Card>

                {/* EVM - SPI */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          SPI (Planning)
                        </p>
                        <p className="text-2xl font-bold">
                          {kpiMetrics.schedule_performance.toFixed(2)}
                        </p>
                      </div>
                      <Calendar
                        className={`h-8 w-8 ${
                          kpiMetrics.schedule_performance >= 1
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.schedule_performance >= 1 ? "En avance" : "En retard"}
                    </p>
                  </CardContent>
                </Card>

                {/* Quality */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Qualité
                        </p>
                        <p className="text-2xl font-bold">
                          {kpiMetrics.quality_score.toFixed(0)}%
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.risk_score} incidents critiques
                    </p>
                  </CardContent>
                </Card>

                {/* Risks */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Risques
                        </p>
                        <p className="text-2xl font-bold">
                          {kpiMetrics.risk_score}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.round(kpiMetrics.risk_score * 0.3)} risques élevés
                    </p>
                  </CardContent>
                </Card>

                {/* Health Score */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Santé Globale
                        </p>
                        <p className="text-2xl font-bold">
                          {Math.round((kpiMetrics.quality_score + kpiMetrics.schedule_performance + kpiMetrics.cost_efficiency) / 3)}
                        </p>
                      </div>
                      <Target
                        className={`h-8 w-8 ${
                          Math.round((kpiMetrics.quality_score + kpiMetrics.schedule_performance + kpiMetrics.cost_efficiency) / 3) >= 80
                            ? "text-green-600"
                            : Math.round((kpiMetrics.quality_score + kpiMetrics.schedule_performance + kpiMetrics.cost_efficiency) / 3) >= 60
                            ? "text-orange-600"
                            : "text-red-600"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Score sur 100
                    </p>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Délai
                        </p>
                        <p className="text-2xl font-bold">
                          {Math.round(kpiMetrics.schedule_performance * 3)}j
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.round((100 - kpiMetrics.schedule_performance) * 2)}j écoulés
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed KPI Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Valeur acquise</span>
                        <span className="font-semibold">
                          {kpiMetrics.actual_cost.toLocaleString()} MRU
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Variance coût</span>
                        <span
                          className={`font-semibold ${
                            kpiMetrics.budget_variance >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {kpiMetrics.budget_variance.toLocaleString()} MRU
                        </span>
                      </div>
                      <Progress
                        value={(kpiMetrics.actual_cost / kpiMetrics.total_budget) * 100}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Planning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Variance planning</span>
                        <span
                          className={`font-semibold ${
                            kpiMetrics.timeline_variance >= 0
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          {Math.abs(kpiMetrics.timeline_variance).toFixed(1)} jours
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Tâches en retard</span>
                        <span className="font-semibold text-red-600">
                          {Math.round(kpiMetrics.risk_score * 0.2)}
                        </span>
                      </div>
                      <Progress
                        value={kpiMetrics.progress_percentage}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Chargement des KPIs...</p>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <div className="space-y-6">
            {/* Bank Guarantees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Garanties bancaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bankGuaranteesData.length > 0 ? (
                  <div className="space-y-4">
                    {bankGuaranteesData.map((guarantee: any) => (
                      <div key={guarantee.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {guarantee.guarantee_type}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Banque: {guarantee.bank_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Montant:{" "}
                              {guarantee.guarantee_amount?.toLocaleString()} MRU
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Émission:{" "}
                              {new Date(
                                guarantee.issue_date
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Échéance:{" "}
                              {new Date(
                                guarantee.expiry_date
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            className={
                              guarantee.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {guarantee.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Aucune garantie bancaire enregistrée
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Insurance Certificates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Assurances
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insuranceCertificatesData.length > 0 ? (
                  <div className="space-y-4">
                    {insuranceCertificatesData.map((cert: any) => (
                      <div key={cert.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {cert.coverage_type}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Assureur: {cert.insurance_company}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Police: {cert.policy_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Couverture:{" "}
                              {cert.coverage_amount?.toLocaleString()} MRU
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Validité:{" "}
                              {new Date(cert.valid_from).toLocaleDateString()} -{" "}
                              {new Date(cert.valid_until).toLocaleDateString()}
                            </p>
                            {cert.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Notes: {cert.notes}
                              </p>
                            )}
                          </div>
                          <Badge
                            className={
                              cert.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {cert.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Aucune assurance enregistrée
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Compliance Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Documents de conformité
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documentsData.filter((doc: any) =>
                  ["contract", "project_report", "tender"].includes(
                    doc.document_type
                  )
                ).length > 0 ? (
                  <div className="space-y-4">
                    {documentsData
                      .filter((doc: any) =>
                        ["contract", "project_report", "tender"].includes(
                          doc.document_type
                        )
                      )
                      .map((doc: any) => (
                        <div key={doc.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{doc.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Type: {doc.document_type}
                              </p>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground">
                                  {doc.description}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Créé le:{" "}
                                {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              className={
                                doc.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : doc.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {doc.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun document de conformité
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Résumé de conformité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {bankGuaranteesData.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Garanties bancaires
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {insuranceCertificatesData.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Assurances</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {
                        documentsData.filter((d: any) =>
                          ["contract", "project_report", "tender"].includes(
                            d.document_type
                          )
                        ).length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Documents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <InteractiveMapGIS
            title="Localisation du projet"
            description="Carte interactive avec outils GIS"
            allowPolygon={true}
            value={{
              coordinates: project.coordinates?.latitude && project.coordinates?.longitude
                ? {
                    lat: project.coordinates.latitude,
                    lng: project.coordinates.longitude,
                  }
                : undefined,
              polygon: Array.isArray((project as any).localisation)
                ? (project as any).localisation
                : [],
              warehouseShape: Array.isArray((project as any).localisation)
                ? (project as any).localisation
                : [],
              address:
                typeof (project as any).adresse === "string"
                  ? (project as any).adresse
                  : (project as any).adresse?.address || project.location || "",
              shapeType: (project as any).forme,
            }}
            onChange={(data) => {
              console.log("Map data changed:", data);
              // Handle map data updates
            }}
          />
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default ProjectDetailByDTO;
