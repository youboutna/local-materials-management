/**
 * QuantityTakeoffForm - Quantity calculation form
 * Uses local snake_case types matching DB schema for quantity_takeoffs table
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { calculateQuantity } from '@/dtos/entities/QuantityTakeoffDTO';
import { useMaterialsForTakeoff } from '@/hooks/hexagonal';

interface QuantityTakeoffFormProps {
  projectId: string;
  onSubmitSuccess?: () => void;
}

interface FormData {
  materialId: string;
  elementType: string;
  unit: 'm³' | 'm²' | 'm' | 'unité';
  length: number;
  width: number;
  height: number;
  note: string;
}

const QuantityTakeoffForm = ({ projectId, onSubmitSuccess }: QuantityTakeoffFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    materialId: '',
    elementType: '',
    unit: 'm³',
    length: 0,
    width: 0,
    height: 0,
    note: ''
  });
  const [calculatedQuantity, setCalculatedQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { data: materials } = useMaterialsForTakeoff();

  useEffect(() => {
    const qty = calculateQuantity(formData.length, formData.width, formData.height, formData.unit);
    setCalculatedQuantity(qty);
  }, [formData.length, formData.width, formData.height, formData.unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.materialId || !formData.elementType) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('quantity_takeoffs').insert({
        project_id: projectId,
        material_id: formData.materialId,
        element_type: formData.elementType,
        unit: formData.unit,
        length: formData.length,
        width: formData.width || null,
        height: formData.height || null,
        note: formData.note || null,
      });

      if (error) throw error;

      toast({
        title: "Métré créé",
        description: `Métré créé avec succès. Quantité calculée: ${calculatedQuantity} ${formData.unit}`,
      });

      setFormData({
        materialId: '',
        elementType: '',
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
    } finally {
      setSubmitting(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
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
            <Select value={formData.materialId} onValueChange={(value) => updateFormData('materialId', value)}>
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
            <Label htmlFor="elementType">Type d'élément</Label>
            <Input
              id="elementType"
              type="text"
              value={formData.elementType}
              onChange={(e) => updateFormData('elementType', e.target.value)}
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

          <div className="bg-muted p-4 rounded-lg">
            <div className="text-lg font-semibold">
              Quantité calculée: {calculatedQuantity.toFixed(2)} {formData.unit}
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Création...' : 'Créer Métré'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuantityTakeoffForm;
