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
// IMPORTANT: matches CreateQuantityTakeoffRequestDto (snake_case) expected by QuantityTakeoffService
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
      quantity?: number;
      phase_id?: string;
      milestone_id?: string;
      unit_price?: number;
    }) => {
      const service = new QuantityTakeoffService();
      const allowed = new Set(['m³', 'm²', 'm', 'unité']);
      const unit = (allowed.has(data.unit) ? data.unit : 'unité') as 'm³' | 'm²' | 'm' | 'unité';
      await service.createQuantityTakeoff({
        project_id: projectId,
        material_id: data.material_id,
        element_type: data.element_type,
        unit,
        length: data.length || 0,
        width: data.width,
        height: data.height,
        unit_price: data.unit_price,
        phase_id: data.phase_id,
        milestone_id: data.milestone_id,
        note: data.note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantity-takeoffs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-quantity-takeoffs'] });
    }
  });
}