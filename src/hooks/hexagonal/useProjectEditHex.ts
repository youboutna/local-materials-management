/**
 * useProjectEditHex - Hook Hexagonal pour l'Édition de Projets
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

// Import DTOs
import { ProjectDTO, UpdateProjectDTO } from "@/dtos/entities/ProjectDTO";
import { PhaseDTO } from "@/dtos/entities/PhaseDTO";
import { ProjectWorkflowData, SaveResult, ValidationResult } from "@/dtos/workflows/ProjectWorkflowDTOs";

// Import services
import { ProjectService } from "@/application/services/ProjectService";
import { PhaseService } from "@/application/services/PhaseService";
import { ProjectStakeholderService } from "@/application/services/ProjectStakeholderService";
import { ReferentialService } from "@/application/services/ReferentialService";
import { RepositoryFactory } from "@/infrastructure/supabase/RepositoryFactory";

// Import transformer for UI conversions
import { ProjectWorkflowTransforms } from "@/dtos/transforms/ProjectWorkflowTransforms";

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
  thumbnail: string;
  teamSize: number;
  financing_source: string;
  market_type: string;
  selection_mode: string;
  project_reference: string;
  main_contractor: string;
  engineering_consultant: string;
  allows_initial_payment: boolean;
  initial_payment_percentage: number;
  current_phase: string;
  current_stage: string;
  coordinates?: { latitude: number; longitude: number };
  phases?: PhaseDTO[];
  stakeholders?: any[];
  delegation?: Record<string, string>;
  materials?: any[];
}

export interface ProjectEditFormData extends ProjectEditUIState {
  id?: string;
}

async function loadProjectForEdit(projectId: string): Promise<ProjectEditFormData | null> {
  try {
    const projectService = new ProjectService(
      RepositoryFactory.getProjectRepository(),
      RepositoryFactory.getProjectStakeholderRepository()
    );
    const referentialService = ReferentialService.getInstance();
    
    const projectDetail = await projectService.getProjectWithDetails(projectId);
    if (!projectDetail) return null;

    const projectStakeholderService = new ProjectStakeholderService(
      RepositoryFactory.getProjectRepository(),
      RepositoryFactory.getProjectStakeholderRepository()
    );
    const stakeholdersData = await projectStakeholderService.getProjectStakeholders(projectId);

    if (projectDetail.projectReference) {
      try {
        const referential = await referentialService.getReferential(projectDetail.projectReference as any);
        if (!referential) {
          console.warn(`Referential ${projectDetail.projectReference} not found`);
        }
      } catch (error) {
        console.error('Error validating project referential:', error);
      }
    }

    const delegation: Record<string, string> = {};
    const externalStakeholders: any[] = [];

    stakeholdersData?.forEach((sh: any) => {
      if (sh.stakeholder_entity_type === "employee" && sh.employee_id) {
        if (sh.stakeholder_type === "project_manager") {
          delegation.projectManager = sh.employee_id;
        } else if (sh.stakeholder_type === "technical_manager") {
          delegation.technicalManager = sh.employee_id;
        }
      } else if (sh.stakeholder_entity_type === "supplier" && sh.supplier_id) {
        externalStakeholders.push({
          id: sh.id,
          stakeholder_type: sh.stakeholder_type,
          stakeholder_entity_type: sh.stakeholder_entity_type,
          supplier_id: sh.supplier_id,
          role_description: sh.role_description,
          is_primary: sh.is_active,
        });
      }
    });

    return {
      id: projectDetail.id,
      title: projectDetail.title || '',
      description: projectDetail.description || '',
      location: projectDetail.location || '',
      status: projectDetail.status || 'draft',
      budget: projectDetail.budget || 0,
      progress: projectDetail.progress || 0,
      startDate: projectDetail.startDate?.split('T')[0] || '',
      endDate: projectDetail.endDate?.split('T')[0] || '',
      thumbnail: projectDetail.thumbnail || '',
      teamSize: projectDetail.teamSize || 1,
      financing_source: (projectDetail as any).financingSource || "",
      market_type: (projectDetail as any).marketType || "",
      selection_mode: (projectDetail as any).selectionMode || "",
      project_reference: (projectDetail as any).projectReferenceNumber || "",
      main_contractor: (projectDetail as any).mainContractor as string || "",
      engineering_consultant: (projectDetail as any).engineeringConsultant || "",
      allows_initial_payment: (projectDetail as any).allowsInitialPayment || false,
      initial_payment_percentage: (projectDetail as any).initialAdvancePercentage || 0,
      current_phase: (projectDetail as any).currentPhase || "",
      current_stage: (projectDetail as any).currentStage as string || "",
      coordinates: projectDetail.coordinates ? {
        latitude: projectDetail.coordinates.latitude,
        longitude: projectDetail.coordinates.longitude
      } : undefined,
      phases: (projectDetail as any).plannedPhases || [],
      stakeholders: externalStakeholders,
      delegation,
    };
  } catch (error) {
    console.error('Error loading project for edit:', error);
    throw error;
  }
}

export function useProjectEditHex(projectId?: string) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ProjectEditFormData | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [originalData, setOriginalData] = useState<ProjectEditFormData | null>(null);

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

  useEffect(() => {
    if (loadedData && !formData) {
      setFormData(loadedData);
      setOriginalData(loadedData);
    }
  }, [loadedData, formData]);

  const transformFormToUpdateRequest = useCallback((data: ProjectEditFormData): UpdateProjectDTO => {
    return ProjectWorkflowTransforms.formToUpdateRequest(data as unknown as Record<string, unknown>);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (data: ProjectEditFormData): Promise<SaveResult> => {
      if (!projectId) throw new Error("Project ID required");

      try {
        const projectService = new ProjectService(
          RepositoryFactory.getProjectRepository(),
          RepositoryFactory.getProjectStakeholderRepository()
        );
        const referentialService = ReferentialService.getInstance();
        
        const updateRequest = transformFormToUpdateRequest(data);
        
        if (data.project_reference) {
          try {
            const referential = await referentialService.getReferential(data.project_reference as any);
            if (!referential) {
              throw new Error(`Referential ${data.project_reference} not found`);
            }
          } catch (error) {
            console.error('❌ Referential validation failed:', error);
            throw new Error(`Invalid project referential: ${data.project_reference}`);
          }
        }

        const updatedProject = await projectService.update(projectId, updateRequest);
        if (!updatedProject) {
          throw new Error("Failed to update project");
        }

        // Update phases if provided
        if (data.phases && data.phases.length > 0) {
          const phaseService = new PhaseService(RepositoryFactory.getPhaseRepository());
          // Use available phase methods instead of non-existent saveProjectPhases
          for (const phase of data.phases) {
            if (phase.id) {
              await phaseService.updatePhase(phase.id, phase);
            } else {
              await phaseService.createPhase(phase, projectId);
            }
          }
        }

        return {
          success: true,
          data: {
            id: updatedProject.id,
            title: updatedProject.title,
            status: updatedProject.status,
            progress: updatedProject.progress || 0,
            updatedAt: updatedProject.updatedAt
          }
        };
      } catch (error) {
        console.error('❌ Save project error:', error);
        return {
          success: false,
          errors: [error instanceof Error ? error.message : 'Unknown error occurred']
        };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Succès",
          description: "Projet sauvegardé avec succès",
        });
        setIsDirty(false);
        queryClient.invalidateQueries({ queryKey: ["project-edit-hex", projectId] });
        queryClient.invalidateQueries({ queryKey: ["project-materials", projectId] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
    },
  });

  const validateFormData = useCallback((data: ProjectEditFormData): ValidationResult => {
    const errors: string[] = [];

    if (!data.title?.trim()) {
      errors.push("Le titre est obligatoire");
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
    };
  }, []);

  const saveProject = useCallback(async (): Promise<SaveResult> => {
    if (!formData) {
      return { success: false, errors: ["No form data"] };
    }

    const validation = validateFormData(formData);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    return saveMutation.mutateAsync(formData);
  }, [formData, validateFormData, saveMutation]);

  const resetForm = useCallback(() => {
    if (originalData) {
      setFormData(originalData);
      setIsDirty(false);
    }
  }, [originalData]);

  const updateFormData = useCallback((updates: Partial<ProjectEditFormData>) => {
    setFormData(prev => {
      if (!prev) return prev;
      const newData = { ...prev, ...updates };
      setIsDirty(true);
      return newData;
    });
  }, []);

  const uiState = useCallback((): ProjectEditUIState | null => {
    if (!formData) return null;
    return { ...formData };
  }, [formData]);

  return {
    formData,
    uiState,
    originalData,
    isLoading,
    isSaving: saveMutation.isPending,
    error,
    saveProject,
    refetch,
    resetForm,
    updateFormData,
    validateFormData,
    isDirty,
    saveMutation,
  };
}
