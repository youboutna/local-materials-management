/**
 * Hexagonal hook for fetching active suppliers (for task assignment)
 * Centralizes active supplier queries
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveSupplier {
  id: string;
  name: string;
  contact_person?: string;
  type?: string;
}

// Hook: Fetch active suppliers for task assignment
export function useActiveSuppliersHex() {
  return useQuery({
    queryKey: ['active-suppliers'],
    queryFn: async (): Promise<ActiveSupplier[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, contact_person, type')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}
