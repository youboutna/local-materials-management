import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface PhaseInspectionFormData {
  inspector: string;
  date: string;
  status: string;
  progressAtInspection: string;
  comments: string;
  documentsData?: Record<string, unknown>;
}

export function usePhaseInspectionsListHex(phaseId: string) {
  return useQuery({
    queryKey: ['phase-inspections', phaseId],
    queryFn: async () => {
      const { btpClient } = await import('@/integrations/supabase/schema-clients');
      const { data, error } = await btpClient.from('inspections')
        .select('*')
        .eq('phase_id', phaseId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useAddPhaseInspectionHex(phaseId: string, projectId: string, syncProgress: () => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inspectionData: PhaseInspectionFormData) => {
      const { btpClient } = await import('@/integrations/supabase/schema-clients');
      const { data, error } = await btpClient.from('inspections')
        .insert({
          project_id: projectId,
          phase_id: phaseId,
          inspector: inspectionData.inspector,
          date: new Date(inspectionData.date).toISOString(),
          status: inspectionData.status,
          progress_at_inspection: parseInt(inspectionData.progressAtInspection) || 0,
          comments: inspectionData.comments,
          documents: inspectionData.documentsData || {},
        })
        .select()
        .single();

      if (error) throw error;

      await syncProgress();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeletePhaseInspectionHex(phaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { btpClient } = await import('@/integrations/supabase/schema-clients');
      const { error } = await btpClient.from('inspections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
    },
  });
}
