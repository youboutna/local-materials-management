import { ExternalLink, Layers, Package, FileText } from 'lucide-react';
import React from 'react';
import MaterialFormSection from '../../MaterialFormSection';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import EnhancedWorkflowPhaseManager from '../EnhancedWorkflowPhaseManager';
import ProjectDocumentUpload from '../ProjectDocumentUpload';

interface PhasePlanificationStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  selectedMaterials: Array<{ materialId: string; quantity: number }>;
  onMaterialsChange: (materials: Array<{ materialId: string; quantity: number }>) => void;
  isEditing?: boolean;
  baseData?: any;
}

const PhasePlanificationStep: React.FC<PhasePlanificationStepProps> = ({
  formData,
  onUpdate,
  selectedMaterials,
  onMaterialsChange,
  isEditing = false,
  baseData = {}
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-500" />
          Phases & Planification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium">Gestion des phases du projet</h4>
            {formData.id && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`/projects/${formData.id}/phases/detail`, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Gérer les détails des phases
              </Button>
            )}
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Les ressources, matériaux et documents de chaque phase peuvent être gérés 
              dans la vue détaillée des phases. Cliquez sur "Gérer les détails des phases" pour accéder 
              aux options avancées de chaque phase.
            </p>
          </div>
          
          <EnhancedWorkflowPhaseManager
            projectId={formData.id || 'new-project'}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PhasePlanificationStep;