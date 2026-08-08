/**
 * Materials Hook - Hexagonal Architecture
 * Rule #1: Form → DTO → Service → Domain → Adapter → DB
 */

import { getGeocodingService } from '@/application/services/GeocodingServiceFactory';
import { MaterialService } from "@/application/services/MaterialService";
import { useLanguage } from '@/contexts/LanguageContext';
import { CreateMaterialDTO, MaterialCategory, MaterialDTO, MaterialFormDataDTO, MaterialStatus, MaterialUnit, UpdateMaterialDTO } from '@/dtos/entities';
import { CreateMaterialRequestDto, MaterialUIDTO, UpdateMaterialRequestDto } from '@/dtos/transforms';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

// Types for advanced UI features
interface WorkspaceData {
  id: string;
  name: string;
  location: {
    name: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  } | string; // Can be string or object with coordinates
  status: string;
  coordinatesLatitude?: number; // Add direct coordinate access
  coordinatesLongitude?: number; // Add direct coordinate access
}

interface MaterialAnalytics {
  totalMaterials: number;
  totalValue: number;
  averagePrice: number;
  lowStockItems: number;
  outOfStockItems: number;
  categoryBreakdown: Record<string, number>;
  supplierBreakdown: Record<string, number>;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface MaterialReport {
  material: MaterialDTO;
  summary: string;
  recommendations: string[];
  generatedAt: string;
}

export interface UseMaterialsHexResult {
  materials: MaterialUIDTO[]; // Changed from MaterialDTO[] to MateriaDTO[]
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createMaterial: { 
    mutate: (data: CreateMaterialRequestDto, options?: {
      onSuccess?: (data: MaterialDTO) => void;
      onError?: (error: Error) => void;
      onSettled?: () => void;
    }) => void; 
    isPending: boolean; 
  };
  updateMaterial: { mutate: (params: { id: string; data: UpdateMaterialRequestDto }) => void; isPending: boolean };
  deleteMaterial: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  workspaces: WorkspaceData[]; // Workspace data for forms
  // Enhanced UI features
  getMaterialStockStatus: (material: MaterialUIDTO) => 'optimal' | 'low' | 'critical' | 'out_of_stock';
  getMaterialCostEfficiency: (material: MaterialUIDTO) => number;
  getMaterialQualityScore: (material: MaterialUIDTO) => number;
  getMaterialReorderLevel: (material: MaterialUIDTO) => number;
  getMaterialAnalytics: () => MaterialAnalytics;
  validateMaterialWithReferential: (material: MaterialUIDTO, referentialType: string) => Promise<ValidationResult>;
  generateMaterialReport: (material: MaterialUIDTO) => MaterialReport;
}

/**
 * Main materials management hook
 */
export function useMaterialsHex(): UseMaterialsHexResult {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { workspaces } = useWorkspaces();

  // Singleton geocoding service injected via factory (hexagonal DI).
  const geocodingService = getGeocodingService();

  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());

