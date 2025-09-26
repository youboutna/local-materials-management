import React from 'react';
import { Layers, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedWorkflowPhaseManager from '../EnhancedWorkflowPhaseManager';
import MaterialFormSection from '@/components/MaterialFormSection';

interface PhasePlanificationStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  selectedMaterials: Array<{ materialId: string; quantity: number }>;
  onMaterialsChange: (materials: Array<{ materialId: string; quantity: number }>) => void;
  isEditing?: boolean;
}

const PhasePlanificationStep: React.FC<PhasePlanificationStepProps> = ({
  formData,
  onUpdate,
  selectedMaterials,
  onMaterialsChange,
  isEditing = false
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
        <Tabs defaultValue="phases" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="phases" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Phases du Projet
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ressources & Matériaux
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="phases" className="space-y-4">
            <EnhancedWorkflowPhaseManager
              phases={formData.phases || []}
              onPhasesChange={(phases) => onUpdate({ phases })}
              isEditing={isEditing}
            />
          </TabsContent>
          
          <TabsContent value="materials" className="space-y-4">
            <div className="space-y-6">
              <MaterialFormSection
                selectedMaterials={selectedMaterials}
                onMaterialsChange={onMaterialsChange}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Budget matériaux estimé</label>
                  <input 
                    type="number" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="500000"
                    value={formData.materials_budget || ''}
                    onChange={(e) => onUpdate({ materials_budget: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Délai d'approvisionnement (jours)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="30"
                    value={formData.procurement_lead_time || ''}
                    onChange={(e) => onUpdate({ procurement_lead_time: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium mb-3">Assignation des ressources</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      id="assignToPhases"
                      name="resourceAssignment"
                      value="phases"
                      className="h-4 w-4 text-primary focus:ring-primary"
                      checked={formData.resource_assignment === 'phases'}
                      onChange={(e) => onUpdate({ resource_assignment: e.target.value })}
                    />
                    <label htmlFor="assignToPhases" className="text-sm">
                      Assigner les matériaux aux phases du projet
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      id="assignToTasks"
                      name="resourceAssignment"
                      value="tasks"
                      className="h-4 w-4 text-primary focus:ring-primary"
                      checked={formData.resource_assignment === 'tasks'}
                      onChange={(e) => onUpdate({ resource_assignment: e.target.value })}
                    />
                    <label htmlFor="assignToTasks" className="text-sm">
                      Assigner les matériaux aux tâches spécifiques
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="radio" 
                      id="globalPool"
                      name="resourceAssignment"
                      value="global"
                      className="h-4 w-4 text-primary focus:ring-primary"
                      checked={formData.resource_assignment === 'global'}
                      onChange={(e) => onUpdate({ resource_assignment: e.target.value })}
                    />
                    <label htmlFor="globalPool" className="text-sm">
                      Pool global de ressources (à répartir ultérieurement)
                    </label>
                  </div>
                </div>
              </div>

              {selectedMaterials.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium mb-3">Résumé des matériaux sélectionnés</h4>
                  <div className="grid gap-2">
                    {selectedMaterials.map((material, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>Matériau #{material.materialId}</span>
                        <span className="font-medium">Quantité: {material.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PhasePlanificationStep;