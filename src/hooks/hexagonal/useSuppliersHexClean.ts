/**
 * Hexagonal Hook for Suppliers Management
 * Implements complete hexagonal architecture flow:
 * [UI] → [Hook] → [Factory] → [Adapter] → [Service] → [Transformers] → [Entities] → [Persistence]
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { SupplierService } from "@/application/services/SupplierService";
import { SupplierMapper, SupplierResponseDto, CreateSupplierRequestDto, UpdateSupplierRequestDto } from "@/infrastructure/transformers/SupplierMapper";
import { SupplierCategory } from "@/domain/entities/Supplier";

// Types pour les hooks
export interface UseSuppliersHexResult {
  suppliers: SupplierResponseDto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createSupplier: (data: CreateSupplierRequestDto) => void;
  updateSupplier: ({ id, data }: { id: string; data: UpdateSupplierRequestDto }) => void;
  deleteSupplier: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

/**
 * Hook principal pour la gestion des fournisseurs
 * Architecture hexagonale complète avec mocks centralisés
 */
export function useSuppliersHex(): UseSuppliersHexResult {
  const queryClient = useQueryClient();
  
  // [Factory] → [Adapter] → [Service] → [Transformers] → [Entities]
  // Utilisation de l'architecture existante
  const supplierRepository = RepositoryFactory.getSupplierRepository();
  const supplierService = new SupplierService(supplierRepository);

  // Query pour la liste des fournisseurs
  const {
    data: suppliers = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<SupplierResponseDto[]> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const suppliers = await supplierService.getAllSuppliers();
        
        // [Transformers]: Entities → DTOs
        // Utilisation du Transformer existant : SupplierMapper
        return SupplierMapper.toResponseDtoArray(suppliers);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch suppliers');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (supplierData: CreateSupplierRequestDto): Promise<SupplierResponseDto> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        const supplierEntity = SupplierMapper.toDomainFromCreateDto(supplierData);
        const createdSupplier = await supplierService.createSupplier(supplierEntity);
        
        return SupplierMapper.toResponseDto(createdSupplier);
      } catch (error) {
        console.error('Error creating supplier:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create supplier');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Fournisseur créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupplierRequestDto }): Promise<SupplierResponseDto> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        const updateData = SupplierMapper.toUpdateData(data);
        const updatedSupplier = await supplierService.updateSupplier(id, updateData);
        
        return SupplierMapper.toResponseDto(updatedSupplier);
      } catch (error) {
        console.error('Error updating supplier:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to update supplier');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Fournisseur mis à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        await supplierService.deleteSupplier(id);
      } catch (error) {
        console.error('Error deleting supplier:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to delete supplier');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Fournisseur supprimé avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return {
    suppliers,
    isLoading,
    error,
    refetch,
    createSupplier: createMutation.mutate,
    updateSupplier: updateMutation.mutate,
    deleteSupplier: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
