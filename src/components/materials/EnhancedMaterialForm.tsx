import React, { useState, useImperativeHandle, forwardRef, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, Package, User, Warehouse, Target, Pentagon, Upload, X, Image, FileText } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import MaterialCategorySelector from './MaterialCategorySelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import WorkspaceSelector from '@/components/workspace/WorkspaceSelector';
import WorkspaceCreateDialog from '@/components/workspace/WorkspaceCreateDialog';
import InteractiveMapGIS, { MapData } from '@/components/map/InteractiveMap';
import DocumentUpload from '@/components/documents/DocumentUpload';
import { toast } from 'sonner';

// Hexagonal Architecture imports
import { useMaterialsHex, useSuppliersHex, useWorkspacesHex } from '@/hooks/hexagonal';
import { useLocationHex } from '@/hooks/hexagonal/useLocationHex';
import { MaterialTransformer } from '@/dtos/transforms/MaterialTransformer';
import {
  MaterialDTO,
  CreateMaterialDTO,
  UpdateMaterialDTO,
  MaterialFilterDTO,
  MaterialCategory,
  MaterialFormDataDTO,
  MaterialUnit
} from '@/dtos/entities/MaterialDTO';

// Location/Geocoding Service (to be created)
import type { Region, City } from '@/utils/mauritania';
import { WorkspaceDTO, SupplierDTO, LocationDTO } from '@/dtos';
import { CreateMaterialRequestDto } from '@/dtos/transforms';
import MaterialDocuments from './MaterialDocuments';
import UnifiedLocationSelector from '@/components/location/UnifiedLocationSelector';
import { useLocationAutoFill } from '@/hooks/hexagonal/useLocationAutoFill';

// Create type alias
type MauritaniaLocation = Location ;

interface FormRef {
  submit: () => void;
  getFormData: () => Partial<MaterialFormDataDTO>;
}

// Component-specific types
interface SimpleWorkspace {
  id: string;
  name: string;
  location: string;
  status: string;
}

interface EnhancedMaterialFormProps {
  onSubmit: (material: Partial<MaterialFormDataDTO>) => void;
  initialData?: Partial<MaterialFormDataDTO>;
  workspaces?: WorkspaceDTO[];
  suppliers?: SupplierDTO[];
  showSubmitButton?: boolean;
  language?: string;
  materialId?: string; // For document management
}