  const {
    data: materials = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['materials'],
    queryFn: async (): Promise<MaterialDTO[]> => {
      try {
        const materialData = await materialService.getMaterialsForUI();
        return materialData;
      } catch (err) {
        console.error('Error fetching materials:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Enhanced workspaces with geocoding data
  const {
    data: enhancedWorkspaces = [],
    isLoading: isLoadingWorkspaces
  } = useQuery({
    queryKey: ['enhanced-workspaces'],
    queryFn: async (): Promise<WorkspaceData[]> => {
      if (!workspaces || workspaces.length === 0) return [];

      const enhancedWorkspacesPromises = workspaces.map(async (w): Promise<WorkspaceData> => {
        try {
          let enhancedLocation: string | {
            name: string;  // required name
            coordinates?: {
              latitude: number;
              longitude: number;
            };
          } = w.location;

          // If location is a GeographicUnit with coordinates but missing name, try reverse geocoding
          if (typeof w.location === 'object' &&
              w.location &&
              'lat' in w.location && 'lng' in w.location &&
              (!('name' in w.location) || !(w.location as { name?: string }).name || (w.location as { name?: string }).name === '')) {

            try {
              const locationObj = w.location as { lat: number; lng: number };
              const coordinates = {
                latitude: locationObj.lat,
                longitude: locationObj.lng
              };
              const reverseResults = await geocodingService.reverseGeocode(coordinates.latitude, coordinates.longitude);
              if (reverseResults.length > 0) {
                const bestResult = reverseResults[0];
                if (bestResult.coordinates && typeof bestResult.coordinates.lng === 'number') {
                  enhancedLocation = {
                    name: bestResult.address,
                    coordinates: {
                      latitude: bestResult.coordinates.lat,
                      longitude: bestResult.coordinates.lng
                    }
                  };
                }
              }
            } catch (error) {
              console.warn(`Reverse geocoding failed for workspace ${w.id}:`, error);
            }
          }

          // If location is just a name string, try to geocode it for coordinates
          else if (typeof w.location === 'string' && w.location.trim() !== '') {
            try {
              const query = w.location.trim();
              const suggestions = await geocodingService.searchMauritaniaLocations(query);
              if (suggestions.length > 0) {
                const bestResult = suggestions[0] as { coordinates?: { lat: number; lng: number } };
                if (bestResult.coordinates && typeof bestResult.coordinates.lng === 'number') {
                  enhancedLocation = {
                    name: w.location,
                    coordinates: {
                      latitude: bestResult.coordinates.lat,
                      longitude: bestResult.coordinates.lng
                    }
                  };
                }
              }
            } catch (error) {
              console.warn(`Geocoding failed for workspace ${w.id}:`, error);
            }
          }

          return {
            id: w.id,
            name: w.name,
            location: enhancedLocation,
            status: w.status || 'active',
            coordinatesLatitude: typeof enhancedLocation === 'object' && enhancedLocation.coordinates
              ? enhancedLocation.coordinates.latitude
              : undefined,
            coordinatesLongitude: typeof enhancedLocation === 'object' && enhancedLocation.coordinates
              ? enhancedLocation.coordinates.longitude
              : undefined,
          };
        } catch (error) {
          console.warn(`Failed to enhance workspace ${w.id} with geocoding:`, error);
          // Return basic workspace data if enhancement fails
          return {
            id: w.id,
            name: w.name,
            location: w.location,
            status: w.status || 'active',
            coordinatesLatitude: undefined,
            coordinatesLongitude: undefined,
          };
        }
      });

      return await Promise.all(enhancedWorkspacesPromises);
    },
    enabled: !!workspaces && workspaces.length > 0,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes since geocoding is expensive
  });

  // Transform MaterialDTO[] to MaterialUIDTO[] for UI
  const transformedMaterials: MaterialUIDTO[] = materials.map((material): MaterialUIDTO => ({
    id: material.id,
    name: material.name,
    description: material.description,
    category: material.category,
    unit: material.unit,
    quantity: material.quantity,
    pricePerUnit: material.pricePerUnit,
    availableQuantity: material.availableQuantity,
    image: material.image,
    originLocation: material.originLocation,
    coordinatesLatitude: material.coordinatesLatitude,
    coordinatesLongitude: material.coordinatesLongitude,
    forme: material.forme,
    adresse: material.adresse,
    localisation: material.localisation,
    isActive: material.status === 'available',
    minimumQuantity: material.minQuantity,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt
  }));

  const createMaterialMutation = useMutation({
    mutationFn: async (data: CreateMaterialRequestDto) => {
      // Transform CreateMaterialRequestDto to CreateMaterialDTO
      const createDTO: CreateMaterialDTO = {
        name: data.name,
        description: data.description,
        category: data.category as MaterialCategory,
        unit: data.unit as MaterialUnit,
        pricePerUnit: data.unitCost || 0, // Map unitCost to pricePerUnit
        quantity: data.currentStock || 0, // Map currentStock to quantity
        availableQuantity: data.currentStock || 0, // Map currentStock to availableQuantity
        workspaceId: 'default-workspace', // Default workspace, should be provided by UI
        minQuantity: data.minStock || 0, // Map minStock to minQuantity
        gtin: data.specifications, // Map specifications to gtin (placeholder)
        sku: undefined,
        ean: undefined,
        asin: undefined,
        image: undefined,
        coordinatesLatitude: undefined,
        coordinatesLongitude: undefined,
        adresse: undefined,
        forme: undefined,
        localisation: undefined,
        multilangLabels: undefined,
        timeline: undefined,
        supplier: data.supplierId ? {
          name: data.supplierName || '',
          contact: data.leadTime?.toString() || '',
          leadTime: data.leadTime || 7
        } : undefined
      };
      return await materialService.createMaterial(createDTO);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(`Le matériel "${data.name}" a été créé avec succès.`);
      navigate('/materials');
    },
    onError: (error) => {
      console.error('Error creating material:', error);
      toast.error("Impossible de créer le matériel.");
    }
  });

  // Create a custom mutate function that accepts options
  const createMaterial = {
    mutate: (data: CreateMaterialRequestDto, options?: {
      onSuccess?: (data: MaterialDTO) => void;
      onError?: (error: Error) => void;
      onSettled?: () => void;
    }) => {
      createMaterialMutation.mutate(data, {
        onSuccess: (responseData) => {
          queryClient.invalidateQueries({ queryKey: ['materials'] });
          options?.onSuccess?.(responseData);
        },
        onError: (error) => {
          console.error('Error creating material:', error);
          options?.onError?.(error as Error);
        },
        onSettled: options?.onSettled,
      });
    },
    isPending: createMaterialMutation.isPending,
  };

  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaterialRequestDto }) => {
      // Transform UpdateMaterialRequestDto to UpdateMaterialDTO
      const updateDTO: UpdateMaterialDTO = {
        name: data.name,
        description: data.description,
        category: data.category as MaterialCategory,
        unit: data.unit as MaterialUnit,
        quantity: data.currentStock,
        pricePerUnit: data.unitCost,
        availableQuantity: data.currentStock,
        minQuantity: data.minStock,
        supplierName: data.supplierName,
        coordinatesLatitude: data.specifications ? undefined : undefined, // Not in transforms DTO
        coordinatesLongitude: data.specifications ? undefined : undefined, // Not in transforms DTO
        adresse: data.specifications ? undefined : undefined, // Not in transforms DTO
        forme: data.specifications ? undefined : undefined, // Not in transforms DTO
        localisation: data.specifications ? undefined : undefined, // Not in transforms DTO
        gtin: data.specifications,
        sku: undefined,
        ean: undefined,
        asin: undefined,
        image: undefined,
        multilangLabels: undefined,
        timeline: undefined,
        supplier: data.supplierId ? {
          name: data.supplierName || '',
          contact: data.leadTime?.toString() || '',
          leadTime: data.leadTime || 7
        } : undefined,
        tags: undefined,
        notes: undefined
      };
      return await materialService.updateMaterial(id, updateDTO);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success(`Le matériel "${data.name}" a été mis à jour.`);
    },
    onError: (error: Error) => {
      console.error('Error updating material:', error);
      toast.error("Impossible de mettre à jour le matériel.");
    }
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      await materialService.deleteMaterial(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success("Le matériel a été supprimé.");
    },
    onError: () => {
      toast.error("Impossible de supprimer le matériel.");
    }
  });

