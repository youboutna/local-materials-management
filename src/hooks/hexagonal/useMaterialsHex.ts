/**
 * Materials Hook - Enhanced with MaterialDomainTransformer Integration
 * Uses MaterialDomainTransformer with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { MaterialService } from "@/application/services/MaterialService";
import { MaterialTransformer, CreateMaterialRequestDto, UpdateMaterialRequestDto, MaterialDTO, MaterialCategory } from '@/dtos/transforms';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Types compatibles avec le service
type ServiceCreateMaterialDTO = Omit<CreateMaterialRequestDto, 'category'> & { category?: MaterialCategory };
type ServiceUpdateMaterialDTO = Omit<UpdateMaterialRequestDto, 'category'> & { category?: MaterialCategory };

// Enhanced types for UI components
interface MaterialAnalytics {
  stockStatus: 'optimal' | 'low' | 'critical' | 'out_of_stock';
  costEfficiency: number;
  qualityScore: number;
  reorderLevel: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  compliance: string;
}

interface MaterialReport {
  id: string;
  name: string;
  analytics: MaterialAnalytics;
}

export interface UseMaterialsHexResult {
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
  getMaterialStockStatus: (material: MaterialDTO) => 'optimal' | 'low' | 'critical' | 'out_of_stock';
  getMaterialCostEfficiency: (material: MaterialDTO) => number;
  getMaterialQualityScore: (material: MaterialDTO) => number;
  getMaterialReorderLevel: (material: MaterialDTO) => number;
  getMaterialAnalytics: () => MaterialAnalytics;
  validateMaterialWithReferential: (material: MaterialDTO, referentialType: string) => Promise<ValidationResult>;
  generateMaterialReport: (material: MaterialDTO) => MaterialReport;
}

/**
 * Enhanced hook for materials management with UI-specific features
 */
