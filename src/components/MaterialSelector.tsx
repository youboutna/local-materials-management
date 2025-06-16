import { useState, useEffect } from 'react';
import { Plus, Trash, Package, MapPin, Search } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Database } from '@/integrations/supabase/types';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [totalCost, setTotalCost] = useState(0);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Get unique categories from materials with proper filtering
  const categories = [...new Set(materials
    .map(m => m.category)
    .filter(category => category && typeof category === 'string' && category.trim() !== '')
  )];

  // Filter materials based on search and category
  const filteredMaterials = materials.filter(material => {
    if (!material) return false;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const nameMatch = material.name?.toLowerCase().includes(searchLower) || false;
    const descriptionMatch = material.description?.toLowerCase().includes(searchLower) || false;
    const categoryMatch = material.category?.toLowerCase().includes(searchLower) || false;
    
    const matchesSearch = searchTerm === '' || nameMatch || descriptionMatch || categoryMatch;
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get available materials (not already selected)
  const availableMaterials = filteredMaterials.filter(
    material => !selectedMaterials.some(selected => selected.materialId === material.id)
  );

  // Fetch materials from Supabase
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        console.log('Fetching materials from Supabase...');
        
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Materials fetched:', data?.length || 0, 'materials');
        console.log('Sample material:', data?.[0]);
        setMaterials((data as Material[]) || []);
      } catch (error) {
        console.error('Error fetching materials:', error);
        toast({
          title: t('materials.error_loading') || "Erreur",
          description: t('materials.retry') || "Impossible de récupérer les matériaux. Veuillez réessayer plus tard.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [toast, t]);

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
    console.log('Add material clicked');
    console.log('Available materials:', availableMaterials.length);
    console.log('Filtered materials:', filteredMaterials.length);
    console.log('Total materials:', materials.length);
    
    if (availableMaterials.length === 0) {
      toast({
        title: "Aucun matériau disponible",
        description: filteredMaterials.length === 0 
          ? "Aucun matériau ne correspond aux critères de recherche."
          : "Tous les matériaux correspondants sont déjà sélectionnés.",
        variant: "default",
      });
      return;
    }
    
    const materialToAdd = availableMaterials[0];
    const updatedMaterials = [
      ...selectedMaterials,
      { materialId: materialToAdd.id, quantity: 1 }
    ];
    onChange(updatedMaterials);
    
    toast({
      title: "Matériau ajouté",
      description: `${materialToAdd.name} a été ajouté à la sélection.`,
      variant: "default",
    });
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
    if (quantity <= 0) return;
    const updatedMaterials = [...selectedMaterials];
    updatedMaterials[index].quantity = quantity;
    onChange(updatedMaterials);
  };

  // Get material details
  const getMaterialDetails = (materialId: string) => {
    return materials.find(material => material.id === materialId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">{t('materials.loading') || "Chargement des matériaux..."}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('materials.required') || "Matériaux requis"}
            <Badge variant="outline" className="ml-auto">
              {materials.length} disponibles
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and filters */}
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
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={addMaterial}
                disabled={availableMaterials.length === 0}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('materials.add') || "Ajouter un matériau"}
              </Button>
            </div>
          </div>

          {/* Results info */}
          <div className="text-sm text-muted-foreground">
            {filteredMaterials.length} matériau(x) trouvé(s)
            {searchTerm && ` pour "${searchTerm}"`}
            {selectedCategory !== 'all' && ` dans "${selectedCategory}"`}
            {availableMaterials.length !== filteredMaterials.length && 
              ` (${availableMaterials.length} disponibles pour ajout)`
            }
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 p-2 bg-gray-50 rounded">
              Debug: Total materials: {materials.length}, Filtered: {filteredMaterials.length}, Available: {availableMaterials.length}, Selected: {selectedMaterials.length}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected materials */}
      <Card>
        <CardHeader>
          <CardTitle>Matériaux sélectionnés ({selectedMaterials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedMaterials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('materials.none_selected') || "Aucun matériau sélectionné"}</p>
              <p className="text-sm">
                {materials.length === 0 
                  ? "Aucun matériau disponible dans la base de données"
                  : "Utilisez le bouton \"Ajouter un matériau\" ci-dessus"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedMaterials.map((selected, index) => {
                const material = getMaterialDetails(selected.materialId);
                const itemCost = material ? Number(material.price_per_unit) * selected.quantity : 0;
                
                return (
                  <Card key={index} className="border border-border">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        {/* Material selection */}
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-sm font-medium">Matériau</Label>
                          <Select
                            value={selected.materialId || undefined}
                            onValueChange={(value) => updateMaterialId(index, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un matériau" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {materials
                                .filter(material => material && material.id && material.id.trim() !== '')
                                .map(material => (
                                <SelectItem 
                                  key={material.id} 
                                  value={material.id}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{material.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {material.category} • {Number(material.price_per_unit).toLocaleString()} MRU/{material.unit}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {material && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {material.category}
                              </Badge>
                              {material.origin_location && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {material.origin_location}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quantity input */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Quantité</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={selected.quantity}
                              onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                            {material && (
                              <span className="text-sm text-muted-foreground">
                                {material.unit}
                              </span>
                            )}
                          </div>
                          {material && (
                            <div className="text-xs text-muted-foreground">
                              Stock: {Number(material.available_quantity)} {material.unit}
                            </div>
                          )}
                        </div>

                        {/* Cost and actions */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMaterial(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-lg font-bold text-primary">
                            {itemCost.toLocaleString()} MRU
                          </div>
                          {material && (
                            <div className="text-xs text-muted-foreground">
                              {Number(material.price_per_unit).toLocaleString()} MRU/{material.unit}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Total summary */}
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Coût total des matériaux</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedMaterials.length} matériau(x) sélectionné(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {totalCost.toLocaleString()} MRU
                      </div>
                      {projectBudget && (
                        <div className="text-sm">
                          <span className={totalCost > projectBudget ? "text-destructive" : "text-green-600"}>
                            {((totalCost / projectBudget) * 100).toFixed(1)}% du budget
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {projectBudget && (
                    <div className="mt-3">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            totalCost > projectBudget ? "bg-destructive" : "bg-green-500"
                          }`} 
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
