import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, FileText } from 'lucide-react';
import MaterialFormSection from '@/components/MaterialFormSection';
import ProjectDocumentUpload from '@/components/project/ProjectDocumentUpload';

interface ResourcesMaterialsStepProps {
  selectedMaterials: Array<{ materialId: string; quantity: number }>;
  onMaterialsChange: (materials: Array<{ materialId: string; quantity: number }>) => void;
  formData?: any;
  onUpdate?: (data: any) => void;
  isEditing?: boolean;
  currentPhaseId?: string;
  currentStepId?: string;
}

const ResourcesMaterialsStep: React.FC<ResourcesMaterialsStepProps> = ({
  selectedMaterials,
  onMaterialsChange,
  formData,
  onUpdate,
  isEditing = false,
  currentPhaseId,
  currentStepId
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-purple-500" />
          Ressources & Matériaux
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Matériaux & Ressources
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents Associés
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="materials" className="space-y-6">
            {/* Sélection des matériaux */}
            <div>
              <label className="block text-sm font-medium mb-2">Matériaux du projet</label>
              <MaterialFormSection
                selectedMaterials={selectedMaterials}
                onChange={onMaterialsChange}
                projectId={formData?.id}
              />
            </div>

          {/* Rattachement aux phases/tâches */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Rattachement des ressources</h3>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="font-medium mb-2">Organisation par phases</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Les matériaux peuvent être rattachés à des phases spécifiques ou à des tâches individuelles
                </p>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="material_assignment" 
                      value="phase"
                      className="mr-2"
                      defaultChecked
                    />
                    Rattacher aux phases du projet
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="material_assignment" 
                      value="task"
                      className="mr-2"
                    />
                    Rattacher aux tâches spécifiques
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="material_assignment" 
                      value="general"
                      className="mr-2"
                    />
                    Ressources générales du projet
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Informations sur les ressources */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Informations sur les ressources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Budget matériaux estimé</label>
                <input 
                  type="number" 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Montant en MRU"
                  value={formData?.materials_budget || ''}
                  onChange={(e) => onUpdate?.({ materials_budget: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Délai d'approvisionnement (jours)</label>
                <input 
                  type="number" 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nombre de jours"
                  value={formData?.procurement_lead_time || ''}
                  onChange={(e) => onUpdate?.({ procurement_lead_time: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

            {/* Résumé des matériaux sélectionnés */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Résumé des matériaux</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{selectedMaterials.length}</strong> matériau(x) sélectionné(s)
                </p>
                {selectedMaterials.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Quantité totale d'articles: {selectedMaterials.reduce((sum, m) => sum + m.quantity, 0)}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4">
            <ProjectDocumentUpload
              projectId={formData?.id || null}
              phaseId={currentPhaseId || null}
              stepId={currentStepId || null}
              context="step"
              contextLabel="Documents de ressources et matériaux"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ResourcesMaterialsStep;