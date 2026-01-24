/**
 * Supplier Management CRUD Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierService } from '@/application/services/SupplierService';

export interface SupplierMgmtFormData {
  name: string;
  company_name?: string;
  contact_person?: string;
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
      const supplierService = new SupplierService();
      const suppliers = await supplierService.getAllSuppliers();
      return suppliers || [];
    }
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SupplierMgmtFormData) => {
      const supplierService = new SupplierService();
      await supplierService.createSupplier({
        company_name: data.name || data.company_name || '',
        contact_person: data.contact_person,
        category: data.category,
        status: data.status || 'active',
        email: data.email,
        phone: data.phone,
        address: data.address,
        nif: data.nif,
        specializations: data.specializations,
        rating: data.rating
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers-list-crud'] })
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SupplierMgmtFormData }) => {
      const supplierService = new SupplierService();
      await supplierService.updateSupplier(id, {
        company_name: data.name || data.company_name,
        contact_person: data.contact_person,
        category: data.category,
        status: data.status,
        email: data.email,
        phone: data.phone,
        address: data.address,
        nif: data.nif,
        specializations: data.specializations,
        rating: data.rating
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers-list-crud'] })
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supplierService = new SupplierService();
      await supplierService.deleteSupplier(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers-list-crud'] })
  });
}
