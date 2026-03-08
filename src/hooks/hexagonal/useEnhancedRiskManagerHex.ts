import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { toast } from '@/hooks/use-toast';

export interface ProjectRisk {
  id: string;
  project_id: string;
  risk_title: string;
  risk_description: string | null;
  probability: string | null;
  impact: string | null;
  risk_level: string | null;
  mitigation_strategy: string | null;
  status: string | null;
  identified_by: string | null;
  identified_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  probability_numeric: number | null;
  impact_numeric: number | null;
  risk_score: number | null;
  mitigation_plan: string | null;
  status_new: string | null;
  owner_id: string | null;
  due_date: string | null;
  phase_id?: string | null;
}

export interface RiskTaskRelation {
  id: string;
  risk_id: string;
  task_id: string;
}

export interface TaskAssignment {
  id: string;
  title: string | null;
  phase_id?: string | null;
}

export interface ProjectPhase {
  id: string;
  phase_name: string;
  status: string;
  construction_phase?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  type?: string;
}

export interface Employee {
  id: string;
  full_name: string;
  position?: string;
}

export interface RiskFormData {
  risk_title: string;
  risk_description: string;
  probability_numeric: string;
  impact_numeric: string;
  mitigation_plan: string;
  status_new: string;
  owner_id: string;
  due_date: string;
  related_tasks: string[];
  phase_id: string;
  construction_phase: string;
  applyToAllPhases: boolean;
  selectedPhases?: string[];
}

export const useEnhancedRiskManagerHex = (
  projectId: string, 
  propRisks?: ProjectRisk[], 
  propPhases?: ProjectPhase[]
) => {
  const queryClient = useQueryClient();
  const riskRepo = RepositoryFactory.getRiskRepository();
  const taskRepo = RepositoryFactory.getTaskRepository();
  const phaseRepo = RepositoryFactory.getPhaseRepository();
  const employeeRepo = RepositoryFactory.getEmployeeRepository();
  const supplierRepo = RepositoryFactory.getSupplierRepository();

  const { data: fetchedRisks = [], isLoading: risksLoading, error: risksError } = useQuery({
    queryKey: ['enhanced-project-risks', projectId],
    queryFn: async (): Promise<ProjectRisk[]> => {
      const data = await riskRepo.findByProjectId(projectId);
      return (data || []) as unknown as ProjectRisk[];
    },
    enabled: !!projectId && !propRisks,
    retry: 3,
    retryDelay: 1000
  });

  const currentRisks = propRisks || fetchedRisks;

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['project-task-assignments', projectId],
    queryFn: async (): Promise<TaskAssignment[]> => {
      const data = await taskRepo.findByProject(projectId);
      return (data || []).map((t: any) => ({
        id: t.id,
        title: t.title || t.task_name || null,
        phase_id: t.phase_id || t.phaseId || null,
      }));
    },
    enabled: !!projectId,
    retry: 3,
    retryDelay: 1000
  });

  const { data: phases = [], isLoading: phasesLoading } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<ProjectPhase[]> => {
      const data = await phaseRepo.findByProject(projectId);
      return (data || []).map((phase: any) => ({
        id: phase.id,
        phase_name: phase.phase_name || phase.phaseName || phase.name || '',
        status: phase.status || 'pending',
        construction_phase: phase.construction_phase || undefined,
        description: phase.description || undefined,
        start_date: phase.start_date || phase.startDate || undefined,
        end_date: phase.end_date || phase.endDate || undefined,
      }));
    },
    enabled: !!projectId && !propPhases,
    retry: 3,
    retryDelay: 1000
  });

  const currentPhases = propPhases || phases;

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-active'],
    queryFn: async (): Promise<Employee[]> => {
      const data = await employeeRepo.findAll({ isActive: true });
      return (data || []).map((emp: any) => ({
        id: emp.id,
        full_name: emp.full_name || emp.fullName || '',
        position: emp.position || undefined
      }));
    },
    retry: 3,
    retryDelay: 1000
  });

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers-active'],
    queryFn: async (): Promise<Supplier[]> => {
      const data = await supplierRepo.findAll({ isActive: true });
      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name || '',
        contact_person: s.contact_person || s.contactPerson || undefined
      }));
    },
    retry: 3,
    retryDelay: 1000
  });

  const { data: riskTaskRelations = [], isLoading: relationsLoading } = useQuery({
    queryKey: ['risk-task-relations', projectId],
    queryFn: async (): Promise<RiskTaskRelation[]> => {
      if (!currentRisks || currentRisks.length === 0) return [];
      const data = await riskRepo.findTaskRelations(currentRisks.map(r => r.id));
      return (data || []) as RiskTaskRelation[];
    },
    enabled: !!currentRisks && currentRisks.length > 0,
    retry: 3,
    retryDelay: 1000
  });

  const createRiskMutation = useMutation({
    mutationFn: async (data: Partial<ProjectRisk>) => {
      return await riskRepo.create({
        ...data,
        project_id: data.project_id || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      toast({ title: "Succès", description: "Risque créé avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  const updateRiskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectRisk> }) => {
      return await riskRepo.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      toast({ title: "Succès", description: "Risque mis à jour avec succès" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

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

  const createRiskTaskRelationMutation = useMutation({
    mutationFn: async (relation: Omit<RiskTaskRelation, 'id'>) => {
      return await riskRepo.createTaskRelation(relation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-task-relations', projectId] });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  return {
    risks: currentRisks,
    tasks,
    phases: currentPhases,
    employees,
    suppliers,
    riskTaskRelations,
    isLoading: risksLoading || tasksLoading || phasesLoading || employeesLoading || suppliersLoading || relationsLoading,
    error: risksError,
    createRiskMutation,
    updateRiskMutation,
    deleteRiskMutation,
    createRiskTaskRelationMutation,
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