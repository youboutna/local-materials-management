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
import { usePhaseManagement } from '@/hooks/usePhaseManagement';
import { Phase } from '@/domain/entities/Phase';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { toast } from '@/hooks/use-toast';

interface ConstructionPhaseWithStepsProps {
  projectId: string;
  referentialCode?: ReferentialType;
  onPhaseUpdate?: (phase: Phase) => void;
}

export function ConstructionPhaseWithSteps({ 
  projectId, 
  referentialCode, 
  onPhaseUpdate 
}: ConstructionPhaseWithStepsProps) {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const {
    phases,
    isLoading,
    error,
    createPhasesFromReferential,
    updateStepProgress,
    createPhase,
    updatePhase,
    deletePhase,
    getPhaseById,
    getPhaseSteps,
    getStepTasks,
    calculatePhaseProgress,
    refreshPhases
  } = useConstructionPhaseWithSteps({ projectId, referentialCode });

  // Auto-select first phase if none selected
  useEffect(() => {
    if (phases.length > 0 && !selectedPhaseId) {
      setSelectedPhaseId(phases[0].id);
    }
  }, [phases, selectedPhaseId]);

  const handleCreatePhasesFromReferential = async (refCode: ReferentialType) => {
    try {
      const createdPhases = await createPhasesFromReferential(refCode);
      toast.success(`Created ${createdPhases.length} phases from referential`);
      if (createdPhases.length > 0) {
        setSelectedPhaseId(createdPhases[0].id);
      }
    } catch (error) {
      toast.error('Failed to create phases from referential');
    }
  };

  const handleUpdateStepProgress = async (stepId: string, progress: number, status?: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    if (!selectedPhaseId) return;

    try {
      const stepUpdates = [{ stepId, progress, status }];
      const updatedPhase = await updateStepProgress(selectedPhaseId, stepUpdates);
      toast.success(`Updated step progress to ${progress}%`);
      onPhaseUpdate?.(updatedPhase);
    } catch (error) {
      toast.error('Failed to update step progress');
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

  const selectedPhase = selectedPhaseId ? getPhaseById(selectedPhaseId) : null;
  const phaseSteps = selectedPhaseId ? getPhaseSteps(selectedPhaseId) : [];
  const stepTasks = selectedStepId ? getStepTasks(selectedPhaseId, selectedStepId) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading construction phases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <p className="text-gray-600">Failed to load construction phases</p>
          <Button onClick={refreshPhases} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Construction Phases</h2>
          <p className="text-gray-600">Manage phases with steps from referential</p>
        </div>
        <div className="space-x-2">
          {referentialCode && (
            <Button 
              onClick={() => handleCreatePhasesFromReferential(referentialCode)}
              variant="outline"
            >
              Create from {referentialCode}
            </Button>
          )}
          <Button onClick={refreshPhases} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Phase list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {phases.map((phase) => (
          <Card 
            key={phase.id} 
            className={`cursor-pointer transition-all ${
              selectedPhaseId === phase.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedPhaseId(phase.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{phase.phaseName}</CardTitle>
                <Badge className={getPhaseStatusColor(phase.status)}>
                  {phase.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{phase.progress}%</span>
                  </div>
                  <Progress value={phase.progress} className="h-2" />
                </div>
                <div className="text-sm text-gray-600">
                  <p>Steps: {phase.steps?.length || 0}</p>
                  <p>Duration: {phase.estimatedDuration} days</p>
                  {phase.budget && <p>Budget: ${phase.budget.toLocaleString()}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected phase details */}
      {selectedPhase && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedPhase.name} - Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="steps" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="steps">Steps ({phaseSteps.length})</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="steps" className="space-y-4">
                {phaseSteps.map((step, index) => (
                  <Card key={step.id} className="border-l-4 border-l-blue-500">
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
                            <span>Progress</span>
                            <span>{step.progress}%</span>
                          </div>
                          <Progress value={step.progress} className="h-2" />
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Tasks: {step.tasks?.length || 0}</p>
                          <p>Duration: {step.estimatedDurationDays} days</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStepProgress(step.id, 25, 'in_progress')}
                            disabled={step.progress >= 25}
                          >
                            25%
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStepProgress(step.id, 50, 'in_progress')}
                            disabled={step.progress >= 50}
                          >
                            50%
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStepProgress(step.id, 75, 'in_progress')}
                            disabled={step.progress >= 75}
                          >
                            75%
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStepProgress(step.id, 100, 'completed')}
                            disabled={step.progress >= 100}
                          >
                            Complete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Phase Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Overall Progress</span>
                            <span>{selectedPhase.progress}%</span>
                          </div>
                          <Progress value={selectedPhase.progress} className="h-3" />
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Status: {selectedPhase.status}</p>
                          <p>Steps Completed: {phaseSteps.filter(s => s.progress >= 100).length}/{phaseSteps.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Step Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {phaseSteps.map((step) => (
                          <div key={step.id} className="flex items-center justify-between">
                            <span className="text-sm">{step.name}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24">
                                <Progress value={step.progress} className="h-2" />
                              </div>
                              <span className="text-sm w-12 text-right">{step.progress}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Phase Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Name:</span>
                          <span>{selectedPhase.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Status:</span>
                          <Badge className={getPhaseStatusColor(selectedPhase.status)}>
                            {selectedPhase.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Progress:</span>
                          <span>{selectedPhase.progress}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Duration:</span>
                          <span>{selectedPhase.estimatedDuration} days</span>
                        </div>
                        {selectedPhase.budget && (
                          <div className="flex justify-between">
                            <span className="font-medium">Budget:</span>
                            <span>${selectedPhase.budget.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedPhase.actualCost && (
                          <div className="flex justify-between">
                            <span className="font-medium">Actual Cost:</span>
                            <span>${selectedPhase.actualCost.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Start Date:</span>
                          <span>{selectedPhase.startDate?.toLocaleDateString() || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">End Date:</span>
                          <span>{selectedPhase.endDate?.toLocaleDateString() || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Created:</span>
                          <span>{selectedPhase.createdAt.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Updated:</span>
                          <span>{selectedPhase.updatedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ConstructionPhaseWithSteps;
