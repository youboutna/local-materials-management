/**
 * Hexagonal hook for fetching active suppliers (for task assignment)
 */

import { SupplierService } from '@/application/services/SupplierService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';



import { ActiveSupplier } from '@/dtos/entities/SupplierDTO';
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
        contact_person: undefined,
        type: supplier.category || undefined
      }));
    },
  });
}