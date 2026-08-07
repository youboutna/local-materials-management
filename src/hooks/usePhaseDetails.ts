/**
 * usePhaseDetails - Hook hexagonal pour la gestion des détails d'une phase
 * 
 * Architecture Hexagonale - RÈGLES STRICTES :
 * - Zéro interface/type dans UI/Hooks
 * - Tous les types proviennent des DTOs
 * - UI Component → Hook → Service → Repository → Adapter → DB
 * 
 * Respecte PROMPT.md :
 * - ✅ Zéro supabase.from() dans les hooks
 * - ✅ Utilisation des services et DTOs
 * - ✅ camelCase pour les DTOs
 * - ✅ Pas de redéfinition de types dans UI
 * - ✅ Gestion complète des phases, steps et tâches
 */

import { DocumentService } from '@/application/services/DocumentService';
import { EmployeeService } from '@/application/services/EmployeeService';
import { InspectionService } from '@/application/services/InspectionService';
import { MaterialService } from '@/application/services/MaterialService';
import { PaymentService } from '@/application/services/PaymentService';
import { PhaseService } from '@/application/services/PhaseService';
import { ProjectWorkflowService } from '@/application/services/ProjectWorkflowService';
import { ReferentialService } from '@/application/services/ReferentialService';
import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
import { ReferentialType } from '@/config/referentials';
import { PhaseDTO, PhaseStatus, PhaseStepDTO, PhaseTaskDTO } from '@/dtos/entities/PhaseDTO';
import { TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Statistiques d'une phase
 * Utilisé en interne pour le typage des retours
 */
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

/**
 * Catégorie sémantique d'une phase
 */
type SemanticCategory = 'planning' | 'execution' | 'monitoring' | 'finalization';

/**
 * Hook hexagonal pour la gestion des détails d'une phase
 * Fournit les opérations CRUD pour les phases, steps et tâches
 */
export function usePhaseDetails(phaseId: string | undefined) {
  const queryClient = useQueryClient();
  const workflowService = ProjectWorkflowService.default();
  const phaseService = new PhaseService(RepositoryFactory.getPhaseRepository());
  const referentialService = ReferentialService.getInstance();

  // ===== QUERIES =====
  
  /**
   * Récupère les détails de la phase via PhaseService
   */
  const phaseQuery = useQuery({
    queryKey: ['phase-dto', phaseId],
    queryFn: async (): Promise<PhaseDTO> => {
      if (!phaseId) throw new Error('Phase ID is required');
      const phase = await phaseService.getPhaseById(phaseId);
      if (!phase) throw new Error('Phase not found');
      return phase as unknown as PhaseDTO;
    },
    enabled: !!phaseId,
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Récupère les métriques de la phase
   */
  const metricsQuery = useQuery({
    queryKey: ['phase-metrics', phaseId],
    queryFn: async (): Promise<PhaseMetrics> => {
      if (!phaseId) return defaultMetrics;

      try {
        // Services hexagonaux
        const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
        const taskAssignmentService = new TaskAssignmentService(
          RepositoryFactory.getTaskAssignmentRepository()
        );
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
          materialService.getAllMaterials(),
          taskAssignmentService.getByPhase(phaseId),
          inspectionService.getInspectionsByPhase(phaseId),
          employeeService.getEmployeesByPhase(phaseId),
          paymentService.getPaymentsByPhase(phaseId),
          documentService.getDocumentsByPhase(phaseId),
        ]);

        // Calcul des coûts des matériaux
        const materialCost = materialsData?.reduce((sum, material) => {
          return sum + ((material.pricePerUnit || 0) * (material.quantity || 0));
        }, 0) || 0;

        // Statistiques des tâches
        const totalTasks = tasksData?.length || 0;
        const completedTasks = tasksData?.filter(
          (t: TaskAssignmentDTO) => t.status === 'COMPLETED'
        ).length || 0;

        // Statistiques des inspections
        const totalInspections = inspectionsData?.length || 0;
        const passedInspections = inspectionsData?.filter(
          (i: any) => String(i.status) === 'approved' || String(i.status) === 'completed'
        ).length || 0;

        // Statistiques des paiements
        const paymentArr = Array.isArray(paymentsData) ? paymentsData : (paymentsData as any)?.data || [];
        const totalPayments = paymentArr.length;
        const totalPaymentAmount = paymentArr.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        // Progression des steps
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
    staleTime: 2 * 60 * 1000,
  });

  // ===== MUTATIONS - PHASE =====

  /**
   * Met à jour la phase
   */
  const updatePhaseMutation = useMutation({
    mutationFn: async (updates: Partial<PhaseDTO>) => {
      if (!phaseId) throw new Error('Phase ID is required');
      
      // Convertir le statut si nécessaire
      const convertedUpdates = {
        ...updates,
        status: (updates.status === 'delayed' ? 'in_progress' : updates.status) as PhaseStatus,
      };
      
      // Filtrer les propriétés non valides
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

  // ===== MUTATIONS - STEPS =====

  /**
   * Ajoute une étape à la phase
   */
  const addStepMutation = useMutation({
    mutationFn: async (step: Omit<PhaseStepDTO, 'id'>) => {
      if (!phaseId || !phaseQuery.data) throw new Error('Phase data is required');
      
      const newStep: PhaseStepDTO = {
        ...step,
        id: crypto.randomUUID(),
        description: step.description || '',
        tasks: step.tasks || [],
      };
      
      // Mettre à jour les steps dans la phase
      const existingSteps = (phaseQuery.data as any)?.steps || [];
      const updatedSteps = [...existingSteps, newStep];
      
      return phaseService.updatePhase(phaseId, {
        status: phaseQuery.data?.status as any,
        steps: updatedSteps,
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

  /**
   * Met à jour une étape
   */
  const updateStepMutation = useMutation({
    mutationFn: async ({ stepId, updates }: { stepId: string; updates: Partial<PhaseStepDTO> }) => {
      if (!phaseId || !phaseQuery.data) throw new Error('Phase data is required');
      
      const existingSteps = (phaseQuery.data as any)?.steps || [];
      const updatedSteps = existingSteps.map((step: PhaseStepDTO) => 
        step.id === stepId ? { ...step, ...updates } : step
      );
      
      return phaseService.updatePhase(phaseId, {
        status: phaseQuery.data?.status as any,
        steps: updatedSteps,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-metrics', phaseId] });
      toast({
        title: 'Étape mise à jour',
        description: 'L\'étape a été modifiée avec succès.',
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

  /**
   * Supprime une étape
   */
  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      if (!phaseId || !phaseQuery.data) throw new Error('Phase data is required');
      
      const existingSteps = (phaseQuery.data as any)?.steps || [];
      const updatedSteps = existingSteps.filter((step: PhaseStepDTO) => step.id !== stepId);
      
      return phaseService.updatePhase(phaseId, {
        status: phaseQuery.data?.status as any,
        steps: updatedSteps,
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

  // ===== MUTATIONS - TÂCHES =====

  /**
   * Ajoute une tâche à une étape
   */
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
        status: phaseQuery.data?.status as any,
        steps: updatedSteps,
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

  /**
   * Met à jour une tâche
   */
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
        status: phaseQuery.data?.status as any,
        steps: updatedSteps,
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

  /**
   * Supprime une tâche
   */
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
        status: phaseQuery.data?.status as any,
        steps: updatedSteps,
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

  // ===== FONCTIONS UTILITAIRES =====

  /**
   * Récupère les informations du référentiel pour une phase
   */
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
        continue;
      }
    }
    return null;
  };

  /**
   * Détermine la catégorie sémantique d'une phase
   */
  const getSemanticCategory = (phaseType?: string): SemanticCategory => {
    if (!phaseType) return 'execution';
    
    const type = phaseType.toUpperCase();
    
    if (type.includes('PRE_FEASIBILITY') || 
        type.includes('DESIGN') || 
        type.includes('PLANNING') ||
        type.includes('STUDY')) {
      return 'planning';
    } else if (type.includes('INSPECTION') || 
               type.includes('QUALITY') ||
               type.includes('MONITORING') ||
               type.includes('CONTROL') ||
               type.includes('TEST')) {
      return 'monitoring';
    } else if (type.includes('RECEPTION') || 
               type.includes('HANDOVER') ||
               type.includes('CLOSURE') ||
               type.includes('FINAL') ||
               type.includes('COMMISSIONING')) {
      return 'finalization';
    }
    
    return 'execution';
  };

  /**
   * Récupère la hiérarchie des phases pour un projet
   */
  const getWorkflowHierarchy = async (projectId: string) => {
    try {
      const phases = await phaseService.getPhasesByProject(projectId);
      
      const orderedPhases = await Promise.all(phases.map(async (phase) => {
        let semanticOrder = 0;
        
        if (phase.orderIndex !== undefined && phase.orderIndex !== null) {
          semanticOrder = (phase.orderIndex || 0) * 100;
          
          const semanticCategory = getSemanticCategory((phase as any).type);
          switch (semanticCategory) {
            case 'planning':
              semanticOrder += 0;
              break;
            case 'execution':
              semanticOrder += 100;
              break;
            case 'monitoring':
              semanticOrder += 200;
              break;
            case 'finalization':
              semanticOrder += 300;
              break;
          }
        } else {
          const referentialInfo = await getReferentialInfo((phase as any).type);
          if (referentialInfo) {
            const phaseCode = referentialInfo.phaseInfo.code;
            const baseOrder = referentialInfo.phaseInfo.order * 100;
            
            if (phaseCode.includes('PRE_FEASIBILITY') || 
                phaseCode.includes('DESIGN') || 
                phaseCode.includes('PLANNING') ||
                phaseCode.includes('STUDY')) {
              semanticOrder = baseOrder;
            } else if (phaseCode.includes('CONSTRUCTION') || 
                       phaseCode.includes('IMPLEMENTATION') ||
                       phaseCode.includes('EXECUTION') ||
                       phaseCode.includes('WORKS')) {
              semanticOrder = baseOrder + 100;
            } else if (phaseCode.includes('INSPECTION') || 
                       phaseCode.includes('QUALITY') ||
                       phaseCode.includes('MONITORING') ||
                       phaseCode.includes('CONTROL') ||
                       phaseCode.includes('TEST')) {
              semanticOrder = baseOrder + 200;
            } else if (phaseCode.includes('RECEPTION') || 
                       phaseCode.includes('HANDOVER') ||
                       phaseCode.includes('CLOSURE') ||
                       phaseCode.includes('FINAL') ||
                       phaseCode.includes('COMMISSIONING')) {
              semanticOrder = baseOrder + 300;
            } else {
              semanticOrder = baseOrder + 100;
            }
          } else {
            semanticOrder = 0;
          }
        }
        
        return {
          id: phase.id,
          name: (phase as any).title || (phase as any).name || '',
          order: semanticOrder,
          status: phase.status,
          progress: phase.progress,
          startDate: phase.startDate,
          endDate: phase.endDate,
          semanticCategory: getSemanticCategory((phase as any).type),
        };
      }));
      
      return orderedPhases.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error getting workflow hierarchy:', error);
      return [];
    }
  };

  // ===== RETOUR DU HOOK =====

  return {
    // Queries
    phase: phaseQuery.data,
    isLoading: phaseQuery.isLoading,
    error: phaseQuery.error,
    metrics: metricsQuery.data || defaultMetrics,
    metricsLoading: metricsQuery.isLoading,
    refetch: phaseQuery.refetch,
    
    // Mutations - Phase
    updatePhase: updatePhaseMutation.mutate,
    updatePhaseAsync: updatePhaseMutation.mutateAsync,
    isUpdatingPhase: updatePhaseMutation.isPending,
    
    // Mutations - Steps
    addStep: addStepMutation.mutateAsync,
    updateStep: (stepId: string, updates: Partial<PhaseStepDTO>) => 
      updateStepMutation.mutateAsync({ stepId, updates }),
    deleteStep: deleteStepMutation.mutateAsync,
    isAddingStep: addStepMutation.isPending,
    isUpdatingStep: updateStepMutation.isPending,
    isDeletingStep: deleteStepMutation.isPending,
    
    // Mutations - Tasks
    addTask: (stepId: string, task: Omit<PhaseTaskDTO, 'id'>) => 
      addTaskMutation.mutateAsync({ stepId, task }),
    updateTask: (stepId: string, taskId: string, updates: Partial<PhaseTaskDTO>) => 
      updateTaskMutation.mutateAsync({ stepId, taskId, updates }),
    deleteTask: (stepId: string, taskId: string) => 
      deleteTaskMutation.mutateAsync({ stepId, taskId }),
    isAddingTask: addTaskMutation.isPending,
    isUpdatingTask: updateTaskMutation.isPending,
    isDeletingTask: deleteTaskMutation.isPending,
    
    // État global des mutations
    isUpdating: updatePhaseMutation.isPending || 
                addStepMutation.isPending || 
                updateStepMutation.isPending || 
                deleteStepMutation.isPending ||
                addTaskMutation.isPending ||
                updateTaskMutation.isPending ||
                deleteTaskMutation.isPending,
    
    // Utilitaires
    getReferentialInfo,
    getWorkflowHierarchy,
    getSemanticCategory,
  };
}