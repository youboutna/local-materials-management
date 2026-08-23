import React, { useState } from 'react';
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
import { useProjectStructureHex } from '@/hooks/hexagonal/useProjectStructureHex';


import { TranslatedStatus } from '@/components/i18n/TranslatedBadges';
import { useI18n } from '@/hooks/useI18n';
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
  const { t } = useI18n();
  const [selectedPhases, setSelectedPhases] = useState<Set<string>>(new Set());

  // Lecture via la chaîne hexagonale (repositories) — aucun accès Supabase direct.
  const { data: project = null, isLoading: loading } = useProjectStructureHex(projectId);

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
        return 'bg-success';
      case 'in_progress':
      case 'en cours':
        return 'bg-primary';
      case 'delayed':
      case 'en retard':
        return 'bg-destructive';
      default:
        return 'bg-muted-foreground';
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'terminé':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in_progress':
      case 'en cours':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'delayed':
      case 'en retard':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
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
              <TranslatedStatus code={project.status} />
            </Badge>
          </div>

          {/* Project Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {project.budget && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="font-medium">
                  {(project.budget / 1000000).toFixed(1)}M MRU
                </span>
              </div>
            )}
            {project.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="truncate">{project.location}</span>
              </div>
            )}
            {project.start_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-warning" />
                <span>{format(new Date(project.start_date), 'd MMM yyyy', { locale: fr })}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-accent" />
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
            <p>{t('phase.noneForProject')}</p>
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
