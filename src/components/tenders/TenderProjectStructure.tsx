import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  FolderTree,
  Layers,
  CheckCircle,
  Clock,
  Target,
  Package,
  ChevronRight,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { btpClient } from '@/integrations/supabase/schema-clients';

interface Phase {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  start_date?: string;
  end_date?: string;
  budget?: number;
  steps?: Step[];
}

interface Step {
  id: string;
  name: string;
  status: string;
  progress: number;
  order_index: number;
}

interface ProjectDetails {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  budget?: number;
  location?: string;
  start_date?: string;
  end_date?: string;
  phases: Phase[];
}

interface TenderProjectStructureProps {
  projectId: string;
  onPhaseSelect?: (phaseId: string) => void;
  onStepSelect?: (stepId: string, phaseId: string) => void;
  compact?: boolean;
}

const TenderProjectStructure: React.FC<TenderProjectStructureProps> = ({
  projectId,
  onPhaseSelect,
  onStepSelect,
  compact = false
}) => {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhases, setSelectedPhases] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (projectId) {
      loadProjectStructure();
    }
  }, [projectId]);

  const loadProjectStructure = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const { data: projectData, error: projectError } = await btpClient.from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch phases with steps
      const { data: phasesData, error: phasesError } = await btpClient.from('project_phases')
        .select(`
          *,
          phase_steps (*)
        `)
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true });

      if (phasesError) throw phasesError;

      // Map phases with steps
      const phases: Phase[] = (phasesData || []).map((phase: any) => ({
        id: phase.id,
        name: phase.phase_name || phase.name,
        description: phase.description,
        status: phase.status || 'pending',
        progress: phase.progress || 0,
        start_date: phase.start_date,
        end_date: phase.end_date,
        budget: phase.budget_allocated,
        steps: (phase.phase_steps || [])
          .sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
          .map((step: any) => ({
            id: step.id,
            name: step.step_name || step.name,
            status: step.status || 'pending',
            progress: step.progress || 0,
            order_index: step.step_order || 0
          }))
      }));

      setProject({
        id: projectData.id || '',
        title: projectData.title || '',
        description: projectData.description || undefined,
        status: projectData.status || 'en attente',
        progress: projectData.progress || 0,
        budget: projectData.budget || undefined,
        location: projectData.location || undefined,
        start_date: projectData.start_date || undefined,
        end_date: projectData.end_date || undefined,
        phases
      });

    } catch (error) {
      console.error('Error loading project structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePhaseSelection = (phaseId: string) => {
    setSelectedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
    onPhaseSelect?.(phaseId);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'terminé':
        return 'bg-green-500';
      case 'in_progress':
      case 'en cours':
        return 'bg-blue-500';
      case 'delayed':
      case 'en retard':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'terminé':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
      case 'en cours':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'delayed':
      case 'en retard':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Sélectionnez un projet pour voir sa structure
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(compact && "border-0 shadow-none")}>
      <CardHeader className={cn("pb-3", compact && "px-0")}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderTree className="h-5 w-5 text-primary" />
          Structure du Projet
        </CardTitle>
      </CardHeader>

      <CardContent className={cn("space-y-4", compact && "px-0")}>
        {/* Project Summary */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">{project.title}</h3>
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {project.description}
                </p>
              )}
            </div>
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>

          {/* Project Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {project.budget && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">
                  {(project.budget / 1000000).toFixed(1)}M MRU
                </span>
              </div>
            )}
            {project.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="truncate">{project.location}</span>
              </div>
            )}
            {project.start_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span>{format(new Date(project.start_date), 'd MMM yyyy', { locale: fr })}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-purple-600" />
              <span>{project.phases.length} phase(s)</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progression globale</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        </div>

        {/* Phases Accordion */}
        {project.phases.length > 0 ? (
          <Accordion type="multiple" className="space-y-2">
            {project.phases.map((phase, index) => (
              <AccordionItem
                key={phase.id}
                value={phase.id}
                className={cn(
                  "border rounded-lg overflow-hidden",
                  selectedPhases.has(phase.id) && "ring-2 ring-primary"
                )}
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 [&[data-state=open]]:bg-muted/30">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{phase.name}</span>
                        {getStatusIcon(phase.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{phase.steps?.length || 0} étape(s)</span>
                        <span>•</span>
                        <span>{phase.progress}%</span>
                      </div>
                    </div>
                    <Button
                      variant={selectedPhases.has(phase.id) ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePhaseSelection(phase.id);
                      }}
                    >
                      {selectedPhases.has(phase.id) ? 'Sélectionné' : 'Sélectionner'}
                    </Button>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="px-4 pb-4 pt-2 space-y-3">
                    {phase.description && (
                      <p className="text-sm text-muted-foreground">
                        {phase.description}
                      </p>
                    )}

                    {/* Phase Metrics */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      {phase.budget && (
                        <Badge variant="outline" className="gap-1">
                          <DollarSign className="h-3 w-3" />
                          {(phase.budget / 1000000).toFixed(2)}M
                        </Badge>
                      )}
                      {phase.start_date && (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(phase.start_date), 'd MMM', { locale: fr })}
                          {phase.end_date && ` - ${format(new Date(phase.end_date), 'd MMM', { locale: fr })}`}
                        </Badge>
                      )}
                    </div>

                    {/* Steps */}
                    {phase.steps && phase.steps.length > 0 ? (
                      <div className="space-y-2 mt-3">
                        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Étapes
                        </h5>
                        <div className="space-y-1">
                          {phase.steps.map((step) => (
                            <div
                              key={step.id}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => onStepSelect?.(step.id, phase.id)}
                            >
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span className="flex-1 text-sm">{step.name}</span>
                              {getStatusIcon(step.status)}
                              <span className="text-xs text-muted-foreground">
                                {step.progress}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Aucune étape définie pour cette phase
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Aucune phase définie pour ce projet</p>
          </div>
        )}

        {/* Selection Summary */}
        {selectedPhases.size > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedPhases.size} phase(s) sélectionnée(s)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPhases(new Set())}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TenderProjectStructure;
