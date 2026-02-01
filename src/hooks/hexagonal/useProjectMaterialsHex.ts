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
    const materialService = new MaterialService();
    const materials = await materialService.getProjectMaterials(projectId);
    return materials.map((item: {
      id: string;
      project_id: string;
      material_id: string;
      quantity: number;
      unit_cost: number;
      total_cost: number;
      material_name?: string;
      material_type?: string;
    }) => ({
      id: item.id,
      project_id: item.project_id,
      material_id: item.material_id,
      quantity: item.quantity,
      material: {
        id: item.material?.id || '',
        name: item.material?.name || '',
        category: item.material?.category || '',
        unit: item.material?.unit || '',
        price_per_unit: item.material?.price_per_unit || 0,
      }
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
    const materialService = new MaterialService();
    // Supprimer tous les matériaux existants du projet
    await materialService.removeMaterialFromProject(projectId, "all");
    
    // Ajouter les nouveaux matériaux
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
  const materialService = new MaterialService();

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
      const materialService = new MaterialService();
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
    mutationFn: async (materialId: string) => {
      const materialService = new MaterialService();
      await materialService.removeMaterialFromProject(projectId!, materialId);
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
