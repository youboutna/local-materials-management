/**
 * Supplier Management CRUD Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierService } from '@/application/services/SupplierService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface SupplierMgmtFormData {
  name: string;
  companyName?: string;
  contactPerson?: string;
  category: string;
  status?: string;
  email?: string;
  phone?: string;
  address?: string;
  nif?: string;
  specializations?: string[];
  rating?: number;
}

export function useSuppliersList() {
  return useQuery({
    queryKey: ['suppliers-list-crud'],
    queryFn: async () => {
      const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
      const suppliers = await supplierService.getAllSuppliers();
      return suppliers || [];
    }
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SupplierMgmtFormData) => {
      const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
      await supplierService.createSupplier({
        name: data.companyName || data.name || '',
        contactPerson: data.contactPerson,
        category: data.category,
        status: data.status || 'active',
        email: data.email,
        phone: data.phone,
        address: data.address,
        nif: data.nif,
        rating: data.rating
      } as any);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers-list-crud'] })
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SupplierMgmtFormData }) => {
      const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
      await supplierService.updateSupplier(id, {
        name: data.companyName || data.name,
        contactPerson: data.contactPerson,
        category: data.category,
        status: data.status,
        email: data.email,
        phone: data.phone,
        address: data.address,
        nif: data.nif,
        rating: data.rating
      } as any);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers-list-crud'] })
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
      await supplierService.deleteSupplier(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers-list-crud'] })
  });
}