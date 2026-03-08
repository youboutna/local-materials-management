import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PhaseService } from '@/application/services/PhaseService';
import { ProjectWorkflowService } from '@/application/services/ProjectWorkflowService';
import { referentialService } from '@/application/services/ReferentialService';
import { PhaseDTO, PhaseStatus, PhaseStepDTO, PhaseTaskDTO, UpdatePhaseDTO } from '@/dtos/entities/PhaseDTO';
import { ReferentialType } from '@/config/referentials';
import { toast } from '@/hooks/use-toast';
import { MaterialService } from '@/application/services/MaterialService';
import { TaskService } from '@/application/services/TaskService';
import { InspectionService } from '@/application/services/InspectionService';
import { EmployeeService } from '@/application/services/EmployeeService';
import { PaymentService } from '@/application/services/PaymentService';
import { DocumentService } from '@/application/services/DocumentService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
  const workflowService = new ProjectWorkflowService(
    RepositoryFactory.getProjectRepository(),
    RepositoryFactory.getPhaseRepository(),
    RepositoryFactory.getRiskRepository(),
    RepositoryFactory.getProjectStakeholderRepository()
  );
  const phaseService = new PhaseService(RepositoryFactory.getPhaseRepository());

  // Fetch phase details using PhaseService DTO method
  const phaseQuery = useQuery({
    queryKey: ['phase-dto', phaseId],
    queryFn: async () => {
      if (!phaseId) throw new Error('Phase ID is required');
      const phase = await phaseService.getPhaseById(phaseId);
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
        // Utiliser les services hexagonaux au lieu des appels directs Supabase
        const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
        const taskService = new TaskService(RepositoryFactory.getTaskRepository());
        const inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());
        const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
        const paymentService = new PaymentService(RepositoryFactory.getPaymentRepository());
        const documentService = new DocumentService(RepositoryFactory.getDocumentRepository());

        const [
          materialsData,
          tasksData,
          inspectionsData,
          employeeData,
          paymentsData,
          documentsData,
        ] = await Promise.all([
          materialService.getAllMaterials().then(m => m || []),
          taskService.getTasksByPhase(phaseId),
          inspectionService.getInspectionsByPhase(phaseId),
          employeeService.getEmployeesByPhase(phaseId),
          paymentService.getPaymentsByPhase(phaseId),
          documentService.getDocumentsByPhase(phaseId),
        ]);

        // Calculate material cost using MaterialService
        let materialCost = 0;
        
        if (materialsData && materialsData.length > 0) {
          materialCost = materialsData.reduce((sum, material) => {
            return sum + (material.pricePerUnit * material.quantity || 0);
          }, 0) || 0;
        }

        const totalTasks = tasksData?.length || 0;
        const completedTasks = tasksData?.filter((t) => t.status === 'completed').length || 0;
        const totalInspections = inspectionsData?.length || 0;
        const passedInspections = inspectionsData?.filter(
          (i) => i.status === 'approved' || i.status === 'completed'
        ).length || 0;
        const totalPayments = (paymentsData as any)?.length || (paymentsData as any)?.data?.length || 0;
        const paymentArr = Array.isArray(paymentsData) ? paymentsData : (paymentsData as any)?.data || [];
        const totalPaymentAmount = paymentArr.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        // Calculate steps progress from phase DTO
        const phase = phaseQuery.data;
        const stepsArr = (phase as any)?.steps || [];
        const stepsCount = stepsArr.length;
        const completedSteps = stepsArr.filter((s: any) => s.status === 'completed').length;
        const milestoneProgress = stepsCount > 0 ? (completedSteps / stepsCount) * 100 : 0;

        return {
          materialCost,
          totalMaterials: materialsData?.length || 0,
          totalTasks,
          completedTasks,
          taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          totalInspections,
          passedInspections,
          inspectionPassRate: totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0,
          totalEmployees: employeeData?.length || 0,
          totalPayments,
          totalPaymentAmount,
          totalDocuments: documentsData?.length || 0,
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

  // Update phase mutation using PhaseService
  const updatePhaseMutation = useMutation({
    mutationFn: async (updates: Partial<PhaseDTO>) => {
      if (!phaseId) throw new Error('Phase ID is required');
      // Convert status to match expected type
      const convertedUpdates = {
        ...updates,
        status: (updates.status === 'delayed' ? 'in_progress' : updates.status) as PhaseStatus
      };
      // Filter out steps property since UpdatePhaseDTO doesn't accept it
      const { steps, ...validUpdates } = convertedUpdates as any;
      return phaseService.updatePhase(phaseId, validUpdates);
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
      return phaseService.updateTaskStatus(phaseId, stepId, taskId, status, progress);
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
        description: step.description || '', // Ensure description is not undefined
        tasks: step.tasks || [] // Ensure tasks is array
      } as PhaseStepDTO; // Cast to PhaseStepDTO
      newStep.id = crypto.randomUUID();
      
      const existingSteps = (phaseQuery.data as any)?.steps || [];
      const updatedSteps = [...existingSteps, newStep];
      
      return phaseService.updatePhase(phaseId, { 
        status: phaseQuery.data?.status as any
      } as any);
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
      
      const existingSteps = (phaseQuery.data as any)?.steps || [];
      const updatedSteps = existingSteps.map((step: PhaseStepDTO) => 
        step.id === stepId ? { ...step, ...updates } : step
      );
      
      return phaseService.updatePhase(phaseId, { 
        status: phaseQuery.data?.status as any
      } as any);
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
      
      const existingSteps = (phaseQuery.data as any)?.steps || [];
      const updatedSteps = existingSteps.filter((step: PhaseStepDTO) => step.id !== stepId);
      return phaseService.updatePhase(phaseId, { 
        status: phaseQuery.data?.status as any
      } as any);
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
      
      const existingSteps = (phaseQuery.data as any)?.steps || [];
      const updatedSteps = existingSteps.map((step: PhaseStepDTO) => 
        step.id === stepId 
          ? { ...step, tasks: [...(step.tasks || []), newTask] }
          : step
      );
      
      return phaseService.updatePhase(phaseId, { 
        status: phaseQuery.data?.status as any
      } as any);
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
      
      const existingSteps = (phaseQuery.data as any)?.steps || [];
      const updatedSteps = existingSteps.map((step: PhaseStepDTO) => 
        step.id === stepId 
          ? { 
              ...step, 
              tasks: (step.tasks || []).map((task: PhaseTaskDTO) => 
                task.id === taskId ? { ...task, ...updates } : task
              )
            }
          : step
      );
      
      return phaseService.updatePhase(phaseId, { 
        status: phaseQuery.data?.status as any
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-metrics', phaseId] });
      toast({
        title: 'Tâche mise à jour',
        description: 'La tâche a été modifiée avec succès.',
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

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async ({ stepId, taskId }: { stepId: string; taskId: string }) => {
      if (!phaseId || !phaseQuery.data) throw new Error('Phase data is required');
      
      const existingSteps = (phaseQuery.data as any)?.steps || [];
      const updatedSteps = existingSteps.map((step: PhaseStepDTO) => 
        step.id === stepId 
          ? { 
              ...step, 
              tasks: (step.tasks || []).filter((task: PhaseTaskDTO) => task.id !== taskId)
            }
          : step
      );
      
      return phaseService.updatePhase(phaseId, { 
        status: phaseQuery.data?.status as any
      } as any);
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

  // Get referential information for this phase
  const getReferentialInfo = async (phaseType?: string) => {
    if (!phaseType) return null;
    const referentials = await referentialService.getAllReferentials();
    for (const ref of referentials) {
      try {
        const phases = await referentialService.getPhasesForReferential(ref.code as ReferentialType);
        const matchingPhase = phases.find((p) => p.code === phaseType);
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

  // Get workflow hierarchy for the project
  const getWorkflowHierarchy = async (projectId: string) => {
    try {
      // Use PhaseService to get all phases for the project
      const phases = await phaseService.getPhasesByProject(projectId);
      
      // Calculate semantic order based on referential data and phase types
      const orderedPhases = await Promise.all(phases.map(async phase => {
        let semanticOrder = 0;
        
        // Use stored orderIndex if available, otherwise calculate from referential
        if (phase.orderIndex !== undefined && phase.orderIndex !== null) {
          semanticOrder = (phase.orderIndex || 0) * 100;
          
          // Add semantic category offset based on phase type
          const semanticCategory = getSemanticCategory((phase as any).type);
          switch (semanticCategory) {
            case 'planning':
              semanticOrder += 0; // Planning: 0-99
              break;
            case 'execution':
              semanticOrder += 100; // Execution: 100-199
              break;
            case 'monitoring':
              semanticOrder += 200; // Monitoring: 200-299
              break;
            case 'finalization':
              semanticOrder += 300; // Finalization: 300-399
              break;
          }
        } else {
          // Fallback: calculate from referential if no stored orderIndex
          const referentialInfo = await getReferentialInfo((phase as any).type);
          if (referentialInfo) {
            const phaseCode = referentialInfo.phaseInfo.code;
            const baseOrder = referentialInfo.phaseInfo.order * 100;
            
            // Planning phases (0-99): Pre-feasibility, design, planning
            if (phaseCode.includes('PRE_FEASIBILITY') || 
                phaseCode.includes('DESIGN') || 
                phaseCode.includes('PLANNING') ||
                phaseCode.includes('STUDY')) {
              semanticOrder = baseOrder; // 100-999
            }
            // Execution phases (100-199): Construction, implementation
            else if (phaseCode.includes('CONSTRUCTION') || 
                     phaseCode.includes('IMPLEMENTATION') ||
                     phaseCode.includes('EXECUTION') ||
                     phaseCode.includes('WORKS')) {
              semanticOrder = baseOrder + 100; // 200-299
            }
            // Monitoring/Inspection phases (200-299): Quality control, monitoring
            else if (phaseCode.includes('INSPECTION') || 
                     phaseCode.includes('QUALITY') ||
                     phaseCode.includes('MONITORING') ||
                     phaseCode.includes('CONTROL') ||
                     phaseCode.includes('TEST')) {
              semanticOrder = baseOrder + 200; // 300-399
            }
            // Final phases (300-399): Reception, handover, closure
            else if (phaseCode.includes('RECEPTION') || 
                     phaseCode.includes('HANDOVER') ||
                     phaseCode.includes('CLOSURE') ||
                     phaseCode.includes('FINAL') ||
                     phaseCode.includes('COMMISSIONING')) {
              semanticOrder = baseOrder + 300; // 400-499
            }
            // Default execution order for other phases
            else {
              semanticOrder = baseOrder + 100;
            }
          } else {
            // Default order if no referential info found - use 0 as base
            semanticOrder = 0;
          }
        }
        
        return {
          id: phase.id,
          name: phase.name,
          order: semanticOrder,
          status: phase.status,
          progress: phase.progress,
          startDate: phase.startDate,
          endDate: phase.endDate,
          semanticCategory: getSemanticCategory(phase.type)
        };
      }));
      
      // Sort by semantic order
      return orderedPhases.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error getting workflow hierarchy:', error);
      return [];
    }
  };

  // Helper function to determine semantic category
  const getSemanticCategory = (phaseType?: string): 'planning' | 'execution' | 'monitoring' | 'finalization' => {
    if (!phaseType) return 'execution';
    
    const type = phaseType.toUpperCase();
    
    if (type.includes('PRE_FEASIBILITY') || 
        type.includes('DESIGN') || 
        type.includes('PLANNING') ||
        type.includes('STUDY')) {
      return 'planning';
    }
    else if (type.includes('INSPECTION') || 
             type.includes('QUALITY') ||
             type.includes('MONITORING') ||
             type.includes('CONTROL') ||
             type.includes('TEST')) {
      return 'monitoring';
    }
    else if (type.includes('RECEPTION') || 
             type.includes('HANDOVER') ||
             type.includes('CLOSURE') ||
             type.includes('FINAL') ||
             type.includes('COMMISSIONING')) {
      return 'finalization';
    }
    
    return 'execution';
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
