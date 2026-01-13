/**
 * PhaseMaterials - Phase material assignments
 * MIGRATED TO HEXAGONAL ARCHITECTURE
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, Edit2, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePhaseMaterialsHex, useAvailableMaterials } from '@/hooks/hexagonal/usePhaseMaterialsHex';

interface PhaseMaterialsProps {
  phaseId: string;
  projectId: string;
}

const PhaseMaterials: React.FC<PhaseMaterialsProps> = ({ phaseId, projectId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const { toast } = useToast();

  // Use hexagonal hooks
  const { 
    phaseMaterials, 
    isLoading, 
    addMaterial, 
    updateQuantity: updateMaterialQuantity, 
    removeMaterial 
  } = usePhaseMaterialsHex(phaseId, projectId);
  
  const { data: availableMaterials } = useAvailableMaterials();

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialId || !quantity) {
      toast({ 
        title: 'Erreur', 
        description: 'Veuillez sélectionner un matériau et spécifier une quantité',
        variant: 'destructive' 
      });
      return;
    }
    
    const qty = parseFloat(quantity);
    if (qty <= 0) {
      toast({ 
        title: 'Erreur', 
        description: 'La quantité doit être supérieure à 0',
        variant: 'destructive' 
      });
      return;
    }

    try {
      await addMaterial({ materialId: selectedMaterialId, qty });
      setIsAdding(false);
      setSelectedMaterialId('');
      setQuantity('');
      toast({ title: 'Matériau ajouté avec succès' });
    } catch (error) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible d\'ajouter le matériau',
        variant: 'destructive' 
      });
    }
  };

  const handleUpdateQuantity = async (id: string, currentQuantity: number) => {
    const newQuantity = prompt('Nouvelle quantité:', currentQuantity.toString());
    if (newQuantity && !isNaN(parseFloat(newQuantity))) {
      const qty = parseFloat(newQuantity);
      if (qty > 0) {
        try {
          await updateMaterialQuantity({ id, newQuantity: qty });
          toast({ title: 'Quantité mise à jour avec succès' });
        } catch (error) {
          toast({ 
            title: 'Erreur', 
            description: 'Impossible de mettre à jour la quantité',
            variant: 'destructive' 
          });
        }
      }
    }
  };

  const handleRemoveMaterial = async (id: string) => {
    try {
      await removeMaterial(id);
      toast({ title: 'Matériau retiré avec succès' });
    } catch (error) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de retirer le matériau',
        variant: 'destructive' 
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Chargement des matériaux...</div>;
  }

  const totalCost = phaseMaterials?.reduce((sum, pm) => 
    sum + (pm.quantity * pm.material.price_per_unit), 0
  ) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Matériaux de la phase ({phaseMaterials?.length || 0})
          </CardTitle>
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un matériau
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un matériau à la phase</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div>
                  <Label htmlFor="material">Matériau</Label>
                  <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un matériau" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMaterials?.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} - {material.price_per_unit} MRU/{material.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex: 10.5"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Ajouter</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {phaseMaterials && phaseMaterials.length > 0 ? (
          <div className="space-y-4">
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Coût total des matériaux: {totalCost.toLocaleString()} MRU
              </p>
            </div>
            
            {phaseMaterials.map((pm) => (
              <div key={pm.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{pm.material.name}</h3>
                  <p className="text-sm text-muted-foreground">{pm.material.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{pm.material.category}</Badge>
                    <Badge variant="secondary">
                      {pm.quantity} {pm.material.unit}
                    </Badge>
                    <Badge>
                      {(pm.quantity * pm.material.price_per_unit).toLocaleString()} MRU
                    </Badge>
                  </div>
                  {pm.material.origin_location && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Origine: {pm.material.origin_location}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateQuantity(pm.id, pm.quantity)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveMaterial(pm.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun matériau assigné à cette phase.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseMaterials;
