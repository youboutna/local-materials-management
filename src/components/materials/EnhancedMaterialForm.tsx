
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { Location, Region, OperationalStatus, TimeLine, EnhancedMaterial, MAURITANIA_REGIONS } from '@/types/mauritania';

import InteractiveMap from '@/components/map/InteractiveMap';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import { toast } from '@/hooks/use-toast';

interface MapData {
  center?: { lat: number; lng: number };
  polygon?: { lat: number; lng: number }[];
  address?: string;
}

interface EnhancedMaterialFormProps {
  onSubmit: (material: Partial<EnhancedMaterial>) => void;
  initialData?: Partial<EnhancedMaterial>;
  workspaces?: Array<{ id: string; name: string; location: Location; status: OperationalStatus }>;
}

const EnhancedMaterialForm: React.FC<EnhancedMaterialFormProps> = ({
  onSubmit,
  initialData,
  workspaces = []
}) => {
  const [formData, setFormData] = useState<Partial<EnhancedMaterial>>({
    name: '',
    description: '',
    quantity: 0,
    unit: 'kg',
    minQuantity: 0,
    pricePerUnit: 0,
    availableQuantity: 0,
    workspaceId: '',
    location: Location.Nouakchott,
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

  const [warehouseMapData, setWarehouseMapData] = useState<MapData>({
    center: undefined,
    polygon: [],
    address: ''
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTimelineChange = (field: keyof TimeLine, value: any) => {
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

  const handleMapDataChange = (data: MapData) => {
    setWarehouseMapData(data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Include warehouse location data
    const submissionData = {
      ...formData,
      warehouseLocation: warehouseMapData
    };
    
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom du matériau</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="unit">Unité</Label>
              <Select value={formData.unit} onValueChange={(value) => handleChange('unit', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilogrammes (kg)</SelectItem>
                  <SelectItem value="liters">Litres</SelectItem>
                  <SelectItem value="units">Unités</SelectItem>
                  <SelectItem value="m3">Mètres cubes (m³)</SelectItem>
                  <SelectItem value="m2">Mètres carrés (m²)</SelectItem>
                  <SelectItem value="tons">Tonnes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Workspace and Location */}
      <Card>
        <CardHeader>
          <CardTitle>Espace de travail et localisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workspaceId">Espace de travail</Label>
              <Select value={formData.workspaceId} onValueChange={(value) => handleChange('workspaceId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un espace de travail" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map(workspace => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name} - {workspace.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="location">Localisation</Label>
              <Select value={formData.location} onValueChange={(value) => handleChange('location', value as Location)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAURITANIA_REGIONS.map(region => (
                    <SelectItem key={region.code} value={region.code}> {/* or region.name */}
                      {region.name} ({region.nameAr})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

   

      {/* Quantities and Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Quantités et prix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label htmlFor="availableQuantity">Quantité disponible</Label>
              <Input
                id="availableQuantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.availableQuantity}
                onChange={(e) => handleChange('availableQuantity', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label htmlFor="minQuantity">Quantité minimale</Label>
              <Input
                id="minQuantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.minQuantity}
                onChange={(e) => handleChange('minQuantity', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div>
              <Label htmlFor="pricePerUnit">Prix unitaire (MRO)</Label>
              <Input
                id="pricePerUnit"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricePerUnit}
                onChange={(e) => handleChange('pricePerUnit', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Chronologie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.timeline?.start ? new Date(formData.timeline.start).toISOString().split('T')[0] : ''}
                onChange={(e) => handleTimelineChange('start', new Date(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.timeline?.end ? new Date(formData.timeline.end).toISOString().split('T')[0] : ''}
                onChange={(e) => handleTimelineChange('end', new Date(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="estimatedDuration">Durée estimée (jours)</Label>
              <Input
                id="estimatedDuration"
                type="number"
                min="1"
                value={formData.timeline?.estimatedDuration || 0}
                onChange={(e) => handleTimelineChange('estimatedDuration', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations fournisseur</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierSelector
            value={formData.supplier}
            onChange={handleSupplierChange}
            allowCustom={true}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" className="bg-terracotta-500 hover:bg-terracotta-600">
          Enregistrer le matériau
        </Button>
      </div>
    </form>
  );
};

export default EnhancedMaterialForm;
