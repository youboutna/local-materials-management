/**
 * Hexagonal hook for fetching active suppliers (for task assignment)
 */

import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { SupplierService } from '@/application/services/SupplierService';

export interface ActiveSupplier {
  id: string;
  name: string;
  contact_person?: string;
  type?: string;
}

// Hook: Fetch active suppliers for task assignment
export function useActiveSuppliersHex() {
  const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
  
  return useQuery({
    queryKey: ['active-suppliers'],
    queryFn: async (): Promise<ActiveSupplier[]> => {
      const result = await supplierService.searchSuppliers({ isActive: true });
      return result.suppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        contact_person: supplier.contacts[0]?.name,
        type: supplier.category || undefined
      }));
    },
  });
}
