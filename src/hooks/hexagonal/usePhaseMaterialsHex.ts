// hooks/hexagonal/usePhaseMaterialsHex.ts - Hexagonal hook for phase materials management

import { MaterialService, getMaterialService} from '@/application/services/MaterialService';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPhaseMaterialService } from '@/application/services/PhaseMaterialService';
import { getTakeoffToBoqService } from '@/application/services/TakeoffToBoqService';

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
  const materialService = getMaterialService();
  const phaseMaterialService = getPhaseMaterialService();

  const loadAvailable = async (): Promise<AvailableMaterial[]> => {
    const materials = await materialService.getAllMaterials();
    return materials.map((material) => ({
      id: material.id,
      name: material.name,
      category: material.category,
      unit: material.unit,
      price_per_unit: material.pricePerUnit,
    }));
  };

  const {
    data: availableMaterials = [],
    isLoading: isLoadingAvailable,
  } = useQuery({
    queryKey: ['available-materials-hex'],
    queryFn: loadAvailable,
  });

  const {
    data: phaseMaterials = [],
    isLoading: isLoadingMaterials,
    error: materialsError,
    refetch: refetchMaterials,
  } = useQuery({
    queryKey: ['phase-materials-hex', phaseId],
    queryFn: async (): Promise<PhaseMaterial[]> => {
      if (!phaseId) return [];
      // Répare aussi les métrés historiques avant lecture des ressources.
      if (projectId) await getTakeoffToBoqService().syncProject(projectId);
      const list = await phaseMaterialService.getByPhase(phaseId);
      // enrich with material details using already-loaded available materials
      const allMaterials = await loadAvailable();
      const byId = new Map(allMaterials.map((m) => [m.id, m]));
      return list.map((row) => {
        const m = byId.get(row.materialId);
        return {
          id: row.id,
          phase_id: row.phaseId,
          material_id: row.materialId,
          quantity: Number(row.quantity) || 0,
          material: {
            id: row.materialId,
            name: m?.name || 'Matériau inconnu',
            category: m?.category || '',
            unit: m?.unit || '',
            price_per_unit: m?.price_per_unit || 0,
          },
        };
      });
    },
    enabled: !!phaseId,
  });

  const addMaterialMutation = useMutation({
    mutationFn: async ({ materialId, quantity }: { materialId: string; quantity: number }) => {
      return phaseMaterialService.assign({
        phaseId,
        projectId: projectId ?? null,
        materialId,
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-materials-hex', phaseId] });
      toast({ title: 'Matériau ajouté', description: 'Le matériau a été ajouté à la phase' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de l'ajout: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, newQuantity }: { id: string; newQuantity: number }) => {
      return phaseMaterialService.updateQuantity(id, newQuantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-materials-hex', phaseId] });
      toast({ title: 'Quantité mise à jour', description: 'La quantité a été mise à jour' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la mise à jour: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const removeMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      await phaseMaterialService.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-materials-hex', phaseId] });
      toast({ title: 'Matériau supprimé', description: 'Le matériau a été retiré de la phase' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const totalCost = phaseMaterials.reduce((sum, pm) => {
    const price = pm.material?.price_per_unit || 0;
    return sum + pm.quantity * price;
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
    updateMaterialQuantity: updateQuantityMutation.mutateAsync,
    removeMaterial: removeMaterialMutation.mutateAsync,
    isAdding: addMaterialMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
    isRemoving: removeMaterialMutation.isPending,
  };
};

export function useAvailableMaterials() {
  const materialService = getMaterialService();

  return useQuery({
    queryKey: ['available-materials-hex'],
    queryFn: async () => {
      const materials = await materialService.getAllMaterials();
      return materials.map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        unit: m.unit,
        price_per_unit: m.pricePerUnit,
      }));
    },
  });
}
