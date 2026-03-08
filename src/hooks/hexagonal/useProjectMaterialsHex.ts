/**
 * useProjectMaterialsHex - Hook hexagonal pour la gestion des matériaux projet
 * Utilise MaterialService au lieu des appels Supabase directs
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { MaterialService } from "@/application/services/MaterialService";
import { RepositoryFactory } from "@/infrastructure/supabase/RepositoryFactory";
import { MaterialDTO } from "@/dtos/entities/MaterialDTO";

export interface ProjectMaterial {
  id?: string;
  project_id: string;
  material_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  material_name?: string;
  material_type?: string;
  material?: MaterialDTO;
}

export interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

async function fetchProjectMaterials(projectId: string): Promise<ProjectMaterial[]> {
  try {
    const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
    const materials = await materialService.getProjectMaterials(projectId);
    return materials.map((item: MaterialDTO) => ({
      id: item.id,
      project_id: projectId,
      material_id: item.id,
      quantity: item.availableQuantity || 0,
      unit_cost: item.pricePerUnit || 0,
      total_cost: (item.availableQuantity || 0) * (item.pricePerUnit || 0),
      material_name: item.name,
      material_type: item.category,
      material: item,
    }));
  } catch (error) {
    console.error('Error fetching project materials:', error);
    throw error;
  }
}

async function updateProjectMaterials(
  projectId: string, 
  materials: SelectedMaterial[]
): Promise<void> {
  try {
    const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
    // Add the new materials
    for (const material of materials) {
      await materialService.addMaterialToProject(projectId, material.materialId, material.quantity);
    }
  } catch (error) {
    console.error('Error updating project materials:', error);
    throw error;
  }
}

export const useProjectMaterialsHex = (projectId?: string) => {
  const queryClient = useQueryClient();

  const { data: materials = [], isLoading, error, refetch } = useQuery({
    queryKey: ["project-materials", projectId],
    queryFn: () => fetchProjectMaterials(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: (newMaterials: SelectedMaterial[]) => 
      updateProjectMaterials(projectId!, newMaterials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-materials", projectId] });
      toast({
        title: "Matériaux mis à jour",
        description: "Les matériaux du projet ont été sauvegardés.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addMaterialMutation = useMutation({
    mutationFn: async (material: SelectedMaterial) => {
      const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
      await materialService.addMaterialToProject(projectId!, material.materialId, material.quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-materials", projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMaterialMutation = useMutation({
    mutationFn: async (_materialId: string) => {
      // TODO: Implement when removeMaterialFromProject is available
      console.log('Remove material from project:', projectId, _materialId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-materials", projectId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Convert to SelectedMaterial format for forms
  const selectedMaterials: SelectedMaterial[] = materials.map((m) => ({
    materialId: m.material_id,
    quantity: m.quantity,
  }));

  return {
    materials,
    selectedMaterials,
    isLoading,
    error,
    refetch,
    updateMaterials: updateMutation.mutateAsync,
    addMaterial: addMaterialMutation.mutateAsync,
    removeMaterial: removeMaterialMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}