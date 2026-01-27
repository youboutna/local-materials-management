/**
 * useProjectEditHex - Hook hexagonal pour l'édition de projet
 * Centralise toutes les opérations de chargement/sauvegarde
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectStakeholderService } from '@/application/services/ProjectStakeholderService';
import { PhaseService } from '@/application/services/PhaseService';
import { useProjectMaterialsHex, SelectedMaterial } from "./useProjectMaterialsHex";

const projectService = new ProjectService();

export interface ProjectEditData {
  id?: string;
  title: string;
  description: string;
  location: string;
  status: string;
  budget: number;
  progress?: number;
  startDate?: string;
  endDate?: string;
  teamSize?: number;
  financing_source?: string;
  market_type?: string;
  selection_mode?: string;
  project_reference?: string;
  main_contractor?: string;
  engineering_consultant?: string;
  allows_initial_payment?: boolean;
  initial_payment_percentage?: number;
  current_phase?: string;
  current_stage?: string;
  coordinates?: { latitude: number; longitude: number };
  localisation?: any[];
  forme?: string;
  adresse?: string;
  phases?: any[];
  stakeholders?: any[];
  delegation?: Record<string, string>;
  materials?: SelectedMaterial[];
}

async function loadProjectForEdit(projectId: string): Promise<ProjectEditData | null> {
  const projectDetail = await projectService.getProjectDetail(projectId);
  if (!projectDetail) return null;

  // Load stakeholders
  const stakeholdersData = await ProjectStakeholderService.getProjectStakeholders(projectId);

  // Map stakeholders to form format
  const delegation: Record<string, string> = {};
  const externalStakeholders: any[] = [];

  stakeholdersData?.forEach((sh: any) => {
    if (sh.stakeholder_entity_type === "employee" && sh.employee_id) {
      if (sh.stakeholder_type === "project_manager") {
        delegation.projectManager = sh.employee_id;
      } else if (sh.stakeholder_type === "technical_manager") {
        delegation.technicalManager = sh.employee_id;
      } else if (sh.stakeholder_type === "supervisor") {
        delegation.supervisor = sh.employee_id;
      } else if (sh.stakeholder_type === "client") {
        delegation.client = sh.employee_id;
      }
    } else if (sh.stakeholder_entity_type === "supplier" && sh.supplier_id) {
      externalStakeholders.push({
        id: sh.id,
        type: "external",
        entityId: sh.supplier_id,
        role: sh.stakeholder_type,
        isPrimary: sh.is_primary || false,
      });
    }
  });

  const formatDate = (date: any): string => {
    if (!date) return "";
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  return {
    id: projectDetail.id,
    title: projectDetail.title,
    description: projectDetail.description || "",
    location: projectDetail.location || "",
    status: projectDetail.status || "en cours",
    budget: projectDetail.budget || 0,
    progress: projectDetail.progress || 0,
    startDate: formatDate(projectDetail.startDate),
    endDate: formatDate(projectDetail.endDate),
    teamSize: projectDetail.teamSize || 1,
    financing_source: projectDetail.financingSource || "",
    market_type: projectDetail.marketType || "",
    selection_mode: projectDetail.selectionMode || "",
    project_reference: projectDetail.projectReference || "",
    main_contractor: projectDetail.mainContractor || "",
    engineering_consultant: (projectDetail as any).engineeringConsultant || "",
    allows_initial_payment: projectDetail.allowsInitialPayment || false,
    initial_payment_percentage: projectDetail.initialPaymentPercentage || 0,
    current_phase: projectDetail.currentPhase || "",
    current_stage: projectDetail.currentStage || "",
    coordinates: projectDetail.coordinates,
    localisation: (projectDetail as any).localisation,
    forme: (projectDetail as any).forme,
    adresse: (projectDetail as any).adresse,
    phases: projectDetail.plannedPhases || [],
    stakeholders: externalStakeholders,
    delegation,
  };
}

export function useProjectEditHex(projectId?: string) {
  const queryClient = useQueryClient();
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load project data
  const { 
    data: projectData, 
    isLoading: isLoadingProject, 
    error: projectError,
    refetch: refetchProject 
  } = useQuery({
    queryKey: ["project-edit", projectId],
    queryFn: () => loadProjectForEdit(projectId!),
    enabled: !!projectId && !hasLoaded,
    staleTime: 60_000,
  });

  // Load materials via dedicated hook
  const { 
    selectedMaterials, 
    updateMaterials, 
    isLoading: isLoadingMaterials 
  } = useProjectMaterialsHex(projectId);

  // Mark as loaded once data is fetched
  useEffect(() => {
    if (projectData && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [projectData, hasLoaded]);

  // Save project mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ProjectEditData) => {
      if (!projectId) throw new Error("Project ID required");

      const nullIfEmpty = (value: any) => (value === "" || value === undefined ? null : value);

      // Update project
      await projectService.updateProject(projectId, {
        title: data.title,
        description: data.description,
        location: data.location,
        budget: data.budget,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        teamSize: data.teamSize,
        financingSource: nullIfEmpty(data.financing_source),
        marketType: nullIfEmpty(data.market_type),
        selectionMode: nullIfEmpty(data.selection_mode),
        projectReference: nullIfEmpty(data.project_reference),
        mainContractor: nullIfEmpty(data.main_contractor),
        allowsInitialPayment: data.allows_initial_payment,
        initialPaymentPercentage: data.initial_payment_percentage,
        coordinates: data.coordinates,
      });

      // Update stakeholders
      if (data.stakeholders || data.delegation) {
        await ProjectStakeholderService.updateProjectStakeholders(
          projectId,
          data.stakeholders || [],
          data.delegation || {}
        );
      }

      // Update phases
      if (data.phases && data.phases.length > 0) {
        await PhaseService.saveProjectPhases(projectId, data.phases);
      }

      // Update materials
      if (data.materials) {
        await updateMaterials(data.materials);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-edit", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-summary", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Combined data with materials
  const formData: ProjectEditData | null = projectData 
    ? { ...projectData, materials: selectedMaterials }
    : null;

  return {
    formData,
    isLoading: isLoadingProject || isLoadingMaterials,
    error: projectError,
    refetch: refetchProject,
    saveProject: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    hasLoaded,
  };
}
