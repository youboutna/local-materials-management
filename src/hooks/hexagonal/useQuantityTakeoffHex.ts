/**
 * Hexagonal hooks for Quantity Takeoff
 * Uses QuantityTakeoffService/adapter instead of direct Supabase access
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuantityTakeoffService } from '@/application/services/QuantityTakeoffService';
import { MaterialService } from '@/application/services/MaterialService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Hook: Fetch materials for quantity takeoff
export function useMaterialsForTakeoff() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const service = new MaterialService(RepositoryFactory.getMaterialRepository());
      const materials = await service.getAllMaterials();
      return materials.map(m => ({
        id: m.id,
        name: m.name,
        unit: m.unit,
        category: m.category,
      }));
    }
  });
}

// Hook: Create quantity takeoff
export function useCreateQuantityTakeoff(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      material_id: string;
      element_type: string;
      unit: string;
      length: number;
      width?: number;
      height?: number;
      note?: string;
      quantity: number;
    }) => {
      const service = new QuantityTakeoffService(RepositoryFactory.getQuantityTakeoffRepository());
      await service.create({
        materialId: data.material_id,
        elementType: data.element_type,
        unit: data.unit,
        length: data.length,
        width: data.width ?? 0,
        height: data.height ?? 0,
        note: data.note ?? '',
        quantity: data.quantity,
        projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantity-takeoffs', projectId] });
    }
  });
}
