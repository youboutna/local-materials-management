import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { InspectionDTO, CreateInspectionDTO, UpdateInspectionDTO } from '@/dtos/entities/InspectionDTO';
import { InspectionService, getInspectionService} from '@/application/services/InspectionService';

export const useEnhancedInspectionCrudHex = (projectId?: string) => {
  const queryClient = useQueryClient();
  const inspectionService = getInspectionService();

  // Fetch inspections
  const { data: inspections = [], isLoading, error } = useQuery({
    queryKey: ['inspections', projectId],
    queryFn: async (): Promise<InspectionDTO[]> => {
      const results = projectId 
        ? await inspectionService.getInspectionsByProject(projectId)
        : await inspectionService.getAllInspections();
      return results as unknown as InspectionDTO[];
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Create inspection mutation
  const createInspectionMutation = useMutation({
    mutationFn: async (data: CreateInspectionDTO): Promise<InspectionDTO | null> => {
      const result = await inspectionService.createInspection(data as any);
      if (!result) throw new Error('Failed to create inspection');
      return result as unknown as InspectionDTO;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast({ title: "Succès", description: "Inspection créée avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Update inspection mutation
  const updateInspectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInspectionDTO }): Promise<InspectionDTO | null> => {
      const result = await InspectionService.updateInspection(id, data as any);
      if (!result) throw new Error('Failed to update inspection');
      return result as unknown as InspectionDTO;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast({ title: "Succès", description: "Inspection mise à jour avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Delete inspection mutation
  const deleteInspectionMutation = useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      await inspectionService.deleteInspection(id);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast({ title: "Succès", description: "Inspection supprimée avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  const getInspectionById = async (id: string) => {
    const result = await inspectionService.getInspectionById(id);
    return result as unknown as InspectionDTO | null;
  };
  const createInspection = async (data: CreateInspectionDTO) => createInspectionMutation.mutateAsync(data);
  const updateInspection = async (id: string, data: UpdateInspectionDTO) => updateInspectionMutation.mutateAsync({ id, data });
  const deleteInspection = async (id: string) => deleteInspectionMutation.mutateAsync(id);

  return {
    inspections, isLoading, error,
    createInspectionMutation, updateInspectionMutation, deleteInspectionMutation,
    createInspection, updateInspection, deleteInspection, getInspectionById,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['inspections'] }),
  };
};
