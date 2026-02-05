/**
 * useProjectEditHex - Hexagonal Hook for Project Edit
 * Following the 10-step hexagonal flow:
 * 1. UI Form → formData
 * 2. Hook → Transformer.formToUpdateRequest(formData) → UpdateProjectDTO
 * 3. Service → Transformer.fromUpdateRequest(dto) → Entity
 * 4. Repository → Entity validation
 * 5. Adapter → Transformer.toSupabase(entity) → snake_case data
 * 6. Database → UPDATE
 * 7. Adapter → Transformer.fromSupabase(row) → Entity
 * 8. Service → Transformer.toDTO(entity) → ProjectDTO
 * 9. Hook → Update state
 * 10. UI → Render updated data
 */

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { RepositoryFactory } from "@/infrastructure/supabase/RepositoryFactory";

// Import transformers
import { ProjectWorkflowTransforms } from "@/dtos/transforms/ProjectWorkflowTransforms";

// Import DTOs
import { ProjectDTO, UpdateProjectDTO, CreateProjectDTO } from "@/dtos/entities/ProjectDTO";
import { PhaseDTO } from "@/dtos/entities/PhaseDTO";
import { ProjectWorkflowData, SaveResult, ValidationResult } from "@/dtos/workflows/ProjectWorkflowDTOs";

// Import services
import { ProjectService } from "@/application/services/ProjectService";
import { PhaseService } from "@/application/services/PhaseService";
import { ProjectStakeholderService } from "@/application/services/ProjectStakeholderService";

// Types for UI state
export interface ProjectEditUIState {
  id?: string;
  title: string;
  description: string;
  location: string;
  status: string;
  budget: number;
  progress: number;
  startDate: string;
  endDate: string;
  teamSize: number;
  // UI computed fields
  formattedBudget: string;
  formattedStartDate: string;
  formattedEndDate: string;
  statusColor: string;
  canEdit: boolean;
  canDelete: boolean;
  isDirty: boolean;
  isValid: boolean;
}

export interface ProjectEditFormData {
  title: string;
  description: string;
  location: string;
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
  teamSize: number;
  progress?: number;
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
  phases?: PhaseDTO[];
  stakeholders?: any[];
  delegation?: Record<string, string>;
  materials?: any[];
}

const projectService = new ProjectService();

/**
 * Step 1: Load project data from database
 */
async function loadProjectForEdit(projectId: string): Promise<ProjectEditFormData | null> {
  // Step 7: Adapter returns Entity from Supabase
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

  // Step 8: Transform Entity to DTO for UI
  return {
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
    main_contractor: projectDetail.mainContractor as string || "",
    engineering_consultant: (projectDetail as any).engineeringConsultant || "",
    allows_initial_payment: projectDetail.allowsInitialPayment || false,
    initial_payment_percentage: projectDetail.initialPaymentPercentage || 0,
    current_phase: projectDetail.currentPhase || "",
    current_stage: projectDetail.currentStage as string || "",
    coordinates: projectDetail.coordinates,
    phases: projectDetail.plannedPhases || [],
    stakeholders: externalStakeholders,
    delegation,
  };
}

