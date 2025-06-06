import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import MaterialSelector from './MaterialSelector';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('materials.title')}
        </CardTitle>
        <CardDescription>
          {t('project_create.form.add_materials')}
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
