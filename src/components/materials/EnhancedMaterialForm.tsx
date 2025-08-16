import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, Package, User, Warehouse, Target, Pentagon, Upload, X, Image } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import MaterialCategorySelector from './MaterialCategorySelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import WorkspaceSelector from '@/components/workspace/WorkspaceSelector';
import WorkspaceCreateDialog from '@/components/workspace/WorkspaceCreateDialog';
import InteractiveMapGIS from './InteractiveMapGIS';
import MaterialDocuments from './MaterialDocuments';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { toast } from 'sonner';

interface MaterialFormData {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  availableQuantity: number;
  workspaceId: string;
  image?: string;
  adresse?: string;
  forme?: string;
  localisation?: any[];
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  // New identifier fields
  gtin?: string;
  sku?: string;
  ean?: string;
  asin?: string;
  multilangLabels?: Record<string, string>;
  timeline?: {
    start: Date;
    end: Date;
    estimatedDuration: number;
  };
  supplier?: {
    name: string;
    contact: string;
    leadTime: number;
  };
}

interface MapData {
  coordinates?: { lat: number; lng: number };
  address?: string;
  shape?: { lat: number; lng: number }[];
  shapeType?: 'polygon' | 'rectangle' | 'circle' | 'diamond';
}

interface SimpleWorkspace {
  id: string;
  name: string;
  location: string;
  status: string;
}

interface EnhancedMaterialFormProps {
  onSubmit: (material: Partial<MaterialFormData>) => void;
  initialData?: Partial<MaterialFormData>;
  workspaces?: SimpleWorkspace[];
  showSubmitButton?: boolean;
  language?: string;
  materialId?: string; // For document management
}

