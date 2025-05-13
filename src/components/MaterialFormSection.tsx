
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MaterialSelector from './MaterialSelector';

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Matériaux nécessaires
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MaterialSelector 
          selectedMaterials={selectedMaterials}
          onChange={onChange}
        />
      </CardContent>
    </Card>
  );
};

export default MaterialFormSection;
