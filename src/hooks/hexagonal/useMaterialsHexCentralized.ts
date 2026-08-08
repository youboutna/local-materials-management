/**
 * Hexagonal Hook for Materials
 * Uses MaterialService with domain entities
 */

import { MaterialService } from '@/application/services/MaterialService';
import { CreateMaterialDTO, UpdateMaterialDTO } from '@/dtos/entities/MaterialDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useMaterials() {
  const queryClient = useQueryClient();
  
  const materialService = new MaterialService(
    RepositoryFactory.getMaterialRepository()
  );

  const {
    data: materials = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      return await materialService.getAllMaterials();
    },
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (materialData: CreateMaterialDTO) => {
      return await materialService.createMaterial(materialData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Matériel créé avec succès');
    },
    onError: () => {
      toast.error('Échec de la création du matériel');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaterialDTO }) => {
      return await materialService.updateMaterial(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Matériel mis à jour avec succès');
    },
    onError: () => {
      toast.error('Échec de la mise à jour du matériel');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await materialService.deleteMaterial(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Matériel supprimé avec succès');
    },
    onError: () => {
      toast.error('Échec de la suppression du matériel');
    },
  });

  return {
    materials,
    isLoading,
    error,
    refetch,
    createMaterial: createMutation.mutate,
    updateMaterial: updateMutation.mutate,
    deleteMaterial: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useMaterialById(id: string) {
  const materialService = new MaterialService(
    RepositoryFactory.getMaterialRepository()
  );

  return useQuery({
    queryKey: ['materials', 'id', id],
    queryFn: async () => {
      return await materialService.getMaterialById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMaterialsByCategory(category: string) {
  const materialService = new MaterialService(
    RepositoryFactory.getMaterialRepository()
  );

  return useQuery({
    queryKey: ['materials', 'category', category],
    queryFn: async () => {
      return await materialService.getMaterialsByCategory(category);
    },
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLowStockMaterials() {
  const materialService = new MaterialService(
    RepositoryFactory.getMaterialRepository()
  );

  return useQuery({
    queryKey: ['materials', 'low-stock'],
    queryFn: async () => {
      return await materialService.getLowStockMaterials();
    },
    staleTime: 5 * 60 * 1000,
  });
}
