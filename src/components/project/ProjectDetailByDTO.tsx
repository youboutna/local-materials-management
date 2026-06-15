import InteractiveMapGIS from "@/components/materials/InteractiveMapGIS";
import EnhancedRiskManager from "@/components/project/EnhancedRiskManager";
import EnhancedTaskManager from "@/components/project/EnhancedTaskManager";
import FinancialOverview from "@/components/project/FinaancialOverview";
import PhaseList from "@/components/project/PhaseList";
import { InspectionsList } from "@/components/project/InspectionsList";
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
import { ProgressCalculationHexService } from '@/application/services/ProgressCalculationHexService';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { ProjectDetailDTO, ProjectSummaryDTO } from "@/dtos/entities/ProjectDTO";
import { InspectionDTO } from "@/dtos/entities/InspectionDTO";
import { useProjectCompliance } from '@/hooks/hexagonal';
import { PhaseDTO } from "@/dtos/entities/PhaseDTO";
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
import { getProjectTabs } from "@/config/referentials/projects/project-views.referential";
import { referentialService } from '@/application/services/ReferentialService';
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
import MonitoringEvaluationPanel from "@/components/project/monitoring/MonitoringEvaluationPanel";
import { PaymentDialog } from "@/components/project/PaymentDialog";

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
  custom_phase_data: Record<string, unknown>;
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
  const [phases, setPhases] = useState<PhaseDTO[]>([]);
  const [referentialOptions, setReferentialOptions] = useState<{ value: string; label: string; description?: string }[]>([]);
  

  // Load referential options
  useEffect(() => {
    const loadReferentialOptions = async () => {
      try {
        const options = await referentialService.getReferentialOptions();
        setReferentialOptions(options);
      } catch (error) {
        console.error('Failed to load referential options:', error);
        setReferentialOptions([]);
      }
    };
    
    loadReferentialOptions();
  }, []);

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
      if (!projectId) {
        throw new Error(t("project.errors.missing_id"));
      }
      const result = await projectService.getProjectSummary(projectId);
      if (!result) {
        throw new Error(t("project.errors.not_found"));
      }
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

  const projectTabsDef = useMemo(
    () => getProjectTabs((projectDetail as any)?.entityCode),
    [projectDetail]
  );

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

       // Type the responses safely
       const typedMetrics = (metrics || {}) as { totalMilestones?: number; completedMilestones?: number; overdueTasks?: number };
       const typedAnalytics = (analytics || {}) as unknown as Record<string, number>;
       const typedCostAnalysis = (costAnalysis || {}) as unknown as Record<string, number>;
       
       // Combine all data into the expected format (camelCase only)
       return {
         // Core progress metrics
         completedTasks: typedMetrics.completedMilestones || 0,
         delayedTasks: typedMetrics.overdueTasks || 0,
         totalTasks: typedMetrics.totalMilestones || 0,
         pendingTasks: 0,
         totalMilestones: typedMetrics.totalMilestones || 0,
         completedMilestones: typedMetrics.completedMilestones || 0,
         totalRisks: 0,
         highRisks: 0,
         mediumRisks: 0,
         lowRisks: 0,
         totalIssues: 0,
         openIssues: 0,
         resolvedIssues: 0,
         criticalIssues: 0,
         // Cost analysis (camelCase)
         budgetUtilization: (typedCostAnalysis.actualCost || typedCostAnalysis.actual_cost || 0) / (typedCostAnalysis.totalBudget || typedCostAnalysis.total_budget || 1) * 100,
         remainingBudget: typedCostAnalysis.remainingBudget || typedCostAnalysis.remaining_budget || 0,
         actualCost: typedCostAnalysis.actualCost || typedCostAnalysis.actual_cost || 0,
         totalBudget: typedCostAnalysis.totalBudget || typedCostAnalysis.total_budget || 0,
         cpi: typedCostAnalysis.costPerformanceIndex || typedCostAnalysis.cost_performance_index || 0,
         earnedValue: typedCostAnalysis.actualCost || typedCostAnalysis.actual_cost || 0,
         costVariance: typedCostAnalysis.costVariance || typedCostAnalysis.cost_variance || 0,
         // Performance metrics (camelCase with dual-casing fallback)
         progressPercentage: typedAnalytics.progressPercentage || typedAnalytics.progress_percentage || 0,
         milestoneCompletion: typedAnalytics.milestoneCompletion || typedAnalytics.milestone_completion || 0,
         schedulePerformance: typedAnalytics.schedulePerformance || typedAnalytics.schedule_performance || 0,
         costEfficiency: typedAnalytics.costEfficiency || typedAnalytics.cost_efficiency || 0,
         qualityScore: typedAnalytics.qualityScore || typedAnalytics.quality_score || 0,
         riskScore: typedAnalytics.riskScore || typedAnalytics.risk_score || 0,
         spi: (typedAnalytics.schedulePerformance || typedAnalytics.schedule_performance || 0) / 100,
         inspectionPassRate: typedAnalytics.qualityScore || typedAnalytics.quality_score || 0,
         healthScore: Math.round(
           ((typedAnalytics.progressPercentage || typedAnalytics.progress_percentage || 0) + 
            (typedAnalytics.qualityScore || typedAnalytics.quality_score || 0) + 
            (typedAnalytics.schedulePerformance || typedAnalytics.schedule_performance || 0)) / 3
         ),
         remainingDays: Math.max(0, 30),
         elapsedDays: 45,
         overallProgress: typedAnalytics.progressPercentage || typedAnalytics.progress_percentage || 0,
         scheduleVariance: typedAnalytics.timelineVariance || typedAnalytics.timeline_variance || 0
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
        "@/application/services/ProjectCalculationService"
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
        "@/application/services/ProjectCalculationService"
      );
      return ProjectCalculationService.generateGanttChart(projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000,
  });

  // Milestone count for dashboard - use instance method
  const milestoneServiceInstance = useMemo(() => new MilestoneService(), []);
  const progressServiceInstance = useMemo(() => new ProgressCalculationHexService(), []);
  const { data: milestoneProgress } = useQuery({
    queryKey: ["milestone-progress", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return await milestoneServiceInstance.getMilestoneProgress(projectId);
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  // Use data from ProjectDetailDTO (hydrated camelCase from service)
  const phasesSource = useMemo(() => projectDetail?.plannedPhases || [], [projectDetail]);
  const tasksSource = useMemo(() => projectDetail?.tasks || [], [projectDetail]);
  const risksSource = useMemo(() => projectDetail?.risks || [], [projectDetail]);
  const inspectionsSource = useMemo<InspectionDTO[]>(
    () => ((projectDetail as any)?.inspections || []),
    [projectDetail]
  );
  const paymentsSource = useMemo(() => projectDetail?.expenses || [], [projectDetail]);

  // Calculate current phase and stage dynamically from phases
  // Uses normalized PhaseDTO fields (phase_name) and falls back across aliases.
  const currentPhaseInfo = useMemo(() => {
    const source = (phasesSource || []) as any[];
    if (source.length === 0) {
      return { currentPhase: null, currentStage: null };
    }

    const getName = (p: any) =>
      p?.phase_name || p?.name || p?.phase || p?.type || p?.constructionStage || null;

    const getStage = (p: any): string | null => {
      const stages = Array.isArray(p?.stages) ? p.stages : [];
      const active = stages.find((s: any) => s?.status && s.status !== "completed");
      return active?.name || stages[0]?.name || p?.constructionStage || null;
    };

    const inProgress = source.find((p) => p?.status === "in_progress");
    if (inProgress) {
      return { currentPhase: getName(inProgress), currentStage: getStage(inProgress) };
    }

    const pending = source.find((p) => p?.status === "pending" || p?.status === "planned" || p?.status === "not_started");
    if (pending) {
      return { currentPhase: getName(pending), currentStage: getStage(pending) };
    }

    const last = source[source.length - 1];
    return { currentPhase: getName(last), currentStage: getStage(last) };
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
  }, [projectDetail?.methodology]);

  // Compute derived data from DTO
  const [resources, setResources] = useState<Array<{id: string, name: string, type: string, cost?: number}>>([]);
  const [tasks, setTasks] = useState<Array<{id: string, name: string, status: string, progress?: number}>>([]);
  const [risks, setRisks] = useState<Array<{id: string, title: string, description: string, probability: number, impact: number}>>([]);

  useEffect(() => {
    const computeResources = () => {
      if (!projectDetail) return;
      
      // Hydrate les ressources réelles depuis le DTO projet (plus de mock).
      const realResources = Array.isArray(projectDetail.resources) ? projectDetail.resources : [];
      
      // Transform real resources to the expected format
      const allResources = realResources.map((resource: any) => ({
        id: resource.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `resource-${Date.now()}`),
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
      const contactsArray = Array.isArray((projectDetail as any).contacts) ? (projectDetail as any).contacts : [];
      if (projectDetail.projectManagerId && !allResources.find((r) => r.id.includes('manager'))) {
        const managerContact = contactsArray.find((c: any) => 
          c.role === 'project_manager' || c.role === 'chef de projet'
        );
        
        allResources.push({
          id: `manager-${projectDetail.projectManagerId}`,
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
      if (projectDetail.mainContractor && !allResources.find((r) => r.id.includes('contractor'))) {
        const contractorContact = contactsArray.find((c: any) => 
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
      // Transform tasks to expected format
      const transformedTasks = tasksSource.map((t: any) => ({
        id: t.id,
        name: t.title || t.name || 'Task',
        status: t.status || 'pending',
        progress: t.progress
      }));
      setTasks(transformedTasks);
      // Transform risks to expected format
      const transformedRisks = risksSource.map((r: any) => ({
        id: r.id,
        title: r.title || r.name || 'Risk',
        description: r.description || '',
        probability: typeof r.probability === 'number' ? r.probability : 0,
        impact: typeof r.impact === 'number' ? r.impact : 0
      }));
      setRisks(transformedRisks);
    }
  }, [projectDetail, risksSource, tasksSource, t]);

  // Calculate realistic progress from hydrated collections (phases + tasks + inspections)
  // via ProgressCalculationHexService — pure-TS service piloté par référentiel de poids.
  const calculatedProgress = useMemo<number>(() => {
    const phases = (phasesSource || []) as any[];
    const tasks = (tasksSource || []) as any[];
    const inspections = (inspectionsSource || []) as any[];

    // Aucune collection hydratée → on retombe sur la valeur persistée.
    if (phases.length === 0 && tasks.length === 0 && inspections.length === 0) {
      return projectDetail?.progress ?? 0;
    }

    const normalizeStatus = (s: any) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '_');
    const mapPhase = (p: any) => ({
      id: p.id,
      name: p.phase_name || p.name || '',
      phase_name: p.phase_name || p.name || '',
      status: ['completed', 'in_progress', 'cancelled'].includes(normalizeStatus(p.status))
        ? (normalizeStatus(p.status) as any)
        : 'pending',
      progress: Number(p.progress ?? 0),
    });
    const mapTask = (t: any) => ({
      id: t.id,
      title: t.title || t.task_name || '',
      status: ['completed', 'in_progress', 'cancelled'].includes(normalizeStatus(t.status))
        ? (normalizeStatus(t.status) as any)
        : 'pending',
      progress: Number(t.progress ?? 0),
      phase_id: t.phase_id || '',
      priority: (t.priority || 'medium') as any,
    });
    const mapInspection = (i: any) => ({
      id: i.id,
      title: i.title || i.inspection_type || '',
      status: ['completed', 'in_progress', 'cancelled'].includes(normalizeStatus(i.status))
        ? (normalizeStatus(i.status) as any)
        : 'scheduled',
      progress: Number(i.progress ?? (normalizeStatus(i.status) === 'completed' ? 100 : 0)),
      phase_id: i.phase_id || '',
      type: (i.type || 'regular') as any,
      priority: (i.priority || 'medium') as any,
    });

    return progressServiceInstance.calculateProjectProgress(
      phases.map(mapPhase) as any,
      tasks.map(mapTask) as any,
      inspections.map(mapInspection) as any,
    );
  }, [phasesSource, tasksSource, inspectionsSource, projectDetail?.progress]);

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
              id: `contractor-${String(projectDetail.mainContractor).replace(/\s+/g, '-').toLowerCase()}`,
              name: String(projectDetail.mainContractor),
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
    };
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
  const documentsData = useMemo(() => {
    return ((projectDetail as any)?.documents || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title || doc.file_name || 'Document',
      type: doc.document_type || doc.type || 'other',
      document_type: doc.document_type || doc.type || 'other',
      description: doc.description,
      created_at: doc.created_at || doc.createdAt || new Date().toISOString(),
      status: doc.status || 'pending',
    }));
  }, [projectDetail]);

  const bankGuaranteesData = useMemo(() => {
    return ((projectDetail as any)?.bankGuarantees || []).map((bg: any) => ({
      id: bg.id,
      guarantee_type: bg.guarantee_type || 'Garantie de bonne exécution',
      bank_name: bg.bank_name || 'Non spécifié',
      guarantee_amount: bg.guarantee_amount || 0,
      issue_date: bg.issue_date || bg.created_at,
      expiry_date: bg.expiry_date || '',
      status: bg.status || 'active',
    }));
  }, [projectDetail]);

  const insuranceCertificatesData = useMemo(() => {
    return ((projectDetail as any)?.insuranceCertificates || []).map((ic: any) => ({
      id: ic.id,
      coverage_type: ic.coverage_type || 'Responsabilité civile',
      insurance_company: ic.insurance_company || 'Non spécifié',
      policy_number: ic.policy_number || '',
      coverage_amount: ic.coverage_amount || 0,
      valid_from: ic.valid_from || ic.created_at,
      valid_until: ic.valid_until || '',
      notes: ic.notes,
      status: ic.status || 'active',
    }));
  }, [projectDetail]);

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
        await referentialService.getPhasesForReferential(selectedReferential);

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
          (project?.budget || 0) / (referentialPhases.length || 1)
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
              (project?.budget || 0) / (referentialPhases.length || 1)
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

    const normalize = (p: any) => {
      return {
        id: p.id,
        phase:
          p.phase_name ||
          p.phase ||
          p.name ||
          p.constructionStage ||
          t("project.phase_label"),
        phase_name: p.phase_name || p.phase || p.name,
        status: p.status || "planned",
        progress: p.progress || 0,
        startDate: p.startDate || "",
        endDate: p.endDate || "",
        description: p.description,
        budget: p.estimatedCost || p.estimated_cost || p.budget,
        stages: Array.isArray(p.stages)
          ? p.stages
          : (p.customPhaseData || p.custom_phase_data)?.customStages
          ? ((p.customPhaseData || p.custom_phase_data).customStages as Array<{ name: string; status?: string; order?: number }>).map((s) => ({
              name: s.name,
              status: s.status || "pending",
              order: s.order,
            }))
          : (p.constructionStage || p.construction_stage)
          ? [{ name: p.constructionStage || p.construction_stage, status: p.status || "planned" }]
          : [],
      };
    };

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
  // Any non-terminal/non-pending phase status is considered "in progress" to
  // reflect dynamic workflow (inspection, validation, payment_request, etc.).
  const TERMINAL_PHASE_STATUSES = new Set(["completed", "closed", "cancelled", "archived"]);
  const PENDING_PHASE_STATUSES = new Set(["not_started", "pending", "draft", "planned"]);
  const phasesStats = useMemo(() => {
    const total = computedPhases.length || project?.phasesCount || 0;
    const projectDone =
      (project?.status || "").toLowerCase() === "completed" ||
      (project?.status || "").toLowerCase() === "terminé" ||
      (project?.progress || 0) >= 100;
    let completed = computedPhases.filter((p) => p.status === "completed").length || 0;
    if (projectDone && total > 0) completed = total;
    const inProgress = computedPhases.filter(
      (p) => !TERMINAL_PHASE_STATUSES.has(p.status) && !PENDING_PHASE_STATUSES.has(p.status),
    ).length || 0;
    return { total, completed, inProgress };
  }, [computedPhases, project?.phasesCount, project?.status, project?.progress]);


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
          <p className="text-sm text-muted-foreground mb-2">
            ID du projet: {projectId || "Non défini"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Vérifiez que l'ID du projet est correct ou que vous avez les
            permissions nécessaires.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["project-summary", projectId] });
                queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
              }}
              variant="outline"
            >
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
    <div className="container mx-auto py-4 space-y-4">

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
                  project={projectDataForReport as any}
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
        <TabsList className="sticky top-0 z-20 grid w-full grid-cols-3 md:grid-cols-7 h-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
          {projectTabsDef.map((tab) => (
            <TabsTrigger key={tab.uiValue} value={tab.uiValue} className="text-xs sm:text-sm">
              {tab.label.fr}
            </TabsTrigger>
          ))}
        </TabsList>



        <TabsContent value="overview" className="space-y-4">
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
                      {computedPhases.reduce((total: number, phase) => {
                        // Phase doesn't have milestones or materials properties, using 0 for now
                        const milestoneCount = 0; // Would need additional data structure
                        const materialCount = 0; // Would need additional data structure
                        return total + milestoneCount + materialCount;
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
                      {typeof milestoneProgress === 'number' ? milestoneProgress : 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Progression: {typeof milestoneProgress === 'number' ? milestoneProgress : 0}%
                    </p>
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
            spent={paymentsSource.reduce((sum, p) => sum + (p.amount || 0), 0)}
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
                        {referentialOptions.map((option) => (
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
                workflowData={null}
                onStepComplete={(stepData) => setPhases(stepData.phases)}
                projectBudget={project?.budget || 0}
                projectId={projectId}
              />
            </DialogContentUI>
          </DialogUI>
        </TabsContent>

        {/* New Planning Tab with Gantt, PERT, Kanban, Critical Path */}
        <TabsContent value="planning" className="mt-6">
          <Tabs defaultValue="gantt" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
              <TabsTrigger value="gantt" className="text-xs sm:text-sm">Gantt</TabsTrigger>
              <TabsTrigger value="pert" className="text-xs sm:text-sm">PERT</TabsTrigger>
              <TabsTrigger value="kanban" className="text-xs sm:text-sm">Kanban</TabsTrigger>
              <TabsTrigger value="critical" className="text-xs sm:text-sm">Chemin Critique</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs sm:text-sm">Timeline</TabsTrigger>
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
                  phases={(computedPhases || []).map((p) => ({
                    id: p.id,
                    name: p.phase,
                    startDate: new Date(p.startDate || new Date()),
                    endDate: new Date(p.endDate || new Date()),
                    progress: p.progress || 0,
                    status: p.status || "planned",
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
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Durée attendue totale
                            </p>
                            <p className="text-xl font-semibold">
                              {pertAnalysis.totalExpectedDuration.toFixed(1)} jours
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Écart-type total
                            </p>
                            <p className="text-xl font-semibold">
                              {pertAnalysis.variances
                                ? Math.sqrt(
                                    (Object.values(pertAnalysis.variances) as number[]).reduce(
                                      (sum: number, variance: number) =>
                                        sum + (variance || 0),
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
                            <p className="text-xl font-semibold">
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
          {(() => {
            // Default execution sub-tab driven by project status
            const status = String((project as any)?.status || '').toLowerCase();
            const defaultExecTab =
              status.includes('inspection') ? 'inspections'
              : status.includes('payment') ? 'payments-exec'
              : 'tasks-exec';
            return (
              <Tabs defaultValue={defaultExecTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="tasks-exec">Tâches</TabsTrigger>
                  <TabsTrigger value="inspections">Inspections</TabsTrigger>
                  <TabsTrigger value="payments-exec">Paiements</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks-exec">
                  <EnhancedTaskManager
                    projectId={projectId!}
                    tasks={tasks}
                    setTasks={setTasks}
                    phases={computedPhases}
                  />
                </TabsContent>

                <TabsContent value="inspections">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Inspections du projet
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InspectionsList projectId={projectId!} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="payments-exec">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Paiements en cours
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {payments.filter(p => p.status !== 'paid' && p.status !== 'cancelled').length === 0 ? (
                        <p className="text-muted-foreground">Aucun paiement en cours pour ce projet.</p>
                      ) : (
                        <div className="grid gap-3">
                          {payments
                            .filter(p => p.status !== 'paid' && p.status !== 'cancelled')
                            .map((p) => (
                              <a
                                key={p.id}
                                href={`/payments/${p.id}`}
                                className="p-3 border rounded-lg hover:bg-accent flex justify-between"
                              >
                                <div>
                                  <p className="font-medium">{(p as any).description || 'Paiement'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(p.paymentDate).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{(p.amount || 0).toLocaleString()} MRU</p>
                                  <Badge variant="secondary">{p.status}</Badge>
                                </div>
                              </a>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            );
          })()}
        </TabsContent>


        <TabsContent value="risks" className="mt-6">
          <EnhancedRiskManager
            projectId={projectId!}
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
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Échéancier de paiements
                </span>
                <PaymentDialog
                  project={{
                    ...(project as any),
                    payments: (payments || []).map((p: any) => ({
                      id: p.id,
                      amount: Number(p.amount ?? 0),
                      paymentDate: p.paymentDate ?? p.payment_date ?? '',
                      progressAtPayment: p.progressAtPayment ?? p.progress_at_payment ?? 0,
                      status: p.status ?? 'pending',
                      description: p.description ?? '',
                    })),
                  } as any}
                  onPaymentComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
                    queryClient.invalidateQueries({ queryKey: ["project-summary", projectId] });
                  }}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(project as ProjectSummaryDTO).allowsInitialPayment && (
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h4 className="font-medium">Avance initiale autorisée</h4>
                    <p className="text-sm text-muted-foreground">
                      {(project as ProjectSummaryDTO).initialPaymentPercentage}% du montant total
                    </p>
                    <p className="font-semibold text-green-700">
                      {(
                        (((project as ProjectSummaryDTO).budget || 0) *
                          ((project as ProjectSummaryDTO).initialPaymentPercentage || 0)) /
                        100
                      ).toLocaleString()}{" "}
                      MRU
                    </p>
                  </div>
                )}
                {payments.length > 0 ? (
                  <div className="grid gap-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {(payment as any).description || "Paiement"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Date:{" "}
                              {new Date(
                                payment.paymentDate
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Progression: {payment.progressAtPayment}%
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Progress KPIs */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Progression
                        </p>
                        <p className="text-xl font-semibold">
                          {kpiMetrics.progressPercentage}% ({kpiMetrics.milestoneCompletion}% jalons)
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
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Utilisation Budget
                        </p>
                        <p className="text-xl font-semibold">
                          {((kpiMetrics.actualCost / (kpiMetrics.totalBudget || 1)) * 100).toFixed(1)}%
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
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          CPI (Coût)
                        </p>
                        <p className="text-xl font-semibold">
                          {kpiMetrics.costEfficiency.toFixed(2)}
                        </p>
                      </div>
                      <TrendingUp
                        className={`h-8 w-8 ${
                          kpiMetrics.costEfficiency >= 1
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.costEfficiency >= 1
                        ? "En dessous du budget"
                        : "Au-dessus du budget"}
                    </p>
                  </CardContent>
                </Card>

                {/* EVM - SPI */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          SPI (Planning)
                        </p>
                        <p className="text-xl font-semibold">
                          {kpiMetrics.schedulePerformance.toFixed(2)}
                        </p>
                      </div>
                      <Calendar
                        className={`h-8 w-8 ${
                          kpiMetrics.schedulePerformance >= 1
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.schedulePerformance >= 1 ? "En avance" : "En retard"}
                    </p>
                  </CardContent>
                </Card>

                {/* Quality */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Qualité
                        </p>
                        <p className="text-xl font-semibold">
                          {kpiMetrics.qualityScore.toFixed(0)}%
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiMetrics.riskScore} incidents critiques
                    </p>
                  </CardContent>
                </Card>

                {/* Risks */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Risques
                        </p>
                        <p className="text-xl font-semibold">
                          {kpiMetrics.riskScore}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.round(kpiMetrics.riskScore * 0.3)} risques élevés
                    </p>
                  </CardContent>
                </Card>

                {/* Health Score */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Santé Globale
                        </p>
                        <p className="text-xl font-semibold">
                          {Math.round((kpiMetrics.qualityScore + kpiMetrics.schedulePerformance + kpiMetrics.costEfficiency) / 3)}
                        </p>
                      </div>
                      <Target
                        className={`h-8 w-8 ${
                          Math.round((kpiMetrics.qualityScore + kpiMetrics.schedulePerformance + kpiMetrics.costEfficiency) / 3) >= 80
                            ? "text-green-600"
                            : Math.round((kpiMetrics.qualityScore + kpiMetrics.schedulePerformance + kpiMetrics.costEfficiency) / 3) >= 60
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
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Délai
                        </p>
                        <p className="text-xl font-semibold">
                          {Math.round(kpiMetrics.schedulePerformance * 3)}j
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.round((100 - kpiMetrics.schedulePerformance) * 2)}j écoulés
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
                          {kpiMetrics.actualCost.toLocaleString()} MRU
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Variance coût</span>
                        <span
                          className={`font-semibold ${
                            kpiMetrics.costVariance >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {kpiMetrics.costVariance.toLocaleString()} MRU
                        </span>
                      </div>
                      <Progress
                        value={(kpiMetrics.actualCost / (kpiMetrics.totalBudget || 1)) * 100}
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
                            kpiMetrics.scheduleVariance >= 0
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          {Math.abs(kpiMetrics.scheduleVariance).toFixed(1)} jours
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Tâches en retard</span>
                        <span className="font-semibold text-red-600">
                          {Math.round(kpiMetrics.riskScore * 0.2)}
                        </span>
                      </div>
                      <Progress
                        value={kpiMetrics.progressPercentage}
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
          <div className="space-y-4">
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
                    {bankGuaranteesData.map((guarantee) => (
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
                    {insuranceCertificatesData.map((cert) => (
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
                              (cert as any).status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {(cert as any).status || 'N/A'}
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
                {documentsData.filter((doc) =>
                  ["contract", "project_report", "tender"].includes(
                    doc.document_type
                  )
                ).length > 0 ? (
                  <div className="space-y-4">
                    {documentsData
                      .filter((doc) =>
                        ["contract", "project_report", "tender"].includes(
                          doc.document_type
                        )
                      )
                      .map((doc) => (
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
                    <p className="text-xl font-semibold">
                      {bankGuaranteesData.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Garanties bancaires
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-xl font-semibold">
                      {insuranceCertificatesData.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Assurances</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-xl font-semibold">
                      {
                        documentsData.filter((d: {id: string, title: string, type: string, document_type: string, description?: string, created_at: string, status: string}) =>
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

        <TabsContent value="monitoring" className="mt-6">
          <MonitoringEvaluationPanel
            scope="project"
            project={projectDetail as any}
            phases={computedPhases.map((p) => ({
              id: p.id,
              name: p.phase_name || p.phase,
              status: p.status,
              progress: p.progress,
              startDate: p.startDate,
              endDate: p.endDate,
              budget: p.budget,
              actualProgress: p.progress,
            }))}
          />
        </TabsContent>

        <TabsContent value="map" className="mt-6">

          <InteractiveMapGIS
            title="Localisation du projet"
            description="Carte interactive avec outils GIS"
            allowPolygon={true}
            value={{
              coordinates: project && project.coordinates && project.coordinates.latitude !== undefined && project.coordinates.longitude !== undefined
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
            onChange={(_data) => {
              // Map data changes are persisted via the dedicated project edit workflow (step Localisation).
              // No-op here to keep the detail view read-only for GIS overlays.
            }}
          />
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default ProjectDetailByDTO;
