/**
 * Materials Hook - Hexagonal Architecture
 * Rule #1: Form → DTO → Service → Domain → Adapter → DB
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { MaterialService } from "@/application/services/MaterialService";
import { MaterialTransformer, CreateMaterialRequestDto, UpdateMaterialRequestDto, MaterialDTO, MaterialUIDTO } from '@/dtos/transforms';
import { MaterialCategory } from '@/dtos/entities/MaterialDTO';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorkspaces } from '@/hooks/useWorkspaces';

export interface UseMaterialsHexResult {
  materials: MaterialUIDTO[]; // Changed from MaterialDTO[] to MaterialUIDTO[]
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createMaterial: (data: CreateMaterialRequestDto) => void;
  updateMaterial: { mutate: (params: { id: string; data: UpdateMaterialRequestDto }) => void; isPending: boolean };
  deleteMaterial: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  getMaterialStockStatus: (material: MaterialUIDTO) => 'optimal' | 'low' | 'critical' | 'out_of_stock';
  getMaterialCostEfficiency: (material: MaterialUIDTO) => number;
  getMaterialQualityScore: (material: MaterialUIDTO) => number;
  getMaterialReorderLevel: (material: MaterialUIDTO) => number;
  getMaterialAnalytics: () => MaterialAnalytics;
  validateMaterialWithReferential: (material: MaterialUIDTO, referentialType: string) => Promise<ValidationResult>;
  generateMaterialReport: (material: MaterialUIDTO) => MaterialReport;
}

/**
 * Main materials management hook
 */
export function useMaterialsHex(): UseMaterialsHexResult {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { workspaces } = useWorkspaces();

  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());

  const {
    data: materials = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['materials'],
    queryFn: async (): Promise<MaterialUIDTO[]> => {
      try {
        const materialData = await materialService.getMaterialsForUI();
        return materialData;
      } catch (err) {
        console.error('Error fetching materials:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const createMaterialMutation = useMutation({
    mutationFn: async (data: CreateMaterialRequestDto) => {
      return await materialService.createMaterial(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(`Le matériel "${data.name}" a été créé avec succès.`);
      navigate('/materials');
    },
    onError: (error) => {
      console.error('Error creating material:', error);
      toast.error("Impossible de créer le matériel.");
    }
  });

  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaterialRequestDto }) => {
      return await materialService.updateMaterial(id, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(`Le matériel "${data.name}" a été mis à jour.`);
    },
    onError: (error: Error) => {
      console.error('Error updating material:', error);
      toast.error("Impossible de mettre à jour le matériel.");
    }
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      await materialService.deleteMaterial(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success("Le matériel a été supprimé.");
    },
    onError: () => {
      toast.error("Impossible de supprimer le matériel.");
    }
  });

  return {
    materials,
    isLoading,
    error: error ? String(error) : null,
    refetch,
    createMaterial: createMaterialMutation.mutate,
    updateMaterial: updateMaterialMutation,
    deleteMaterial: deleteMaterialMutation.mutate,
    isCreating: createMaterialMutation.isPending,
    isUpdating: updateMaterialMutation.isPending,
    isDeleting: deleteMaterialMutation.isPending,
    workspaces: workspaces || [],
  };
}

export function useMaterialsByCategory(category: string) {
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
  return useQuery({
    queryKey: ['materials', 'category', category],
    queryFn: () => materialService.getMaterialsByCategory(category as any),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMaterialById(id: string) {
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
  return useQuery({
    queryKey: ['materials', 'id', id],
    queryFn: () => materialService.getMaterialById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLowStockMaterials() {
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
  return useQuery({
    queryKey: ['materials', 'low-stock'],
    queryFn: () => materialService.getLowStockMaterials(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectMaterialsHex(projectId: string) {
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
  return useQuery({
    queryKey: ['project-materials', projectId],
    queryFn: () => materialService.getProjectMaterials(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddMaterialToProjectHex() {
  const queryClient = useQueryClient();
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());

  return useMutation({
    mutationFn: async ({ projectId, materialId, quantity }: { 
      projectId: string; materialId: string; quantity: number 
    }) => {
      await materialService.addMaterialToProject(projectId, materialId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Matériel ajouté au projet');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'ajout');
    }
  });
}

/**
 * Hook for single material operations
 */
export function useMaterialHex(id: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());

  const {
    data: material,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['materials', id],
    queryFn: () => materialService.getMaterialById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateMaterialRequestDto) => {
      return await materialService.updateMaterial(id, data);
    },
    onSuccess: () => {
      toast.success('Matériel mis à jour');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error('Error updating material:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => materialService.deleteMaterial(id),
    onSuccess: () => {
      toast.success('Matériel supprimé');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      navigate('/materials');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return {
    material,
    isLoading,
    error,
    refetch,
    updateMaterial: updateMutation.mutate,
    deleteMaterial: deleteMutation.mutate,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

// Re-export types
export type { MaterialDTO, CreateMaterialRequestDto, UpdateMaterialRequestDto, MaterialFormData };
