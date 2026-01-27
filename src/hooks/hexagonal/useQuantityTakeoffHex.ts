/**
 * Hexagonal hooks for Quantity Takeoff
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Hook: Fetch materials for quantity takeoff
export function useMaterialsForTakeoff() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, unit, category')
        .order('name');
      
      if (error) throw error;
      return data || [];
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
      const submitData = {
        material_id: data.material_id,
        element_type: data.element_type,
        unit: data.unit,
        length: data.length,
        width: data.width ?? 0,
        height: data.height ?? 0,
        note: data.note ?? '',
        quantity: data.quantity,
        project_id: projectId
      };

      const { error } = await supabase
        .from('quantity_takeoffs')
        .insert(submitData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantity-takeoffs', projectId] });
    }
  });
}
