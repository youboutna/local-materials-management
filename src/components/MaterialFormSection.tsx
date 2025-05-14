
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import MaterialSelector from './MaterialSelector';

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

interface MaterialFormSectionProps {
  selectedMaterials: SelectedMaterial[];
  onChange: (materials: SelectedMaterial[]) => void;
  projectBudget?: number;
}

const MaterialFormSection: React.FC<MaterialFormSectionProps> = ({
  selectedMaterials,
  onChange,
  projectBudget
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Matériaux nécessaires
        </CardTitle>
        <CardDescription>
          Sélectionnez les matériaux requis pour ce projet
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
  );
};

export default MaterialFormSection;