export function useMaterialsHex(): UseMaterialsHexResult {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Initialize services with transformers
  const materialRepository = RepositoryFactory.getMaterialRepository();
  const materialService = new MaterialService(materialRepository);
  const materialTransformer = MaterialTransformer;

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
        const materialData = await materialService.getAllMaterials();
        return materialData.map(entity => MaterialTransformer.toDTO(entity));
      } catch (err) {
        console.error('Error fetching materials:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000,
    enabled: true
  });

  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: async (materialData: CreateMaterialRequestDto) => {
      try {
        // Convert to service-compatible format
        const serviceData: ServiceCreateMaterialDTO = { ...materialData };
        const createdMaterial = await materialService.createMaterial({
          ...serviceData,
          name: serviceData.name || '',
          description: serviceData.description || '',
          unit: serviceData.unit || 'unit'
        } as ServiceCreateMaterialDTO);
        return createdMaterial;
      } catch (error) {
        console.error('Error creating material:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(`Le matériel "${data.name}" a été créé avec succès.`);
      navigate('/materials');
    },
    onError: (error) => {
      console.error('Error creating material:', error);
      toast.error("Impossible de créer le matériel. Veuillez réessayer.");
    }
  });

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaterialRequestDto }) => {
      try {
        // Convert to service-compatible format
        const serviceData: ServiceUpdateMaterialDTO = { ...data };
        const updatedMaterial = await materialService.updateMaterial(id, {
          ...serviceData,
          name: data.name || '',
          description: data.description || '',
          unit: data.unit || 'unit'
        } as ServiceUpdateMaterialDTO);
        return updatedMaterial;
      } catch (error) {
        console.error('Error updating material:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(`Le matériel "${data.name}" a été mis à jour avec succès.`);
    },
    onError: (error: Error) => {
      console.error('Error updating material:', error);
      toast.error("Impossible de mettre à jour le matériel. Veuillez réessayer.");
    }
  });

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await materialService.deleteMaterial(id);
        return { success: true, id };
      } catch (error) {
        console.error('Error deleting material:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success("Le matériel a été supprimé avec succès.");
    },
    onError: (error) => {
      console.error('Error deleting material:', error);
      toast.error("Impossible de supprimer le matériel.");
    }
  });

  // Enhanced UI functions
  const getMaterialStockStatus = (material: MaterialDTO): 'optimal' | 'low' | 'critical' | 'out_of_stock' => {
    const currentStock = material.currentStock || 0;
    const minStock = material.minStock || 0;
    
    if (currentStock === 0) return 'out_of_stock';
    if (currentStock <= minStock) return 'critical';
    if (currentStock <= minStock * 1.5) return 'low';
    return 'optimal';
  };

  const getMaterialCostEfficiency = (material: MaterialDTO): number => {
    const unitCost = material.unitCost || 0;
    const expectedCost = material.expectedCost || unitCost;
    const actualCost = material.actualCost || unitCost;
    
    if (expectedCost === 0) return 100;
    return Math.round((expectedCost / actualCost) * 100);
  };

  const getMaterialQualityScore = (material: MaterialDTO): number => {
    // Calcul basé sur le taux de défauts et la fiabilité du fournisseur
    const defectRate = material.defectRate || 0;
    const supplierReliability = material.supplierReliability || 100;
    
    // Score de qualité : 100 - (taux de défauts * 10) - (100 - supplierReliability))
    const qualityScore = Math.max(0, Math.min(100, 100 - (defectRate * 10) - (100 - supplierReliability)));
    return Math.round(qualityScore);
  };

  const getMaterialReorderLevel = (material: MaterialDTO): number => {
    const currentStock = material.currentStock || 0;
    const minStock = material.minStock || 0;
    const dailyUsage = material.dailyUsage || 1;
    
    // Jours jusqu'au réapprovisionnement
    if (currentStock <= minStock) return 0;
    return Math.round((currentStock - minStock) / dailyUsage);
  };

  const getMaterialStockLevel = (material: MaterialDTO): 'optimal' | 'low' | 'critical' | 'out_of_stock' => {
    const currentStock = material.currentStock || 0;
    const minStock = material.minStock || 0;
    
    if (currentStock === 0) return 'out_of_stock';
    if (currentStock <= minStock) return 'critical';
    if (currentStock <= minStock * 1.5) return 'low';
    return 'optimal';
  };

  const getMaterialAnalytics = (): MaterialAnalytics => {
    const totalMaterials = materials.length;
    const stockStatus = materials.reduce((acc, material) => {
      const stock = material.currentStock || 0;
      const minStock = material.minStock || 0;
      
      if (stock === 0) acc.outOfStock++;
      else if (stock <= minStock) acc.critical++;
      else acc.optimal++;
      
      return acc;
    }, { optimal: 0, low: 0, critical: 0, outOfStock: 0 });
    
    const totalValue = materials.reduce((sum, material) => sum + (material.value || 0), 0);
    const averageCostEfficiency = materials.length > 0 
      ? materials.reduce((sum, m) => sum + (m.costEfficiency || 0), 0) / materials.length 
      : 0;
    const averageQualityScore = materials.length > 0
      ? materials.reduce((sum, m) => sum + (m.qualityScore || 0), 0) / materials.length
      : 0;
    
    return {
      stockStatus: {
        optimal: stockStatus.optimal,
        low: stockStatus.low,
        critical: stockStatus.critical,
        outOfStock: stockStatus.outOfStock
      },
      costEfficiency: Math.round(averageCostEfficiency),
      qualityScore: Math.round(averageQualityScore * 100) / 100,
      reorderLevel: 0
    };
  };

  // Validation functions for different referential types
  const validateQualityReferential = (material: MaterialDTO) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate quality standards
    if (!material.qualityStandards) {
      warnings.push('Quality standards not specified');
    }
    
    // Validate quality certifications
    if (!material.qualityCertifications && material.value > 10000) {
      warnings.push('Quality certifications recommended for materials over 10,000');
    }
    
    // Validate quality testing
    if (!material.qualityTests && material.value > 5000) {
      warnings.push('Quality testing recommended for materials over 5,000');
    }
    
    // Validate quality specifications
    if (!material.qualitySpecifications) {
      warnings.push('Quality specifications not specified');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'quality'
    };
  };

  const validateSafetyReferential = (material: MaterialDTO) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate safety data sheet
    if (!material.safetyDataSheet) {
      errors.push('Safety data sheet is required');
    }
    
    // Validate safety certifications
    if (!material.safetyCertifications && material.hazardous) {
      errors.push('Safety certifications required for hazardous materials');
    }
    
    // Validate handling procedures
    if (!material.handlingProcedures && material.requiresSpecialHandling) {
      warnings.push('Handling procedures not specified for special handling materials');
    }
    
    // Validate storage requirements
    if (!material.storageRequirements && material.requiresSpecialStorage) {
      warnings.push('Storage requirements not specified for special storage materials');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'safety'
    };
  };

  const validateEnvironmentalReferential = (material: MaterialDTO) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate environmental impact assessment
    if (!material.environmentalImpact) {
      warnings.push('Environmental impact assessment not specified');
    }
    
    // Validate environmental compliance
    if (!material.environmentalCompliance && material.value > 25000) {
      warnings.push('Environmental compliance documentation recommended for materials over 25,000');
    }
    
    // Validate disposal requirements
    if (!material.disposalRequirements && material.hazardous) {
      errors.push('Disposal requirements required for hazardous materials');
    }
    
    // Validate recycling information
    if (!material.recyclingInformation && material.recyclable) {
      warnings.push('Recycling information not specified for recyclable materials');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'environmental'
    };
  };

  const validateRegulatoryReferential = (material: MaterialDTO) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate regulatory compliance
    if (!material.regulatoryCompliance) {
      warnings.push('Regulatory compliance not specified');
    }
    
    // Validate import/export documentation
    if (!material.importExportDocumentation && material.value > 15000) {
      warnings.push('Import/export documentation recommended for materials over 15,000');
    }
    
    // Validate customs requirements
    if (!material.customsRequirements && material.international) {
      warnings.push('Customs requirements not specified for international materials');
    }
    
    // Validate regulatory certifications
    if (!material.regulatoryCertifications && material.value > 20000) {
      warnings.push('Regulatory certifications recommended for materials over 20,000');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'regulatory'
    };
  };

  // Generate material recommendations based on analysis
  const generateMaterialRecommendations = (material: MaterialDTO, reorderLevel: string, stockLevel: string) => {
    const recommendations: string[] = [];
    
    // Stock level-based recommendations
    if (stockLevel === 'critical') {
      recommendations.push('Urgent reorder required - critical stock level');
      recommendations.push('Consider alternative suppliers if available');
      recommendations.push('Review reorder point and safety stock levels');
    } else if (stockLevel === 'low') {
      recommendations.push('Reorder recommended - low stock level');
      recommendations.push('Review reorder point and safety stock levels');
    }
    
    // Reorder level-based recommendations
    if (reorderLevel === 'urgent') {
      recommendations.push('Immediate reorder required');
    } else if (reorderLevel === 'high') {
      recommendations.push('Reorder within 3 days');
    } else if (reorderLevel === 'medium') {
      recommendations.push('Reorder within 7 days');
    }
    
    // Material-specific recommendations
    if (material.hazardous) {
      recommendations.push('Handle with appropriate safety measures');
      recommendations.push('Ensure proper storage and disposal procedures');
    }
    
    if (material.perishable && material.expiryDate) {
      recommendations.push('Check expiry date before use');
      recommendations.push('Implement FIFO rotation system');
    }
    
    if (material.value > 100000) {
      recommendations.push('High-value material requires additional verification');
      recommendations.push('Consider insurance coverage');
    }
    
    return recommendations;
  };

  const validateMaterialWithReferential = async (material: MaterialDTO, referentialType: string): Promise<ValidationResult> => {
    try {
      // Validation selon le type de référentiel
      switch (referentialType) {
        case 'quality':
          return validateQualityReferential(material);
        case 'safety':
          return validateSafetyReferential(material);
        case 'environmental':
          return validateEnvironmentalReferential(material);
        case 'regulatory':
          return validateRegulatoryReferential(material);
        default:
          return { isValid: true, errors: [], warnings: ['Unknown referential type'] };
      }
    } catch (error) {
      console.error('Referential validation error:', error);
      return { isValid: false, errors: ['Validation failed'], warnings: [] };
    }
  };

  const generateMaterialReport = (material: MaterialDTO): MaterialReport => {
    try {
      const analytics = getMaterialAnalytics();
      const reorderLevel = getMaterialReorderLevel(material);
      const stockLevel = getMaterialStockLevel(material);
      
      return {
        id: material.id,
        name: material.name,
        analytics: {
          stockStatus: analytics.stockStatus,
          costEfficiency: analytics.costEfficiency,
          qualityScore: analytics.qualityScore,
          reorderLevel: reorderLevel
        }
      };
    } catch (error) {
      console.error('Report generation error:', error);
      return { 
        id: material.id, 
        name: material.name,
        error: 'Report generation failed',
        status: 'error'
      };
    }
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
    getMaterialStockStatus,
    getMaterialCostEfficiency,
    getMaterialQualityScore,
    getMaterialReorderLevel,
    getMaterialAnalytics,
    validateMaterialWithReferential,
    generateMaterialReport
  };
}

