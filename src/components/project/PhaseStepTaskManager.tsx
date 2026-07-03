import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Layers,
  ChevronRight,
  ChevronDown,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Shield
} from 'lucide-react';
import { ProjectWorkflowService } from '@/application/services/ProjectWorkflowService';

// Local type for phase hierarchy view data (snake_case from DB query)
interface PhaseStepTask {
  phase_id: string;
  phase_name: string;
  phase_code: string;
  status: string;
  progress?: number;
  start_date?: string;
  end_date?: string;
  step_id?: string;
  step_name?: string;
  step_code?: string;
  task_id?: string;
  task_name?: string;
  task_description?: string;
  assigned_to?: string[];
}
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { supabase } from '@/integrations/supabase/client';

interface PhaseStepTaskManagerProps {
  projectId: string;
}

const PhaseStepTaskManager: React.FC<PhaseStepTaskManagerProps> = ({ projectId }) => {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [selectedContext, setSelectedContext] = useState<{
    type: 'phase' | 'step' | 'task';
    phaseId: string;
    stepId?: string;
    taskId?: string;
  } | null>(null);

  // Fetch phase hierarchy from database
  const { data: hierarchy = [], isLoading, refetch } = useQuery({
    queryKey: ['project-phase-hierarchy', projectId],
    queryFn: async () => {
      // Use supabase directly for hierarchy query since WorkflowService constructor requires many repos
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');
      
      if (error) throw error;
      
      // Transform to PhaseStepTask format
      return (data || []).map((row: any) => ({
        phase_id: row.id,
        phase_name: row.phase_name || row.name || 'Phase',
        phase_code: row.construction_phase || '',
        status: row.status || 'planned',
        progress: row.progress || 0,
        start_date: row.start_date,
        end_date: row.end_date,
      })) as PhaseStepTask[];
    },
    enabled: !!projectId && projectId !== 'new-project',
  });

  // Group hierarchy by phase and step
  const groupedData = React.useMemo(() => {
    const phases = new Map<string, {
      phase: PhaseStepTask;
      steps: Map<string, { step: PhaseStepTask; tasks: PhaseStepTask[] }>;
    }>();

    hierarchy.forEach(item => {
      if (!phases.has(item.phase_id)) {
        phases.set(item.phase_id, {
          phase: item,
          steps: new Map(),
        });
      }

      const phaseData = phases.get(item.phase_id)!;

      if (item.step_id) {
        const stepKey = item.step_id;
        if (!phaseData.steps.has(stepKey)) {
          phaseData.steps.set(stepKey, {
            step: item,
            tasks: [],
          });
        }

        if (item.task_id) {
          phaseData.steps.get(stepKey)!.tasks.push(item);
        }
      }
    });

    return Array.from(phases.values());
  }, [hierarchy]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      completed: { variant: 'default', icon: CheckCircle },
      in_progress: { variant: 'secondary', icon: Clock },
      planned: { variant: 'outline', icon: Calendar },
      delayed: { variant: 'destructive', icon: AlertCircle },
    };

    const config = variants[status] || variants.planned;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="text-xs">
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groupedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phases du Projet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune phase créée pour ce projet.</p>
            <p className="text-sm mt-2">Utilisez le gestionnaire de phases pour créer des phases.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groupedData.map(({ phase, steps }) => {
        const isPhaseExpanded = expandedPhases.has(phase.phase_id);
        
        return (
          <Card key={phase.phase_id} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => togglePhase(phase.phase_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {isPhaseExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <Layers className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{phase.phase_name}</CardTitle>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Code: {phase.phase_code}
                      </span>
                      {phase.start_date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(phase.start_date).toLocaleDateString()} 
                          {phase.end_date && ` - ${new Date(phase.end_date).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(phase.status)}
                  {phase.progress !== undefined && (
                    <div className="flex items-center gap-2">
                      <Progress value={phase.progress} className="w-24 h-2" />
                      <span className="text-xs font-medium">{phase.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            {isPhaseExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-3 ml-8">
                  {Array.from(steps.values()).map(({ step, tasks }) => {
                    const stepKey = step.step_id!;
                    const isStepExpanded = expandedSteps.has(stepKey);

                    return (
                      <div key={stepKey} className="border-l-2 border-primary/20 pl-4">
                        <div
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => toggleStep(stepKey)}
                        >
                          {isStepExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{step.step_name}</div>
                            <div className="text-xs text-muted-foreground">
                              Code: {step.step_code}
                            </div>
                          </div>
                          {getStatusBadge(step.status)}
                          <Badge variant="secondary" className="text-xs">
                            {tasks.length} tâche{tasks.length > 1 ? 's' : ''}
                          </Badge>
                        </div>

                        {isStepExpanded && tasks.length > 0 && (
                          <div className="space-y-2 mt-2 ml-6">
                            {tasks.map(task => (
                              <Card key={task.task_id} className="bg-accent/20">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{task.task_name}</span>
                                      </div>
                                      {task.task_description && (
                                        <p className="text-sm text-muted-foreground mb-3">
                                          {task.task_description}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        {task.assigned_to && task.assigned_to.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {task.assigned_to.length} assigné{task.assigned_to.length > 1 ? 's' : ''}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                          <FileText className="h-3 w-3" />
                                          Documents
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Package className="h-3 w-3" />
                                          Ressources
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Shield className="h-3 w-3" />
                                          Inspections
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      {getStatusBadge(task.status)}
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setSelectedContext({
                                          type: 'task',
                                          phaseId: task.phase_id,
                                          stepId: task.step_id,
                                          taskId: task.task_id,
                                        })}
                                      >
                                        Détails
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default PhaseStepTaskManager;
