import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Plus } from 'lucide-react';
import { 
  PROCUREMENT_STAGES, 
  PROCUREMENT_PHASE_LABELS, 
  ProcurementPhase, 
  ProcurementStage,
  SUGGESTED_DOCUMENTS,
  getSuggestedDocuments,
  PROCUREMENT_PHASES
} from './PublicProcurementWorkflow';

interface ProcurementStepSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStep: (phase: ProcurementPhase, stage: { value: ProcurementStage; label: string }, selectedDocuments?: string[]) => void;
  existingSteps: { phase: ProcurementPhase; stage: { value: ProcurementStage; label: string } }[];
}

const ProcurementStepSelector = ({ isOpen, onClose, onSelectStep, existingSteps }: ProcurementStepSelectorProps) => {
  const [selectedPhase, setSelectedPhase] = useState<ProcurementPhase | null>(null);
  const [selectedStage, setSelectedStage] = useState<{ value: ProcurementStage; label: string } | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<'single' | 'phase' | 'suggested'>('single');

  useEffect(() => {
    if (!isOpen) {
      setSelectedPhase(null);
      setSelectedStage(null);
      setSelectedDocuments([]);
      setSelectionMode('single');
    }
  }, [isOpen]);

  const handleSelectStage = (phase: ProcurementPhase, stage: { value: ProcurementStage; label: string }) => {
    setSelectedPhase(phase);
    setSelectedStage(stage);
    setSelectedDocuments([]); // Reset document selection when changing stage
  };

  const handleToggleDocument = (docTitle: string) => {
    setSelectedDocuments(prev => prev.includes(docTitle) ? prev.filter(d => d !== docTitle) : [...prev, docTitle]);
  };

  const handleConfirmSelection = () => {
    if (!selectedPhase) return;

    if (selectionMode === 'phase') {
      // Add all stages of the selected phase
      const phaseStages = PROCUREMENT_STAGES[selectedPhase];
      phaseStages.forEach((stage) => {
        const alreadyExists = existingSteps.some(s => s.phase === selectedPhase && s.stage.value === stage.value);
        if (!alreadyExists) {
          onSelectStep(selectedPhase, stage, []);
        }
      });
    } else {
      // Single stage selection
      if (selectedStage) {
        const alreadyExists = existingSteps.some(s => s.phase === selectedPhase && s.stage.value === selectedStage.value);
        if (!alreadyExists) {
          onSelectStep(selectedPhase, selectedStage, selectedDocuments);
        }
      }
    }

    // Reset and close
    setSelectedPhase(null);
    setSelectedStage(null);
    setSelectedDocuments([]);
    setSelectionMode('single');
    onClose();
  };

  const isStepAlreadyAdded = (phase: ProcurementPhase, stageValue: ProcurementStage) => {
    return existingSteps.some(step => 
      step.phase === phase && step.stage.value === stageValue
    );
  };

  // Get suggested documents for the selected stage
  const getStageSuggestedDocuments = () => {
    if (!selectedPhase || !selectedStage) return [];
    
    return getSuggestedDocuments(selectedPhase, selectedStage.value);
  };

  const suggestedDocs = getStageSuggestedDocuments();
  // Get phase keys from PROCUREMENT_PHASES object
  const procurementPhaseKeys = Object.keys(PROCUREMENT_PHASES) as ProcurementPhase[];
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sélectionner une Étape de Marché Public</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Choisissez une étape du processus de marché public :
          </p>

          {/* Selection Mode Toggle */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Mode de sélection</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`px-3 py-1 rounded text-sm ${selectionMode === 'single' ? 'bg-adrar-800 text-white' : 'bg-gray-100'}`}
                onClick={() => setSelectionMode('single')}
              >
                Étape unique
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded text-sm ${selectionMode === 'phase' ? 'bg-adrar-800 text-white' : 'bg-gray-100'}`}
                onClick={() => setSelectionMode('phase')}
              >
                Phase entière
              </button>
            </div>
          </div>
          
          {/* Phases and Stages */}
          <div className="space-y-6">
            {procurementPhaseKeys.map((phase) => {
              const phaseStages = PROCUREMENT_STAGES[phase];
              return (
                <div key={phase} className="space-y-3">
                  <h3 className="text-lg font-semibold text-adrar-800 border-b pb-2">
                    {PROCUREMENT_PHASE_LABELS[phase]}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {phaseStages.map((stage) => {
                      const isAlreadyAdded = isStepAlreadyAdded(phase, stage.value);
                      const isSelected = selectedPhase === phase && selectedStage?.value === stage.value;
                      
                      return (
                        <Card 
                          key={stage.value} 
                          className={`cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-terracotta-500' : ''
                          } ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                          onClick={() => !isAlreadyAdded && handleSelectStage(phase, stage)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                {stage.label}
                              </CardTitle>
                              {isAlreadyAdded && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Ajoutée
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            <p className="text-sm text-gray-600">
                              Phase: {PROCUREMENT_PHASE_LABELS[phase]}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              ID: {stage.value}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suggested Documents Section */}
          {selectedStage && (
            <div className="border p-4 rounded-lg bg-gray-50">
              <h4 className="font-medium text-sm mb-3">
                Documents suggérés pour: {selectedStage.label}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Cochez les documents à inclure avec cette étape (optionnel)
              </p>

              <div className="space-y-2">
                {suggestedDocs.length > 0 ? (
                  suggestedDocs.map((doc, index) => (
                    <label key={index} className="flex items-start gap-2 p-2 bg-white rounded border hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.title)}
                        onChange={() => handleToggleDocument(doc.title)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{doc.title}</p>
                        <p className="text-xs text-gray-500">
                          {doc.isRequired ? 'Requis' : 'Optionnel'} • {doc.category}
                        </p>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Aucune suggestion de document pour cette étape.</p>
                    <p className="text-xs mt-1">
                      Vous pourrez ajouter des documents manuellement après avoir créé l'étape.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmSelection}
              disabled={
                !selectedPhase || 
                (selectionMode !== 'phase' && !selectedStage) ||
                (selectionMode === 'phase' && PROCUREMENT_STAGES[selectedPhase].every(stage => 
                  isStepAlreadyAdded(selectedPhase, stage.value)
                ))
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              {selectionMode === 'phase' ? 'Ajouter la phase entière' : 'Ajouter cette Étape'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProcurementStepSelector;