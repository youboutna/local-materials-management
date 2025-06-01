
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calculator, Plus } from 'lucide-react';
import { calculateAdvancedQuantities } from '@/utils/btpCalculations';
import { Badge } from '@/components/ui/badge';

interface CalculationResult {
  elementType: string;
  dimensions: {
    length: number;
    width?: number;
    height?: number;
  };
  results: { [key: string]: number };
}

interface AdvancedQuantityCalculatorProps {
  onResultsChange?: (results: CalculationResult[]) => void;
}

const AdvancedQuantityCalculator = ({ onResultsChange }: AdvancedQuantityCalculatorProps) => {
  const [elementType, setElementType] = useState('dalle béton');
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);

  const elementTypes = [
    'Dalle béton',
    'Ferraillage',
    'Mur maçonnerie',
    'Enduit',
    'Poutre',
    'Poteau',
    'Fondation',
    'Escalier',
    'Autre'
  ];

  const handleCalculate = () => {
    if (length <= 0) return;

    const results = calculateAdvancedQuantities(
      elementType,
      length,
      width > 0 ? width : undefined,
      height > 0 ? height : undefined
    );

    const newCalculation: CalculationResult = {
      elementType,
      dimensions: {
        length,
        width: width > 0 ? width : undefined,
        height: height > 0 ? height : undefined
      },
      results
    };

    const updatedCalculations = [...calculations, newCalculation];
    setCalculations(updatedCalculations);
    onResultsChange?.(updatedCalculations);

    // Reset form
    setLength(0);
    setWidth(0);
    setHeight(0);
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
        if (totals[key]) {
          totals[key] += value;
        } else {
          totals[key] = value;
        }
      });
    });

    return totals;
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
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
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
                min="0"
                value={length || ''}
                onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Largeur (m)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={width || ''}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Hauteur (m)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={height || ''}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          <Button onClick={handleCalculate} disabled={length <= 0}>
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
                      <h4 className="font-medium capitalize">{calc.elementType}</h4>
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
                      <Badge variant="outline">L: {calc.dimensions.length}m</Badge>
                      {calc.dimensions.width && (
                        <Badge variant="outline">l: {calc.dimensions.width}m</Badge>
                      )}
                      {calc.dimensions.height && (
                        <Badge variant="outline">H: {calc.dimensions.height}m</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(calc.results).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium">{value.toFixed(2)}</span>
                        </div>
                      ))}
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
                {Object.entries(getTotalsByMaterial()).map(([material, total]) => (
                  <div key={material} className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">{material}</span>
                    <Badge variant="secondary">{total.toFixed(2)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdvancedQuantityCalculator;
