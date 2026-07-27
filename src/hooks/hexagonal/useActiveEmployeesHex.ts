/**
 * Hexagonal hook for fetching active employees (for task assignment)
 * Uses RepositoryFactory instead of direct Supabase calls
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';

export interface ActiveEmployee {
  id: string;
  full_name: string;
  position?: string | null;
  department?: string | null;
}

export function useActiveEmployeesHex() {
  return useQuery({
    queryKey: ['active-employees'],
    queryFn: async (): Promise<ActiveEmployee[]> => {
      const employeeRepo = RepositoryFactory.getEmployeeRepository();
      const data = await employeeRepo.findAll();
      return (data || []).map((emp: any) => ({
        id: emp.id,
        full_name: emp.full_name || emp.fullName || '',
        position: emp.position || null,
        department: emp.department || null,
      }));
    },
  });
}