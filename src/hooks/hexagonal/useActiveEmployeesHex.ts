/**
 * Hexagonal hook for fetching active employees (for task assignment)
 * Centralizes active employee queries
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveEmployee {
  id: string;
  full_name: string;
  position?: string | null;
  department?: string | null; // Added department property for UI filtering
}

// Hook: Fetch active employees for task assignment
export function useActiveEmployeesHex() {
  return useQuery({
    queryKey: ['active-employees'],
    queryFn: async (): Promise<ActiveEmployee[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position, department')
        .eq('is_active', true)
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}
