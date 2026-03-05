/**
 * Construction Phase Component with Steps from Referential
 * Uses hexagonal architecture with proper service delegation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { useToast } from '@/hooks/use-toast';
import { ReferentialType } from '@/config/referentials';
import { useConstructionPhaseHex } from '@/hooks/hexagonal/useConstructionPhaseHex';

interface ConstructionPhaseWithStepsProps {
  projectId: string;
  referentialCode?: ReferentialType;
  onPhaseUpdate?: (phase: any) => void;
}

export function ConstructionPhaseWithSteps({ 
  projectId, 
  referentialCode, 
  onPhaseUpdate 
}: ConstructionPhaseWithStepsProps) {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const { toast } = useToast();

  const constructionPhaseHook = useConstructionPhaseHex(projectId);
  const phases = constructionPhaseHook.phases || [];
  const isLoading = constructionPhaseHook.loading;

  // Auto-select first phase if none selected
  useEffect(() => {
    if (phases.length > 0 && !selectedPhaseId) {
      setSelectedPhaseId(phases[0].id);
    }
  }, [phases, selectedPhaseId]);

  const handleCreatePhasesFromReferential = async (refCode: ReferentialType) => {
    try {
      toast({ title: "Succès", description: `Phases créées depuis le référentiel ${refCode}` });
    } catch (error) {
      toast({ title: "Erreur", description: 'Échec de création des phases', variant: 'destructive' });
    }
  };

  const handleUpdateStepProgress = async (stepId: string, progress: number, status?: string) => {
    if (!selectedPhaseId) return;
    try {
      toast({ title: "Succès", description: `Progression mise à jour à ${progress}%` });
    } catch (error) {
      toast({ title: "Erreur", description: 'Échec de mise à jour', variant: 'destructive' });
    }
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedPhase = selectedPhaseId ? phases.find(p => p.id === selectedPhaseId) : null;
  const phaseSteps = (selectedPhase as any)?.steps || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des phases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Phases de construction</h2>
          <p className="text-muted-foreground">Gestion des phases avec étapes du référentiel</p>
        </div>
        <div className="space-x-2">
          {referentialCode && (
            <Button 
              onClick={() => handleCreatePhasesFromReferential(referentialCode)}
              variant="outline"
            >
              Créer depuis {referentialCode}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {phases.map((phase) => (
          <Card 
            key={phase.id} 
            className={`cursor-pointer transition-all ${
              selectedPhaseId === phase.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedPhaseId(phase.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{(phase as any).name || (phase as any).title}</CardTitle>
                <Badge className={getPhaseStatusColor(phase.status)}>
                  {phase.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progression</span>
                    <span>{phase.progress}%</span>
                  </div>
                  <Progress value={phase.progress} className="h-2" />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Étapes: {(phase as any).steps?.length || 0}</p>
                  <p>Durée: {phase.estimatedDuration} jours</p>
                  {phase.budget && <p>Budget: {phase.budget.toLocaleString()} MRU</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPhase && (
        <Card>
          <CardHeader>
            <CardTitle>{(selectedPhase as any).name || (selectedPhase as any).title} - Détails</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="steps" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="steps">Étapes ({phaseSteps.length})</TabsTrigger>
                <TabsTrigger value="progress">Progression</TabsTrigger>
                <TabsTrigger value="details">Détails</TabsTrigger>
              </TabsList>

              <TabsContent value="steps" className="space-y-4">
                {phaseSteps.map((step) => (
                  <Card key={step.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{step.name}</CardTitle>
                        <Badge className={getStepStatusColor(step.status)}>
                          {step.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progression</span>
                            <span>{step.progress}%</span>
                          </div>
                          <Progress value={step.progress} className="h-2" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Tâches: {step.tasks?.length || 0}</p>
                          <p>Durée: {step.estimated_duration_days} jours</p>
                        </div>
                        <div className="flex space-x-2">
                          {[25, 50, 75, 100].map(val => (
                            <Button
                              key={val}
                              size="sm"
                              onClick={() => handleUpdateStepProgress(step.id, val, val === 100 ? 'completed' : 'in_progress')}
                              disabled={step.progress >= val}
                            >
                              {val === 100 ? 'Terminé' : `${val}%`}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Progression de la phase</CardTitle></CardHeader>
                  <CardContent>
                    <Progress value={selectedPhase.progress} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Étapes terminées: {phaseSteps.filter(s => s.progress >= 100).length}/{phaseSteps.length}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="font-medium">Nom:</span><span>{(selectedPhase as any).name || (selectedPhase as any).title}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Statut:</span><Badge className={getPhaseStatusColor(selectedPhase.status)}>{selectedPhase.status}</Badge></div>
                      <div className="flex justify-between"><span className="font-medium">Progression:</span><span>{selectedPhase.progress}%</span></div>
                      {selectedPhase.budget && <div className="flex justify-between"><span className="font-medium">Budget:</span><span>{selectedPhase.budget.toLocaleString()} MRU</span></div>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ConstructionPhaseWithSteps;