const EnhancedMaterialForm = forwardRef<any, EnhancedMaterialFormProps>(({
  onSubmit,
  initialData,
  workspaces = [],
  showSubmitButton = true,
  language,
  materialId
}, ref) => {
  const { t } = useLanguage();
  const { workspaces: dbWorkspaces, createWorkspace } = useWorkspaces();
  const { uploadFile, uploading } = useDocumentStorage();

  const [formData, setFormData] = useState<Partial<MaterialFormData>>({
    name: '',
    description: '',
    category: '',
    unit: 'kg',
    quantity: 0,
    minQuantity: 0,
    pricePerUnit: 0,
    availableQuantity: 0,
    workspaceId: '',
    forme: '',
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

  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialData?.subcategory || '');
  const [activeTab, setActiveTab] = useState('basic');
  const [mapData, setMapData] = useState<MapData>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);

  // Use database workspaces if available, otherwise fall back to prop workspaces
  const availableWorkspaces = dbWorkspaces.length > 0 ? dbWorkspaces : workspaces;

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('Setting initial data:', initialData);
      setFormData(prev => ({ ...prev, ...initialData }));
      setSelectedCategory(initialData.category || '');
      setSelectedSubcategory(initialData.subcategory || '');
      
      // Update map data if coordinates or location data exists
      if (initialData.coordinatesLatitude && initialData.coordinatesLongitude) {
        setMapData({
          coordinates: {
            lat: initialData.coordinatesLatitude,
            lng: initialData.coordinatesLongitude
          },
          address: initialData.adresse,
          shape: Array.isArray(initialData.localisation) ? initialData.localisation : [],
          shapeType: initialData.forme as 'polygon' | 'rectangle' | 'circle' | undefined
        });
      }
    }
  }, [initialData]);

  // Expose submit method to parent via ref
  useImperativeHandle(ref, () => ({
    submit: () => {
      handleFormSubmit();
    },
    getFormData: () => formData
  }));

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

  const handleTimelineChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline!,
        [field]: value
      }
    }));
  };

  const handleSupplierChange = (supplier: any) => {
    setFormData(prev => ({
      ...prev,
      supplier
    }));
  };

  const handleMapChange = (mapData: MapData) => {
    console.log('Map data changed:', mapData);
    
    // Convert map coordinates to localisation format
    let localisation: any[] = [];
    
    if (mapData.shape && mapData?.shape?.length > 0) {
      // If there's a shape, use it as localisation
      localisation = mapData.shape.map(point => ({
        lat: point.lat,
        lng: point.lng
      }));
    } else if (mapData.coordinates) {
      // If there are coordinates but no shape, use coordinates as single point
      localisation = [{
        lat: mapData.coordinates.lat,
        lng: mapData.coordinates.lng
      }];
    }

    setFormData(prev => ({
      ...prev,
      adresse: mapData.address,
      coordinatesLatitude: mapData.coordinates?.lat,
      coordinatesLongitude: mapData.coordinates?.lng,
      localisation: localisation,
      forme: mapData?.shapeType || (mapData.coordinates ? 'point' : undefined)
    }));

    console.log('Updated form data with localisation:', localisation, 'and forme:', mapData?.shapeType);
  };

  const handleWorkspaceLocationChange = (workspace: any) => {
    console.log('Workspace selected, focusing map on:', workspace);
    
    // Parse coordinates from workspace location if it contains coordinates
    let coordinates: { lat: number; lng: number } | undefined = undefined;
    if (workspace.location && typeof workspace.location === 'string') {
      // Try to extract coordinates from location string (format: "City, lat, lng" or similar)
      const coordMatch = workspace.location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coordMatch) {
        coordinates = {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2])
        };
      } else {
        // Default coordinates for major Mauritanian cities
        const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
          'nouakchott': { lat: 18.0735, lng: -15.9582 },
          'nouadhibou': { lat: 20.9, lng: -17.0347 },
          'rosso': { lat: 16.5167, lng: -15.8 },
          'kaédi': { lat: 16.15, lng: -13.5 },
          'zouérat': { lat: 22.75, lng: -12.4667 },
          'kiffa': { lat: 16.6167, lng: -11.4 }
        };
        
        const cityName = workspace.location.toLowerCase();
        coordinates = cityCoordinates[cityName] || { lat: 18.0735, lng: -15.9582 }; // Default to Nouakchott
      }
    }

    // Update map data to focus on workspace location
    const newMapData: MapData = {
      ...mapData,
      coordinates,
      address: `${workspace.name} - ${workspace.location}`
    };
    
    setMapData(newMapData);
    handleMapChange(newMapData);
  };

  const handleFormSubmit = () => {
    onSubmit(formData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFormSubmit();
  };

  // Convert form data to map format
  const getMapData = (): MapData => {
    return {
      coordinates: formData.coordinatesLatitude && formData.coordinatesLongitude 
        ? { lat: formData.coordinatesLatitude, lng: formData.coordinatesLongitude }
        : mapData.coordinates,
      address: formData.adresse || mapData.address,
      shape: Array.isArray(formData.localisation) ? formData.localisation : mapData.shape || [],
      shapeType: formData.forme as 'polygon' | 'rectangle' | 'circle' | undefined || mapData?.shapeType
    };
  };

  // Transform workspaces to match WorkspaceSelector interface
  const transformedWorkspaces = availableWorkspaces.map(workspace => ({
    id: workspace.id,
    name: workspace.name,
    location: workspace.location as any, // Cast to satisfy Location type
    status: workspace.status as any, // Cast to satisfy OperationalStatus type
  }));

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

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);

    try {
      const result = await uploadFile(file, `materials/${Date.now()}_${file.name}`);
      if (result.success && result.url) {
        handleChange('image', result.url);
        toast.success('Image téléchargée avec succès');
      } else {
        toast.error('Erreur lors du téléchargement de l\'image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
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

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t('materials.image') || 'Image du matériau'}
                </Label>
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Aperçu du matériau"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : null}

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-terracotta-500 transition-colors">
                    {imagePreview ? null : (
                      <>
                        <Image className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Cliquez pour ajouter une image
                        </p>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <Label
                      htmlFor="image-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-50 border border-terracotta-200 rounded-md text-sm font-medium text-terracotta-700 hover:bg-terracotta-100 cursor-pointer transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Téléchargement...' : 'Sélectionner une image'}
                    </Label>
                    {imagePreview && !imageFile && (
                      <span className="text-xs text-green-600">✓ Image sauvegardée</span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Formats acceptés: JPG, PNG, GIF. Taille max: 5MB
                  </p>
                </div>
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

          {/* Interactive Map GIS */}
          <InteractiveMapGIS
            value={getMapData()}
            onChange={handleMapChange}
            className="border-l-4 border-l-primary shadow-lg"
          />

          {/* Location Data Display */}
          {(formData.localisation && formData.localisation.length > 0) && (
            <Card className="border-l-4 border-l-success bg-gradient-to-r from-success/5 to-success/10 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-success-foreground">
                  <Target className="h-4 w-4 text-success" />
                  Données de géolocalisation
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background/60 border border-border/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Pentagon className="h-3 w-3 text-success" />
                      <span className="text-xs font-medium text-muted-foreground">Type de forme</span>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {formData.forme || 'Non définie'}
                    </Badge>
                  </div>
                  <div className="bg-background/60 border border-border/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-3 w-3 text-success" />
                      <span className="text-xs font-medium text-muted-foreground">Points de coordonnées</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formData.localisation.length}</span>
                  </div>
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Voir les coordonnées détaillées
                  </summary>
                  <div className="mt-2 max-h-32 overflow-y-auto bg-muted/30 border border-border/50 p-3 rounded-lg">
                    <pre className="text-xs text-muted-foreground font-mono">
                      {JSON.stringify(formData.localisation, null, 2)}
                    </pre>
                  </div>
                </details>
              </CardContent>
            </Card>
          )}
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
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {/* Material Documents */}
          {materialId ? (
            <MaterialDocuments 
              materialId={materialId} 
              readonly={false}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>Sauvegardez d'abord le matériau pour pouvoir ajouter des documents.</p>
              </CardContent>
            </Card>
          )}
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
