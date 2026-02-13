/**
 * QuantityTakeoffForm - Quantity calculation form
 * MIGRATED TO HEXAGONAL ARCHITECTURE
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { calculateQuantity, CreateQuantityTakeoffData } from '@/dtos/entities/QuantityTakeoffDTO';
import { useMaterialsForTakeoff, useCreateQuantityTakeoff } from '@/hooks/hexagonal';

interface QuantityTakeoffFormProps {
  projectId: string;
  onSubmitSuccess?: () => void;
}

const QuantityTakeoffForm = ({ projectId, onSubmitSuccess }: QuantityTakeoffFormProps) => {
  const [formData, setFormData] = useState<Omit<CreateQuantityTakeoffData, 'projectId'>>({
    materialId: '',
    description: '',
    unit: 'm³',
    quantity: 0,
    unitPrice: 0,
    location: '',
    calculatedBy: ''
  });
  const [calculatedQuantity, setCalculatedQuantity] = useState(0);

  // Use hexagonal hooks
  const { data: materials } = useMaterialsForTakeoff();
  const createMutation = useCreateQuantityTakeoff(projectId);

  useEffect(() => {
    const quantity = calculateQuantity({
      quantity: formData.quantity,
      unit: formData.unit,
      wastageFactor: 0.1
    });
    setCalculatedQuantity(quantity.totalWithWastage);
  }, [formData.quantity, formData.unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.material_id || !formData.element_type) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...formData,
        quantity: calculatedQuantity
      });

      toast({
        title: "Métré créé",
        description: `Métré créé avec succès. Quantité calculée: ${calculatedQuantity} ${formData.unit}`,
      });

      // Reset form
      setFormData({
        material_id: '',
        element_type: '',
        unit: 'm³',
        length: 0,
        width: 0,
        height: 0,
        note: ''
      });

      onSubmitSuccess?.();
    } catch (error) {
      console.error('Error creating quantity takeoff:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le métré. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau Calcul Métré</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="material">Matériau</Label>
            <Select value={formData.material_id} onValueChange={(value) => updateFormData('material_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un matériau..." />
              </SelectTrigger>
              <SelectContent>
                {materials?.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name} ({material.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="element_type">Type d'élément</Label>
            <Input
              id="element_type"
              type="text"
              value={formData.element_type}
              onChange={(e) => updateFormData('element_type', e.target.value)}
              placeholder="Ex: Mur, Dalle, Poutre..."
              required
            />
          </div>

          <div>
            <Label htmlFor="unit">Unité</Label>
            <Select value={formData.unit} onValueChange={(value) => updateFormData('unit', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="m³">m³ (volume)</SelectItem>
                <SelectItem value="m²">m² (surface)</SelectItem>
                <SelectItem value="m">m (linéaire)</SelectItem>
                <SelectItem value="unité">unité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="length">Longueur (m)</Label>
            <Input
              id="length"
              type="number"
              step="0.01"
              value={formData.length}
              onChange={(e) => updateFormData('length', parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          {(formData.unit === 'm³' || formData.unit === 'm²') && (
            <div>
              <Label htmlFor="width">Largeur (m)</Label>
              <Input
                id="width"
                type="number"
                step="0.01"
                value={formData.width}
                onChange={(e) => updateFormData('width', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          )}

          {formData.unit === 'm³' && (
            <div>
              <Label htmlFor="height">Hauteur (m)</Label>
              <Input
                id="height"
                type="number"
                step="0.01"
                value={formData.height}
                onChange={(e) => updateFormData('height', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="note">Note (optionnel)</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => updateFormData('note', e.target.value)}
              placeholder="Notes additionnelles..."
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-lg font-semibold">
              Quantité calculée: {calculatedQuantity.toFixed(2)} {formData.unit}
            </div>
          </div>

          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Création...' : 'Créer Métré'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuantityTakeoffForm;
