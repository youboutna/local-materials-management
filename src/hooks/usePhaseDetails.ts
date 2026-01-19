import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PhaseService, PhaseData } from '@/services/phaseService';
import { WorkflowPhaseService } from '@/services/WorkflowPhaseService';
import { referentialService } from '@/services/ReferentialService';
import { PhaseDTO, PhaseStatus, PhaseStepDTO, PhaseTaskDTO } from '@/types/phase-dto';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PhaseMetrics {
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
  milestoneProgress: number;
  stepsCount: number;
  completedSteps: number;
}

const defaultMetrics: PhaseMetrics = {
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
  stepsCount: 0,
  completedSteps: 0,
};

export function usePhaseDetails(phaseId: string | undefined) {
  const queryClient = useQueryClient();
  const workflowService = new WorkflowPhaseService();

  // Fetch phase details using PhaseService DTO method
  const phaseQuery = useQuery({
    queryKey: ['phase-dto', phaseId],
    queryFn: async () => {
      if (!phaseId) throw new Error('Phase ID is required');
      const phase = await PhaseService.getPhaseDTOById(phaseId);
      if (!phase) throw new Error('Phase not found');
      return phase;
    },
    enabled: !!phaseId,
  });

  // Fetch phase metrics
  const metricsQuery = useQuery({
    queryKey: ['phase-metrics', phaseId],
    queryFn: async (): Promise<PhaseMetrics> => {
      if (!phaseId) return defaultMetrics;

      try {
        const [
          materialData,
          tasksData,
          inspectionsData,
          employeeData,
          paymentsData,
          documentsData,
        ] = await Promise.all([
          supabase.from('project_materials').select('quantity, material_id').eq('phase_id', phaseId),
          supabase.from('task_assignments').select('status').eq('phase_id', phaseId),
          supabase.from('inspections').select('status').eq('phase_id', phaseId),
          supabase.from('phase_employees').select('*').eq('phase_id', phaseId),
          supabase.from('payments').select('amount').eq('phase_id', phaseId),
          supabase.from('documents').select('id, document_type').eq('phase_id', phaseId),
        ]);

        // Calculate material cost
        const materialIds = materialData.data?.map((m) => m.material_id).filter(Boolean) || [];
        let materialCost = 0;

        if (materialIds.length > 0) {
          const { data: materials } = await supabase
            .from('materials')
            .select('id, price_per_unit')
            .in('id', materialIds);

          materialCost = materialData.data?.reduce((sum, pm) => {
            const material = materials?.find((m) => m.id === pm.material_id);
            return sum + (pm.quantity || 0) * (material?.price_per_unit || 0);
          }, 0) || 0;
        }

        const totalTasks = tasksData.data?.length || 0;
        const completedTasks = tasksData.data?.filter((t) => t.status === 'completed').length || 0;
        const totalInspections = inspectionsData.data?.length || 0;
        const passedInspections = inspectionsData.data?.filter(
          (i) => i.status === 'approved' || i.status === 'passed'
        ).length || 0;
        const totalPayments = paymentsData.data?.length || 0;
        const totalPaymentAmount = paymentsData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Calculate steps progress from phase DTO
        const phase = phaseQuery.data;
        const stepsCount = phase?.steps?.length || 0;
        const completedSteps = phase?.steps?.filter((s) => s.status === 'completed').length || 0;
        const milestoneProgress = stepsCount > 0 ? (completedSteps / stepsCount) * 100 : 0;

        return {
          materialCost,
          totalMaterials: materialData.data?.length || 0,
          totalTasks,
          completedTasks,
          taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          totalInspections,
          passedInspections,
          inspectionPassRate: totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0,
          totalEmployees: employeeData.data?.length || 0,
          totalPayments,
          totalPaymentAmount,
          totalDocuments: documentsData.data?.length || 0,
          milestoneProgress,
          stepsCount,
          completedSteps,
        };
      } catch (error) {
        console.error('Error fetching metrics:', error);
        return defaultMetrics;
      }
    },
    enabled: !!phaseId && !!phaseQuery.data,
  });

  // Get referential information for this phase
  const getReferentialInfo = (constructionPhase?: string) => {
    if (!constructionPhase) return null;
    const referentials = referentialService.getAllReferentials();
    for (const ref of referentials) {
      try {
        const phases = referentialService.getPhasesForReferential(ref.code as any);
        const matchingPhase = phases.find((p: any) => p.code === constructionPhase);
        if (matchingPhase) {
          return {
            referential: ref,
            phaseInfo: matchingPhase,
          };
        }
      } catch {
        // Skip referentials that can't be loaded
        continue;
      }
    }
    return null;
  };

  // Update phase mutation using PhaseService
  const updatePhaseMutation = useMutation({
    mutationFn: async (updates: Partial<PhaseDTO>) => {
      if (!phaseId) throw new Error('Phase ID is required');
      return PhaseService.updatePhaseFromDTO(phaseId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-metrics', phaseId] });
      toast({
        title: 'Phase mise à jour',
        description: 'Les modifications ont été enregistrées avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour la phase.',
        variant: 'destructive',
      });
    },
  });

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({
      stepId,
      taskId,
      status,
      progress,
    }: {
      stepId: string;
      taskId: string;
      status: PhaseStatus;
      progress: number;
    }) => {
      if (!phaseId) throw new Error('Phase ID is required');
      return PhaseService.updateTaskStatus(phaseId, stepId, taskId, status, progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-metrics', phaseId] });
      toast({
        title: 'Tâche mise à jour',
        description: 'Le statut de la tâche a été modifié.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Add step mutation
  const addStepMutation = useMutation({
    mutationFn: async (step: Omit<PhaseStepDTO, 'id'>) => {
      if (!phaseId || !phaseQuery.data) throw new Error('Phase data is required');
      
      const newStep: PhaseStepDTO = {
        ...step,
        id: crypto.randomUUID(),
      };
      
      const updatedSteps = [...phaseQuery.data.steps, newStep];
      return PhaseService.updatePhaseFromDTO(phaseId, { steps: updatedSteps });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-metrics', phaseId] });
      toast({
        title: 'Étape ajoutée',
        description: 'L\'étape a été ajoutée avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update step mutation
  const updateStepMutation = useMutation({
    mutationFn: async ({ stepId, updates }: { stepId: string; updates: Partial<PhaseStepDTO> }) => {
      if (!phaseId || !phaseQuery.data) throw new Error('Phase data is required');
      
      const updatedSteps = phaseQuery.data.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      );
      
      return PhaseService.updatePhaseFromDTO(phaseId, { steps: updatedSteps });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-metrics', phaseId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete step mutation
  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      if (!phaseId || !phaseQuery.data) throw new Error('Phase data is required');
      
      const updatedSteps = phaseQuery.data.steps.filter(step => step.id !== stepId);
      return PhaseService.updatePhaseFromDTO(phaseId, { steps: updatedSteps });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-metrics', phaseId] });
      toast({
        title: 'Étape supprimée',
        description: 'L\'étape a été supprimée avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async ({ stepId, task }: { stepId: string; task: Omit<PhaseTaskDTO, 'id'> }) => {
      if (!phaseId || !phaseQuery.data) throw new Error('Phase data is required');
      
      const newTask: PhaseTaskDTO = {
        ...task,
        id: crypto.randomUUID(),
      };
      
      const updatedSteps = phaseQuery.data.steps.map(step => 
        step.id === stepId 
          ? { ...step, tasks: [...step.tasks, newTask] }
          : step
      );
      
      return PhaseService.updatePhaseFromDTO(phaseId, { steps: updatedSteps });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-metrics', phaseId] });
      toast({
        title: 'Tâche ajoutée',
        description: 'La tâche a été ajoutée avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ 
      stepId, 
      taskId, 
      updates 
    }: { 
      stepId: string; 
      taskId: string; 
      updates: Partial<PhaseTaskDTO> 
    }) => {
      if (!phaseId || !phaseQuery.data) throw new Error('Phase data is required');
      
      const updatedSteps = phaseQuery.data.steps.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              tasks: step.tasks.map(task => 
                task.id === taskId ? { ...task, ...updates } : task
              )
            }
          : step
      );
      
      return PhaseService.updatePhaseFromDTO(phaseId, { steps: updatedSteps });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-metrics', phaseId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async ({ stepId, taskId }: { stepId: string; taskId: string }) => {
      if (!phaseId || !phaseQuery.data) throw new Error('Phase data is required');
      
      const updatedSteps = phaseQuery.data.steps.map(step => 
        step.id === stepId 
          ? { ...step, tasks: step.tasks.filter(task => task.id !== taskId) }
          : step
      );
      
      return PhaseService.updatePhaseFromDTO(phaseId, { steps: updatedSteps });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-metrics', phaseId] });
      toast({
        title: 'Tâche supprimée',
        description: 'La tâche a été supprimée avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get workflow hierarchy for the project
  const getWorkflowHierarchy = async (projectId: string) => {
    return workflowService.getProjectPhaseHierarchy(projectId);
  };

  return {
    phase: phaseQuery.data,
    isLoading: phaseQuery.isLoading,
    error: phaseQuery.error,
    metrics: metricsQuery.data || defaultMetrics,
    metricsLoading: metricsQuery.isLoading,
    updatePhase: updatePhaseMutation.mutate,
    updatePhaseAsync: updatePhaseMutation.mutateAsync,
    isUpdating: updatePhaseMutation.isPending || 
                addStepMutation.isPending || 
                updateStepMutation.isPending || 
                deleteStepMutation.isPending ||
                addTaskMutation.isPending ||
                updateTaskMutation.isPending ||
                deleteTaskMutation.isPending,
    updateTaskStatus: updateTaskStatusMutation.mutate,
    // Step operations
    addStep: addStepMutation.mutateAsync,
    updateStep: (stepId: string, updates: Partial<PhaseStepDTO>) => 
      updateStepMutation.mutateAsync({ stepId, updates }),
    deleteStep: deleteStepMutation.mutateAsync,
    // Task operations
    addTask: (stepId: string, task: Omit<PhaseTaskDTO, 'id'>) => 
      addTaskMutation.mutateAsync({ stepId, task }),
    updateTask: (stepId: string, taskId: string, updates: Partial<PhaseTaskDTO>) => 
      updateTaskMutation.mutateAsync({ stepId, taskId, updates }),
    deleteTask: (stepId: string, taskId: string) => 
      deleteTaskMutation.mutateAsync({ stepId, taskId }),
    getReferentialInfo,
    getWorkflowHierarchy,
    refetch: phaseQuery.refetch,
  };
}
