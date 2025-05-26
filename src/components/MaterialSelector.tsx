
import { useState, useEffect } from 'react';
import { Plus, Trash, FileText } from 'lucide-react';
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
import { Badge } from "@/components/ui/badge";
import { Progress } from '@/components/ui/progress';
import type { Database } from '@/integrations/supabase/types';

type Material = Database['public']['Tables']['materials']['Row'];

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

interface MaterialSelectorProps {
  selectedMaterials: SelectedMaterial[];
  onChange: (materials: SelectedMaterial[]) => void;
  projectBudget?: number;
}

const MaterialSelector = ({ selectedMaterials, onChange, projectBudget }: MaterialSelectorProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);

  // Fetch materials from Supabase
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setMaterials((data as Material[]) || []);
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

  // Calculate total cost whenever selected materials change
  useEffect(() => {
    let cost = 0;
    selectedMaterials.forEach(selected => {
      const material = materials.find(m => m.id === selected.materialId);
      if (material) {
        cost += Number(material.price_per_unit) * selected.quantity;
      }
    });
    setTotalCost(cost);
  }, [selectedMaterials, materials]);

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
            const itemCost = material ? Number(material.price_per_unit) * selected.quantity : 0;
            
            return (
              <div key={index} className="p-3 border rounded-md bg-gray-50">
                <div className="flex gap-2 items-end">
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
                
                {material && (
                  <div className="mt-2 flex flex-wrap gap-2 items-center">
                    <Badge variant="outline" className="bg-blue-50">
                      {material.category}
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50">
                      Prix: {Number(material.price_per_unit).toLocaleString()} MRU/{material.unit}
                    </Badge>
                    <Badge variant="outline" className="bg-green-50">
                      Stock: {Number(material.available_quantity)} {material.unit}
                    </Badge>
                    <Badge className="ml-auto bg-terracotta-100 text-terracotta-700 hover:bg-terracotta-200">
                      Total: {itemCost.toLocaleString()} MRU
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="border-t pt-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Coût total des matériaux:</span>
              <span className="font-bold text-lg">{totalCost.toLocaleString()} MRU</span>
            </div>
            
            {projectBudget && (
              <div className="mt-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Pourcentage du budget:</span>
                  <span className={totalCost > projectBudget ? "text-red-500" : "text-green-600"}>
                    {((totalCost / projectBudget) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-1">
                  <div 
                    className={`h-2 rounded-full ${
                      totalCost > projectBudget ? "bg-red-500" : "bg-green-500"
                    }`} 
                    style={{ width: `${Math.min((totalCost / projectBudget) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialSelector;
