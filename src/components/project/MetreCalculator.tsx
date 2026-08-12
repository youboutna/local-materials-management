
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateQuantity } from '@/dtos/entities/QuantityTakeoffDTO';
import { useToast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { Calculator, FileText, Plus, Save, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getQuantityTakeoffService } from '@/application/services/QuantityTakeoffService';
import { getUnitOptions, METRE_UNIT_CODES } from '@/config/referentials/boq/unit-catalog.referential';

// Local Material interface for UI usage
interface LocalMaterial {
  id: string;
  name: string;
  unit: string;
  category: string;
  price_per_unit: number;
}

interface QuantityCalculation {
  id?: string;
  materialId: string;
  elementType: string;
  unit: 'm³' | 'm²' | 'm' | 'unité';
  length: number;
  width?: number;
  height?: number;
  quantity: number;
  note?: string;
}

interface MetreCalculatorProps {
  projectId: string;
  projectBudget?: number;
  onCalculationsChange?: (calculations: QuantityCalculation[]) => void;
}

const MetreCalculator: React.FC<MetreCalculatorProps> = ({
  projectId,
  projectBudget,
  onCalculationsChange
}) => {
  const [materials, setMaterials] = useState<LocalMaterial[]>([]);
  const [calculations, setCalculations] = useState<QuantityCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('automatic');
  const { toast } = useToast();

  // Element types for construction
  const elementTypes = [
    'Fondation',
    'Mur',
    'Dalle',
    'Poutre',
    'Poteau',
    'Cloison',
    'Toiture',
    'Revêtement',
    'Autre'
  ];

  // Units available (référentiel central — jamais codées en dur ici)
  const units: Array<{ value: 'm³' | 'm²' | 'm' | 'unité'; label: string }> =
    getUnitOptions(METRE_UNIT_CODES).map((entry) => ({
      value: entry.code as 'm³' | 'm²' | 'm' | 'unité',
      label: entry.longLabel,
    }));

  useEffect(() => {
    fetchMaterials();
    fetchExistingCalculations();
  }, [projectId]);

  useEffect(() => {
    onCalculationsChange?.(calculations);
  }, [calculations, onCalculationsChange]);

  const fetchMaterials = async () => {
    try {
      const materialRepository = RepositoryFactory.getMaterialRepository();
      const domainMaterials = await materialRepository.findAll();
      // Map domain entities to local UI format
      const mappedMaterials: LocalMaterial[] = domainMaterials.map(m => ({
        id: m.id,
        name: m.name,
        unit: m.unit,
        category: m.category,
        price_per_unit: m.pricePerUnit ?? 0
      }));
      setMaterials(mappedMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les matériaux.",
        variant: "destructive",
      });
    }
  };

  const fetchExistingCalculations = async () => {
    try {
      const data = await getQuantityTakeoffService().getByProject(projectId);

      const formattedCalculations: QuantityCalculation[] = (data || []).map((item: any) => ({
        id: item.id,
        materialId: item.material_id,
        elementType: item.element_type,
        unit: item.unit as 'm³' | 'm²' | 'm' | 'unité',
        length: item.length || 0,
        width: item.width || undefined,
        height: item.height || undefined,
        quantity: item.quantity || 0,
        note: item.note || undefined
      }));

      setCalculations(formattedCalculations);
    } catch (error) {
      console.error('Error fetching calculations:', error);
    }
  };

  const addNewCalculation = () => {
    const newCalculation: QuantityCalculation = {
      materialId: '',
      elementType: 'Autre',
      unit: 'm³',
      length: 1,
      width: 1,
      height: 1,
      quantity: 1
    };
    setCalculations([...calculations, newCalculation]);
  };

  const updateCalculation = (index: number, field: keyof QuantityCalculation, value: any) => {
    const updated = [...calculations];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate quantity when dimensions change
    if (['length', 'width', 'height', 'unit'].includes(field)) {
      updated[index].quantity = calculateQuantity(
        updated[index].length,
        updated[index].width,
        updated[index].height,
        updated[index].unit
      );
    }
    
    setCalculations(updated);
  };

  const removeCalculation = (index: number) => {
    const updated = [...calculations];
    updated.splice(index, 1);
    setCalculations(updated);
  };

  const saveCalculations = async () => {
    setLoading(true);
    try {
      await getQuantityTakeoffService().replaceForProject(
        projectId,
        calculations.map((calc) => ({
          projectId,
          materialId: calc.materialId,
          elementType: calc.elementType,
          unit: calc.unit,
          length: calc.length,
          width: calc.width ?? null,
          height: calc.height ?? null,
          quantity: calc.quantity,
          note: calc.note ?? null,
        })),
      );

      toast({
        title: "Métrés sauvegardés",
        description: `${calculations.length} calcul(s) de métré sauvegardé(s).`,
      });

      // Refresh the calculations to get IDs
      fetchExistingCalculations();
    } catch (error) {
      console.error('Error saving calculations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les métrés.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAutomaticCalculations = async () => {
    try {
      // Get project materials
      const materialRepository = RepositoryFactory.getMaterialRepository();
      const projectMaterials = await materialRepository.findAll();

      // Generate automatic calculations based on material categories and quantities
      const autoCalculations: QuantityCalculation[] = projectMaterials.map(pm => {
        const material = pm;
        let elementType = 'Autre';
        let unit: 'm³' | 'm²' | 'm' | 'unité' = 'unité';
        let length = pm.availableQuantity || 0;
        let width: number | undefined, height: number | undefined;

        // Determine element type and dimensions based on material category
        if (material.category.toLowerCase().includes('béton')) {
          elementType = 'Dalle';
          unit = 'm³';
          length = Math.cbrt(pm.availableQuantity || 1);
          width = length;
          height = length;
        } else if (material.category.toLowerCase().includes('acier') || material.category.toLowerCase().includes('fer')) {
          elementType = 'Poutre';
          unit = 'm';
          length = pm.availableQuantity || 0;
        } else if (material.category.toLowerCase().includes('brique') || material.category.toLowerCase().includes('parpaing')) {
          elementType = 'Mur';
          unit = 'm²';
          length = Math.sqrt(pm.availableQuantity || 1);
          width = Math.sqrt(pm.availableQuantity || 1);
        }

        return {
          materialId: material.id,
          elementType,
          unit,
          length,
          width,
          height,
          quantity: calculateQuantity(length, width, height, unit),
          note: 'Calcul automatique basé sur la catégorie du matériau'
        };
      });

      setCalculations(autoCalculations);
      toast({
        title: "Calculs automatiques générés",
        description: `${autoCalculations.length} calcul(s) de métré généré(s) automatiquement.`,
      });
    } catch (error) {
      console.error('Error generating automatic calculations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les calculs automatiques.",
        variant: "destructive",
      });
    }
  };

  const getTotalCost = () => {
    return calculations.reduce((total, calc) => {
      const material = materials.find(m => m.id === calc.materialId);
      if (material) {
        return total + (calc.quantity * (material.price_per_unit || 0));
      }
      return total;
    }, 0);
  };

  const getTotalQuantity = () => {
    return calculations.reduce((total, calc) => total + calc.quantity, 0);
  };

  return (
    <Card className="border-l-4 border-l-blue-600">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Calculator className="h-5 w-5" />
          Calcul des métrés
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div>
            <Badge variant="outline">{calculations.length} calculs</Badge>
          </div>
          <div>
            Quantité totale: {getTotalQuantity().toFixed(2)}
          </div>
          <div>
            Coût total: {getTotalCost().toLocaleString('fr-FR')} MRU
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="automatic">Calcul automatique</TabsTrigger>
            <TabsTrigger value="manual">Calcul manuel</TabsTrigger>
          </TabsList>

          <TabsContent value="automatic" className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Calcul automatique des métrés</h3>
              <p className="text-sm text-blue-700 mb-4">
                Les métrés seront calculés automatiquement en fonction des matériaux du projet et de leurs catégories.
              </p>
              <Button onClick={generateAutomaticCalculations} className="bg-blue-600 hover:bg-blue-700">
                <Calculator className="mr-2 h-4 w-4" />
                Générer les calculs automatiques
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Calculs manuels</h3>
              <Button onClick={addNewCalculation} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un calcul
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Calculations List */}
        {calculations.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Calculs de métré</h4>
            {calculations.map((calc, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Material Selection */}
                    <div className="space-y-2">
                      <Label>Matériau</Label>
                      <Select
                        value={calc.materialId}
                        onValueChange={(value) => updateCalculation(index, 'materialId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name} ({material.category})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Element Type */}
                    <div className="space-y-2">
                      <Label>Type d'élément</Label>
                      <Select
                        value={calc.elementType}
                        onValueChange={(value) => updateCalculation(index, 'elementType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {elementTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Unit */}
                    <div className="space-y-2">
                      <Label>Unité</Label>
                      <Select
                        value={calc.unit}
                        onValueChange={(value) => updateCalculation(index, 'unit', value as 'm³' | 'm²' | 'm' | 'unité')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Remove Button */}
                    <div className="space-y-2">
                      <Label>&nbsp;</Label>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeCalculation(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Longueur (m)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={calc.length}
                        onChange={(e) => updateCalculation(index, 'length', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    {calc.unit !== 'm' && calc.unit !== 'unité' && (
                      <div className="space-y-2">
                        <Label>Largeur (m)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={calc.width || 0}
                          onChange={(e) => updateCalculation(index, 'width', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    )}
                    
                    {calc.unit === 'm³' && (
                      <div className="space-y-2">
                        <Label>Hauteur (m)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={calc.height || 0}
                          onChange={(e) => updateCalculation(index, 'height', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Quantité calculée</Label>
                      <Input
                        type="number"
                        value={calc.quantity.toFixed(2)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label>Note (optionnel)</Label>
                    <Input
                      value={calc.note || ''}
                      onChange={(e) => updateCalculation(index, 'note', e.target.value)}
                      placeholder="Ajoutez une note..."
                    />
                  </div>

                  {/* Cost calculation */}
                  {calc.materialId && (
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <div className="text-sm text-green-800">
                        {(() => {
                          const material = materials.find(m => m.id === calc.materialId);
                          const cost = material ? calc.quantity * material.price_per_unit : 0;
                          return (
                            <>
                              <span className="font-medium">Coût estimé: </span>
                              {cost.toLocaleString('fr-FR')} MRU
                              {material && (
                                <span className="text-green-600 ml-2">
                                  ({calc.quantity.toFixed(2)} × {material.price_per_unit.toLocaleString('fr-FR')} MRU)
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Save button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={saveCalculations} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder les métrés'}
              </Button>
            </div>
          </div>
        )}

        {calculations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun calcul de métré. Utilisez le calcul automatique ou ajoutez des calculs manuels.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetreCalculator;
