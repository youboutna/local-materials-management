/**
 * Enhanced Hook for Materials Management with Rich UI Features
 * Uses MaterialDomainTransformer with advanced calculations and utilities
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { MaterialService } from "@/application/services/MaterialService";
import { MaterialTransformer, CreateMaterialRequestDto, UpdateMaterialRequestDto } from '@/dtos/transforms';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';

// Enhanced types for UI components
export interface UseMaterialsEnhancedResult {
  materials: MaterialDTO[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createMaterial: (data: CreateMaterialRequestDto) => void;
  updateMaterial: ({ id, data }: { id: string; data: UpdateMaterialRequestDto }) => void;
  deleteMaterial: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  searchMaterials: (term: string) => MaterialDTO[];
  filterByCategory: (category: string) => MaterialDTO[];
  sortByPrice: (ascending?: boolean) => MaterialDTO[];
  sortByQuantity: (ascending?: boolean) => MaterialDTO[];
  calculateTotalCost: (materials: MaterialDTO[], quantities: number[]) => number;
  calculateInventoryValue: () => number;
  getLowStockMaterials: () => MaterialDTO[];
  getOutOfStockMaterials: () => MaterialDTO[];
}

/**
 * Enhanced hook for materials management with UI-specific features
 */
export function useMaterialsEnhanced(): UseMaterialsEnhancedResult {
  const queryClient = useQueryClient();
  
  const materialRepository = RepositoryFactory.getMaterialRepository();
  const materialService = new MaterialService(materialRepository);
  const materialTransformer = new MaterialTransformer();

  // Query for materials list
  const {
    data: materials = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['materials'],
    queryFn: async (): Promise<MaterialDTO[]> => {
      try {
        const materialEntities = await materialService.getAllMaterials();
        return materialTransformer.fromDtosToAdapter(
          materialEntities.map(entity => materialTransformer.toDTO(entity))
        );
      } catch (err) {
        console.error('Error fetching materials:', err);
        throw err;
      }
    }
  });

  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: async (data: CreateMaterialRequestDto): Promise<MaterialDTO> => {
      try {
        const materialDTO = materialTransformer.toRequestDto(data);
        const materialEntity = materialService.createMaterial(materialDTO);
        return materialTransformer.fromDomainToResponseDto(materialEntity);
      } catch (error) {
        console.error('Error creating material:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Matériel créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: (error: Error) => {
      console.error('Create material error:', error);
      toast.error('Erreur lors de la création du matériel');
    }
  });

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaterialRequestDto }): Promise<MaterialDTO> => {
      try {
        const materialDTO = materialTransformer.toUpdateDto(data);
        const materialEntity = await materialService.updateMaterial(id, materialDTO);
        return materialTransformer.fromDomainToResponseDto(materialEntity);
      } catch (error) {
        console.error('Error updating material:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Matériel mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: (error: Error) => {
      console.error('Update material error:', error);
      toast.error('Erreur lors de la mise à jour du matériel');
    }
  });

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      try {
        await materialService.deleteMaterial(id);
      } catch (error) {
        console.error('Error deleting material:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Matériel supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: (error: Error) => {
      console.error('Delete material error:', error);
      toast.error('Erreur lors de la suppression du matériel');
    }
  });

  // Enhanced UI methods (simplified)
  const searchMaterials = (term: string): MaterialDTO[] => {
    return materials.filter(material => 
      material.name.toLowerCase().includes(term.toLowerCase())
    );
  };

  const filterByCategory = (category: string): MaterialDTO[] => {
    return materials.filter(material => material.category === category);
  };

  const sortByPrice = (ascending: boolean = true): MaterialDTO[] => {
    return [...materials].sort((a, b) => 
      ascending ? a.unitPrice - b.unitPrice : b.unitPrice - a.unitPrice
    );
  };

  const sortByQuantity = (ascending: boolean = false): MaterialDTO[] => {
    return [...materials].sort((a, b) => 
      ascending ? a.availableQuantity - b.availableQuantity : b.availableQuantity - a.availableQuantity
    );
  };

  const calculateTotalCost = (materialsList: MaterialDTO[], quantities: number[]): number => {
    return materialsList.reduce((total, material, index) => {
      const quantity = quantities[index] || 0;
      return total + (material.unitPrice * quantity);
    }, 0);
  };

  const calculateInventoryValue = (): number => {
    return materials.reduce((total, material) => {
      return total + (material.unitPrice * material.availableQuantity);
    }, 0);
  };

  const getLowStockMaterials = (): MaterialDTO[] => {
    return materials.filter(material => material.availableQuantity <= material.minStock);
  };

  const getOutOfStockMaterials = (): MaterialDTO[] => {
    return materials.filter(material => material.availableQuantity === 0);
  };

  return {
    materials,
    isLoading,
    error,
    refetch,
    createMaterial: createMaterialMutation.mutate,
    updateMaterial: updateMaterialMutation.mutate,
    deleteMaterial: deleteMaterialMutation.mutate,
    isCreating: createMaterialMutation.isPending,
    isUpdating: updateMaterialMutation.isPending,
    isDeleting: deleteMaterialMutation.isPending,
    // Enhanced UI features
    searchMaterials,
    filterByCategory,
    sortByPrice,
    sortByQuantity,
    calculateTotalCost,
    calculateInventoryValue,
    getLowStockMaterials,
    getOutOfStockMaterials
  };
}

/**
 * Hook for material calculations and analytics
 */
export function useMaterialCalculations() {
  const { materials } = useMaterialsEnhanced();

  const getMaterialStats = () => {
    const totalValue = MaterialDomainTransformer.calculateTotalInventoryValue(materials);
    const lowStockCount = materials.filter(m => 
      MaterialDomainTransformer.getMaterialStockStatus(m.availableQuantity) === 'low-stock'
    ).length;
    const outOfStockCount = materials.filter(m => 
      MaterialDomainTransformer.getMaterialStockStatus(m.availableQuantity) === 'out-of-stock'
    ).length;
    
    return {
      totalMaterials: materials.length,
      totalValue,
      lowStockCount,
      outOfStockCount,
      inStockCount: materials.length - lowStockCount - outOfStockCount
    };
  };

  const getCategoryBreakdown = () => {
    const categories: Record<string, { count: number; value: number }> = {};
    
    materials.forEach(material => {
      const category = material.category;
      if (!categories[category]) {
        categories[category] = { count: 0, value: 0 };
      }
      categories[category].count++;
      categories[category].value += MaterialDomainTransformer.calculateMaterialValue(material);
    });
    
    return categories;
  };

  const getTopExpensiveMaterials = (limit: number = 5) => {
    return MaterialDomainTransformer.sortMaterialsByPrice(materials, false)
      .slice(0, limit)
      .map(material => ({
        name: material.name,
        price: material.pricePerUnit,
        value: MaterialDomainTransformer.calculateMaterialValue(material)
      }));
  };

  return {
    getMaterialStats,
    getCategoryBreakdown,
    getTopExpensiveMaterials
  };
}