export function useProjectEditHex(projectId?: string) {
  const queryClient = useQueryClient();
  
  // Step 9: Local state for form data
  const [formData, setFormData] = useState<ProjectEditFormData | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [originalData, setOriginalData] = useState<ProjectEditFormData | null>(null);

  // Step 1: Load project data via query
  const { 
    data: loadedData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["project-edit-hex", projectId],
    queryFn: () => loadProjectForEdit(projectId!),
    enabled: !!projectId,
    staleTime: 60_000,
  });

  // Step 9: Update local state when data loads
  useEffect(() => {
    if (loadedData && !formData) {
      setFormData(loadedData);
      setOriginalData(loadedData);
    }
  }, [loadedData, formData]);

  // Step 2: Transform form data to UpdateProjectDTO
  const transformFormToUpdateRequest = useCallback((data: ProjectEditFormData): UpdateProjectDTO => {
    return ProjectWorkflowTransforms.formToUpdateRequest(data as Record<string, unknown>);
  }, []);

  // Step 1 (UI): Update form data from UI
  const updateFormData = useCallback((updates: Partial<ProjectEditFormData>) => {
    setFormData(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      setIsDirty(true);
      return updated;
    });
  }, []);

  // Steps 2-8: Save project mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ProjectEditFormData): Promise<SaveResult> => {
      if (!projectId) throw new Error("Project ID required");

      // Step 2: Transform form data to UpdateProjectDTO
      const updateRequest = transformFormToUpdateRequest(data);

      // Step 3-5: Service handles entity conversion and calls adapter
      await projectService.updateProject(projectId, {
        title: data.title,
        description: data.description,
        location: data.location,
        budget: data.budget,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        teamSize: data.teamSize,
        financingSource: data.financing_source || undefined,
        marketType: data.market_type || undefined,
        selectionMode: data.selection_mode || undefined,
        projectReference: data.project_reference || undefined,
        mainContractor: data.main_contractor || undefined,
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

      // Step 6-7: Database operation completed, adapter returns entity
      // Step 8: Service transforms entity to DTO
      return {
        success: true,
        projectId,
        data: data
      };
    },
    onSuccess: (result) => {
      // Step 9: Update state
      setIsDirty(false);
      setOriginalData(formData);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["project-edit-hex", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-summary", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      // Step 10: Toast success (UI updates via React Query invalidation)
      toast({
        title: "Projet sauvegardé",
        description: "Les modifications ont été enregistrées avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Validate form data
  const validateFormData = useCallback((data: ProjectEditFormData): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.title?.trim()) {
      errors.push("Le titre est obligatoire");
    }

    if (!data.location?.trim()) {
      warnings.push("La localisation est recommandée");
    }

    if (data.budget <= 0) {
      warnings.push("Le budget devrait être supérieur à 0");
    }

    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (end < start) {
        errors.push("La date de fin doit être après la date de début");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  // Transform to UI state
  const uiState = useCallback((): ProjectEditUIState | null => {
    if (!formData) return null;

    // Use transformer for UI conversion
    const entity = ProjectWorkflowTransforms.fromDTO({
      projectId: projectId,
      currentStep: 1,
      isDraft: false,
      isComplete: false,
      projectData: formData as any,
      relatedData: {
        phases: formData.phases || [],
        risks: []
      },
      metadata: {
        lastSavedAt: new Date().toISOString(),
        totalSteps: 7,
        completedSteps: 0,
        progressPercentage: formData.progress || 0
      }
    });

    const uiData = ProjectWorkflowTransforms.toUI(entity);

    return {
      id: projectId,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      status: formData.status,
      budget: formData.budget,
      progress: formData.progress || 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      teamSize: formData.teamSize,
      formattedBudget: uiData.formattedBudget as string,
      formattedStartDate: uiData.formattedStartDate as string,
      formattedEndDate: uiData.formattedEndDate as string,
      statusColor: uiData.statusColor as string,
      canEdit: uiData.canEdit as boolean,
      canDelete: uiData.canDelete as boolean,
      isDirty,
      isValid: validateFormData(formData).isValid
    };
  }, [formData, projectId, isDirty, validateFormData]);

  // Save with validation
  const saveProject = useCallback(async (): Promise<SaveResult> => {
    if (!formData) {
      return { success: false, errors: ["No form data"] };
    }

    const validation = validateFormData(formData);
    if (!validation.isValid) {
      toast({
        title: "Validation échouée",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return { success: false, errors: validation.errors };
    }

    return saveMutation.mutateAsync(formData);
  }, [formData, validateFormData, saveMutation]);

  // Reset form to original data
  const resetForm = useCallback(() => {
    if (originalData) {
      setFormData(originalData);
      setIsDirty(false);
    }
  }, [originalData]);

  return {
    // Form data and updates
    formData,
    updateFormData,
    
    // Loading states
    isLoading,
    isSaving: saveMutation.isPending,
    error,
    
    // Actions
    saveProject,
    refetch,
    resetForm,
    
    // Validation
    validateFormData,
    
    // UI state
    uiState: uiState(),
    isDirty,
    
    // Direct mutation access for advanced use
    saveMutation,
  };
}
