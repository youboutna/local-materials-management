/**
 * useProjectMaterialsHex - Hook hexagonal pour la gestion des matériaux projet
 * Élimine les appels Supabase directs dans les composants
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ProjectMaterial {
  id?: string;
  project_id: string;
  material_id: string;
  quantity: number;
  material?: {
    id: string;
    name: string;
    category: string;
    unit: string;
    price_per_unit: number;
  };
}

export interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

async function fetchProjectMaterials(projectId: string): Promise<ProjectMaterial[]> {
  const { data, error } = await supabase
    .from("project_materials")
    .select(`
      id,
      project_id,
      material_id,
      quantity,
      materials:material_id (
        id,
        name,
        category,
        unit,
        price_per_unit
      )
    `)
    .eq("project_id", projectId);

  if (error) throw error;
  
  return (data || []).map((item: any) => ({
    id: item.id,
    project_id: item.project_id,
    material_id: item.material_id,
    quantity: item.quantity,
    material: item.materials,
  }));
}

async function updateProjectMaterials(
  projectId: string, 
  materials: SelectedMaterial[]
): Promise<void> {
  // Delete existing materials
  await supabase
    .from("project_materials")
    .delete()
    .eq("project_id", projectId);

  // Insert new materials
  if (materials.length > 0) {
    const materialsToInsert = materials.map((material) => ({
      project_id: projectId,
      material_id: material.materialId,
      quantity: material.quantity,
    }));

    const { error } = await supabase
      .from("project_materials")
      .insert(materialsToInsert);

    if (error) throw error;
  }
}

export function useProjectMaterialsHex(projectId?: string) {
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
      const { error } = await supabase
        .from("project_materials")
        .insert({
          project_id: projectId!,
          material_id: material.materialId,
          quantity: material.quantity,
        });
      if (error) throw error;
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
      const { error } = await supabase
        .from("project_materials")
        .delete()
        .eq("project_id", projectId!)
        .eq("material_id", materialId);
      if (error) throw error;
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
