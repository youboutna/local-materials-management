import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { InspectionDTO, CreateInspectionDTO, UpdateInspectionDTO } from '@/dtos/entities/InspectionDTO';
import { InspectionService } from '@/application/services/InspectionService';
import { supabase } from '@/integrations/supabase/client';

export const useEnhancedInspectionCrudHex = (projectId?: string) => {
  const queryClient = useQueryClient();

  // Fetch inspections
  const { data: inspections = [], isLoading, error } = useQuery({
    queryKey: ['inspections', projectId],
    queryFn: async (): Promise<InspectionDTO[]> => {
      if (projectId) {
        return await InspectionService.getInspectionsByProject(projectId);
      }
      
      // If no projectId, return empty array or fetch all inspections
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          projects (title, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as InspectionDTO[];
    },
    retry: 3,
    retryDelay: 1000,
    enabled: !!projectId || true // Always enabled, but will fetch different data based on projectId
  });

  // Create inspection mutation
  const createInspectionMutation = useMutation({
    mutationFn: async (data: CreateInspectionDTO): Promise<InspectionDTO | null> => {
      const result = await InspectionService.createInspection(data);
      if (!result) throw new Error('Failed to create inspection');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast({
        title: "Succès",
        description: "Inspection créée avec succès",
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

  // Update inspection mutation
  const updateInspectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInspectionDTO }): Promise<InspectionDTO | null> => {
      const result = await InspectionService.updateInspection(id, data);
      if (!result) throw new Error('Failed to update inspection');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast({
        title: "Succès",
        description: "Inspection mise à jour avec succès",
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

  // Delete inspection mutation
  const deleteInspectionMutation = useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const result = await InspectionService.deleteInspection(id);
      if (!result) throw new Error('Failed to delete inspection');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast({
        title: "Succès",
        description: "Inspection supprimée avec succès",
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

  // Get inspection by ID
  const getInspectionById = async (id: string): Promise<InspectionDTO | null> => {
    return await InspectionService.getInspectionById(id);
  };

  const createInspection = async (data: CreateInspectionDTO) => {
    return await createInspectionMutation.mutateAsync(data);
  };

  const updateInspection = async (id: string, data: UpdateInspectionDTO) => {
    return await updateInspectionMutation.mutateAsync({ id, data });
  };

  const deleteInspection = async (id: string) => {
    return await deleteInspectionMutation.mutateAsync(id);
  };

  return {
    inspections,
    isLoading,
    error,
    createInspectionMutation,
    updateInspectionMutation,
    deleteInspectionMutation,
    createInspection,
    updateInspection,
    deleteInspection,
    getInspectionById,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    }
  };
};
