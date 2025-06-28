
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { ConstructionPhase, ConstructionStage } from '@/types/project';

interface ConstructionPhaseSelectorProps {
  currentPhase?: ConstructionPhase;
  currentStage?: ConstructionStage;
  onPhaseChange: (phase: ConstructionPhase) => void;
  onStageChange: (stage: ConstructionStage) => void;
}

const CONSTRUCTION_PHASES: { value: ConstructionPhase; label: string; description: string }[] = [
  { value: 'pre_construction', label: 'Pré-construction', description: 'Planification et conception' },
  { value: 'site_preparation', label: 'Préparation du site', description: 'Nettoyage et terrassement' },
  { value: 'foundation', label: 'Fondation', description: 'Travaux de fondation' },
  { value: 'framing', label: 'Charpente', description: 'Structure principale' },
  { value: 'structural_work', label: 'Gros œuvre', description: 'Travaux structurels' },
  { value: 'finishing', label: 'Finitions', description: 'Travaux de finition' },
  { value: 'post_construction', label: 'Post-construction', description: 'Inspections finales' },
  { value: 'handover', label: 'Livraison', description: 'Remise des clés' }
];

const CONSTRUCTION_STAGES: { [key in ConstructionPhase]: { value: ConstructionStage; label: string }[] } = {
  pre_construction: [
    { value: 'planning_design', label: 'Planification et conception' },
    { value: 'permits_approvals', label: 'Permis et approbations' }
  ],
  site_preparation: [
    { value: 'site_clearing', label: 'Déblayage du site' },
    { value: 'excavation', label: 'Excavation' }
  ],
  foundation: [
    { value: 'foundation_work', label: 'Travaux de fondation' }
  ],
  framing: [
    { value: 'structural_framing', label: 'Charpente structurelle' }
  ],
  structural_work: [
    { value: 'roofing', label: 'Toiture' },
    { value: 'electrical_plumbing', label: 'Électricité et plomberie' }
  ],
  finishing: [
    { value: 'interior_finishing', label: 'Finitions intérieures' },
    { value: 'exterior_finishing', label: 'Finitions extérieures' }
  ],
  post_construction: [
    { value: 'final_inspection', label: 'Inspection finale' }
  ],
  handover: [
    { value: 'handover_complete', label: 'Livraison complète' }
  ]
};

const ConstructionPhaseSelector: React.FC<ConstructionPhaseSelectorProps> = ({
  currentPhase,
  currentStage,
  onPhaseChange,
  onStageChange
}) => {
  const handlePhaseChange = (phase: ConstructionPhase) => {
    onPhaseChange(phase);
    // Auto-select first stage of the new phase
    const firstStage = CONSTRUCTION_STAGES[phase]?.[0]?.value;
    if (firstStage) {
      onStageChange(firstStage);
    }
  };

  const availableStages = currentPhase ? CONSTRUCTION_STAGES[currentPhase] : [];

  return (
    <Card className="border-l-4 border-l-blue-600">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Calendar className="h-5 w-5" />
          Phases de construction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Phase Selection */}
        <div className="space-y-2">
          <Label htmlFor="construction-phase" className="text-sm font-medium text-gray-700">
            Phase actuelle
          </Label>
          <Select value={currentPhase || ''} onValueChange={handlePhaseChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une phase" />
            </SelectTrigger>
            <SelectContent>
              {CONSTRUCTION_PHASES.map((phase) => (
                <SelectItem key={phase.value} value={phase.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{phase.label}</span>
                    <span className="text-sm text-gray-500">{phase.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stage Selection */}
        {currentPhase && (
          <div className="space-y-2">
            <Label htmlFor="construction-stage" className="text-sm font-medium text-gray-700">
              Étape actuelle
            </Label>
            <Select value={currentStage || ''} onValueChange={onStageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une étape" />
              </SelectTrigger>
              <SelectContent>
                {availableStages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Construction Timeline Preview */}
        {currentPhase && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Séquence de construction</h4>
            <div className="space-y-2">
              {CONSTRUCTION_PHASES.map((phase, index) => {
                const isCompleted = CONSTRUCTION_PHASES.findIndex(p => p.value === currentPhase) > index;
                const isCurrent = phase.value === currentPhase;
                const isPending = CONSTRUCTION_PHASES.findIndex(p => p.value === currentPhase) < index;

                return (
                  <div key={phase.value} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {isCurrent && (
                        <Clock className="h-5 w-5 text-blue-500" />
                      )}
                      {isPending && (
                        <AlertTriangle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          isCompleted ? 'text-green-700' : 
                          isCurrent ? 'text-blue-700' : 
                          'text-gray-500'
                        }`}>
                          {phase.label}
                        </span>
                        {isCurrent && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            En cours
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Terminé
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{phase.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConstructionPhaseSelector;
