
import { useState, useEffect } from 'react';
import { Plus, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Define types for our component
interface Material {
  id: string;
  name: string;
  unit: string;
  available_quantity: number;
  price_per_unit: number;
}

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

interface MaterialSelectorProps {
  selectedMaterials: SelectedMaterial[];
  onChange: (materials: SelectedMaterial[]) => void;
}

const MaterialSelector = ({ selectedMaterials, onChange }: MaterialSelectorProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch materials from Supabase
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from('materials')
          .select('id, name, unit, available_quantity, price_per_unit')
          .order('name');
        
        if (error) throw error;
        setMaterials(data || []);
      } catch (error) {
        console.error('Error fetching materials:', error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les matériaux. Veuillez réessayer plus tard.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  // Add a new material to the selection
  const addMaterial = () => {
    if (materials.length === 0) return;
    
    // Find the first material that's not already selected
    const availableMaterial = materials.find(
      material => !selectedMaterials.some(selected => selected.materialId === material.id)
    );
    
    if (availableMaterial) {
      const updatedMaterials = [
        ...selectedMaterials,
        { materialId: availableMaterial.id, quantity: 1 }
      ];
      onChange(updatedMaterials);
    }
  };

  // Remove a material from the selection
  const removeMaterial = (index: number) => {
    const updatedMaterials = [...selectedMaterials];
    updatedMaterials.splice(index, 1);
    onChange(updatedMaterials);
  };

  // Update material selection
  const updateMaterialId = (index: number, materialId: string) => {
    const updatedMaterials = [...selectedMaterials];
    updatedMaterials[index].materialId = materialId;
    onChange(updatedMaterials);
  };

  // Update quantity
  const updateQuantity = (index: number, quantity: number) => {
    const updatedMaterials = [...selectedMaterials];
    updatedMaterials[index].quantity = quantity;
    onChange(updatedMaterials);
  };

  // Get material details
  const getMaterialDetails = (materialId: string) => {
    return materials.find(material => material.id === materialId);
  };

  if (loading) {
    return <div className="text-center py-4">Chargement des matériaux...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Matériaux requis</h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={addMaterial}
          disabled={materials.length === 0 || selectedMaterials.length >= materials.length}
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un matériau
        </Button>
      </div>

      {selectedMaterials.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center text-gray-500">
          Aucun matériau sélectionné
        </div>
      ) : (
        <div className="space-y-3">
          {selectedMaterials.map((selected, index) => {
            const material = getMaterialDetails(selected.materialId);
            return (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-grow">
                  <label className="text-sm font-medium mb-1 block">Matériau</label>
                  <Select
                    value={selected.materialId}
                    onValueChange={(value) => updateMaterialId(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un matériau" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map(material => (
                        <SelectItem 
                          key={material.id} 
                          value={material.id}
                          disabled={selectedMaterials.some(
                            (sm, i) => i !== index && sm.materialId === material.id
                          )}
                        >
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-32">
                  <label className="text-sm font-medium mb-1 block">Quantité</label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={selected.quantity}
                    onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="w-16 flex-shrink-0 pb-2">
                  {material && (
                    <div className="text-sm text-gray-500 text-center">
                      {material.unit}
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMaterial(index)}
                  className="flex-shrink-0"
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MaterialSelector;
