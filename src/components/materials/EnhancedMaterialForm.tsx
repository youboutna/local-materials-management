
import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Package, User } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import MaterialCategorySelector from './MaterialCategorySelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';

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

interface EnhancedMaterialFormProps {
  onSubmit: (material: Partial<MaterialFormData>) => void;
  initialData?: Partial<MaterialFormData>;
  workspaces?: Array<{ id: string; name: string; location: string; status: string }>;
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

  const handleFormSubmit = () => {
    onSubmit(formData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFormSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="border-l-4 border-l-terracotta-500">
        <CardHeader className="bg-gradient-to-r from-terracotta-50 to-adrar-50">
          <CardTitle className="flex items-center gap-2 text-adrar-800">
            <Package className="h-5 w-5" />
            Informations de base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nom du matériau
              </Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nom du matériau"
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
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description du matériau"
              rows={3}
              className="border-gray-300 focus:border-terracotta-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Workspace and Location */}
      <Card className="border-l-4 border-l-adrar-500">
        <CardHeader className="bg-gradient-to-r from-adrar-50 to-terracotta-50">
          <CardTitle className="flex items-center gap-2 text-adrar-800">
            <MapPin className="h-5 w-5" />
            Emplacement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="workspaceId" className="text-sm font-medium text-gray-700">
              Espace de travail
            </Label>
            <Select
              value={formData.workspaceId || ''}
              onValueChange={value => handleChange('workspaceId', value)}
            >
              <SelectTrigger className="border-gray-300 focus:border-adrar-500">
                <SelectValue placeholder="Sélectionner un espace de travail" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map(workspace => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{workspace.name}</span>
                      <span className="text-sm text-gray-500">{workspace.location}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adresse" className="text-sm font-medium text-gray-700">
              Adresse
            </Label>
            <Input
              id="adresse"
              type="text"
              value={formData.adresse || ''}
              onChange={(e) => handleChange('adresse', e.target.value)}
              placeholder="Adresse du matériau"
              className="border-gray-300 focus:border-adrar-500"
              autoComplete="street-address"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quantities and Pricing */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="text-adrar-800">Quantités et prix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                Quantité
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
                Quantité disponible
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
                Quantité minimale
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
                Prix unitaire
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

      {/* Timeline */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-adrar-800">
            <Clock className="h-5 w-5" />
            Planning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                Date de début
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
                Date de fin
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
                Durée estimée (jours)
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

      {/* Supplier Information */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-adrar-800">
            <User className="h-5 w-5" />
            Informations fournisseur
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

      {/* Conditional Submit Button */}
      {showSubmitButton && (
        <div className="flex justify-end gap-4 pt-6">
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700 text-white px-8 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Créer le matériau
          </Button>
        </div>
      )}
    </form>
  );
});

EnhancedMaterialForm.displayName = 'EnhancedMaterialForm';

export default EnhancedMaterialForm;
