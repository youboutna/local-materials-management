import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calculator, Plus, X } from 'lucide-react';
import { calculateAdvancedQuantities } from '@/utils/btpCalculations';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Opening {
  id: string;
  length: number;
  width: number;
  height?: number;
}

interface CalculationResult {
  elementType: string;
  dimensions: {
    length: number;
    width?: number;
    height?: number;
  };
  openings?: Opening[];
  results: { [key: string]: number };
}

interface AdvancedQuantityCalculatorProps {
  onResultsChange?: (results: CalculationResult[]) => void;
}

const STANDARD_OPENINGS = [
  { label: "Porte standard", length: 0.9, width: 2.1 },
  { label: "Fenêtre standard", length: 1.2, width: 1.5 },
  { label: "Baie vitrée", length: 2.4, width: 2.1 },
  { label: "Ouverture technique", length: 0.6, width: 0.6 }
];

const AdvancedQuantityCalculator = ({ onResultsChange }: AdvancedQuantityCalculatorProps) => {
  const [elementType, setElementType] = useState('concrete_slab');
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [currentOpening, setCurrentOpening] = useState<Opening>({
    id: '',
    length: 0,
    width: 0,
    height: 0
  });
  const [showOpeningForm, setShowOpeningForm] = useState(false);

  const elementTypes = [
    {
      value: 'concrete_slab',
      label: 'Dalle béton',
      requires: ['length', 'width', 'height'],
      defaultUnit: 'm³',
      minHeight: 0.05,
      heightStep: 0.01,
      heightPlaceholder: '0.15 (ex: 15cm)'
    },
    {
      value: 'hollow_core_slab',
      label: 'Plancher corps creux',
      requires: ['length', 'width', 'height'],
      defaultUnit: 'm³',
      minHeight: 0.04,
      heightStep: 0.01
    },
    {
      value: 'rebar',
      label: 'Ferraillage',
      requires: ['length', 'width'],
      defaultUnit: 'm²'
    },
    {
      value: 'masonry_wall',
      label: 'Mur maçonnerie',
      requires: ['length', 'height'],
      defaultUnit: 'm²',
      minHeight: 0.10
    },
    {
      value: 'plaster',
      label: 'Enduit',
      requires: ['length', 'width'],
      defaultUnit: 'm²'
    },
    {
      value: 'beam',
      label: 'Poutre',
      requires: ['length', 'width', 'height'],
      defaultUnit: 'm³',
      minHeight: 0.20
    },
    {
      value: 'column',
      label: 'Poteau',
      requires: ['length', 'width', 'height'],
      defaultUnit: 'm³',
      minHeight: 0.20
    },
    {
      value: 'foundation',
      label: 'Fondation',
      requires: ['length', 'width', 'height'],
      defaultUnit: 'm³',
      minHeight: 0.30
    },
    {
      value: 'staircase',
      label: 'Escalier',
      requires: ['length', 'width', 'height'],
      defaultUnit: 'm³',
      minHeight: 0.15
    }
  ];

  const getCurrentElementType = () => {
    return elementTypes.find(type => type.value === elementType) || elementTypes[0];
  };

  const hasRequiredDimensions = () => {
    const currentType = getCurrentElementType();
    if (!currentType) return false;

    if (currentType.requires.includes('length') && (isNaN(length) || length <= 0)) {
      return false;
    }

    if (currentType.requires.includes('width') && (isNaN(width) || width <= 0)) {
      return false;
    }

    if (currentType.requires.includes('height')) {
      if (isNaN(height) || height <= 0) return false;
      if (currentType.minHeight && height < currentType.minHeight) {
        toast({
          title: "Attention",
          description: `La hauteur minimale pour ${currentType.label} est ${currentType.minHeight}m`,
          variant: "default",
        });
        return false;
      }
    }

    return true;
  };

  const addOpening = () => {
    if (currentOpening.length <= 0 || currentOpening.width <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer des dimensions valides pour l'ouverture",
        variant: "destructive",
      });
      return;
    }

    setOpenings([...openings, {
      ...currentOpening,
      id: Math.random().toString(36).substring(7),
      height: elementType === 'concrete_slab' ? currentOpening.height || height : undefined
    }]);
    setCurrentOpening({ id: '', length: 0, width: 0, height: 0 });
    setShowOpeningForm(false);
  };

  const handleCalculate = () => {
    if (!hasRequiredDimensions()) return;

    const currentType = getCurrentElementType();
    const elementLabel = currentType.label;

    const results = calculateAdvancedQuantities(
      elementLabel,
      length,
      width,
      height,
      { 
        openings: ['concrete_slab', 'masonry_wall'].includes(elementType) ? openings : undefined 
      }
    );

    const newCalculation: CalculationResult = {
      elementType: elementLabel,
      dimensions: { length, width, height },
      openings: openings.length > 0 ? [...openings] : undefined,
      results
    };

    const updatedCalculations = [...calculations, newCalculation];
    setCalculations(updatedCalculations);
    onResultsChange?.(updatedCalculations);

    // Reset form
    setLength(0);
    setWidth(0);
    setHeight(0);
    setOpenings([]);
  };

  const removeCalculation = (index: number) => {
    const updatedCalculations = calculations.filter((_, i) => i !== index);
    setCalculations(updatedCalculations);
    onResultsChange?.(updatedCalculations);
  };

  const getTotalsByMaterial = () => {
    const totals: { [key: string]: number } = {};

    calculations.forEach(calc => {
      Object.entries(calc.results).forEach(([key, value]) => {
        const materialKey = key.replace(/\([^)]*\)/g, '').trim();
        if (totals[materialKey]) {
          totals[materialKey] += value;
        } else {
          totals[materialKey] = value;
        }
      });
    });

    return totals;
  };

  const formatCementOutput = (cementKg: number) => {
    if (cementKg >= 50000) {
      return {
        label: "Ciment (tonnes)",
        value: (cementKg / 1000).toFixed(2),
        hint: "Commande en vrac recommandée"
      };
    } else {
      return {
        label: "Sacs de ciment (50kg)",
        value: Math.ceil(cementKg / 50),
        hint: ""
      };
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculateur de Métrés Avancé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Type d'élément</Label>
              <Select value={elementType} onValueChange={setElementType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {elementTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Longueur (m)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={length || ''}
                onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            {getCurrentElementType().requires.includes('width') && (
              <div>
                <Label>Largeur (m)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={width || ''}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            )}

            {getCurrentElementType().requires.includes('height') && (
              <div>
                <Label>Hauteur (m)</Label>
                <Input
                  type="number"
                  step={getCurrentElementType().heightStep || "0.01"}
                  min={getCurrentElementType().minHeight || "0.01"}
                  value={height || ''}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  placeholder={getCurrentElementType().heightPlaceholder || "0.00"}
                />
                {getCurrentElementType().minHeight && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum: {getCurrentElementType().minHeight}m
                  </p>
                )}
              </div>
            )}
          </div>

          {(elementType === 'concrete_slab' || elementType === 'masonry_wall') && (
            <div className="mt-4">
              <Label>Ouvertures à déduire</Label>
              <div className="space-y-2">
                {openings.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {openings.map(opening => (
                      <Badge key={opening.id} variant="outline" className="flex items-center gap-1">
                        {opening.length}m × {opening.width}m
                        {opening.height && ` × ${opening.height}m`}
                        <button 
                          onClick={() => setOpenings(openings.filter(o => o.id !== opening.id))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {showOpeningForm ? (
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div>
                      <Label className="text-xs">Longueur</Label>
                      <Input
                        placeholder="Longueur"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={currentOpening.length || ''}
                        onChange={(e) => setCurrentOpening({...currentOpening, length: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Largeur</Label>
                      <Input
                        placeholder="Largeur"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={currentOpening.width || ''}
                        onChange={(e) => setCurrentOpening({...currentOpening, width: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    {elementType === 'concrete_slab' && (
                      <div>
                        <Label className="text-xs">Hauteur</Label>
                        <Input
                          placeholder="Hauteur"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={currentOpening.height || ''}
                          onChange={(e) => setCurrentOpening({...currentOpening, height: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    )}
                    <Button 
                      onClick={addOpening} 
                      size="sm" 
                      className="col-span-3"
                    >
                      Ajouter l'ouverture
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowOpeningForm(true)}
                    >
                      + Ajouter une ouverture
                    </Button>
                    <Select
                      onValueChange={(value) => {
                        const stdOpening = STANDARD_OPENINGS.find(o => o.label === value);
                        if (stdOpening) {
                          setCurrentOpening({
                            ...currentOpening,
                            length: stdOpening.length,
                            width: stdOpening.width
                          });
                          setShowOpeningForm(true);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ouvertures standard" />
                      </SelectTrigger>
                      <SelectContent>
                        {STANDARD_OPENINGS.map(opening => (
                          <SelectItem key={opening.label} value={opening.label}>
                            {opening.label} ({opening.length}m × {opening.width}m)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button 
            onClick={handleCalculate} 
            disabled={!hasRequiredDimensions()}
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Calculer et Ajouter
          </Button>
        </CardContent>
      </Card>

      {calculations.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Calculs Détaillés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calculations.map((calc, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{calc.elementType}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCalculation(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Supprimer
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                      <Badge variant="outline">Longueur: {calc.dimensions.length}m</Badge>
                      {calc.dimensions.width && (
                        <Badge variant="outline">Largeur: {calc.dimensions.width}m</Badge>
                      )}
                      {calc.dimensions.height && (
                        <Badge variant="outline">Hauteur: {calc.dimensions.height}m</Badge>
                      )}
                    </div>

                    {calc.openings && calc.openings.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Ouvertures déduites:</p>
                        <div className="flex flex-wrap gap-2">
                          {calc.openings.map((opening, i) => (
                            <Badge key={i} variant="outline">
                              {opening.length}m × {opening.width}m
                              {opening.height && ` × ${opening.height}m`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(calc.results).map(([key, value]) => {
                        const formattedValue = key.includes('Ciment') && value >= 50000
                          ? `${(value / 1000).toFixed(2)} tonnes`
                          : key.includes('Sacs') 
                            ? `${Math.ceil(value)} sacs`
                            : value.toFixed(2);

                        return (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-600 capitalize">{key}:</span>
                            <span className="font-medium">{formattedValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Totaux par Matériau</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(getTotalsByMaterial()).map(([material, total]) => {
                  const formattedTotal = material.includes('Ciment') && total >= 50000
                    ? `${(total / 1000).toFixed(2)} tonnes`
                    : material.includes('Sacs')
                      ? `${Math.ceil(total)} sacs`
                      : total.toFixed(2);

                  return (
                    <div key={material} className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-medium capitalize">{material}</span>
                      <Badge variant="secondary">
                        {formattedTotal}
                        {material.includes('Ciment') && total >= 50000 && (
                          <span className="ml-2 text-xs text-yellow-600">(vrac)</span>
                        )}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdvancedQuantityCalculator;