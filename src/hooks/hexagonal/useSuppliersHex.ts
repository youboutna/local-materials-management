/**
 * Hexagonal Hook for Suppliers Management
 */

import { SupplierService } from "@/application/services/SupplierService";
import { RepositoryFactory } from "@/infrastructure/RepositoryFactory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Types pour les hooks
export interface UseSuppliersHexResult {
  suppliers: any[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  createSupplier: (data: any) => void;
  updateSupplier: ({ id, data }: { id: string; data: any }) => void;
  deleteSupplier: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  getSupplierReliability: (supplier: any) => number;
  getSupplierPerformance: (supplier: any) => 'excellent' | 'good' | 'average' | 'poor';
  getSupplierRiskLevel: (supplier: any) => 'low' | 'medium' | 'high';
  getSupplierDeliveryTime: (supplier: any) => number;
  getSupplierAnalytics: () => any;
  validateSupplierWithReferential: (supplier: any, referentialType: string) => Promise<any>;
  generateSupplierReport: (supplier: any) => any;
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
    queryFn: async (): Promise<any[]> => {
      const allSuppliers = await supplierService.getAllSuppliers();
      return allSuppliers || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (supplierData: any) => {
      return await supplierService.createSupplier(supplierData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Fournisseur créé avec succès");
    },
    onError: (err: Error) => { toast.error(err.message); }
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await supplierService.updateSupplier(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Fournisseur mis à jour avec succès");
    },
    onError: (err: Error) => { toast.error(err.message); }
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      await supplierService.deleteSupplier(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Fournisseur supprimé avec succès");
    },
    onError: (err: Error) => { toast.error(err.message); }
  });

  const getSupplierReliability = (supplier: any): number => {
    const onTimeDeliveryRate = supplier?.onTimeDeliveryRate || 0.8;
    const qualityScore = supplier?.qualityScore || 0.7;
    const responseTime = supplier?.responseTime || 24;
    const responseScore = Math.max(0, 100 - responseTime);
    return Math.round((onTimeDeliveryRate * 40 + qualityScore * 40 + responseScore * 0.2));
  };

  const getSupplierPerformance = (supplier: any): 'excellent' | 'good' | 'average' | 'poor' => {
    const reliability = getSupplierReliability(supplier);
    if (reliability >= 90) return 'excellent';
    if (reliability >= 75) return 'good';
    if (reliability >= 50) return 'average';
    return 'poor';
  };

  const getSupplierRiskLevel = (supplier: any): 'low' | 'medium' | 'high' => {
    const reliability = getSupplierReliability(supplier);
    if (!supplier?.is_active) return 'high';
    if (reliability >= 80) return 'low';
    if (reliability >= 50) return 'medium';
    return 'high';
  };

  const getSupplierDeliveryTime = (supplier: any): number => {
    return supplier?.averageDeliveryDays || 7;
  };

  const getSupplierAnalytics = () => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter((s: any) => s.is_active !== false).length;
    const averageReliability = suppliers.length > 0
      ? suppliers.reduce((sum: number, s: any) => sum + getSupplierReliability(s), 0) / suppliers.length
      : 0;
    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers: totalSuppliers - activeSuppliers,
      averageReliability: Math.round(averageReliability),
      riskDistribution: {
        low: suppliers.filter((s: any) => getSupplierRiskLevel(s) === 'low').length,
        medium: suppliers.filter((s: any) => getSupplierRiskLevel(s) === 'medium').length,
        high: suppliers.filter((s: any) => getSupplierRiskLevel(s) === 'high').length,
      }
    };
  };

  return {
    suppliers,
    isLoading,
    error,
    refetch,
    createSupplier: createSupplierMutation.mutate,
    updateSupplier: updateSupplierMutation.mutate,
    deleteSupplier: deleteSupplierMutation.mutate,
    isCreating: createSupplierMutation.isPending,
    isUpdating: updateSupplierMutation.isPending,
    isDeleting: deleteSupplierMutation.isPending,
    getSupplierReliability,
    getSupplierPerformance,
    getSupplierRiskLevel,
    getSupplierDeliveryTime,
    getSupplierAnalytics,
    validateSupplierWithReferential: async () => ({ isValid: true, errors: [], warnings: [] }),
    generateSupplierReport: (supplier: any) => ({
      supplier,
      reliability: getSupplierReliability(supplier),
      performance: getSupplierPerformance(supplier),
      riskLevel: getSupplierRiskLevel(supplier),
      generatedAt: new Date().toISOString()
    })
  };
}

export function useSuppliersBySpecializationHex(specialization: string) {
  const supplierRepository = RepositoryFactory.getSupplierRepository();
  const supplierService = new SupplierService(supplierRepository);
  
  return useQuery({
    queryKey: ['suppliers', 'specialization', specialization],
    queryFn: async () => {
      const result = await supplierService.searchSuppliers({ 
        searchTerm: specialization,
        isActive: true,
        limit: 50
      });
      return result?.suppliers || [];
    },
    enabled: !!specialization,
    staleTime: 5 * 60 * 1000,
  });
}

export const useSupplierHex = useSuppliersHex;
