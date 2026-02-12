/**
 * Hexagonal hooks for Suppliers Management module
 * Centralizes CRUD operations for suppliers via SupplierService
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierService } from '@/application/services/SupplierService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
        contact_person: s.contacts[0]?.name || null,
        email: s.email,
        phone: s.phone,
        address: s.address,
        category: s.category,
        rating: s.rating?.overall || null,
        nif: (s as any).nif || null,
        commerce_register_ref: (s as any).commerceRegisterRef || null,
        is_active: s.isActive(),
        created_at: s.createdAt,
        updated_at: s.updatedAt,
      }));
    }
  });
}

// Hook: Create supplier mutation
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierData: SupplierFormData) => {
      const repo = RepositoryFactory.getSupplierRepository();
      return await repo.create(supplierData as any);
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
      const repo = RepositoryFactory.getSupplierRepository();
      return await repo.update(id, data as any);
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
      const repo = RepositoryFactory.getSupplierRepository();
      return await repo.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });
}
