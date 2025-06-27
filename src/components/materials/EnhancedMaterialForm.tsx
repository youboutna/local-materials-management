import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, Package, User, Warehouse } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import MaterialCategorySelector from './MaterialCategorySelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import WorkspaceSelector from '@/components/workspace/WorkspaceSelector';
import WorkspaceCreateDialog from '@/components/workspace/WorkspaceCreateDialog';
import InteractiveMapGIS from './InteractiveMapGIS';

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
  adresse?: string;
  forme?: string;
  localisation?: any[];
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
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
  shapeType?: 'polygon' | 'rectangle' | 'circle';
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
}

const EnhancedMaterialForm = forwardRef<any, EnhancedMaterialFormProps>(({
  onSubmit,
  initialData,
  workspaces = [],
  showSubmitButton = true,
  language
}, ref) => {
  const { t } = useLanguage();

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

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      setSelectedCategory(initialData.category || '');
      setSelectedSubcategory(initialData.subcategory || '');
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
    setFormData(prev => ({
      ...prev,
      adresse: mapData.address,
      coordinatesLatitude: mapData.coordinates?.lat,
      coordinatesLongitude: mapData.coordinates?.lng,
      localisation: mapData.shape || [],
      forme: mapData.shapeType
    }));
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
        : undefined,
      address: formData.adresse,
      shape: Array.isArray(formData.localisation) ? formData.localisation : [],
      shapeType: formData.forme as 'polygon' | 'rectangle' | 'circle' | undefined
    };
  };

  // Transform workspaces to match WorkspaceSelector interface
  const transformedWorkspaces = workspaces.map(workspace => ({
    id: workspace.id,
    name: workspace.name,
    location: workspace.location as any, // Cast to satisfy Location type
    status: workspace.status as any, // Cast to satisfy OperationalStatus type
  }));

  const handleWorkspaceCreated = (workspaceId: string) => {
    // Update the selected workspace to the newly created one
    handleChange('workspaceId', workspaceId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Informations</TabsTrigger>
          <TabsTrigger value="location">Localisation</TabsTrigger>
          <TabsTrigger value="quantities">Quantités</TabsTrigger>
          <TabsTrigger value="timeline">Planning</TabsTrigger>
          <TabsTrigger value="supplier">Fournisseur</TabsTrigger>
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
            className="border-l-4 border-l-blue-500"
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
                {t('materials.supplier_info') || 'Informations fournisseur'}
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
