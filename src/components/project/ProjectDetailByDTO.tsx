/**
 * ProjectDetailByDTO - Détail du projet à partir des DTOs
 * 
 * Architecture Hexagonale :
 * - Utilise ProjectDetailDTO, PhaseDTO, InspectionDTO, etc.
 * - GeoZoneEditor utilise InterventionZoneDTO
 * - Pas de types UI redéfinis
 * - Toutes les données proviennent des services
 */

import { getProjectService } from '@/application/services/ProjectService';
import { referentialService } from '@/application/services/ReferentialService';
import GeoZoneEditor from '@/components/gis/GeoZoneEditor';
import { CriticalPathView, KanbanBoard, PERTDiagram, ProjectTimeline } from "@/components/planning";
import EnhancedRiskManager from "@/components/project/EnhancedRiskManager";
import EnhancedTaskManager from "@/components/project/EnhancedTaskManager";
import FinancialOverview from "@/components/project/FinancialOverview";
import { InspectionsList } from "@/components/project/InspectionsList";
import { UnifiedMilestoneManager } from "@/components/project/milestones";
import ActionableProjectMilestones from "@/components/project/monitoring/ActionableProjectMilestones";
import MonitoringEvaluationPanel from "@/components/project/monitoring/MonitoringEvaluationPanel";
import { PaymentDialog } from "@/components/project/PaymentDialog";
import PhaseList from "@/components/project/PhaseList";
import PlanningVarianceView from "@/components/project/PlanningVarianceView";
import ProjectBudgetTracking from "@/components/project/ProjectBudgetTracking";
import ProjectDqeTab from "@/components/project/ProjectDqeTab";
import ProjectMetricsPanel from "@/components/project/ProjectMetricsPanel";
import ProjectResourcesContainer from "@/components/project/resources/ProjectResourcesContainer";
import ProjectConsultantDesignation from "@/components/project/stakeholders/ProjectConsultantDesignation";

import { getActualCostService } from "@/application/services/ActualCostService";
import { WorkspaceTabsList } from "@/components/common/WorkspaceTabsList";
import ProjectGanttTimeline from "@/components/project/ProjectGanttTimeline";
import UnifiedPERTAnalysis from "@/components/project/UnifiedPERTAnalysis";
import { ReportManager } from "@/components/reports/ReportManager";
import { Badge } from "@/components/ui/badge";
import { resolveProjectLocationLabel } from "@/utils/projectLocationLabel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogContent as DialogContentUI, DialogHeader as DialogHeaderUI, DialogTitle as DialogTitleUI, Dialog as DialogUI } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReferentialType } from "@/config/referentials";
import { getProjectTabs } from "@/config/referentials/projects/project-views.referential";
import { useLanguage } from "@/contexts/LanguageContext";
import { InspectionDTO } from "@/dtos/entities/InspectionDTO";
import { InterventionZoneDTO } from "@/dtos/entities/InterventionZoneDTO";
import { PhaseDTO } from "@/dtos/entities/PhaseDTO";
import { ProjectDetailDTO, ProjectSummaryDTO } from "@/dtos/entities/ProjectDTO";
import { useProjectPhasesHex } from "@/hooks/hexagonal";
import { useDocumentsByProject } from "@/hooks/hexagonal/useDocumentsHex";
import { useMilestonesHex } from "@/hooks/hexagonal/useMilestonesHex";

import { toast } from "@/hooks/use-toast";
import { useProjectMetrics } from "@/hooks/useProjectMetrics";
import { useProjectFinancialsHex } from "@/hooks/hexagonal/useProjectFinancialsHex";
import { formatAmount2 } from "@/utils/reportNumbers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Shield,
  Target
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ElectricSpinner } from "../loading-page";
import { CompactProjectReportGenerator } from "../reports/CompactProjectReportGenerator";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import ConstructionPhaseManager from "./ConstructionPhaseManager";
import { ProjectHeader } from "./hierarchy";
import ProjectCheckpointsDashboard from "./ProjectCheckpointsDashboard";

