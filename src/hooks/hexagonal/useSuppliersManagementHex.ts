/**
 * Hexagonal hooks for Suppliers Management module
 * Centralizes CRUD operations for suppliers via SupplierService
 */

import { SupplierService } from '@/application/services/SupplierService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface SupplierFormData {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  nif?: string;
  commerce_register_ref?: string;
}

function getSupplierService() {
  return new SupplierService(RepositoryFactory.getSupplierRepository());
}

// Hook: Fetch all suppliers
export function useSuppliersList() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const service = getSupplierService();
      const result = await service.searchSuppliers({ limit: 500 });
      return result.suppliers.map(s => ({
        id: s.id,
        name: s.name,
        contact_person: null,
        email: null,
        phone: null,
        address: null,
        category: s.category || null,
        rating: s.rating || null,
        nif: null,
        commerce_register_ref: null,
        is_active: s.isActive,
        created_at: null,
        updated_at: null,
      }));
    }
  });
}

// Hook: Create supplier mutation
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierData: SupplierFormData) => {
      const service = getSupplierService();
      return await service.createSupplier(supplierData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });
}

// Hook: Update supplier mutation
export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SupplierFormData }) => {
      const service = getSupplierService();
      return await service.updateSupplier(id, data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });
}

// Hook: Delete supplier mutation
export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const service = getSupplierService();
      return await service.deleteSupplier(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });
}
