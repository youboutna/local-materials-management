
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Plus } from 'lucide-react';
import { standardWorkflow, WorkflowPhase, WorkflowStage } from '@/dtos/types/workflow';
import { FileText, Settings, CheckCircle2 } from 'lucide-react';

interface WorkflowStepSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStep: (phase: WorkflowPhase, stage: WorkflowStage) => void;
  existingSteps: Array<{ phaseCode: string; stageCode: string }>;
}

const WorkflowStepSelector = ({ isOpen, onClose, onSelectStep, existingSteps }: WorkflowStepSelectorProps) => {
  const [selectedPhase, setSelectedPhase] = useState<WorkflowPhase | null>(null);
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);

  const handleSelectPhase = (phase: WorkflowPhase) => {
    setSelectedPhase(phase);
    setSelectedStage(null);
  };

  const handleSelectStage = (stage: WorkflowStage) => {
    setSelectedStage(stage);
  };

  const handleConfirmSelection = () => {
    if (selectedPhase && selectedStage) {
      onSelectStep(selectedPhase, selectedStage);
      setSelectedPhase(null);
      setSelectedStage(null);
      onClose();
    }
  };

  const isStageAlreadyAdded = (phaseCode: string, stageCode: string) => {
    return (existingSteps || []).some(step => step.phaseCode === phaseCode && step.stageCode === stageCode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sélectionner une Étape du Workflow Officiel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choisissez une phase puis une étape du workflow standard mauritanien :
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Phases Selection */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Phases disponibles:</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {standardWorkflow.map((phase) => {
                  const isSelected = selectedPhase?.id === phase.id;
                  
                  return (
                    <Card 
                      key={phase.id} 
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
                      }`}
                      onClick={() => handleSelectPhase(phase)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <CardTitle className="text-sm">{phase.label}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-600">
                          {phase.stages.length} étapes disponibles
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Stages Selection */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">
                Étapes {selectedPhase ? `de ${selectedPhase.label}` : '(sélectionnez une phase)'}:
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedPhase ? selectedPhase.stages.map((stage) => {
                  const isAlreadyAdded = isStageAlreadyAdded(selectedPhase.code, stage.code);
                  const isSelected = selectedStage?.id === stage.id;
                  
                  return (
                    <Card 
                      key={stage.id} 
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-secondary' : ''
                      } ${isAlreadyAdded ? 'opacity-50' : 'hover:shadow-md'}`}
                      onClick={() => !isAlreadyAdded && handleSelectStage(stage)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            <CardTitle className="text-sm">{stage.label}</CardTitle>
                          </div>
                          {isAlreadyAdded && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Ajoutée
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-600">
                          {stage.tasks.length} tâches définies
                        </p>
                      </CardContent>
                    </Card>
                  );
                }) : (
                  <div className="text-center text-gray-500 py-8">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sélectionnez d'abord une phase</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmSelection}
              disabled={!selectedPhase || !selectedStage}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter cette Étape
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowStepSelector;