import { TranslatedStatus } from '@/components/i18n/TranslatedBadges';
import { useI18n } from '@/hooks/useI18n';
import { T } from '@/components/i18n/T';
import { DecompteTrackingPanel } from '@/components/project/finance/DecompteTrackingPanel';
// ============================================================================
// INTERFACES (uniquement pour les props du composant)
// ============================================================================

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

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const ProjectDetailByDTO: React.FC<ProjectDetailByDTOProps> = ({
  projectId: propProjectId,
  onEdit,
  onClose,
}) => {
  // ============ Hooks et état ============
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { translateTerm } = useI18n();
  const projectId = propProjectId || routeProjectId;
  const [selectedReferential, setSelectedReferential] = useState<ReferentialType | null>(null);
  const [showPhaseManager, setShowPhaseManager] = useState(false);
  const [phases, setPhases] = useState<PhaseDTO[]>([]);
  const [referentialOptions, setReferentialOptions] = useState<{ value: string; label: string; description?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const queryClient = useQueryClient();
  
  // ============ Services ============
  const projectService = useMemo(
    () => getProjectService(),
    [],
  );

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

  // ============ Queries ============
  
  // Fetch project summary
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

  // Fetch detailed project data
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

  // ============ Extraction des zones d'intervention ============
  const interventionZones = useMemo<InterventionZoneDTO[]>(() => {
    // Extraire les zones depuis projectDetail ou project
    const zones = (projectDetail as any)?.interventionZones || 
                  (project as any)?.interventionZones || [];
    
    // Si c'est un tableau, le retourner directement (c'est déjà des DTOs)
    if (Array.isArray(zones)) {
      return zones as InterventionZoneDTO[];
    }
    
    return [];
  }, [projectDetail, project]);

  // ============ Calcul des coordonnées pour la carte ============
  const mapCenter = useMemo<[number, number] | undefined>(() => {
    const lat = projectDetail?.latitude || 
                (projectDetail as any)?.coordinates?.latitude ||
                project?.latitude ||
                (project as any)?.coordinates?.latitude;
    const lng = projectDetail?.longitude || 
                (projectDetail as any)?.coordinates?.longitude ||
                project?.longitude ||
                (project as any)?.coordinates?.longitude;
    
    if (typeof lat === 'number' && typeof lng === 'number') {
      return [lat, lng];
    }
    return undefined;
  }, [projectDetail, project]);

  const projectTabsDef = useMemo(
    () => getProjectTabs((projectDetail as any)?.entityCode),
    [projectDetail]
  );

  // Use data from ProjectDetailDTO
  const phasesSource = useMemo(() => projectDetail?.plannedPhases || [], [projectDetail]);
  const tasksSource = useMemo(() => projectDetail?.tasks || [], [projectDetail]);
  const risksSource = useMemo(() => projectDetail?.risks || [], [projectDetail]);
  const inspectionsSource = useMemo<InspectionDTO[]>(
    () => ((projectDetail as any)?.inspections || []),
    [projectDetail]
  );
  const paymentsSource = useMemo(() => projectDetail?.expenses || [], [projectDetail]);

  // ============ Calcul de la phase actuelle ============
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

  // ============ Calcul de la méthodologie ============
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

  // ============ Ressources ============
  const [resources, setResources] = useState<Array<{id: string, name: string, type: string, cost?: number}>>([]);
  const [tasks, setTasks] = useState<Array<{id: string, name: string, status: string, progress?: number}>>([]);
  const [risks, setRisks] = useState<Array<{id: string, title: string, description: string, probability: number, impact: number}>>([]);

  useEffect(() => {
    const computeResources = () => {
      if (!projectDetail) return;
      
      const realResources = Array.isArray(projectDetail.resources) ? projectDetail.resources : [];
      
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
      const transformedTasks = tasksSource.map((t: any) => ({
        id: t.id,
        name: t.title || t.name || 'Task',
        status: t.status || 'pending',
        progress: t.progress
      }));
      setTasks(transformedTasks);
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

  // ============ Données pour le rapport ============
  const projectDataForReport = useMemo(() => {
    if (!project || !projectDetail) return null;
    
    const typedProject = project as ProjectSummaryDTO;
    
    return {
      id: typedProject.id,
      title: typedProject.title || 'Projet sans titre',
      description: typedProject.description || "Aucune description disponible",
      location: typedProject.location || "Localisation non spécifiée",
      status: typedProject.status || "en cours",
      progress: typedProject.progress ?? undefined,
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
      resources: resources,
      tasks: tasksSource,
      phases: phasesSource,
      inspections: inspectionsSource,
      expenses: paymentsSource,
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
      contacts: (projectDetail?.contacts?.length
        ? projectDetail.contacts
        : projectDetail?.mainContractor
        ? [
            {
              id: `contractor-${String(projectDetail.mainContractor).replace(/\s+/g, '-').toLowerCase()}`,
              name: String(projectDetail.mainContractor),
              role: "contractor",
              email: "",
              isPrimary: true,
            },
          ]
        : undefined) as any,
      stakeholders: (projectDetail?.stakeholders?.length
        ? (projectDetail.stakeholders as any[]).map((s: any) => ({
            id: s.id,
            name: s.name || s.roleDescription || s.stakeholderType || "Partie prenante",
            email: s.email || "",
            phone: s.phone || "",
            role: s.stakeholderType || s.role || "stakeholder",
            organization: s.organization || s.roleDescription || "",
            isPrimary: !!s.isPrimary,
          }))
        : projectDetail?.financingSource
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
        : undefined) as any,
      methodology: projectDetail?.methodology || undefined,
    };
  }, [
    project,
    projectDetail,
    project?.progress,
    resources,
    tasksSource,
    risksSource,
    phasesSource,
    inspectionsSource,
    paymentsSource,
  ]);

  // ============ Documents et garanties ============
  // Source unique : DocumentService (scopé projet), fallback sur l'agrégat ProjectDetail
  const { data: projectDocuments = [] } = useDocumentsByProject((project as any)?.id || '');

  // ============ Jalons — source unique MilestoneService ============
  const { milestones: hexMilestones = [] } = useMilestonesHex((project as any)?.id);
  const milestonesSource = useMemo(() => {
    const source = (hexMilestones && hexMilestones.length > 0)
      ? hexMilestones
      : ((projectDetail as any)?.milestones ?? []);
    return source as any[];
  }, [hexMilestones, projectDetail]);


  const documentsData = useMemo(() => {
    const source =
      (projectDocuments && projectDocuments.length > 0)
        ? projectDocuments
        : ((projectDetail as any)?.documents || []);
    return (source as any[]).map((doc: any) => ({
      id: doc.id,
      title: doc.title || doc.fileName || doc.file_name || 'Document',
      type: doc.documentType || doc.document_type || doc.type || 'other',
      document_type: doc.documentType || doc.document_type || doc.type || 'other',
      description: doc.description,
      created_at: doc.createdAt || doc.created_at || new Date().toISOString(),
      status: doc.status || 'pending',
    }));
  }, [projectDocuments, projectDetail]);


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

  // ============ Génération des phases ============
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
      const referentialPhases = await referentialService.getPhasesForReferential(selectedReferential);

      if (referentialPhases.length === 0) {
        toast({
          title: "Aucune phase",
          description: "Ce référentiel ne contient pas de phases configurées",
          variant: "destructive",
        });
        return;
      }

      const phasesToSave: PhaseToSave[] = [];
      let cumulativeStartDays = 0;

      for (const refPhase of referentialPhases) {
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

        const startDate = new Date();
        startDate.setDate(startDate.getDate() + cumulativeStartDays);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + phaseDuration);

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
          construction_phase: refPhase.code || refPhase.label.toLowerCase().replace(/ /g, "_"),
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

  // ============ Hook hexagonal pour les phases ============
  const { 
    phases: projectPhases, 
    refetch: refetchPhases, 
    createPhases,
    isLoading: phasesLoading 
  } = useProjectPhasesHex(projectId);

  // ============ Phases normalisées pour l'UI ============
  const computedPhases = useMemo(() => {
    const phasesSource = projectPhases || projectDetail?.plannedPhases || [];

    const normalize = (p: any) => {
      return {
        id: p.id,
        phase: p.phase_name || p.phase || p.name || p.constructionStage || t("project.phase_label"),
        phase_name: p.phase_name || p.phase || p.name,
        status: p.status || "planned",
        progress: p.progress || 0,
        startDate: p.startDate || p.start_date || (p.customPhaseData || p.custom_phase_data)?.startDate || "",
        endDate: p.endDate || p.end_date || (p.customPhaseData || p.custom_phase_data)?.endDate || "",
        description: p.description,
        budget: p.estimatedCost ?? p.estimated_cost ?? p.budget,
        weight: p.weight ?? null,
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

  // ============ Phase actuelle (source : phases persistées puis DTO) ============
  const resolvedPhaseInfo = useMemo(() => {
    if (currentPhaseInfo.currentPhase) return currentPhaseInfo;
    if (computedPhases.length === 0) return currentPhaseInfo;

    const pick =
      computedPhases.find((p) => p.status === "in_progress") ||
      computedPhases.find((p) =>
        ["not_started", "pending", "draft", "planned"].includes(String(p.status)),
      ) ||
      computedPhases[computedPhases.length - 1];

    const stages = Array.isArray(pick?.stages) ? pick.stages : [];
    const activeStage = stages.find((s: { status?: string }) => s?.status && s.status !== "completed");
    return {
      currentPhase: pick?.phase_name || pick?.phase || null,
      currentStage: activeStage?.name || stages[0]?.name || null,
    };
  }, [currentPhaseInfo, computedPhases]);


  // ============ Statistiques des phases ============
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

  // ============ Métriques projet — SOURCE UNIQUE (ProjectMetricsOrchestrator) ============
  const totalPaymentsSpent = useMemo(
    () => paymentsSource.reduce((sum, p: any) => sum + (p.amount || 0), 0),
    [paymentsSource],
  );

  const initialPaymentAmount = useMemo(
    () => (((project as ProjectSummaryDTO)?.budget || 0) * ((project as ProjectSummaryDTO)?.initialPaymentPercentage || 0)) / 100,
    [project],
  );

  // Coût réel consolidé (paiements + engagements ressources) — source unique ActualCostService
  const { data: actualCostBreakdown } = useQuery({
    queryKey: ["project-actual-cost", project?.id],
    queryFn: () => getActualCostService().computeActualCost(project!.id),
    enabled: !!project?.id,
    staleTime: 60_000,
  });

  // Doctrine financière unique : Budget (DQE validé) → Engagé → Dépensé → Payé
  const { financials: doctrineFinancials } = useProjectFinancialsHex({
    scope: 'project',
    entityId: (project as any)?.id,
    declaredBudget: (project as any)?.budget ?? 0,
    currency: (project as any)?.currency ?? 'MRU',
  });

  const metricsInput = useMemo(() => {
    if (!project) return null;
    return {
      project: {
        id: project.id,
        title: project.title,
        budget: project.budget ?? 0,
        progress: project.progress ?? 0,
        startDate: project.startDate ?? null,
        endDate: project.endDate ?? null,
        interventionZones: interventionZones,
        currency: "MRU",
      },
      phases: computedPhases.map((p: any) => ({
        id: p.id,
        name: p.phase ?? p.phase_name,
        budget: p.budget,
        weight: p.weight,
        startDate: p.startDate,
        endDate: p.endDate,
        progress: p.progress ?? 0,
        status: p.status,
      })),
      // AC = paiements payés + engagements ressources de phase (source: ActualCostService)
      actualCost: doctrineFinancials?.spent ?? actualCostBreakdown?.actualCost ?? (totalPaymentsSpent || (project as any)?.actualCost || 0),
      financials: doctrineFinancials,
      inspectionsCount: inspectionsSource.length,
      documentsCount: documentsData.length,
      risks: risksSource as any[],
      milestones: milestonesSource.map((m: any) => ({
        id: m.id,
        name: m.title,
        status: m.status,
        progress: m.progress ?? (m.status === 'completed' ? 100 : 0),
        dueDate: m.targetDate,
      })),
    };
  }, [project, computedPhases, interventionZones, inspectionsSource, documentsData, risksSource, milestonesSource, totalPaymentsSpent, actualCostBreakdown, doctrineFinancials]);


  const metrics = useProjectMetrics(metricsInput);

  // ============ Suppression ============
  const handleDelete = async (projectIdToDelete: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.`)) {
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

  // ============ Fonctions UI ============
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success-soft text-success border-success/30";
      case "in_progress": return "bg-primary/10 text-primary border-primary/30";
      case "delayed": return "bg-destructive/10 text-destructive border-destructive/30";
      case "on_hold": return "bg-warning/10 text-warning border-warning/30";
      case "planned": return "bg-muted text-foreground border-border";
      default: return "bg-muted text-foreground border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "delayed": return <AlertTriangle className="h-4 w-4" />;
      case "on_hold": return <Clock className="h-4 w-4" />;
      case "planned": return <Target className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // ============ Rendu de la carte (hexagonal) ============
  const renderMapTab = () => {
    const hasZones = interventionZones.length > 0;
    const hasCenter = !!mapCenter;
    const address = projectDetail?.location || (project as any)?.location || '';

    return (
      <GeoZoneEditor
        readOnly
        showAddressBar={false}
        value={interventionZones}
        title={hasZones ? "Zones d'intervention" : 'Localisation du projet'}
        hint={
          hasZones
            ? address 
              ? `Adresse : ${address}` 
              : 'Vue lecture seule — éditez via le workflow projet.'
            : hasCenter
            ? address
              ? `Coordonnées uniquement — ${address}`
              : 'Marqueur généré depuis les coordonnées du projet.'
            : "Aucune coordonnée ni zone tracée — définissez-en via l'édition du projet."
        }
        defaultCenter={mapCenter}
        fallbackLabel={project?.title}
        fallbackAddress={address}
        height={520}
      />
    );
  };

  // ============ Chargement ============
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
            Vérifiez que l'ID du projet est correct ou que vous avez les permissions nécessaires.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["project-summary", projectId] });
                queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
              }}
              variant="outline"
            >
              <T k="auto.projectdetailbydto.reessayer" fallback="Réessayer" />
            </Button>
            <Button onClick={() => navigate("/projects")}>
              <T k="auto.projectdetailbydto.retour_aux_projets" fallback="Retour aux projets" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============ Rendu principal ============
  return (
    <div className="container mx-auto py-3 space-y-3">

      {/* Header */}
      <ProjectHeader
        project={{
          id: project.id,
          title: project.title || "Projet sans titre",
          description: project.description,
          status: project.status || "en cours",
          progress: metrics?.progress ?? project.progress ?? 0,
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

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        {/* Barre unifiée : navigation (défilement horizontal) + actions rapports */}
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <TabsList className="h-9 flex-1 justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0">
            {projectTabsDef.map((tab) => (
              <TabsTrigger
                key={tab.uiValue}
                value={tab.uiValue}
                className="shrink-0 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:text-sm"
              >
                {tab.label.fr}
              </TabsTrigger>
            ))}
          </TabsList>

        </div>


        {/* ===== OVERVIEW ===== */}
        <TabsContent value="overview" className="space-y-3">
          {/* Synthèse compacte : identité du marché + statut, une seule carte */}
          <Card>
            <CardContent className="grid grid-cols-1 gap-x-8 gap-y-3 p-4 lg:grid-cols-2">
              <dl className="space-y-2 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground"><T k="auto.projectdetailbydto.periode" fallback="Période" /></dt>
                  <dd className="text-right font-medium">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
                    {" → "}
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : "—"}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground"><T k="auto.projectdetailbydto.financement" fallback="Financement" /></dt>
                  <dd className="text-right font-medium">{project.financingSource || "Non spécifié"}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground"><T k="auto.projectdetailbydto.type_de_marche" fallback="Type de marché" /></dt>
                  <dd className="text-right font-medium">{project.marketType || "Non spécifié"}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground"><T k="auto.projectdetailbydto.localisation" fallback="Localisation" /></dt>
                  <dd className="text-right font-medium">
                    {resolveProjectLocationLabel(project as never) || "Non renseignée"}
                    {(() => {
                      const lat =
                        project?.coordinates?.latitude ??
                        (project as unknown as { latitude?: number }).latitude;
                      const lng =
                        project?.coordinates?.longitude ??
                        (project as unknown as { longitude?: number }).longitude;
                      const hasCoords = typeof lat === "number" && typeof lng === "number";
                      return (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {hasCoords
                            ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
                            : "Aucune coordonnée — voir Cartographie"}
                        </span>
                      );
                    })()}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground"><T k="auto.projectdetailbydto.phase_actuelle" fallback="Phase actuelle" /></span>
                  <Badge variant={resolvedPhaseInfo.currentPhase ? "default" : "outline"} className="text-[11px]">
                    {resolvedPhaseInfo.currentPhase || "Aucune phase planifiée"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground"><T k="auto.projectdetailbydto.etape_actuelle" fallback="Étape actuelle" /></span>
                  <Badge variant={resolvedPhaseInfo.currentStage ? "secondary" : "outline"} className="text-[11px]">
                    {resolvedPhaseInfo.currentStage || "—"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground"><T k="auto.projectdetailbydto.methodologie" fallback="Méthodologie" /></span>
                  <Badge variant="outline" className="text-[11px]">{projectMethodology}</Badge>
                </div>
                <Progress value={metrics?.progress ?? 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Avancement pondéré : {metrics?.formatted.progress ?? "N/A"} ·{" "}
                  {metrics?.progressBasisLabel ?? "projet (aucune phase)"}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground"><T k="auto.projectdetailbydto.jalons" fallback="Jalons" /></span>
                    <span className="font-semibold">
                      {metrics?.milestoneProgress.completed ?? 0}/{metrics?.milestoneProgress.total ?? 0}
                    </span>
                    <span className="text-muted-foreground">
                      ({metrics?.formatted.milestoneProgress ?? "0,00 %"})
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground"><T k="auto.projectdetailbydto.documents" fallback="Documents" /></span>
                    <span className="font-semibold">{documentsData.length}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <ProjectCheckpointsDashboard
            projectId={projectId!}
            progress={metrics?.progress}
            compact
            onPhaseClick={(phaseId) => navigate(`/projects/${projectId}/phases/${phaseId}`)}
          />

          <ActionableProjectMilestones
            projectId={projectId!}
            maxItems={5}
            showHeader={true}
            onMilestoneClick={(milestoneId, phaseId) => {
              if (phaseId) {
                navigate(`/projects/${projectId}/phases/${phaseId}`);
              } else {
                setActiveTab('milestones');
              }
            }}
          />

          {/* Désignation du consultant projet */}
          <ProjectConsultantDesignation projectId={projectId} />
        </TabsContent>




        {/* ===== FINANCIAL ===== */}
        <TabsContent value="financial" className="mt-6">
          {/* Doctrine : dépensé = décomptes validés (jamais lignes DQE / tâches) */}
          <DecompteTrackingPanel
            scope="project"
            entityId={projectId}
            initialBudget={project.budget || 0}
            engaged={doctrineFinancials?.engaged ?? actualCostBreakdown?.resourcesCost ?? 0}
            className="mb-6"
          />

          <FinancialOverview
            budget={project.budget || 0}
            spent={doctrineFinancials?.spent ?? actualCostBreakdown?.decomptedCost ?? metrics?.actualCost ?? totalPaymentsSpent}
            phases={phasesSource || []}
            financialMetrics={
              metrics
                ? {
                    costVariance: metrics.evm.costVariance,
                    costPerformanceIndex: metrics.evm.costPerformanceIndex,
                  }
                : undefined
            }
          />



          {/* Échéancier de paiements */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <T k="auto.projectdetailbydto.echeancier_de_paiements" fallback="Échéancier de paiements" />
                </span>
                <PaymentDialog
                  project={{
                    ...(project as any),
                    payments: (paymentsSource || []).map((p: any) => ({
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
                  <div className="p-4 border rounded-lg bg-success-soft">
                    <h4 className="font-medium"><T k="auto.projectdetailbydto.avance_initiale_autorisee" fallback="Avance initiale autorisée" /></h4>
                    <p className="text-sm text-muted-foreground">
                      {(project as ProjectSummaryDTO).initialPaymentPercentage}% du montant total
                    </p>
                    <p className="font-semibold text-success">
                      {formatAmount2(initialPaymentAmount, "MRU")}
                    </p>
                  </div>
                )}
                {paymentsSource.length > 0 ? (
                  <div className="grid gap-4">
                    {paymentsSource.map((payment) => (
                      <div key={payment.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {(payment as any).description || "Paiement"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Date: {new Date(payment.paymentDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Progression: {payment.progressAtPayment}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatAmount2(payment.amount || 0)}
                            </p>
                            <Badge
                              variant={payment.status === "approved" ? "default" : "secondary"}
                              className={payment.status === "approved" ? "bg-success-soft text-success" : ""}
                            >
                              <TranslatedStatus code={payment.status} />
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground"><T k="auto.projectdetailbydto.aucun_paiement_enregistre" fallback="Aucun paiement enregistré" /></p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PHASES ===== */}
        <TabsContent value="phases" className="mt-6">
          <Tabs defaultValue="wbs" className="space-y-4">
            <WorkspaceTabsList variant="underline">
              <TabsTrigger value="wbs" className="text-xs sm:text-sm">Phases ({translateTerm('wbs_short')})</TabsTrigger>
              <TabsTrigger value="planning" className="text-xs sm:text-sm"><T k="auto.projectdetailbydto.planning" fallback="Planning" /></TabsTrigger>
              <TabsTrigger value="milestones" className="text-xs sm:text-sm"><T k="auto.projectdetailbydto.jalons" fallback="Jalons" /></TabsTrigger>
            </WorkspaceTabsList>

            <TabsContent value="wbs" className="mt-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span><T k="auto.projectdetailbydto.generation_des_phases" fallback="Génération des phases" /></span>
                      <Button onClick={() => setShowPhaseManager(true)} variant="outline">
                        <T k="auto.projectdetailbydto.gestion_avancee_des_phases" fallback="Gestion avancée des phases" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label>{t('phase_structure.referential')}</Label>
                        <Select
                          value={selectedReferential || ""}
                          onValueChange={(value) => setSelectedReferential(value as ReferentialType)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('phase_structure.select_referential')} />
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
                        <Button onClick={handleGeneratePhasesFromReferential} disabled={!selectedReferential}>
                          <T k="auto.projectdetailbydto.generer_les_phases" fallback="Générer les phases" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>• Sélectionnez un référentiel pour générer automatiquement les phases du projet</p>
                      <p>• Les phases incluront les étapes et tâches définies dans le référentiel</p>
                      <p>• Vous pouvez également utiliser la gestion avancée des phases pour un contrôle manuel</p>
                    </div>
                  </CardContent>
                </Card>

                <PhaseList
                  phases={computedPhases}
                  projectId={projectId!}
                  onPhaseUpdate={() => {
                    refetchPhases();
                    queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
                  }}
                />
              </div>

              <DialogUI open={showPhaseManager} onOpenChange={setShowPhaseManager}>
                <DialogContentUI className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeaderUI>
                    <DialogTitleUI><T k="auto.projectdetailbydto.gestion_avancee_des_phases" fallback="Gestion avancée des phases" /></DialogTitleUI>
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

            <TabsContent value="planning" className="mt-6">
              <ProjectBudgetTracking projectId={projectId!} projectBudget={project?.budget ?? null} />
              <div className="mt-4">
                <PlanningVarianceView projectId={projectId!} />
              </div>
              <Tabs defaultValue="gantt" className="space-y-4 mt-4">
                <WorkspaceTabsList variant="underline">
                  <TabsTrigger value="gantt" className="text-xs sm:text-sm"><T k="auto.projectdetailbydto.gantt" fallback="Gantt" /></TabsTrigger>
                  <TabsTrigger value="pert" className="text-xs sm:text-sm"><T k="auto.projectdetailbydto.pert" fallback="PERT" /></TabsTrigger>
                  <TabsTrigger value="kanban" className="text-xs sm:text-sm"><T k="auto.projectdetailbydto.kanban" fallback="Kanban" /></TabsTrigger>
                  <TabsTrigger value="critical" className="text-xs sm:text-sm"><T k="auto.projectdetailbydto.chemin_critique" fallback="Chemin Critique" /></TabsTrigger>
                  <TabsTrigger value="timeline" className="text-xs sm:text-sm"><T k="auto.projectdetailbydto.timeline" fallback="Timeline" /></TabsTrigger>
                </WorkspaceTabsList>

                <TabsContent value="gantt">
                  {metrics ? (
                    <ProjectGanttTimeline gantt={metrics.gantt} />
                  ) : (
                    <p className="text-sm text-muted-foreground"><T k="auto.projectdetailbydto.chargement_du_gantt" fallback="Chargement du Gantt..." /></p>
                  )}
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

            <TabsContent value="milestones" className="mt-6">
              <Tabs defaultValue="timeline" className="space-y-4">
                <WorkspaceTabsList variant="underline">
                  <TabsTrigger value="timeline">Timeline & Liste</TabsTrigger>
                  <TabsTrigger value="gantt"><T k="auto.projectdetailbydto.diagramme_gantt" fallback="Diagramme Gantt" /></TabsTrigger>
                  <TabsTrigger value="pert"><T k="auto.projectdetailbydto.analyse_pert" fallback="Analyse PERT" /></TabsTrigger>
                </WorkspaceTabsList>

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
                  {metrics ? (
                    <ProjectGanttTimeline gantt={metrics.gantt} />
                  ) : (
                    <p className="text-sm text-muted-foreground"><T k="auto.projectdetailbydto.chargement_du_gantt" fallback="Chargement du Gantt..." /></p>
                  )}
                </TabsContent>

                <TabsContent value="pert">
                  {metrics ? (
                    <UnifiedPERTAnalysis pert={metrics.pert} referenceDurationDays={metrics.referenceDurationDays} />
                  ) : (
                    <p className="text-sm text-muted-foreground"><T k="auto.projectdetailbydto.chargement_de_l_analyse_pert" fallback="Chargement de l'analyse PERT..." /></p>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ===== DQE ===== */}
        <TabsContent value="dqe" className="mt-6">
          <ProjectDqeTab projectId={projectId!} projectName={project?.title} referentialCode={project?.referentialCode} />
        </TabsContent>

        {/* ===== TASKS ===== */}
        <TabsContent value="tasks" className="mt-6">
          {(() => {
            const status = String((project as any)?.status || '').toLowerCase();
            const defaultExecTab = status.includes('inspection') ? 'inspections' : 'tasks-exec';
            return (
              <Tabs defaultValue={defaultExecTab} className="space-y-4">
                <WorkspaceTabsList variant="underline">
                  <TabsTrigger value="tasks-exec"><T k="auto.projectdetailbydto.taches" fallback="Tâches" /></TabsTrigger>
                  <TabsTrigger value="inspections"><T k="auto.projectdetailbydto.inspections" fallback="Inspections" /></TabsTrigger>
                  <TabsTrigger value="payments-exec"><T k="auto.projectdetailbydto.paiements" fallback="Paiements" /></TabsTrigger>
                </WorkspaceTabsList>

                <TabsContent value="tasks-exec">
                  <EnhancedTaskManager
                    projectId={projectId!}
                    phases={computedPhases}
                  />

                </TabsContent>

                <TabsContent value="inspections">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <T k="auto.projectdetailbydto.inspections_du_projet" fallback="Inspections du projet" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InspectionsList projectId={projectId!} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="payments-exec" className="space-y-4">
                  {/* Décomptes = factures acceptées ⇒ dépensé réel du projet */}
                  <DecompteTrackingPanel
                    scope="project"
                    entityId={projectId}
                    initialBudget={project.budget || 0}
                    engaged={doctrineFinancials?.engaged ?? actualCostBreakdown?.resourcesCost ?? 0}
                  />
                  <Card>

                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        <T k="auto.projectdetailbydto.paiements_en_cours" fallback="Paiements en cours" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {paymentsSource.filter(p => p.status !== 'paid' && p.status !== 'cancelled').length === 0 ? (
                        <p className="text-muted-foreground"><T k="auto.projectdetailbydto.aucun_paiement_en_cours_pour_ce_projet" fallback="Aucun paiement en cours pour ce projet." /></p>
                      ) : (
                        <div className="grid gap-3">
                          {paymentsSource
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
                                  <p className="font-semibold">{formatAmount2(p.amount || 0)}</p>
                                  <Badge variant="secondary"><TranslatedStatus code={p.status} /></Badge>
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

        {/* ===== MONITORING ===== */}
        <TabsContent value="monitoring" className="mt-6">
          {/* Dashboard Monitoring — source unique : ProjectMetricsOrchestrator */}
          <ProjectMetricsPanel
            project={project as any}
            phases={computedPhases as any[]}
            actualCost={(project as any)?.actualCost ?? 0}
            inspectionsCount={(projectDetail as any)?.inspections?.length ?? 0}
            documentsCount={(projectDetail as any)?.documents?.length ?? 0}
            risks={((projectDetail as any)?.risks ?? []) as any[]}
          />

          <div className="mt-6" />
          <EnhancedRiskManager projectId={projectId!} phases={computedPhases as any} />
          
          {/* KPI : plus aucun calcul inline ici — ProjectMetricsPanel (ci-dessus)
              affiche les KPI issus de ProjectMetricsOrchestrator (source unique). */}


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

        {/* ===== COMPLIANCE ===== */}
        <TabsContent value="compliance" className="mt-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <T k="auto.projectdetailbydto.garanties_bancaires" fallback="Garanties bancaires" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bankGuaranteesData.length > 0 ? (
                  <div className="space-y-4">
                    {bankGuaranteesData.map((guarantee) => (
                      <div key={guarantee.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{guarantee.guarantee_type}</h4>
                            <p className="text-sm text-muted-foreground">Banque: {guarantee.bank_name}</p>
                            <p className="text-sm text-muted-foreground">Montant: {guarantee.guarantee_amount?.toLocaleString()} MRU</p>
                            <p className="text-sm text-muted-foreground">Émission: {new Date(guarantee.issue_date).toLocaleDateString()}</p>
                            <p className="text-sm text-muted-foreground">Échéance: {new Date(guarantee.expiry_date).toLocaleDateString()}</p>
                          </div>
                          <Badge className={guarantee.status === "active" ? "bg-success-soft text-success" : "bg-destructive/10 text-destructive"}>
                            <TranslatedStatus code={guarantee.status} />
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4"><T k="auto.projectdetailbydto.aucune_garantie_bancaire_enregistree" fallback="Aucune garantie bancaire enregistrée" /></p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <T k="auto.projectdetailbydto.assurances" fallback="Assurances" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insuranceCertificatesData.length > 0 ? (
                  <div className="space-y-4">
                    {insuranceCertificatesData.map((cert) => (
                      <div key={cert.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{cert.coverage_type}</h4>
                            <p className="text-sm text-muted-foreground">Assureur: {cert.insurance_company}</p>
                            <p className="text-sm text-muted-foreground">Police: {cert.policy_number}</p>
                            <p className="text-sm text-muted-foreground">Couverture: {cert.coverage_amount?.toLocaleString()} MRU</p>
                            <p className="text-sm text-muted-foreground">Validité: {new Date(cert.valid_from).toLocaleDateString()} - {new Date(cert.valid_until).toLocaleDateString()}</p>
                            {cert.notes && <p className="text-sm text-muted-foreground mt-2">Notes: {cert.notes}</p>}
                          </div>
                          <Badge className={(cert as any).status === "active" ? "bg-success-soft text-success" : "bg-destructive/10 text-destructive"}>
                            {(cert as any).status || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4"><T k="auto.projectdetailbydto.aucune_assurance_enregistree" fallback="Aucune assurance enregistrée" /></p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <T k="auto.projectdetailbydto.documents_de_conformite" fallback="Documents de conformité" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documentsData.filter((doc) => ["contract", "project_report", "tender"].includes(doc.document_type)).length > 0 ? (
                  <div className="space-y-4">
                    {documentsData.filter((doc) => ["contract", "project_report", "tender"].includes(doc.document_type)).map((doc) => (
                      <div key={doc.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{doc.title}</h4>
                            <p className="text-sm text-muted-foreground">Type: {doc.document_type}</p>
                            {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}
                            <p className="text-sm text-muted-foreground">Créé le: {new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                          <Badge className={doc.status === "approved" ? "bg-success-soft text-success" : doc.status === "pending" ? "bg-warning/10 text-warning" : "bg-muted text-foreground"}>
                            <TranslatedStatus code={doc.status} />
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4"><T k="auto.projectdetailbydto.aucun_document_de_conformite" fallback="Aucun document de conformité" /></p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <T k="auto.projectdetailbydto.resume_de_conformite" fallback="Résumé de conformité" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-xl font-semibold">{bankGuaranteesData.length}</p>
                    <p className="text-sm text-muted-foreground"><T k="auto.projectdetailbydto.garanties_bancaires" fallback="Garanties bancaires" /></p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-xl font-semibold">{insuranceCertificatesData.length}</p>
                    <p className="text-sm text-muted-foreground"><T k="auto.projectdetailbydto.assurances" fallback="Assurances" /></p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-xl font-semibold">
                      {documentsData.filter((d) => ["contract", "project_report", "tender"].includes(d.document_type)).length}
                    </p>
                    <p className="text-sm text-muted-foreground"><T k="auto.projectdetailbydto.documents" fallback="Documents" /></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== RESSOURCES ===== */}
        <TabsContent value="resources" className="mt-6">
          <ProjectResourcesContainer
            projectId={projectId!}
            phases={computedPhases as any}
            boqLines={(projectDetail as any)?.dqeLines ?? []}
            executedResources={(projectDetail as any)?.resources ?? []}
            executedMaterials={(projectDetail as any)?.materials ?? []}
            resources={resources}
            setResources={setResources}
          />
        </TabsContent>

        {/* ===== MAP (avec GeoZoneEditor hexagonal) ===== */}
        <TabsContent value="map" className="mt-6 space-y-4">
          {renderMapTab()}
        </TabsContent>

        {/* ===== RAPPORTS ===== */}
        <TabsContent value="rapports" className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold"><T k="auto.projectdetailbydto.rapports_du_projet" fallback="Rapports du projet" /></h2>
            <ReportManager
              data={{ project: (projectDataForReport ?? project) as any }}
              reportType="project"
            />
          </div>
         <CompactProjectReportGenerator project={(projectDetail || project) as any} />
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default ProjectDetailByDTO;