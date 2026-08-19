/**
 * Hexagonal hooks for Suppliers Management module
 * Centralizes CRUD operations for suppliers via SupplierService
 */

import { SupplierService, getSupplierService} from '@/application/services/SupplierService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { SupplierTransformer } from '@/dtos/transforms/SupplierTransformer';
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

// Hook: Fetch all suppliers
export function useSuppliersList() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const service = getSupplierService();
      const suppliers = await service.getAllSuppliers();
      return suppliers.map(s => ({
        id: s.id,
        name: s.name,
        contact_person: s.contactPerson,
        email: s.email,
        phone: s.phone,
        address: s.address,
        category: s.category || null,
        rating: s.rating?.overall ?? null,
        nif: s.nif,
        commerce_register_ref: s.commerceRegisterRef,
        is_active: s.status === 'active',
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
      const service = getSupplierService();
      return await service.createSupplier(SupplierTransformer.fromFormData(supplierData as unknown as Record<string, unknown>));
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
      return await service.updateSupplier(id, SupplierTransformer.fromFormData(data as unknown as Record<string, unknown>));
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
