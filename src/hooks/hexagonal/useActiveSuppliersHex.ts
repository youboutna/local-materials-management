/**
 * Hexagonal hook for fetching active suppliers (for task assignment)
 */

import { SupplierService, getSupplierService} from '@/application/services/SupplierService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';

export interface ActiveSupplier {
  id: string;
  name: string;
  nif?: string | null;
  contact_person?: string;
  type?: string;
}

// Hook: Fetch active suppliers for task assignment
export function useActiveSuppliersHex() {
  const supplierService = getSupplierService();
  
  return useQuery({
    queryKey: ['active-suppliers'],
    queryFn: async (): Promise<ActiveSupplier[]> => {
      const result = await supplierService.searchSuppliers({ isActive: true });
      return result.suppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        nif: supplier.nif ?? null,
        contact_person: undefined,
        type: supplier.category || undefined
      }));
    },
  });
}
