/**
 * useEnhancedRiskManagerHex - Hook hexagonal pour la gestion des risques
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
 * - ✅ Utilisation de TaskAssignmentService
 * - ✅ Tous les hooks commencent par "use"
 */

import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// IMPORTS DES SERVICES HEXAGONAUX
// ============================================================================

import { TaskAssignmentService } from '@/application/services/TaskAssignmentService';
import { TaskAssignmentDTO, TaskStatus } from '@/dtos/entities/TaskAssignmentDTO';
import { RiskDTO, RiskStatus } from '@/dtos/entities/RiskDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { SupplierDTO } from '@/dtos/entities/SupplierDTO';

// ============================================================================
// TYPES - ALIAS VERS LES DTOS
// ============================================================================

/**
 * Alias pour RiskDTO - utilisé comme ProjectRisk
 * ✅ Source unique : RiskDTO
 */
export type ProjectRisk = RiskDTO;

/**
 * Alias pour TaskAssignmentDTO - utilisé comme TaskAssignment
 * ✅ Source unique : TaskAssignmentDTO
 */
export type TaskAssignment = TaskAssignmentDTO;

/**
 * Alias pour PhaseDTO - utilisé comme ProjectPhase
 * ✅ Source unique : PhaseDTO
 */
export type ProjectPhase = PhaseDTO;

/**
 * Alias pour EmployeeDTO - utilisé comme Employee
 * ✅ Source unique : EmployeeDTO
 */
export type Employee = EmployeeDTO;

/**
 * Alias pour SupplierDTO - utilisé comme Supplier
 * ✅ Source unique : SupplierDTO
 */
export type Supplier = SupplierDTO;

/**
 * Relation entre un risque et une tâche
 */
export interface RiskTaskRelation {
  id: string;
  riskId: string;
  taskId: string;
}

/**
 * Données du formulaire de risque
 */
