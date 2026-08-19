
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { ConstructionPhase, ConstructionStage } from '@/dtos/entities/ProjectDTO';
import ConstructionPhaseManager from './ConstructionPhaseManager';

interface ConstructionPhaseSelectorProps {
  currentPhase?: ConstructionPhase;
  currentStage?: ConstructionStage;
  onPhaseChange: (phase: ConstructionPhase) => void;
  onStageChange: (stage: ConstructionStage) => void;
  // New props for sub-project management
  enableSubProjectMode?: boolean;
  projectBudget?: number;
}

const CONSTRUCTION_PHASES: { value: ConstructionPhase; label: string; description: string }[] = [
  { value: 'pre_construction', label: 'Pré-construction', description: 'Planification et conception' },
  { value: 'site_preparation', label: 'Préparation du site', description: 'Nettoyage et terrassement' },
  { value: 'foundation', label: 'Fondation', description: 'Travaux de fondation' },
  { value: 'structure', label: 'Structure', description: 'Structure principale' },
  { value: 'exterior', label: 'Extérieur', description: 'Travaux extérieurs' },
  { value: 'finishing', label: 'Finitions', description: 'Travaux de finition' },
  { value: 'post_construction', label: 'Post-construction', description: 'Inspections finales' },
  { value: 'handover', label: 'Livraison', description: 'Remise des clés' }
];

const ConstructionPhaseSelector: React.FC<ConstructionPhaseSelectorProps> = ({
  currentPhase,
  currentStage,
  onPhaseChange,
  onStageChange,
  enableSubProjectMode = true,
  projectBudget = 0
}) => {
  const [phases, setPhases] = React.useState<any[]>([]);

  // If sub-project mode is enabled, show the enhanced phase manager
  if (enableSubProjectMode) {
    return (
      <ConstructionPhaseManager
        phases={phases}
        onStepComplete={() => {}}
        workflowData={null}
        projectBudget={projectBudget}
        projectId={undefined}
      />
    );
  }

  // original simple phase selector for backward compatibility
  return (
    <Card className="border-l-4 border-l-blue-600">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Calendar className="h-5 w-5" />
          Phases de construction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Construction Timeline Preview */}
        {currentPhase && (
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-foreground mb-3">Séquence de construction</h4>
            <div className="space-y-2">
              {CONSTRUCTION_PHASES.map((phase, index) => {
                const isCompleted = CONSTRUCTION_PHASES.findIndex(p => p.value === currentPhase) > index;
                const isCurrent = phase.value === currentPhase;
                const isPending = CONSTRUCTION_PHASES.findIndex(p => p.value === currentPhase) < index;

                return (
                  <div key={phase.value} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {isCompleted && (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                      {isCurrent && (
                        <Clock className="h-5 w-5 text-primary" />
                      )}
                      {isPending && (
                        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          isCompleted ? 'text-success' : 
                          isCurrent ? 'text-primary' : 
                          'text-muted-foreground'
                        }`}>
                          {phase.label}
                        </span>
                        {isCurrent && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            En cours
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge variant="outline" className="text-xs bg-success-soft text-success border-success/30">
                            Terminé
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{phase.description}</p>
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
