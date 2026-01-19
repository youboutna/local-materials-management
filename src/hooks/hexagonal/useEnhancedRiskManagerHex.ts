import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

  // Fetch risks
  const { data: fetchedRisks = [], isLoading: risksLoading, error: risksError } = useQuery({
    queryKey: ['enhanced-project-risks', projectId],
    queryFn: async (): Promise<ProjectRisk[]> => {
      const { data, error } = await supabase
        .from('project_risks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && !propRisks,
    retry: 3,
    retryDelay: 1000
  });

  // Use props or fallback to fetched data
  const currentRisks = propRisks || fetchedRisks;

  // Fetch task assignments
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['project-task-assignments', projectId],
    queryFn: async (): Promise<TaskAssignment[]> => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('id, title, phase_id')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
    retry: 3,
    retryDelay: 1000
  });

  // Fetch project phases
  const { data: phases = [], isLoading: phasesLoading } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<ProjectPhase[]> => {
      const { data, error } = await supabase
        .from('project_phases')
        .select('id, phase_name, status, construction_phase, description, start_date, end_date')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data?.map(phase => ({
        ...phase,
        construction_phase: phase.construction_phase || undefined
      })) || [];
    },
    enabled: !!projectId && !propPhases,
    retry: 3,
    retryDelay: 1000
  });

  // Use props or fallback to fetched data
  const currentPhases = propPhases || phases;

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-active'],
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .eq('is_active', true);
      
      if (error) throw error;
      return data?.map(emp => ({
        ...emp,
        position: emp.position || undefined
      })) || [];
    },
    retry: 3,
    retryDelay: 1000
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers-active'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, contact_person')
        .eq('is_active', true);
      
      if (error) throw error;
      return data?.map(supplier => ({
        ...supplier,
        contact_person: supplier.contact_person || undefined
      })) || [];
    },
    retry: 3,
    retryDelay: 1000
  });

  // Fetch risk-task relations
  const { data: riskTaskRelations = [], isLoading: relationsLoading } = useQuery({
    queryKey: ['risk-task-relations', projectId],
    queryFn: async (): Promise<RiskTaskRelation[]> => {
      if (!currentRisks || currentRisks.length === 0) return [];
      
      const { data, error } = await supabase
        .from('risk_task_relations')
        .select('*')
        .in('risk_id', currentRisks.map(r => r.id));
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentRisks && currentRisks.length > 0,
    retry: 3,
    retryDelay: 1000
  });

  // Create risk mutation
  const createRiskMutation = useMutation({
    mutationFn: async (data: Partial<ProjectRisk>) => {
      const { error } = await supabase
        .from('project_risks')
        .insert([{
          ...data,
          project_id: data.project_id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      toast({
        title: "Succès",
        description: "Risque créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update risk mutation
  const updateRiskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectRisk> }) => {
      const { error } = await supabase
        .from('project_risks')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      return { id, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      toast({
        title: "Succès",
        description: "Risque mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete risk mutation
  const deleteRiskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_risks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['risk-task-relations', projectId] });
      toast({
        title: "Succès",
        description: "Risque supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create risk-task relation mutation
  const createRiskTaskRelationMutation = useMutation({
    mutationFn: async (relation: Omit<RiskTaskRelation, 'id'>) => {
      const { error } = await supabase
        .from('risk_task_relations')
        .insert([relation]);
      
      if (error) throw error;
      return relation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-task-relations', projectId] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
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
