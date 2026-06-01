import { useState, useEffect } from 'react';
import { Plus, Trash, Package, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/contexts/LanguageContext';
import { useMaterialsSelector, MaterialOption } from '@/hooks/hexagonal'

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [totalCost, setTotalCost] = useState(0);
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: materials = [], isLoading } = useMaterialsSelector({ 
    searchTerm, 
    category: selectedCategory 
  });

  const categories = [...new Set(materials.map(m => m.category).filter(Boolean))];

  const availableMaterials = materials.filter(
    material => !selectedMaterials.some(selected => selected.materialId === material.id)
  );

  useEffect(() => {
    let cost = 0;
    selectedMaterials.forEach(selected => {
      const material = materials.find(m => m.id === selected.materialId);
      if (material) {
        cost += Number(material.price_per_unit || 0) * selected.quantity;
      }
    });
    setTotalCost(cost);
  }, [selectedMaterials, materials]);

  const addMaterial = () => {
    if (availableMaterials.length === 0) {
      toast({
        title: "Aucun matériau disponible",
        description: "Tous les matériaux sont déjà sélectionnés.",
      });
      return;
    }
    
    const materialToAdd = availableMaterials[0];
    onChange([...selectedMaterials, { materialId: materialToAdd.id, quantity: 1 }]);
    
    toast({ title: "Matériau ajouté", description: `${materialToAdd.name} ajouté.` });
  };

  const removeMaterial = (index: number) => {
    const updated = [...selectedMaterials];
    updated.splice(index, 1);
    onChange(updated);
  };

  const updateMaterialId = (index: number, materialId: string) => {
    const updated = [...selectedMaterials];
    updated[index].materialId = materialId;
    onChange(updated);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    const updated = [...selectedMaterials];
    updated[index].quantity = quantity;
    onChange(updated);
  };

  const getMaterialDetails = (materialId: string) => materials.find(m => m.id === materialId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">{t('materials.loading') || "Chargement..."}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('materials.required') || "Matériaux requis"}
            <Badge variant="outline" className="ml-auto">{materials.length} disponibles</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('materials.search') || "Rechercher"}</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('materials.search_placeholder') || "Nom ou description..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('materials.category') || "Catégorie"}</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={addMaterial} disabled={availableMaterials.length === 0} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t('materials.add') || "Ajouter"}
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {materials.length} matériau(x) trouvé(s) ({availableMaterials.length} disponibles)
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matériaux sélectionnés ({selectedMaterials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedMaterials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('materials.none_selected') || "Aucun matériau sélectionné"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedMaterials.map((selected, index) => {
                const material = getMaterialDetails(selected.materialId);
                const itemCost = material ? Number(material.price_per_unit || 0) * selected.quantity : 0;
                
                return (
                  <Card key={index} className="border">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        <div className="md:col-span-2 space-y-2">
                          <Label>Matériau</Label>
                          <Select value={selected.materialId} onValueChange={(v) => updateMaterialId(index, v)}>
                            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                            <SelectContent className="max-h-60">
                              {materials.filter(m => m.id && m.name).map(m => (
                                <SelectItem key={m.id} value={m.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{m.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {m.category} • {Number(m.price_per_unit || 0).toLocaleString()} MRU/{m.unit}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {material && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              <Badge variant="outline" className="text-xs">{material.category}</Badge>
                              {material.origin_location && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="h-3 w-3 mr-1" />{material.origin_location}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Quantité</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={selected.quantity}
                              onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                            {material && <span className="text-sm text-muted-foreground">{material.unit}</span>}
                          </div>
                          {material && (
                            <div className="text-xs text-muted-foreground">
                              Stock: {Number(material.available_quantity)} {material.unit}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total</span>
                            <Button variant="ghost" size="sm" onClick={() => removeMaterial(index)} className="text-destructive">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-lg font-bold text-primary">{itemCost.toLocaleString()} MRU</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Coût total</h3>
                      <p className="text-sm text-muted-foreground">{selectedMaterials.length} matériau(x)</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{totalCost.toLocaleString()} MRU</div>
                      {projectBudget && (
                        <span className={totalCost > projectBudget ? "text-destructive" : "text-green-600"}>
                          {((totalCost / projectBudget) * 100).toFixed(1)}% du budget
                        </span>
                      )}
                    </div>
                  </div>
                  {projectBudget && (
                    <div className="mt-3">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${totalCost > projectBudget ? 'bg-destructive' : 'bg-primary'}`}
                          style={{ width: `${Math.min((totalCost / projectBudget) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialSelector;