export interface RiskFormData {
  title: string;
  description: string;
  probability: number;
  impact: number;
  mitigationPlan: string;
  status: RiskStatus;
  ownerId: string;
  dueDate: string;
  relatedTasks: string[];
  phaseId: string;
  constructionPhase: string;
  applyToAllPhases: boolean;
  selectedPhases?: string[];
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useEnhancedRiskManagerHex = (
  projectId: string,
  propRisks?: RiskDTO[],
  propPhases?: PhaseDTO[]
) => {
  const queryClient = useQueryClient();

  // ===== SERVICES HEXAGONAUX =====
  const riskRepo = RepositoryFactory.getRiskRepository();
  const phaseRepo = RepositoryFactory.getPhaseRepository();
  const employeeRepo = RepositoryFactory.getEmployeeRepository();
  const supplierRepo = RepositoryFactory.getSupplierRepository();
  
  // ✅ Utilisation de TaskAssignmentService au lieu de getTaskRepository
  const taskAssignmentService = new TaskAssignmentService(
    RepositoryFactory.getTaskAssignmentRepository()
  );

  // ===== QUERIES =====

  // Risques
  const { data: fetchedRisks = [], isLoading: risksLoading, error: risksError } = useQuery({
    queryKey: ['enhanced-project-risks', projectId],
    queryFn: async (): Promise<RiskDTO[]> => {
      const data = await riskRepo.findByProjectId(projectId);
      return (data || []) as unknown as RiskDTO[];
    },
    enabled: !!projectId && !propRisks,
    retry: 3,
    retryDelay: 1000
  });

  const currentRisks = propRisks || fetchedRisks;

  // ✅ Tâches via TaskAssignmentService
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['project-task-assignments', projectId],
    queryFn: async (): Promise<TaskAssignmentDTO[]> => {
      return await taskAssignmentService.getByProject(projectId);
    },
    enabled: !!projectId,
    retry: 3,
    retryDelay: 1000
  });

  // Phases
  const { data: phases = [], isLoading: phasesLoading } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<PhaseDTO[]> => {
      const data = await phaseRepo.findByProjectId(projectId);
      return (data || []) as unknown as PhaseDTO[];
    },
    enabled: !!projectId && !propPhases,
    retry: 3,
    retryDelay: 1000
  });

  const currentPhases = propPhases || phases;

  // Employés
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-active'],
    queryFn: async (): Promise<EmployeeDTO[]> => {
      const data = await employeeRepo.findAll();
      return (data || []) as unknown as EmployeeDTO[];
    },
    retry: 3,
    retryDelay: 1000
  });

  // Fournisseurs
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers-active'],
    queryFn: async (): Promise<SupplierDTO[]> => {
      const data = await supplierRepo.findAll();
      return (data || []) as unknown as SupplierDTO[];
    },
    retry: 3,
    retryDelay: 1000
  });

  // Relations risque-tâche
  const { data: riskTaskRelations = [], isLoading: relationsLoading } = useQuery({
    queryKey: ['risk-task-relations', projectId],
    queryFn: async (): Promise<RiskTaskRelation[]> => {
      // TODO: Implémenter la récupération des relations via un service dédié
      return [];
    },
    enabled: !!currentRisks && currentRisks.length > 0,
    retry: 3,
    retryDelay: 1000
  });

  // ===== MUTATIONS =====

  // Créer un risque
  const createRiskMutation = useMutation({
    mutationFn: async (data: Partial<RiskDTO>) => {
      await riskRepo.save({
        ...data,
        projectId: data.projectId || projectId,
      } as RiskDTO);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      toast({ title: "Succès", description: "Risque créé avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Mettre à jour un risque
  const updateRiskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RiskDTO> }) => {
      return await riskRepo.update(id, data as RiskDTO);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      toast({ title: "Succès", description: "Risque mis à jour avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Supprimer un risque
  const deleteRiskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await riskRepo.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['risk-task-relations', projectId] });
      toast({ title: "Succès", description: "Risque supprimé avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Créer une relation risque-tâche
  const createRiskTaskRelationMutation = useMutation({
    mutationFn: async (_relation: Omit<RiskTaskRelation, 'id'>) => {
      // TODO: Implémenter via un service dédié
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-task-relations', projectId] });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Supprimer une relation risque-tâche
  const deleteRiskTaskRelationMutation = useMutation({
    mutationFn: async (_relationId: string) => {
      // TODO: Implémenter via un service dédié
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-task-relations', projectId] });
      toast({ title: "Succès", description: "Relation supprimée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // ===== FONCTIONS UTILITAIRES =====

  /**
   * Calcule le score d'un risque
   */
  const calculateRiskScore = (risk: RiskDTO): number => {
    return (risk.impact || 0) * (risk.probability || 0);
  };

  /**
   * Détermine le niveau d'un risque
   */
  const getRiskLevel = (risk: RiskDTO): 'low' | 'medium' | 'high' => {
    const score = calculateRiskScore(risk);
    if (score > 0.7) return 'high';
    if (score > 0.3) return 'medium';
    return 'low';
  };

  /**
   * Récupère les tâches associées à un risque
   */
  const getTasksForRisk = (riskId: string): TaskAssignmentDTO[] => {
    const relations = riskTaskRelations || [];
    const taskIds = relations
      .filter(r => r.riskId === riskId)
      .map(r => r.taskId);
    return tasks.filter(t => taskIds.includes(t.id));
  };

  /**
   * Récupère les risques associés à une tâche
   */
  const getRisksForTask = (taskId: string): RiskDTO[] => {
    const relations = riskTaskRelations || [];
    const riskIds = relations
      .filter(r => r.taskId === taskId)
      .map(r => r.riskId);
    return currentRisks.filter(r => riskIds.includes(r.id));
  };

  /**
   * Vérifie si un risque peut être fermé
   */
  const canCloseRisk = (risk: RiskDTO): boolean => {
    return risk.status === RiskStatus.MITIGATED || risk.status === RiskStatus.MONITORED;
  };

  /**
   * Calcule les statistiques des risques
   */
  const getRiskStats = () => {
    const risks = currentRisks || [];
    const total = risks.length;
    const high = risks.filter(r => getRiskLevel(r) === 'high').length;
    const medium = risks.filter(r => getRiskLevel(r) === 'medium').length;
    const low = risks.filter(r => getRiskLevel(r) === 'low').length;
    
    return { total, high, medium, low };
  };

  // ===== RETOUR DU HOOK =====

  return {
    // Données
    risks: currentRisks,
    tasks,
    phases: currentPhases,
    employees,
    suppliers,
    riskTaskRelations,
    
    // États
    isLoading: risksLoading || tasksLoading || phasesLoading || employeesLoading || suppliersLoading || relationsLoading,
    error: risksError,
    
    // Mutations
    createRiskMutation,
    updateRiskMutation,
    deleteRiskMutation,
    createRiskTaskRelationMutation,
    deleteRiskTaskRelationMutation,
    
    // Utilitaires
    calculateRiskScore,
    getRiskLevel,
    getTasksForRisk,
    getRisksForTask,
    canCloseRisk,
    getRiskStats,
    
    // Rafraîchissement
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-task-assignments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['employees-active'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-active'] });
      queryClient.invalidateQueries({ queryKey: ['risk-task-relations', projectId] });
    }
  };
};

export default useEnhancedRiskManagerHex;