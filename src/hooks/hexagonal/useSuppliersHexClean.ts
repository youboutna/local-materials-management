/**
 * Hexagonal Hook for Suppliers Management (Clean version)
 */

import { SupplierService } from "@/application/services/SupplierService";
import { RepositoryFactory } from "@/infrastructure/RepositoryFactory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface UseSuppliersHexResult {
  suppliers: any[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createSupplier: (data: any) => void;
  updateSupplier: ({ id, data }: { id: string; data: any }) => void;
  deleteSupplier: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useSuppliersHex(): UseSuppliersHexResult {
  const queryClient = useQueryClient();
  
  const supplierRepository = RepositoryFactory.getSupplierRepository();
  const supplierService = new SupplierService(supplierRepository);

  const {
    data: suppliers = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const suppliers = await supplierService.getAllSuppliers();
      return suppliers || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (supplierData: any) => {
      return await supplierService.createSupplier(supplierData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Fournisseur créé avec succès");
    },
    onError: (error: Error) => { toast.error(error.message); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await supplierService.updateSupplier(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Fournisseur mis à jour avec succès");
    },
    onError: (error: Error) => { toast.error(error.message); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supplierService.deleteSupplier(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Fournisseur supprimé avec succès");
    },
    onError: (error: Error) => { toast.error(error.message); }
  });

  return {
    suppliers,
    isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch,
    createSupplier: createMutation.mutate,
    updateSupplier: updateMutation.mutate,
    deleteSupplier: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
