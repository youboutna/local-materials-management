
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Plus } from 'lucide-react';
import { OFFICIAL_WORKFLOW_STEPS, getStepIcon, getStepColor, OfficialWorkflowStep } from './OfficialWorkflowSteps';
import { ProcurementPhase, ProcurementStage } from './PublicProcurementWorkflow';

interface WorkflowStepSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStep: (step: OfficialWorkflowStep) => void;
  existingStepNumbers: number[];
}

const WorkflowStepSelector = ({ isOpen, onClose, onSelectStep, existingStepNumbers }: WorkflowStepSelectorProps) => {
  const [selectedStep, setSelectedStep] = useState<OfficialWorkflowStep | null>(null);
    const [selectedPhase, setSelectedPhase] = useState<ProcurementPhase | null>(null);

  const handleSelectStep = (step: OfficialWorkflowStep) => {
    setSelectedStep(step);
  };

  const handleConfirmSelection = () => {
    if (selectedStep) {
      onSelectStep(selectedStep);
      setSelectedStep(null);
      onClose();
    }
  };

  const isStepAlreadyAdded = (stepId: number) => {
    return existingStepNumbers.includes(stepId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sélectionner une Étape du Workflow Officiel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choisissez une étape du processus officiel des marchés publics mauritaniens :
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            {OFFICIAL_WORKFLOW_STEPS.map((step) => {
              const IconComponent = getStepIcon(step.category);
              const isAlreadyAdded = isStepAlreadyAdded(step.id);
              const isSelected = selectedStep?.id === step.id;
              
              return (
                <Card 
                  key={step.id} 
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-terracotta-500' : ''
                  } ${isAlreadyAdded ? 'opacity-50' : 'hover:shadow-md'}`}
                  onClick={() => !isAlreadyAdded && handleSelectStep(step)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepColor(step.category)}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Étape {step.id}: {step.title}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAlreadyAdded && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Ajoutée
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {step.estimatedDuration} jours
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Documents requis:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {step.requiredDocuments.slice(0, 3).map((doc, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                            {doc}
                          </li>
                        ))}
                        {step.requiredDocuments.length > 3 && (
                          <li className="text-xs text-gray-500 italic">
                            ... et {step.requiredDocuments.length - 3} autres documents
                          </li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmSelection}
              disabled={!selectedStep}
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
