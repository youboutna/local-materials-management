import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Diamond, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GanttPhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'planned' | 'in_progress' | 'completed';
}

interface Milestone {
  id: string;
  name: string;
  date: Date;
  status: 'completed' | 'current' | 'upcoming';
  isKey?: boolean;
}

interface GanttDiagramWithMilestonesProps {
  projectTitle: string;
  projectPeriod: {
    start: Date;
    end: Date;
  };
  phases: GanttPhase[];
  milestones: Milestone[];
}

const GanttDiagramWithMilestones: React.FC<GanttDiagramWithMilestonesProps> = ({
  projectTitle,
  projectPeriod,
  phases,
  milestones
}) => {
  const [currentViewStart, setCurrentViewStart] = useState(startOfMonth(projectPeriod.start));
  
  // Calculate timeline duration and spacing
  const totalDays = differenceInDays(projectPeriod.end, projectPeriod.start);
  const viewDays = eachDayOfInterval({
    start: currentViewStart,
    end: addDays(currentViewStart, 180) // Show 6 months
  });

  const getPhasePosition = (phase: GanttPhase) => {
    const startOffset = differenceInDays(phase.startDate, projectPeriod.start);
    const duration = differenceInDays(phase.endDate, phase.startDate);
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`
    };
  };

  const getMilestonePosition = (milestone: Milestone) => {
    const offset = differenceInDays(milestone.date, projectPeriod.start);
    return `${(offset / totalDays) * 100}%`;
  };

  const getPhaseColor = (phase: GanttPhase) => {
    switch (phase.status) {
      case 'completed':
        return 'bg-success text-white';
      case 'in_progress':
        return 'bg-primary text-white';
      case 'planned':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPhaseColorCode = (phase: GanttPhase) => {
    switch (phase.status) {
      case 'completed':
        return '#10b981'; // Success green
      case 'in_progress':
        return '#3b82f6'; // Primary blue
      case 'planned':
        return '#e5e7eb'; // Muted gray
      default:
        return '#e5e7eb';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'in_progress':
        return 'En cours';
      case 'planned':
        return 'Planifié';
      default:
        return 'Planifié';
    }
  };

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'current':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'upcoming':
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Diamond className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Progress calculation
  const overallProgress = Math.round(
    phases.reduce((sum, phase) => sum + phase.progress, 0) / phases.length
  );

  return (
    <div className="space-y-6">
      {/* Header with gradient matching your reference */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6" />
            <div>
              <h2 className="text-2xl font-bold">Diagramme de Gantt</h2>
              <p className="text-primary-foreground/90 mt-1">
                Planning du projet: {projectTitle}
              </p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-lg font-medium">
              Période: Du {format(projectPeriod.start, 'dd/MM/yyyy', { locale: fr })} au {format(projectPeriod.end, 'dd/MM/yyyy', { locale: fr })}
            </p>
          </div>
        </div>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Avancement global du projet</span>
            <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline Scale */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Chronologie du Projet</CardTitle>
            <div className="flex gap-2 text-sm">
              <span>0%</span>
              <span className="mx-8">25%</span>
              <span className="mx-8">50%</span>
              <span className="mx-8">75%</span>
              <span>100%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Gantt Chart */}
          <div className="space-y-4">
            {phases.map((phase) => {
              const position = getPhasePosition(phase);
              const colorCode = getPhaseColorCode(phase);
              
              return (
                <div key={phase.id} className="relative">
                  {/* Phase Label */}
                  <div className="flex items-center mb-2">
                    <div className="w-20 text-sm font-medium text-muted-foreground">
                      {phase.name}
                    </div>
                    <div className="flex-1 relative">
                      {/* Timeline Background */}
                      <div className="h-8 bg-muted/30 rounded-sm relative">
                        {/* Phase Bar */}
                        <div
                          className="absolute top-0 h-full rounded-sm flex items-center justify-between px-2"
                          style={{
                            backgroundColor: colorCode,
                            ...position
                          }}
                        >
                          <span className="text-xs font-medium text-white">
                            {getStatusLabel(phase.status)}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {phase.progress}%
                          </span>
                        </div>

                        {/* Progress Fill */}
                        <div
                          className="absolute top-0 h-full bg-success/80 rounded-sm"
                          style={{
                            left: position.left,
                            width: `${(parseFloat(position.width.replace('%', '')) * phase.progress) / 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Milestones Row */}
            <div className="relative mt-6 pt-4 border-t">
              <div className="flex items-center mb-3">
                <div className="w-20 text-sm font-medium text-muted-foreground">
                  Jalons
                </div>
                <div className="flex-1 relative h-6">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="absolute transform -translate-x-1/2 group cursor-pointer"
                      style={{ left: getMilestonePosition(milestone) }}
                    >
                      <div className="flex flex-col items-center">
                        <div className="p-1 bg-background border-2 border-primary rounded-full shadow-sm">
                          {getMilestoneIcon(milestone.status)}
                        </div>
                        <div className="absolute top-8 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {milestone.name}
                          <br />
                          {format(milestone.date, 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Diamond className="h-5 w-5" />
            Jalons du Projet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {getMilestoneIcon(milestone.status)}
                  <div>
                    <h4 className="font-medium">{milestone.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(milestone.date, 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={milestone.status === 'completed' ? 'default' : 'secondary'}
                  className={milestone.status === 'completed' ? 'bg-success' : ''}
                >
                  {milestone.status === 'completed' ? 'Terminé' : 
                   milestone.status === 'current' ? 'En cours' : 'À venir'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success rounded" />
              <span className="text-sm">Terminé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded" />
              <span className="text-sm">En cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted rounded" />
              <span className="text-sm">Planifié</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GanttDiagramWithMilestones;