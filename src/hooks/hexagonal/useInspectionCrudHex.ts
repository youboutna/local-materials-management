// hooks/hexagonal/useInspectionCrudHex.ts - Hexagonal hook for inspection CRUD operations

import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Inspection {
  id: string;
  project_id: string;
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: number;
  comments?: string;
  documents?: any;
  created_at?: string;
  updated_at?: string;
}

export interface InspectionFormData {
  project_id: string;
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: number;
  comments: string;
}

export const useInspectionCrudHex = (projectId?: string) => {
  const queryClient = useQueryClient();

  const {
    data: inspections = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['inspections-crud', projectId],
    queryFn: async () => {
      const repo = RepositoryFactory.getInspectionRepository();
      if (projectId) {
        return await repo.findByProjectId(projectId) as unknown as Inspection[];
      }
      return await repo.findAll() as unknown as Inspection[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (formData: InspectionFormData) => {
      const repo = RepositoryFactory.getInspectionRepository();
      return await repo.create(formData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-crud'] });
      toast({ title: 'Inspection créée', description: 'L\'inspection a été créée avec succès' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: `Erreur lors de la création: ${error.message}`, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InspectionFormData> }) => {
      const repo = RepositoryFactory.getInspectionRepository();
      return await repo.update(id, data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-crud'] });
      toast({ title: 'Inspection mise à jour', description: 'L\'inspection a été mise à jour avec succès' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: `Erreur lors de la mise à jour: ${error.message}`, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const repo = RepositoryFactory.getInspectionRepository();
      return await repo.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-crud'] });
      toast({ title: 'Inspection supprimée', description: 'L\'inspection a été supprimée avec succès' });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: `Erreur lors de la suppression: ${error.message}`, variant: 'destructive' });
    }
  });

  return {
    inspections,
    isLoading,
    error,
    refetch,
    createInspection: createMutation.mutateAsync,
    updateInspection: updateMutation.mutateAsync,
    deleteInspection: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
