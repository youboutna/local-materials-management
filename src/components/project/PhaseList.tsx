// components/project/PhaseList.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PhaseListProps {
  phases: any[];
  projectId: string;
}

const PhaseList: React.FC<PhaseListProps> = ({ phases, projectId }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Phases du projet</h3>
        <Button onClick={() => navigate(`/projects/${projectId}/phases/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle phase
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {phases.map((phase, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{phase.phase}</span>
                <Badge className={getStatusColor(phase.status)}>
                  {phase.status === 'completed' ? 'Terminée' : 
                   phase.status === 'in_progress' ? 'En cours' : 
                   phase.status === 'delayed' ? 'En retard' : 'Non commencée'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={phase.progress || 0} />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{phase.startDate} → {phase.endDate}</span>
                  </div>
                  <span>{phase.progress || 0}% complet</span>
                </div>
                {phase.stages && phase.stages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Étapes:</h4>
                    <div className="space-y-2">
                      {phase.stages.map((stage: any, stageIndex: number) => (
                        <div key={stageIndex} className="flex justify-between items-center text-sm">
                          <span>{stage.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {stage.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {phases.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-muted-foreground text-center mb-4">
              Aucune phase planifiée pour ce projet
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}/phases/new`)}>
              <Plus className="h-4 w-4 mr-2" />
              Planifier une phase
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PhaseList;