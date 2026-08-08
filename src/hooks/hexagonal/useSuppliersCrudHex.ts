/**
 * Supplier Management CRUD Hooks
 */

import { SupplierService, getSupplierService} from '@/application/services/SupplierService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
      const supplierService = getSupplierService();
      const suppliers = await supplierService.getAllSuppliers();
      return suppliers || [];
    }
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SupplierMgmtFormData) => {
      const supplierService = getSupplierService();
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
      const supplierService = getSupplierService();
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
      const supplierService = getSupplierService();
      await supplierService.deleteSupplier(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers-list-crud'] })
  });
}