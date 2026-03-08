import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Alert, AlertDescription } from '../../ui/alert';
import { AlertCircle, Layers } from 'lucide-react';
import ConstructionPhaseManager from '../ConstructionPhaseManager';

interface PhasePlanificationStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  selectedMaterials?: Array<{ materialId: string; quantity: number }>;
  onMaterialsChange?: (materials: Array<{ materialId: string; quantity: number }>) => void;
  isEditing?: boolean;
  baseData?: any;
  projectId?: string;
}

const PhasePlanificationStep: React.FC<PhasePlanificationStepProps> = ({
  formData,
  onUpdate,
  selectedMaterials,
  onMaterialsChange,
  isEditing = false,
  baseData = {},
  projectId
}) => {
  const [phasesData, setPhasesData] = React.useState<any[]>([]);

  const handlePhasesChange = (newPhases: any[]) => {
    setPhasesData(newPhases);
    onUpdate({ phases: newPhases });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-500" />
          Phases & Planification
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!formData.id || formData.id === 'new-project' ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Projet non encore créé.</strong> Complétez les étapes précédentes et enregistrez le projet avant de gérer les phases.
            </AlertDescription>
          </Alert>
        ) : (
          <ConstructionPhaseManager
            phases={phasesData as any}
            workflowData={{ relatedData: { phases: phasesData } } as any}
            onStepComplete={(stepData: any) => handlePhasesChange(stepData?.phases || [])}
            projectBudget={parseFloat(formData.budget) || parseFloat(formData.estimated_budget) || 0}
            projectId={projectId || formData.id}
            referentialType={formData.referential_type}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PhasePlanificationStep;