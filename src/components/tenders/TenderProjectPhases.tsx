/**
 * TenderProjectPhases - Display project phases/steps linked to a tender
 * MIGRATED TO HEXAGONAL ARCHITECTURE
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Layers,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  Link2,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useProjectPhasesForTender } from '@/hooks/hexagonal';

interface TenderProjectPhasesProps {
  tenderId: string;
  projectId?: string;
  compact?: boolean;
  onPhaseClick?: (phaseId: string) => void;
}

const TenderProjectPhases: React.FC<TenderProjectPhasesProps> = ({
  tenderId,
  projectId,
  compact = false,
  onPhaseClick
}) => {
  const navigate = useNavigate();
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const { data, isLoading } = useProjectPhasesForTender(projectId, tenderId);
  const projectInfo = data?.projectInfo || null;
  const phases = data?.phases || [];

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-xs gap-1"><CheckCircle className="h-3 w-3" />Terminé</Badge>;
      case 'in_progress':
        return <Badge className="bg-primary text-xs gap-1"><Clock className="h-3 w-3" />En cours</Badge>;
      case 'delayed':
        return <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />En retard</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">À venir</Badge>;
    }
  };

  const getOverallProgress = () => {
    if (phases.length === 0) return 0;
    return Math.round(phases.reduce((sum, p) => sum + p.progress, 0) / phases.length);
  };

  const handlePhaseClick = (phaseId: string) => {
    if (onPhaseClick) {
      onPhaseClick(phaseId);
    } else if (projectInfo) {
      navigate(`/projects/${projectInfo.id}/phases/${phaseId}`);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn(compact && "border-0 shadow-none")}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!projectInfo || phases.length === 0) {
    return (
      <Card className={cn(compact && "border-0 shadow-none")}>
        <CardContent className="p-8 text-center">
          <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucun projet lié à cet appel d'offres</p>
          <p className="text-xs text-muted-foreground mt-1">
            Liez un projet pour voir ses phases
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(compact && "border-0 shadow-none")}>
      <CardHeader className={cn("pb-3", compact && "px-0")}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5 text-primary" />
            Phases du Projet
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => navigate(`/projects/${projectInfo.id}`)}
            >
              <ExternalLink className="h-3 w-3" />
              Voir projet
            </Button>
          </div>
        </div>
        {/* Project Summary */}
        <div className="flex items-center gap-4 mt-2">
          <Badge variant="outline" className="gap-1">
            <Link2 className="h-3 w-3" />
            {projectInfo.title}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{phases.length} phases</span>
            <span>•</span>
            <span>{getOverallProgress()}% complet</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-3", compact && "px-0")}>
        {/* Overall Progress */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <Progress value={getOverallProgress()} className="flex-1 h-2" />
          <span className="text-sm font-medium w-12 text-right">{getOverallProgress()}%</span>
        </div>

        {/* Phases List */}
        <div className="space-y-2">
          {phases.map((phase, idx) => (
            <Collapsible
              key={phase.id}
              open={expandedPhases.has(phase.id)}
              onOpenChange={() => togglePhase(phase.id)}
            >
              <div className="border rounded-lg overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                    {expandedPhases.has(phase.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    
                    <Badge variant="outline" className="flex-shrink-0">
                      {idx + 1}
                    </Badge>
                    
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-sm truncate">{phase.name}</p>
                      {phase.description && !compact && (
                        <p className="text-xs text-muted-foreground truncate">{phase.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(phase.status)}
                      <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                        <Progress value={phase.progress} className="w-16 h-1.5" />
                        <span className="w-8">{phase.progress}%</span>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t p-3 bg-muted/10 space-y-3">
                    {/* Phase Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {phase.startDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(parseISO(phase.startDate), 'd MMM yyyy', { locale: fr })}</span>
                        </div>
                      )}
                      {phase.endDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>→ {format(parseISO(phase.endDate), 'd MMM yyyy', { locale: fr })}</span>
                        </div>
                      )}
                      {phase.budget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{(phase.budget / 1000000).toFixed(2)}M MRU</span>
                        </div>
                      )}
                      {phase.teamSize && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{phase.teamSize} membres</span>
                        </div>
                      )}
                    </div>

                    {/* Steps */}
                    {phase.steps.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Étapes</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {phase.steps.map(step => (
                            <div
                              key={step.id}
                              className="flex items-center gap-2 p-2 bg-background rounded border text-sm"
                            >
                              <Badge variant="outline" className="h-5 w-5 p-0 justify-center text-xs">
                                {step.order}
                              </Badge>
                              <span className="flex-1 truncate">{step.name}</span>
                              {step.status === 'completed' && (
                                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePhaseClick(phase.id)}
                        className="gap-1"
                      >
                        Voir les détails
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-3 border-t text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-success" /> Terminé
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary" /> En cours
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" /> En retard
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenderProjectPhases;