const EnhancedMaterialForm = forwardRef<FormRef, EnhancedMaterialFormProps>(({
  onSubmit,
  initialData,
  workspaces = [],
  suppliers = [],
  showSubmitButton = true,
  language = 'fr',
  materialId,
}, ref) => {
  const { t } = useLanguage();

  // Hexagonal Architecture hooks
  const { createMaterial, updateMaterial } = useMaterialsHex();
  const { workspaces: hexagonalWorkspaces, createWorkspace } = useWorkspacesHex();
  const { getLocationByCode } = useLocationHex();

  // Location auto-fill hook using GeocodingService
  const {
    handleMapClick: autoFillMapClick,
    geocodeAddress,
    searchMauritaniaLocations,
    isLoading: locationAutoFillLoading
  } = useLocationAutoFill();

  // Use hexagonal workspaces if available, otherwise use prop workspaces
  const availableWorkspaces = hexagonalWorkspaces.length > 0 ? hexagonalWorkspaces : workspaces;

  const [formData, setFormData] = useState<Partial<MaterialFormDataDTO>>({
    name: '',
    description: '',
    category: 'construction', // Use valid MaterialCategory
    unit: MaterialUnit.PIECES, // Use correct MaterialUnit enum value
    quantity: 0,
    minQuantity: 0,
    pricePerUnit: 0,
    availableQuantity: 0,
    workspaceId: '',
    forme: undefined, // Use undefined instead of empty string
    localisation: [],
    coordinatesLatitude: undefined,
    coordinatesLongitude: undefined,
    timeline: {
      start: new Date(),
      end: new Date(),
      estimatedDuration: 7
    },
    supplier: {
      name: '',
      contact: '',
      leadTime: 7
    },
    ...initialData
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [mapData, setMapData] = useState<MapData>({});
  const [address, setAddress] = useState(initialData?.adresse || '');
  const [selectedRegion, setSelectedRegion] = useState<LocationDTO | null>(null);
  const [selectedCity, setSelectedCity] = useState<LocationDTO | null>(null);
  const [isProcessingLocation, setIsProcessingLocation] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.category || 'construction');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialData?.subcategory || '');

  const handleChange = useCallback((field: string, value: string | number | boolean | Date | Array<{ lat: number; lng: number; address?: string; type?: string; confidence?: number }> | Record<string, string> | { name: string; contact: string; leadTime: number }) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Geocoding functions using abstracted location service
  const handleGeocodeAddress = useCallback(async (address: string) => {
    const result = await geocodeAddress(address);
    if (result) {
      setFormData(prev => ({
        ...prev,
        coordinatesLatitude: result.coordinates?.lat,
        coordinatesLongitude: result.coordinates?.lng,
        localisation: result.coordinates ? [{
          lat: result.coordinates.lat,
          lng: result.coordinates.lng,
          address: result.address,
          type: 'point' as const,
          confidence: result.confidence
        }] : []
      }));

      setMapData({
        center: result.coordinates,
        address: result.address
      });
    }
  }, [geocodeAddress]);

  // Enhanced Mauritania location functions using abstracted service
  const handleRegionSelect = useCallback((region: Region) => {
    setSelectedRegion({
      id: region.code,
      code: region.code,
      name: region.name,
      nameAr: region.nameAr,
      type: 'region',
      coordinates: { lat: region.lat, lng: region.lng },
      economicImportance: region.economicImportance,
      population: region.population,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update address with region name
    const regionAddress = region.name;
    setAddress(regionAddress);
    handleChange('adresse', regionAddress);

    // Update map to region center
    setMapData({
      center: { lat: region.lat, lng: region.lng },
      address: regionAddress
    });
  }, [handleChange]);

  const handleCitySelect = useCallback((city: City) => {
    setSelectedCity({
      id: city.code,
      code: city.code,
      name: city.name,
      nameAr: city.nameAr,
      type: 'city',
      coordinates: { lat: city.lat, lng: city.lng },
      parentCode: city.parentCode,
      economicImportance: city.economicImportance,
      population: city.population,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update address with full location
    const cityAddress = `${city.name}, ${selectedRegion?.name || city.parentCode}`;
    setAddress(cityAddress);
    handleChange('adresse', cityAddress);

    // Update coordinates from city using the location service
    // For now, cities have fixed coordinates - this could be enhanced
    const cityCoords = { lat: city.lat || 0, lng: city.lng || 0 };
    if (cityCoords.lat && cityCoords.lng) {
      setFormData(prev => ({
        ...prev,
        coordinatesLatitude: cityCoords.lat,
        coordinatesLongitude: cityCoords.lng,
        localisation: [{
          lat: cityCoords.lat,
          lng: cityCoords.lng,
          address: cityAddress,
          type: 'point' as const,
          confidence: 1.0
        }]
      }));

      // Update map
      setMapData({
        center: cityCoords,
        address: cityAddress
      });
    }
  }, [selectedRegion, handleChange]);

  // Expose submit method to parent via ref
  useImperativeHandle(ref, () => ({
    submit: () => {
      handleFormSubmit();
    },
    getFormData: () => formData
  }));

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    handleChange('category', categoryId);
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    handleChange('subcategory', subcategoryId);
  };

  const handleUnitChange = (unit: string) => {
    handleChange('unit', unit);
  };

  const handleTimelineChange = (field: string, value: string | Date) => {
    setFormData(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline!,
        [field]: value
      }
    }));
  };

  const handleSupplierChange = (supplier: { name: string; contact: string; leadTime: number }) => {
    setFormData(prev => ({
      ...prev,
      supplier
    }));
  };

  const handleMapChange = (mapData: MapData) => {
    console.log('Map data changed:', mapData);
    
    // Convert map coordinates to localisation format
    let localisation: Array<{ lat: number; lng: number }> = [];
    
    if (mapData.polygon && mapData.polygon.length > 0) {
      // If there's a polygon, use it as localisation
      localisation = mapData.polygon.map(point => ({
        lat: point.lat,
        lng: point.lng
      }));
    } else if (mapData.center) {
      // If there are coordinates but no polygon, use center as single point
      localisation = [{
        lat: mapData.center.lat,
        lng: mapData.center.lng
      }];
    }

    setFormData(prev => ({
      ...prev,
      adresse: mapData.address,
      coordinatesLatitude: mapData.center?.lat,
      coordinatesLongitude: mapData.center?.lng,
      localisation: localisation,
      forme: mapData.shapeType && ['polygon', 'rectangle', 'circle', 'point'].includes(mapData.shapeType) 
        ? mapData.shapeType as "polygon" | "rectangle" | "circle" | "point"
        : (mapData.center ? 'point' : undefined)
    }));

    console.log('Updated form data with localisation:', localisation, 'and forme:', mapData.shapeType);
  };

  // Enhanced map click handler using LocationAutoFill hook
  const handleMapClick = useCallback(async (coordinates: { lat: number; lng: number }) => {
    try {
      setIsProcessingLocation(true);

      // Use the LocationAutoFill hook's map click handler
      const locationData = await autoFillMapClick(coordinates);

      if (locationData) {
        // Update form data with the auto-filled location data
        setFormData(prev => ({
          ...prev,
          adresse: locationData.address,
          coordinatesLatitude: locationData.coordinates?.lat,
          coordinatesLongitude: locationData.coordinates?.lng,
          localisation: locationData.coordinates ? [{
            lat: locationData.coordinates.lat,
            lng: locationData.coordinates.lng,
            address: locationData.address,
            type: 'point' as const,
            confidence: locationData.confidence
          }] : []
        }));

        // Update region and city state for UI
        setSelectedRegion(locationData.region ? {
          id: locationData.region.code,
          code: locationData.region.code,
          name: locationData.region.name,
          nameAr: locationData.region.nameAr,
          type: 'region',
          coordinates: { lat: locationData.region.lat, lng: locationData.region.lng },
          economicImportance: locationData.region.economicImportance,
          population: locationData.region.population,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } : null);

        setSelectedCity(locationData.city ? {
          id: locationData.city.code,
          code: locationData.city.code,
          name: locationData.city.name,
          nameAr: locationData.city.nameAr,
          type: 'city',
          coordinates: { lat: locationData.city.lat, lng: locationData.city.lng },
          parentCode: locationData.city.parentCode,
          economicImportance: locationData.city.economicImportance,
          population: locationData.city.population,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } : null);

        // Update map data
        setMapData({
          center: locationData.coordinates,
          address: locationData.address
        });
      }

    } catch (error) {
      console.error('Map click processing failed:', error);

      // Fallback: just set coordinates without address
      const fallbackAddress = `📍 Lat: ${coordinates.lat.toFixed(6)}, Lng: ${coordinates.lng.toFixed(6)}`;
      setFormData(prev => ({
        ...prev,
        coordinatesLatitude: coordinates.lat,
        coordinatesLongitude: coordinates.lng,
        localisation: [{
          lat: coordinates.lat,
          lng: coordinates.lng,
          address: fallbackAddress,
          type: 'point' as const,
          confidence: 0.5
        }]
      }));

      setMapData({
        center: coordinates,
        address: fallbackAddress
      });

      toast.warning('⚠️ Coordonnées mises à jour, mais impossible de trouver l\'adresse automatiquement', {
        duration: 4000
      });
    } finally {
      setIsProcessingLocation(false);
    }
  }, [autoFillMapClick]);

  const handleWorkspaceLocationChange = async (workspace: WorkspaceDTO | SimpleWorkspace) => {
    console.log('Workspace selected, focusing map on:', workspace);

    // Parse coordinates from workspace location if it contains coordinates
    let coordinates: { lat: number; lng: number } | undefined = undefined;
    if (workspace.location) {
      if (typeof workspace.location === 'string') {
        // SimpleWorkspace case
        const coordMatch = workspace.location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
        if (coordMatch) {
          coordinates = {
            lat: parseFloat(coordMatch[1]),
            lng: parseFloat(coordMatch[2])
          };
        } else {
          // Try to geocode the workspace name if no coordinates found
          const result = await geocodeAddress(workspace.name);
          if (result?.coordinates) {
            coordinates = result.coordinates;
          }
        }
      } else if (workspace.location.coordinates) {
        // WorkspaceDTO case
        coordinates = {
          lat: workspace.location.coordinates.latitude,
          lng: workspace.location.coordinates.longitude
        };
      }
    }

    // Update map data to focus on workspace location
    const newMapData: MapData = {
      ...mapData,
      center: coordinates, // Will be undefined if no coordinates found
      address: coordinates
        ? `${workspace.name} - ${typeof workspace.location === 'string' ? workspace.location : workspace.location.name}`
        : workspace.name // Just use workspace name if no coordinates
    };

    setMapData(newMapData);

    // Update form data - preserve existing coordinates if workspace has none
    setFormData(prev => ({
      ...prev,
      adresse: coordinates ? newMapData.address : (prev.adresse || workspace.name),
      coordinatesLatitude: coordinates?.lat ?? prev.coordinatesLatitude,
      coordinatesLongitude: coordinates?.lng ?? prev.coordinatesLongitude,
      localisation: coordinates ? [{
        lat: coordinates.lat,
        lng: coordinates.lng,
        address: newMapData.address || workspace.name,
        type: 'point' as const,
        confidence: 0.9
      }] : prev.localisation, // Preserve existing localisation if no coordinates
      forme: coordinates ? 'point' : prev.forme
    }));

    handleMapChange(newMapData);
  };

  const handleFormSubmit = async () => {
    try {
      // Convert form data to DTO using MaterialTransformer
      const formDataDTO: MaterialFormDataDTO = {
        name: formData.name || '',
        description: formData.description || '', // Ensure description is never undefined
        category: formData.category || 'construction',
        subcategory: formData.subcategory,
        unit: formData.unit || MaterialUnit.PIECES,
        quantity: formData.quantity || 0,
        minQuantity: formData.minQuantity || 0,
        pricePerUnit: formData.pricePerUnit || 0,
        availableQuantity: formData.availableQuantity || 0,
        workspaceId: formData.workspaceId || '',
        image: formData.image,
        adresse: formData.adresse,
        forme: formData.forme,
        localisation: formData.localisation,
        coordinatesLatitude: formData.coordinatesLatitude,
        coordinatesLongitude: formData.coordinatesLongitude,
        gtin: formData.gtin,
        sku: formData.sku,
        ean: formData.ean,
        asin: formData.asin,
        multilangLabels: formData.multilangLabels,
        timeline: formData.timeline,
        supplier: formData.supplier
      };

      if (materialId) {
        // Update existing material
        const transformer = new MaterialTransformer();
        const updateDTO = transformer.toUpdateDto(formDataDTO as MaterialDTO);
        updateMaterial.mutate({ id: materialId, data: updateDTO });
      } else {
        // Create new material
        createMaterial.mutate(formDataDTO as CreateMaterialRequestDto);
      }

      // Call original onSubmit callback for backward compatibility
      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Erreur lors de la soumission du formulaire');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFormSubmit();
  };

  // Convert form data to map format
  const getMapData = (): MapData => {
    return {
      center: formData.coordinatesLatitude && formData.coordinatesLongitude 
        ? { lat: formData.coordinatesLatitude, lng: formData.coordinatesLongitude }
        : mapData.center,
      address: formData.adresse || mapData.address,
      polygon: Array.isArray(formData.localisation) ? formData.localisation : mapData.polygon || [],
      shapeType: formData.forme as 'polygon' | 'rectangle' | 'circle' | 'diamond' | undefined || mapData?.shapeType
    };
  };

  // Transform workspaces to match WorkspaceSelector interface
  const transformedWorkspaces: WorkspaceDTO[] = availableWorkspaces.map((workspace: WorkspaceDTO | SimpleWorkspace) => {
    // If it's already a WorkspaceDTO, return as-is
    if ('location' in workspace && typeof workspace.location === 'object' && workspace.location !== null) {
      return workspace as WorkspaceDTO;
    }

    // Transform SimpleWorkspace to WorkspaceDTO
    const simpleWorkspace = workspace as SimpleWorkspace;
    return {
      id: simpleWorkspace.id,
      workspaceId: simpleWorkspace.id,
      workspaceCode: simpleWorkspace.id,
      name: simpleWorkspace.name,
      location: {
        code: 'default',
        name: simpleWorkspace.location,
        nameAr: simpleWorkspace.location,
        type: 'city' as const,
        coordinates: undefined,
        parentCode: undefined,
        population: undefined
      },
      description: undefined,
      capacity: undefined,
      contact: undefined,
      facilities: undefined,
      status: simpleWorkspace.status as 'active' | 'inactive' | 'closed',
      createdAt: undefined,
      updatedAt: undefined
    };
  });

  const handleWorkspaceCreated = (workspaceId: string) => {
    // Update the selected workspace to the newly created one
    handleChange('workspaceId', workspaceId);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('image type', file.type);
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image valide');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La taille du fichier ne peut pas dépasser 5MB');
      return;
    }

    try {
      // For now, just show a message that upload is disabled
      toast.info('Upload functionality temporarily disabled');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
    }
  };

  const handleRemoveImage = () => {
    handleChange('image', '');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="basic">Informations</TabsTrigger>
          <TabsTrigger value="identifiers">Identifiants</TabsTrigger>
          <TabsTrigger value="location">Localisation</TabsTrigger>
          <TabsTrigger value="quantities">Quantités</TabsTrigger>
          <TabsTrigger value="timeline">Planning</TabsTrigger>
          <TabsTrigger value="supplier">Fournisseur</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          {/* Basic Information */}
          <Card className="border-l-4 border-l-terracotta-500">
            <CardHeader className="bg-gradient-to-r from-terracotta-50 to-adrar-50">
              <CardTitle className="flex items-center gap-2 text-adrar-800">
                <Package className="h-5 w-5" />
                {t('materials.basic_info') || 'Informations de base'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    {t('materials.name') || 'Nom du matériau'}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={t('materials.name_placeholder') || 'Nom du matériau'}
                    className="border-gray-300 focus:border-terracotta-500"
                    required
                  />
                </div>
                
                <MaterialCategorySelector
                  selectedCategory={selectedCategory}
                  selectedSubcategory={selectedSubcategory}
                  onCategoryChange={handleCategoryChange}
                  onSubcategoryChange={handleSubcategoryChange}
                  onUnitChange={handleUnitChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  {t('materials.description') || 'Description'}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={t('materials.description_placeholder') || 'Description du matériau'}
                  rows={3}
                  className="border-gray-300 focus:border-terracotta-500"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="identifiers" className="space-y-6">
          {/* Material Identifiers */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Identifiants du matériau
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gtin" className="text-sm font-medium">
                    GTIN (Global Trade Item Number)
                  </Label>
                  <Input
                    id="gtin"
                    value={formData.gtin || ''}
                    onChange={(e) => handleChange('gtin', e.target.value)}
                    placeholder="ex: 01234567890123"
                    maxLength={14}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-sm font-medium">
                    SKU (Stock Keeping Unit)
                  </Label>
                  <Input
                    id="sku"
                    value={formData.sku || ''}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    placeholder="ex: MAT-CIM-001"
                    maxLength={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ean" className="text-sm font-medium">
                    EAN (European Article Number)
                  </Label>
                  <Input
                    id="ean"
                    value={formData.ean || ''}
                    onChange={(e) => handleChange('ean', e.target.value)}
                    placeholder="ex: 1234567890123"
                    maxLength={13}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="asin" className="text-sm font-medium">
                    ASIN (Amazon Standard Identification Number)
                  </Label>
                  <Input
                    id="asin"
                    value={formData.asin || ''}
                    onChange={(e) => handleChange('asin', e.target.value)}
                    placeholder="ex: B00X8QSNT2"
                    maxLength={10}
                  />
                </div>
              </div>
              
              {/* Multi-language labels */}
              <div className="space-y-4 mt-6">
                <Label className="text-sm font-medium">
                  Libellés multilingues
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="label-fr" className="text-xs">Français</Label>
                    <Input
                      id="label-fr"
                      value={formData.multilangLabels?.fr || ''}
                      onChange={(e) => handleChange('multilangLabels', { 
                        ...formData.multilangLabels, 
                        fr: e.target.value 
                      })}
                      placeholder="Nom en français"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="label-ar" className="text-xs">العربية</Label>
                    <Input
                      id="label-ar"
                      value={formData.multilangLabels?.ar || ''}
                      onChange={(e) => handleChange('multilangLabels', { 
                        ...formData.multilangLabels, 
                        ar: e.target.value 
                      })}
                      placeholder="الاسم بالعربية"
                      dir="rtl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="label-en" className="text-xs">English</Label>
                    <Input
                      id="label-en"
                      value={formData.multilangLabels?.en || ''}
                      onChange={(e) => handleChange('multilangLabels', { 
                        ...formData.multilangLabels, 
                        en: e.target.value 
                      })}
                      placeholder="Name in English"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="label-es" className="text-xs">Español</Label>
                    <Input
                      id="label-es"
                      value={formData.multilangLabels?.es || ''}
                      onChange={(e) => handleChange('multilangLabels', { 
                        ...formData.multilangLabels, 
                        es: e.target.value 
                      })}
                      placeholder="Nombre en español"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          {/* Warehouse and Location */}
          <Card className="border-l-4 border-l-adrar-500">
            <CardHeader className="bg-gradient-to-r from-adrar-50 to-terracotta-50">
              <CardTitle className="flex items-center gap-2 text-adrar-800">
                <Warehouse className="h-5 w-5" />
                {t('materials.warehouse_location') || 'Entrepôt et localisation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <WorkspaceSelector
                    workspaces={transformedWorkspaces}
                    selectedWorkspaceId={formData.workspaceId}
                    onWorkspaceChange={(id) => handleChange('workspaceId', id)}
                    onLocationChange={handleWorkspaceLocationChange}
                    showDetails={true}
                  />
                </div>
                <div className="flex-shrink-0">
                  <WorkspaceCreateDialog
                    onWorkspaceCreated={handleWorkspaceCreated}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unified Location Selector */}
          <UnifiedLocationSelector
            value={{
              address: formData.adresse,
              latitude: formData.coordinatesLatitude,
              longitude: formData.coordinatesLongitude,
              regionCode: selectedRegion?.code,
              cityCode: selectedCity?.code,
              locationData: undefined // Could be populated if needed
            }}
            onChange={(location) => {
              setFormData(prev => ({
                ...prev,
                adresse: location.address,
                coordinatesLatitude: location.latitude,
                coordinatesLongitude: location.longitude,
                localisation: location.latitude && location.longitude ? [{
                  lat: location.latitude,
                  lng: location.longitude,
                  address: location.address || `Lat: ${location.latitude}, Lng: ${location.longitude}`,
                  type: 'point' as const,
                  confidence: 0.9
                }] : prev.localisation || [],
                forme: location.latitude && location.longitude ? 'point' : prev.forme
              }));

              // Update region and city state for UI using LocationService
              const updateLocationState = async () => {
                if (location.locationData) {
                  if (location.locationData.type === 'region') {
                    try {
                      const regionData = await getLocationByCode(location.locationData.code, 'region');
                      setSelectedRegion(regionData);
                    } catch (error) {
                      console.error('Error fetching region data:', error);
                      setSelectedRegion(null);
                    }
                  } else {
                    setSelectedRegion(null);
                  }

                  if (location.locationData.type === 'city') {
                    try {
                      const cityData = await getLocationByCode(location.locationData.code, 'city');
                      setSelectedCity(cityData);
                    } catch (error) {
                      console.error('Error fetching city data:', error);
                      setSelectedCity(null);
                    }
                  } else {
                    setSelectedCity(null);
                  }
                } else {
                  setSelectedRegion(null);
                  setSelectedCity(null);
                }
              };

              updateLocationState();
            }}
            placeholder="Rechercher une région, ville ou localité pour le matériau..."
            filter="all"
            showCoordinates={true}
            showGPS={true}
            allowManualEntry={true}
          />
        </TabsContent>

        <TabsContent value="quantities" className="space-y-6">
          {/* Quantities and Pricing */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-adrar-800">
                {t('materials.quantities_pricing') || 'Quantités et prix'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                    {t('materials.quantity') || 'Quantité'}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.quantity || 0}
                    onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                    className="border-gray-300 focus:border-green-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="availableQuantity" className="text-sm font-medium text-gray-700">
                    {t('materials.available_quantity') || 'Quantité disponible'}
                  </Label>
                  <Input
                    id="availableQuantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.availableQuantity || 0}
                    onChange={(e) => handleChange('availableQuantity', parseFloat(e.target.value) || 0)}
                    className="border-gray-300 focus:border-green-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minQuantity" className="text-sm font-medium text-gray-700">
                    {t('materials.min_quantity') || 'Quantité minimale'}
                  </Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minQuantity || 0}
                    onChange={(e) => handleChange('minQuantity', parseFloat(e.target.value) || 0)}
                    className="border-gray-300 focus:border-green-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit" className="text-sm font-medium text-gray-700">
                    {t('materials.price_per_unit') || 'Prix unitaire'}
                  </Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pricePerUnit || 0}
                    onChange={(e) => handleChange('pricePerUnit', parseFloat(e.target.value) || 0)}
                    className="border-gray-300 focus:border-green-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {/* Timeline */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2 text-adrar-800">
                <Clock className="h-5 w-5" />
                {t('materials.timeline') || 'Planning'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                    {t('materials.start_date') || 'Date de début'}
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.timeline?.start ? new Date(formData.timeline.start).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleTimelineChange('start', new Date(e.target.value))}
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                    {t('materials.end_date') || 'Date de fin'}
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.timeline?.end ? new Date(formData.timeline.end).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleTimelineChange('end', new Date(e.target.value))}
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration" className="text-sm font-medium text-gray-700">
                    {t('materials.estimated_duration') || 'Durée estimée (jours)'}
                  </Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    min="1"
                    value={formData.timeline?.estimatedDuration || 0}
                    onChange={(e) => handleTimelineChange('estimatedDuration', parseInt(e.target.value) || 0)}
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplier" className="space-y-6">
          {/* Supplier Information */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2 text-adrar-800">
                <User className="h-5 w-5" />
                {t('materials.supplier_info.title') || 'Informations fournisseur'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <SupplierSelector
                value={formData.supplier}
                onChange={handleSupplierChange}
                allowCustom={true}
                suppliers={suppliers}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {/* Material Documents */}
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="flex items-center gap-2 text-adrar-800">
                <FileText className="h-5 w-5" />
                {t('materials.documents.title') || 'Documents du matériau'}
              </CardTitle>
              {materialId && (
                <p className="text-sm text-muted-foreground mt-2">
                  {t('materials.documents.subtitle') || 'Gestion de tous les documents du matériau'}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {materialId ? (
                <MaterialDocuments
                  materialId={materialId}
                  readonly={false}
                />
              ) : (
                <div className="space-y-6">
                  {/* Document Upload Section for New Materials */}
                  <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-indigo-900">
                        <Upload className="h-4 w-4" />
                        {t('materials.documents.upload_title') || 'Télécharger des documents'}
                      </CardTitle>
                      <p className="text-sm text-indigo-700">
                        {t('materials.documents.upload_description') || 'Téléchargez des documents qui seront associés à ce matériau une fois créé'}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <DocumentUpload embedded={true} />
                    </CardContent>
                  </Card>

                  {/* Document Types Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <FileText className="h-5 w-5 mb-2 text-blue-600" />
                      <h4 className="font-medium text-sm text-blue-900 mb-1">
                        {t('materials.documents.types.invoice') || 'Factures'}
                      </h4>
                      <p className="text-xs text-blue-700">
                        {t('materials.documents.invoice_desc') || 'Preuves d\'achat et de livraison'}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg bg-green-50">
                      <FileText className="h-5 w-5 mb-2 text-green-600" />
                      <h4 className="font-medium text-sm text-green-900 mb-1">
                        {t('materials.documents.types.certificate') || 'Certificats'}
                      </h4>
                      <p className="text-xs text-green-700">
                        {t('materials.documents.certificate_desc') || 'Qualité, conformité, sécurité'}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg bg-purple-50">
                      <FileText className="h-5 w-5 mb-2 text-purple-600" />
                      <h4 className="font-medium text-sm text-purple-900 mb-1">
                        {t('materials.documents.types.manual') || 'Manuels'}
                      </h4>
                      <p className="text-xs text-purple-700">
                        {t('materials.documents.manual_desc') || 'Instructions d\'utilisation'}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg bg-orange-50">
                      <FileText className="h-5 w-5 mb-2 text-orange-600" />
                      <h4 className="font-medium text-sm text-orange-900 mb-1">
                        {t('materials.documents.types.warranty') || 'Garanties'}
                      </h4>
                      <p className="text-xs text-orange-700">
                        {t('materials.documents.warranty_desc') || 'Documents de garantie'}
                      </p>
                    </div>
                  </div>

                  {/* Save Reminder */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">
                          {t('materials.documents.save_reminder_title') || 'Sauvegarde automatique'}
                        </h3>
                        <p className="mt-1 text-sm text-amber-700">
                          {t('materials.documents.save_reminder_text') || 'Les documents seront automatiquement associés au matériau après sa création.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Conditional Submit Button */}
      {showSubmitButton && (
        <div className="flex justify-end gap-4 pt-6">
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700 text-white px-8 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t('materials.create') || 'Créer le matériau'}
          </Button>
        </div>
      )}
    </form>
  );
});

EnhancedMaterialForm.displayName = 'EnhancedMaterialForm';

export default EnhancedMaterialForm;
