
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calculator, Package } from 'lucide-react';
import MaterialSelector from './MaterialSelector';
import MetreCalculator from './project/MetreCalculator';
import { useLanguage } from '@/contexts/LanguageContext';

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

interface MaterialFormSectionProps {
  selectedMaterials: SelectedMaterial[];
  onChange: (materials: SelectedMaterial[]) => void;
  projectBudget?: number;
  projectId?: string; // For existing projects
  showMetreCalculator?: boolean;
}

const MaterialFormSection: React.FC<MaterialFormSectionProps> = ({
  selectedMaterials,
  onChange,
  projectBudget,
  projectId,
  showMetreCalculator = true
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t('materials.title') || 'Matériaux'}
          </TabsTrigger>
          {showMetreCalculator && (
            <TabsTrigger value="metre" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calcul des métrés
              <Badge variant="outline" className="ml-2">Auto/Manuel</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('materials.title') || 'Sélection des matériaux'}
              </CardTitle>
              <CardDescription>
                {t('project_create.form.add_materials') || 'Sélectionnez les matériaux nécessaires pour ce projet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaterialSelector 
                selectedMaterials={selectedMaterials}
                onChange={onChange}
                projectBudget={projectBudget}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {showMetreCalculator && (
          <TabsContent value="metre">
            {projectId ? (
              <MetreCalculator 
                projectId={projectId}
                projectBudget={projectBudget}
                onCalculationsChange={(calculations) => {
                  // Update selected materials based on calculations
                  const materialQuantities: SelectedMaterial[] = [];
                  calculations.forEach(calc => {
                    const existing = materialQuantities.find(m => m.materialId === calc.materialId);
                    if (existing) {
                      existing.quantity += calc.quantity;
                    } else {
                      materialQuantities.push({
                        materialId: calc.materialId,
                        quantity: calc.quantity
                      });
                    }
                  });
                  onChange(materialQuantities);
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Calcul des métrés disponible après création
                  </h3>
                  <p className="text-gray-600">
                    Le calcul automatique et manuel des métrés sera disponible une fois le projet créé.
                    Vous pourrez alors accéder aux fonctionnalités avancées de calcul de quantités.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default MaterialFormSection;