  return {
    materials: transformedMaterials,
    isLoading: isLoading || isLoadingWorkspaces,
    error: error ? String(error) : null,
    refetch,
    createMaterial,
    updateMaterial: updateMaterialMutation,
    deleteMaterial: deleteMaterialMutation.mutate,
    isCreating: createMaterialMutation.isPending,
    isUpdating: updateMaterialMutation.isPending,
    isDeleting: deleteMaterialMutation.isPending,
    workspaces: enhancedWorkspaces,
    // Enhanced UI features - stub implementations
    getMaterialStockStatus: (material: MaterialUIDTO) => {
      if (material.availableQuantity <= 0) return 'out_of_stock';
      if (material.availableQuantity < 10) return 'critical';
      if (material.availableQuantity < 50) return 'low';
      return 'optimal';
    },
    getMaterialCostEfficiency: (material: MaterialUIDTO) => {
      return material.pricePerUnit * material.availableQuantity;
    },
    getMaterialQualityScore: (material: MaterialUIDTO) => {
      // Stub implementation - could be enhanced with actual quality metrics
      return 8.5;
    },
    getMaterialReorderLevel: (material: MaterialUIDTO) => {
      return material.minimumQuantity || 10;
    },
    getMaterialAnalytics: () => ({
      totalMaterials: transformedMaterials.length,
      totalValue: transformedMaterials.reduce((sum, m) => sum + (m.pricePerUnit * m.availableQuantity), 0),
      averagePrice: transformedMaterials.length > 0 
        ? transformedMaterials.reduce((sum, m) => sum + m.pricePerUnit, 0) / transformedMaterials.length
        : 0,
      lowStockItems: transformedMaterials.filter(m => m.availableQuantity < 10).length,
      outOfStockItems: transformedMaterials.filter(m => m.availableQuantity <= 0).length,
      categoryBreakdown: transformedMaterials.reduce((acc, m) => {
        acc[m.category] = (acc[m.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      supplierBreakdown: {} // Could be enhanced with actual supplier data
    }),
    validateMaterialWithReferential: async (material: MaterialUIDTO, referentialType: string): Promise<ValidationResult> => {
      // Stub implementation - could be enhanced with actual referential validation
      return {
        isValid: true,
        errors: [],
        warnings: []
      };
    },
    generateMaterialReport: (material: MaterialUIDTO): MaterialReport => {
      return {
        material: {
          id: material.id,
          name: material.name,
          description: material.description || '',
          category: material.category as MaterialCategory,
          status: 'available' as MaterialStatus,
          unit: material.unit as MaterialUnit,
          quantity: material.quantity,
          pricePerUnit: material.pricePerUnit,
          availableQuantity: material.availableQuantity,
          minQuantity: material.minimumQuantity || 0,
          totalValue: material.pricePerUnit * material.availableQuantity,
          workspaceId: '',
          originLocation: material.originLocation,
          coordinatesLatitude: material.coordinatesLatitude,
          coordinatesLongitude: material.coordinatesLongitude,
          adresse: material.adresse,
          forme: material.forme as "polygon" | "rectangle" | "circle" | "point" | undefined,
          localisation: material.localisation,
          gtin: '',
          sku: '',
          ean: '',
          asin: '',
          multilangLabels: material.multilangLabels || {},
          timeline: undefined,
          supplier: undefined,
          image: material.image,
          tags: [],
          notes: undefined,
          createdAt: material.createdAt || new Date().toISOString(),
          updatedAt: material.updatedAt || new Date().toISOString()
        },
        summary: `Material ${material.name} is in ${material.availableQuantity > 0 ? 'stock' : 'out of stock'} with ${material.availableQuantity} units available.`,
        recommendations: material.availableQuantity < 10 ? ['Reorder material soon'] : [],
        generatedAt: new Date().toISOString()
      };
    }
  };
}

export function useMaterialsByCategoryHex(category: string) {
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
  return useQuery({
    queryKey: ['materials', 'category', category],
    queryFn: () => materialService.getMaterialsByCategory(category as MaterialCategory),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMaterialByIdHex(id: string) {
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
  return useQuery({
    queryKey: ['materials', 'id', id],
    queryFn: () => materialService.getMaterialById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLowStockMaterialsHex() {
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
  return useQuery({
    queryKey: ['materials', 'low-stock'],
    queryFn: () => materialService.getLowStockMaterials(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectMaterialsHex(projectId: string) {
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
  return useQuery({
    queryKey: ['project-materials', projectId],
    queryFn: () => materialService.getProjectMaterials(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddMaterialToProjectHex() {
  const queryClient = useQueryClient();
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());

  return useMutation({
    mutationFn: async ({ projectId, materialId, quantity }: { 
      projectId: string; materialId: string; quantity: number 
    }) => {
      await materialService.addMaterialToProject(projectId, materialId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Matériel ajouté au projet');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'ajout');
    }
  });
}

/**
 * Hook for single material operations
 */
export function useMaterialHex(id: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());

  const {
    data: material,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['materials', id],
    queryFn: () => materialService.getMaterialById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaterialRequestDto }) => {
      // Transform UpdateMaterialRequestDto to UpdateMaterialDTO
      const updateDTO: UpdateMaterialDTO = {
        name: data.name,
        description: data.description,
        category: data.category as MaterialCategory,
        unit: data.unit as MaterialUnit,
        quantity: data.currentStock,
        pricePerUnit: data.unitCost,
        availableQuantity: data.currentStock,
        minQuantity: data.minStock,
        supplierName: data.supplierName,
        coordinatesLatitude: data.specifications ? undefined : undefined, // Not in transforms DTO
        coordinatesLongitude: data.specifications ? undefined : undefined, // Not in transforms DTO
        adresse: data.specifications ? undefined : undefined, // Not in transforms DTO
        forme: data.specifications ? undefined : undefined, // Not in transforms DTO
        localisation: data.specifications ? undefined : undefined, // Not in transforms DTO
        gtin: data.specifications,
        sku: undefined,
        ean: undefined,
        asin: undefined,
        image: undefined,
        multilangLabels: undefined,
        timeline: undefined,
        supplier: data.supplierId ? {
          name: data.supplierName || '',
          contact: data.leadTime?.toString() || '',
          leadTime: data.leadTime || 7
        } : undefined,
        tags: undefined,
        notes: undefined
      };
      return await materialService.updateMaterial(id, updateDTO);
    },
    onSuccess: () => {
      toast.success('Matériel mis à jour');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error('Error updating material:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => materialService.deleteMaterial(id),
    onSuccess: () => {
      toast.success('Matériel supprimé');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      navigate('/materials');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return {
    material,
    isLoading,
    error,
    refetch,
    updateMaterial: updateMutation,
    deleteMaterial: deleteMutation.mutate,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

// Re-export types
export type { CreateMaterialRequestDto, MaterialDTO, MaterialFormDataDTO as MaterialFormData, UpdateMaterialRequestDto };

