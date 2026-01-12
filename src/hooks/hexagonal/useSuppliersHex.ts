/**
 * Hook hexagonal pour les fournisseurs
 * Encapsule les use cases de l'architecture hexagonale avec CRUD complet
 */
import { useState, useEffect, useCallback } from 'react';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  GetSuppliersListUseCase,
  GetSupplierByIdUseCase,
  CreateSupplierUseCase,
  type CreateSupplierInput
} from '@/application/use-cases';
import { Supplier } from '@/domain/entities/Supplier';
import { supabase } from '@/integrations/supabase/client';

// Singleton instances des use cases
const supplierRepository = RepositoryFactory.getSupplierRepository();
const getSuppliersListUseCase = new GetSuppliersListUseCase(supplierRepository);
const getSupplierByIdUseCase = new GetSupplierByIdUseCase(supplierRepository);
const createSupplierUseCase = new CreateSupplierUseCase(supplierRepository);

export interface SupplierFormData {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  rating?: number;
  nif?: string;
  commerce_register_ref?: string;
}

export interface UseSuppliersHexResult {
  suppliers: Supplier[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createSupplier: (data: CreateSupplierInput) => Promise<Supplier | null>;
  updateSupplier: (id: string, data: Partial<SupplierFormData>) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useSuppliersHex(): UseSuppliersHexResult {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getSuppliersListUseCase.execute();
      if (result.success) {
        setSuppliers(result.suppliers);
      } else {
        throw new Error(result.error || 'Failed to fetch suppliers');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch suppliers'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const createSupplier = useCallback(async (data: CreateSupplierInput): Promise<Supplier | null> => {
    setIsCreating(true);
    try {
      const result = await createSupplierUseCase.execute(data);
      if (result.success && result.supplier) {
        await fetchSuppliers();
        return result.supplier;
      }
      throw new Error(result.error || 'Failed to create supplier');
    } finally {
      setIsCreating(false);
    }
  }, [fetchSuppliers]);

  const updateSupplier = useCallback(async (id: string, data: Partial<SupplierFormData>): Promise<boolean> => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update(data as any)
        .eq('id', id as any);
      
      if (error) throw error;
      await fetchSuppliers();
      return true;
    } catch (err) {
      console.error('Failed to update supplier:', err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [fetchSuppliers]);

  const deleteSupplier = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id as any);
      
      if (error) throw error;
      await fetchSuppliers();
      return true;
    } catch (err) {
      console.error('Failed to delete supplier:', err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [fetchSuppliers]);

  return {
    suppliers,
    loading,
    error,
    refetch: fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    isCreating,
    isUpdating,
    isDeleting,
  };
}

export interface UseSupplierHexResult {
  supplier: Supplier | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSupplierHex(supplierId: string | undefined): UseSupplierHexResult {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSupplier = useCallback(async () => {
    if (!supplierId) {
      setSupplier(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getSupplierByIdUseCase.execute(supplierId);
      if (result.success) {
        setSupplier(result.supplier);
      } else {
        throw new Error(result.error || 'Failed to fetch supplier');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch supplier'));
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchSupplier();
  }, [fetchSupplier]);

  return {
    supplier,
    loading,
    error,
    refetch: fetchSupplier,
  };
}
