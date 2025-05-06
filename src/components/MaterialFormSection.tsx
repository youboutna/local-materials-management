
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Plus, X } from "lucide-react";

interface Material {
  id: string;
  name: string;
  unit: string;
  price_per_unit: number;
  available_quantity: number;
}

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

interface MaterialFormSectionProps {
  selectedMaterials: SelectedMaterial[];
  onChange: (materials: SelectedMaterial[]) => void;
}

const MaterialFormSection: React.FC<MaterialFormSectionProps> = ({
  selectedMaterials,
  onChange
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  // Fetch materials from the API
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('materials')
          .select('id, name, unit, price_per_unit, available_quantity')
          .order('name');

        if (error) {
          throw error;
        }

        setMaterials(data || []);
      } catch (err) {
        console.error('Error fetching materials:', err);
        toast({
          title: language === 'fr' ? "Erreur" : language === 'ar' ? "خطأ" : "Error",
          description: language === 'fr' ? "Impossible de récupérer les matériaux" : 
                       language === 'ar' ? "تعذر استرجاع المواد" : "Unable to retrieve materials",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [toast, language]);

  // Add a new material to the list
  const handleAddMaterial = () => {
    if (materials.length === 0) {
      toast({
        title: language === 'fr' ? "Attention" : language === 'ar' ? "تنبيه" : "Warning",
        description: language === 'fr' ? "Aucun matériau n'est disponible" : 
                     language === 'ar' ? "لا توجد مواد متاحة" : "No materials available",
        variant: "warning",
      });
      return;
    }
    
    // Find the first material that isn't already selected
    const availableMaterial = materials.find(
      material => !selectedMaterials.some(selected => selected.materialId === material.id)
    );

    if (!availableMaterial) {
      toast({
        title: language === 'fr' ? "Information" : language === 'ar' ? "معلومة" : "Information",
        description: language === 'fr' ? "Tous les matériaux ont déjà été ajoutés" : 
                     language === 'ar' ? "تمت إضافة جميع المواد بالفعل" : "All materials have already been added",
      });
      return;
    }

    const newMaterialList = [
      ...selectedMaterials,
      { materialId: availableMaterial.id, quantity: 1 }
    ];
    
    onChange(newMaterialList);
  };

  // Remove a material from the list
  const handleRemoveMaterial = (materialId: string) => {
    const newMaterialList = selectedMaterials.filter(
      item => item.materialId !== materialId
    );
    onChange(newMaterialList);
  };

  // Update the quantity of a material
  const handleQuantityChange = (materialId: string, quantity: number) => {
    const newMaterialList = selectedMaterials.map(item => 
      item.materialId === materialId ? { ...item, quantity } : item
    );
    onChange(newMaterialList);
  };

  // Change the selected material
  const handleMaterialChange = (index: number, newMaterialId: string) => {
    const newMaterialList = [...selectedMaterials];
    newMaterialList[index] = { 
      materialId: newMaterialId, 
      quantity: newMaterialList[index].quantity 
    };
    onChange(newMaterialList);
  };

  // Get material details by ID
  const getMaterialById = (materialId: string) => {
    return materials.find(material => material.id === materialId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'fr' ? "Matériaux nécessaires" : 
           language === 'ar' ? "المواد المطلوبة" : 
           "Required Materials"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-adrar-500" />
          </div>
        ) : (
          <>
            {selectedMaterials.length === 0 ? (
              <div className="text-center py-8 text-adrar-600">
                {language === 'fr' ? "Aucun matériau sélectionné" : 
                 language === 'ar' ? "لم يتم تحديد أي مواد" : 
                 "No materials selected"}
              </div>
            ) : (
              <div className="space-y-4">
                {selectedMaterials.map((item, index) => {
                  const material = getMaterialById(item.materialId);
                  return (
                    <div 
                      key={`${item.materialId}-${index}`} 
                      className="grid grid-cols-12 gap-4 items-center border-b pb-4"
                    >
                      <div className="col-span-5">
                        <Label className={`mb-1 block ${language === 'ar' ? 'text-right' : ''}`}>
                          {language === 'fr' ? "Matériau" : 
                           language === 'ar' ? "المادة" : 
                           "Material"}
                        </Label>
                        <Select
                          value={item.materialId}
                          onValueChange={(value) => handleMaterialChange(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              language === 'fr' ? "Sélectionner un matériau" : 
                              language === 'ar' ? "اختر مادة" : 
                              "Select a material"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem
                                key={material.id}
                                value={material.id}
                                disabled={selectedMaterials.some(
                                  selected => selected.materialId === material.id && selected.materialId !== item.materialId
                                )}
                              >
                                {material.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-3">
                        <Label className={`mb-1 block ${language === 'ar' ? 'text-right' : ''}`}>
                          {language === 'fr' ? "Quantité" : 
                           language === 'ar' ? "الكمية" : 
                           "Quantity"}
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.materialId, parseInt(e.target.value) || 1)}
                          className={language === 'ar' ? 'text-right' : ''}
                        />
                      </div>

                      <div className="col-span-3">
                        <Label className={`mb-1 block ${language === 'ar' ? 'text-right' : ''}`}>
                          {language === 'fr' ? "Unité" : 
                           language === 'ar' ? "الوحدة" : 
                           "Unit"}
                        </Label>
                        <div className="py-2 px-3 border rounded-md bg-gray-50">
                          {material?.unit || ''}
                        </div>
                      </div>

                      <div className="col-span-1 flex items-end justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMaterial(item.materialId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full"
              onClick={handleAddMaterial}
              disabled={materials.length === 0 || selectedMaterials.length === materials.length}
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === 'fr' ? "Ajouter un matériau" : 
               language === 'ar' ? "إضافة مادة" : 
               "Add Material"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialFormSection;
