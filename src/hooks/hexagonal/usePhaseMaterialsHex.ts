// hooks/hexagonal/usePhaseMaterialsHex.ts - Hexagonal hook for phase materials management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { MaterialService } from '@/application/services/MaterialService';
import { toast } from '@/hooks/use-toast';

export interface MaterialDetails {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  price_per_unit: number;
  origin_location?: string;
}

export interface PhaseMaterial {
  id: string;
  phase_id: string;
  material_id: string;
  quantity: number;
  material: MaterialDetails;
}

export interface AvailableMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  price_per_unit: number;
}

export const usePhaseMaterialsHex = (phaseId: string, projectId?: string) => {
  const queryClient = useQueryClient();
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());

  // Fetch phase materials
  const {
    data: phaseMaterials = [],
    isLoading: isLoadingMaterials,
    error: materialsError,
    refetch: refetchMaterials
  } = useQuery({
    queryKey: ['phase-materials-hex', phaseId],
    queryFn: async () => {
      const data = await materialService.getPhaseMaterials(phaseId);
      return data.map(item => ({
        id: item.id,
        phase_id: phaseId,
        material_id: item.materialId || item.id,
        quantity: item.quantity || 0,
        material: {
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          unit: item.unit,
          price_per_unit: item.pricePerUnit
        } as MaterialDetails
      })) as PhaseMaterial[];
    },
    enabled: !!phaseId
  });

  // Fetch available materials
  const {
    data: availableMaterials = [],
    isLoading: isLoadingAvailable
  } = useQuery({
    queryKey: ['available-materials-hex'],
    queryFn: async () => {
      const materials = await materialService.getAllMaterials();
      return materials.map(material => ({
        id: material.id,
        name: material.name,
        category: material.category,
        unit: material.unit,
        price_per_unit: material.pricePerUnit
      }));
    }
  });

  // Add material to phase
  const addMaterialMutation = useMutation({
    mutationFn: async ({ materialId, quantity }: { materialId: string; quantity: number }) => {
      if (!projectId) throw new Error('Project ID is required');
      
      return await materialService.addMaterialToPhase({
        projectId: projectId,
        phaseId: phaseId,
        materialId: materialId,
        quantity: quantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-materials-hex', phaseId] });
      toast({
        title: 'Matériau ajouté',
        description: 'Le matériau a été ajouté à la phase'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de l'ajout: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Update material quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, newQuantity }: { id: string; newQuantity: number }) => {
      await materialService.updateMaterialQuantity(id, newQuantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-materials-hex', phaseId] });
      toast({
        title: 'Quantité mise à jour',
        description: 'La quantité a été mise à jour'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la mise à jour: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Remove material from phase
  const removeMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      await materialService.removeMaterialFromPhase(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-materials-hex', phaseId] });
      toast({
        title: 'Matériau supprimé',
        description: 'Le matériau a été retiré de la phase'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Calculate total cost
  const totalCost = phaseMaterials.reduce((sum, pm) => {
    const price = pm.material?.price_per_unit || 0;
    return sum + (pm.quantity * price);
  }, 0);

  return {
    phaseMaterials,
    availableMaterials,
    isLoading: isLoadingMaterials || isLoadingAvailable,
    error: materialsError,
    refetch: refetchMaterials,
    totalCost,
    addMaterial: addMaterialMutation.mutateAsync,
    updateQuantity: updateQuantityMutation.mutateAsync,
    removeMaterial: removeMaterialMutation.mutateAsync,
    isAdding: addMaterialMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
    isRemoving: removeMaterialMutation.isPending
  };
};

// Separate hook for available materials
export function useAvailableMaterials() {
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());

  return useQuery({
    queryKey: ['available-materials-hex'],
    queryFn: async () => {
      const materials = await materialService.getAllMaterials();
      return materials.map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
        unit: m.unit,
        price_per_unit: m.pricePerUnit
      }));
    }
  });
}