export function useMaterialsByCategory(category: string) {
  const materialService = new MaterialService(
    RepositoryFactory.getMaterialRepository()
  );

  return useQuery({
    queryKey: ['materials', 'category', category],
    queryFn: async () => {
      return await materialService.getMaterialsByCategory(category);
    },
    enabled: !!category,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMaterialById(id: string) {
  const materialService = new MaterialService(
    RepositoryFactory.getMaterialRepository()
  );

  return useQuery({
    queryKey: ['materials', 'id', id],
    queryFn: async () => {
      const material = await materialService.getMaterialById(id);
      return material;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLowStockMaterials() {
  const materialService = new MaterialService(
    RepositoryFactory.getMaterialRepository()
  );

  return useQuery({
    queryKey: ['materials', 'low-stock'],
    queryFn: async () => {
      return await materialService.getLowStockMaterials();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for single material operations
 */
export function useMaterialHex(id: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const materialService = new MaterialService(
    RepositoryFactory.getMaterialRepository()
  );

  // Query for single material
  const {
    data: material,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['materials', id],
    queryFn: async () => {
      const result = await materialService.getMaterialById(id);
      return result;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateMaterialRequestDto) => {
      return await materialService.updateMaterial(id, data);
    },
    onSuccess: () => {
      toast.success(t('material.updated'));
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: (error: Error) => {
      toast.error(t('material.updateError'));
      console.error('Error updating material:', error);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await materialService.deleteMaterial(id);
    },
    onSuccess: () => {
      toast.success(t('material.deleted'));
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      navigate('/materials');
    },
    onError: (error: any) => {
      toast.error(t('material.deleteError'));
      console.error('Error deleting material:', error);
    }
  });

  return {
    material,
    isLoading,
    error,
    refetch,
    updateMaterial: updateMutation.mutate,
    deleteMaterial: deleteMutation.mutate,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
