/**
 * Hexagonal Hook: useProjectPhasesHex
 * Provides project phases management via services
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectPhase {
  id: string;
  project_id: string;
  phase_name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  estimated_duration?: number | null;
  estimated_cost?: number | null;
  status: string | null;
  progress: number | null;
  phase_type?: string | null;
  construction_phase?: string | null;
  custom_phase_data?: any;
  created_at?: string | null;
}

export interface PhaseFormData {
  project_id: string;
  phase_name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  estimated_duration?: number;
  estimated_cost?: number;
  status?: string;
  progress?: number;
  phase_type?: string;
  construction_phase?: string;
  custom_phase_data?: any;
}

async function fetchProjectPhases(projectId: string): Promise<ProjectPhase[]> {
  const { data, error } = await supabase
    .from('project_phases')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function insertPhases(phases: PhaseFormData[]): Promise<ProjectPhase[]> {
  const { data, error } = await supabase
    .from('project_phases')
    .insert(phases as any)
    .select();

  if (error) throw error;
  return data || [];
}

export function useProjectPhasesHex(projectId?: string) {
  const queryClient = useQueryClient();

  const {
    data: phases = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['project-phases-hex', projectId],
    queryFn: () => fetchProjectPhases(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  });

  const createPhasesMutation = useMutation({
    mutationFn: async (phasesData: PhaseFormData[]) => {
      return await insertPhases(phasesData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-phases-hex', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] });
      toast.success('Phases créées avec succès');
    },
    onError: (error) => {
      console.error('Error creating phases:', error);
      toast.error('Impossible de créer les phases');
    },
  });

  return {
    phases,
    isLoading,
    error,
    refetch,
    createPhases: createPhasesMutation.mutateAsync,
    isCreating: createPhasesMutation.isPending,
  };
}

export default useProjectPhasesHex;
