// hooks/hexagonal/usePhaseMaterialsHex.ts - Hexagonal hook for phase materials management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PhaseMaterial {
  id: string;
  phase_id: string;
  material_id: string;
  quantity: number;
  materials?: {
    id: string;
    name: string;
    category: string;
    unit: string;
    price_per_unit: number;
  };
}

export interface AvailableMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  price_per_unit: number;
}

export const usePhaseMaterialsHex = (phaseId: string) => {
  const queryClient = useQueryClient();

  // Fetch phase materials
  const {
    data: phaseMaterials = [],
    isLoading: isLoadingMaterials,
    error: materialsError,
    refetch: refetchMaterials
  } = useQuery({
    queryKey: ['phase-materials-hex', phaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_materials')
        .select(`
          id,
          phase_id,
          material_id,
          quantity,
          materials (
            id,
            name,
            category,
            unit,
            price_per_unit
          )
        `)
        .eq('phase_id', phaseId);

      if (error) throw error;
      return data as PhaseMaterial[];
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
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, category, unit, price_per_unit')
        .order('name');

      if (error) throw error;
      return data as AvailableMaterial[];
    }
  });

  // Add material to phase - need project_id which is required
  const addMaterialMutation = useMutation({
    mutationFn: async ({ materialId, quantity, projectId }: { materialId: string; quantity: number; projectId: string }) => {
      const { data, error } = await supabase
        .from('project_materials')
        .insert({
          project_id: projectId,
          phase_id: phaseId,
          material_id: materialId,
          quantity: quantity
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-materials-hex', phaseId] });
      toast({
        title: 'Matériau ajouté',
        description: 'Le matériau a été ajouté à la phase'
      });
    },
    onError: (error) => {
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
      const { error } = await supabase
        .from('project_materials')
        .update({ quantity: newQuantity })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-materials-hex', phaseId] });
      toast({
        title: 'Quantité mise à jour',
        description: 'La quantité a été mise à jour'
      });
    },
    onError: (error) => {
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
      const { error } = await supabase
        .from('project_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-materials-hex', phaseId] });
      toast({
        title: 'Matériau supprimé',
        description: 'Le matériau a été retiré de la phase'
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: `Erreur lors de la suppression: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Calculate total cost
  const totalCost = phaseMaterials.reduce((sum, pm) => {
    const price = pm.materials?.price_per_unit || 0;
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
