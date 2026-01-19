/**
 * Hexagonal Hook for Suppliers Management
 * Implements complete hexagonal architecture flow:
 * [UI] → [Hook] → [Factory] → [Adapter] → [Service] → [Transformers] → [Entities] → [Persistence]
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { SupplierService } from "@/application/services/SupplierService";
import { SupplierDomainTransformer, CreateSupplierRequestDto, UpdateSupplierRequestDto } from "@/dtos/transforms";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Types pour les hooks
export interface UseSuppliersHexResult {
  suppliers: any[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  createSupplier: (data: CreateSupplierRequestDto) => void;
  updateSupplier: ({ id, data }: { id: string; data: UpdateSupplierRequestDto }) => void;
  deleteSupplier: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  getSupplierReliability: (supplier: any) => number;
  getSupplierPerformance: (supplier: any) => 'excellent' | 'good' | 'average' | 'poor';
  getSupplierRiskLevel: (supplier: any) => 'low' | 'medium' | 'high';
  getSupplierDeliveryTime: (supplier: any) => number;
  getSupplierAnalytics: () => any;
  validateSupplierWithReferential: (supplier: any, referentialType: string) => Promise<any>;
  generateSupplierReport: (supplier: any) => any;
}

/**
 * Hook principal pour la gestion des fournisseurs
 * Architecture hexagonale complète avec mocks centralisés
 */
export function useSuppliersHex(): UseSuppliersHexResult {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // [Factory] → [Adapter] → [Service] → [Transformers] → [Entities]
  // Utilisation de l'architecture existante
  const supplierRepository = RepositoryFactory.getSupplierRepository();
  const supplierService = new SupplierService(supplierRepository, SupplierDomainTransformer);

  // Query pour la liste des fournisseurs
  const {
    data: suppliers = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<any[]> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const suppliers = await supplierService.getAllSuppliers();
          });
        }
        
        // Production: Flux hexagonal complet
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const suppliers = await supplierService.getActiveSuppliers();
        
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

  // Mutation pour créer un fournisseur
  const createSupplierMutation = useMutation({
    mutationFn: async (supplierData: CreateSupplierRequestDto): Promise<SupplierResponseDto> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        const supplierEntity = SupplierMapper.toDomainFromCreateDto(supplierData);
        const supplierEntity = SupplierMapper.toDomainFromCreateDto(createDto);
        const createdSupplier = await supplierService.createSupplier(supplierEntity);
        
        // [Transformers]: Entity → DTO
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

  // Mutation pour mettre à jour un fournisseur
  const updateSupplierMutation = useMutation({
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
          // Utilisation du Transformer existant : SupplierMapper
          const updateDto = new UpdateSupplierRequestDto(
            updates.name,
            updates.contactEmail,
            updates.contactPhone,
            updates.address,
            updates.nif,
            updates.category || 'general',
            updates.isActive ? 'active' : 'inactive',
            updates.rating,
            [],
            updates.isActive ?? true
          );
          
          const supplierEntity = SupplierMapper.toUpdateData(updateDto);
          const updatedSupplier = { ...supplierEntity, id };
          
          return SupplierMapper.toResponseDto(updatedSupplier as any);
        }
        
        // Production: Flux hexagonal complet
        // [DTO] → [Entity] → [Service] → [Repository] → [Persistence]
        // Utilisation du Transformer existant : SupplierMapper
        const updateDto = new UpdateSupplierRequestDto(
          updates.name,
          updates.contactEmail,
          updates.contactPhone,
          updates.address,
          updates.nif,
          updates.category || 'general',
          updates.isActive ? 'active' : 'inactive',
          updates.rating,
          [],
          updates.isActive ?? true
        );
        
        const supplierEntity = SupplierMapper.toUpdateData(updateDto);
        const updatedSupplier = await supplierService.updateSupplier(id, supplierEntity);
        
        // [Transformers]: Entity → DTO
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

  // Mutation pour supprimer un fournisseur
  const deleteSupplierMutation = useMutation({
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
    createSupplier: createSupplierMutation.mutateAsync,
    updateSupplier: updateSupplierMutation.mutateAsync,
    deleteSupplier: deleteSupplierMutation.mutateAsync,
    isCreating: createSupplierMutation.isPending,
    isUpdating: updateSupplierMutation.isPending,
    isDeleting: deleteSupplierMutation.isPending
  };
}

/**
 * Hook pour les fournisseurs par spécialisation
 */
export function useSuppliersBySpecialization(specialization: string) {
  // [Factory] → [Adapter] → [Service] → [Transformers] → [Entities]
  // Utilisation de l'architecture existante
  const supplierRepository = RepositoryFactory.getSupplierRepository();
  const supplierService = new SupplierService(supplierRepository);
  
  return useQuery({
    queryKey: ['suppliers', 'specialization', specialization],
    queryFn: async (): Promise<SupplierResponseDto[]> => {
      try {
        if (DEV_MODE) {
          // Mode développement: filtrer les données centralisées
          const filteredSuppliers = allSuppliersData.filter((s: MockSupplier) => 
            s.specialization.includes(specialization)
          );
          
          // [Mock Data] → [DTOs] : Flux correct pour testing
          // Utilisation du Transformer existant : SupplierMapper
          return filteredSuppliers.map((supplier: MockSupplier) => {
            // Créer une entité Supplier à partir du mock
            const supplierEntity = SupplierMapper.toDomain({
              id: supplier.id,
              name: supplier.name,
              email: supplier.contactEmail,
              phone: supplier.contactPhone,
              address: supplier.address,
              nif: '', // MockSupplier n'a pas de nif, utiliser valeur par défaut
              category: 'materials' as SupplierCategory, // MockSupplier n'a pas de category, utiliser valeur par défaut
              status: supplier.isActive ? 'active' : 'inactive',
              rating: supplier.rating,
              contacts: [],
              is_verified: true,
              verified_at: supplier.createdAt,
              workspace_id: 'workspace-1',
              created_at: supplier.createdAt,
              updated_at: supplier.updatedAt
            });
            
            return SupplierMapper.toResponseDto(supplierEntity);
          });
        }
        
        // Production: Flux hexagonal complet
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const suppliers = await supplierService.searchSuppliers({ 
          searchTerm: specialization,
          isActive: true,
          limit: 50
        });
        
        // [Transformers]: Entities → DTOs
        // Utilisation du Transformer existant : SupplierMapper
        return SupplierMapper.toResponseDtoArray(suppliers.suppliers);
      } catch (error) {
        console.error('Error fetching suppliers by specialization:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch suppliers by specialization');
      }
    },
    enabled: !!specialization,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Export par défaut pour compatibilité
export const useSupplierHex = useSuppliersHex;