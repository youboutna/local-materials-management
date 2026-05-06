import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, BarChart3, Clock, Users, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
/**
 * GanttTaskDTO (camelCase strict) consommé par `WaterfallGanttChart`.
 * Le mapping depuis les phases hex/repos est effectué dans le parent.
 */
export interface GanttTaskDTO {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  phase: string;
  dependencies?: string[];
  assignedTo?: string;
  budget?: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  procurementStep?: number;
}

// Alias rétrocompatible
type GanttTask = GanttTaskDTO;

interface WaterfallGanttChartProps {
  tasks: GanttTask[];
  projectStartDate?: Date;
  projectEndDate?: Date;
  ProjectTitle?: string;
  ProjectDescription?: string;
  ProjectLocation?: string;
  ProjectStatus?: string;
  ProjectProgress?: number;
  projectBudget?: number;
  ProjectTeamSize?: number;
}

const WaterfallGanttChart: React.FC<WaterfallGanttChartProps> = ({
  tasks,
  projectStartDate = new Date(),
  projectEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'quarter' | 'year'>('month');

  // Mauritanian Procurement Workflow Steps
  const procurementSteps = [
    { id: 1, name: "Planification des achats", color: "bg-blue-500" },
    { id: 2, name: "Publicité et appel d'offres", color: "bg-green-500" },
    { id: 3, name: "Réception et analyse", color: "bg-yellow-500" },
    { id: 4, name: "Attribution du marché", color: "bg-purple-500" },
    { id: 5, name: "Contrôle et régulation", color: "bg-red-500" }
  ];

  const getDaysInView = () => {
    if (viewMode === 'month') {
      return eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      });
    }
    // Add quarter and year logic here
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });
  };

  const getTaskPosition = (task: GanttTask, days: Date[]) => {
    const startIndex = days.findIndex(day => 
      day.toDateString() === task.startDate.toDateString()
    );
    const endIndex = days.findIndex(day => 
      day.toDateString() === task.endDate.toDateString()
    );
    
    if (startIndex === -1 || endIndex === -1) return null;
    
    return {
      left: `${(startIndex / days.length) * 100}%`,
      width: `${((endIndex - startIndex + 1) / days.length) * 100}%`
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'delayed': return 'Retardé';
      default: return 'Non commencé';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInView();

  // Calculate KPIs
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const delayedTasks = tasks.filter(t => t.status === 'delayed').length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const totalBudget = tasks.reduce((sum, task) => sum + (task.budget || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux d'achèvement</p>
                <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tâches terminées</p>
                <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tâches en retard</p>
                <p className="text-2xl font-bold">{delayedTasks}</p>
              </div>
              <Users className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget total</p>
                <p className="text-2xl font-bold">{(totalBudget / 1000000).toFixed(1)}M</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Diagramme de Gantt - Gestion Waterfall
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Timeline Header */}
          <div className="border-b pb-2 mb-4">
            <div className="grid grid-cols-12 gap-1">
              {days.map((day, index) => (
                <div
                  key={day.toISOString()}
                  className={`text-xs text-center p-1 ${
                    isToday(day) 
                      ? 'bg-primary text-primary-foreground rounded' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <div>{format(day, 'd')}</div>
                  <div className="text-[10px]">{format(day, 'EEE', { locale: fr })}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            {tasks.map((task) => {
              const position = getTaskPosition(task, days);
              const procurementStep = procurementSteps.find(step => step.id === task.procurementStep);
              
              return (
                <div key={task.id} className="relative">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-1/3 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{task.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {task.phase}
                        </Badge>
                        {procurementStep && (
                          <Badge 
                            className={`text-xs text-white ${procurementStep.color}`}
                          >
                            Étape {procurementStep.id}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getStatusColor(task.status)} text-white`}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        {task.assignedTo && (
                          <span className="text-xs text-muted-foreground">{task.assignedTo}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 relative h-8 bg-gray-100 rounded">
                      {position && (
                        <div
                          className={`absolute top-0 h-full rounded ${getStatusColor(task.status)} opacity-80`}
                          style={position}
                        >
                          <div className="relative h-full">
                            <div 
                              className="bg-green-400 h-full rounded"
                              style={{ width: `${task.progress}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                              {task.progress}%
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Today indicator */}
                      {days.some(day => isToday(day)) && (
                        <div 
                          className="absolute top-0 w-0.5 h-full bg-red-500 z-10"
                          style={{
                            left: `${(days.findIndex(day => isToday(day)) / days.length) * 100}%`
                          }}
                        />
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground text-right min-w-[100px]">
                      <div>{format(task.startDate, 'dd/MM')}</div>
                      <div>{format(task.endDate, 'dd/MM')}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Procurement Workflow Legend */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-3">Workflow Marchés Publics Mauritanie</h4>
            <div className="flex flex-wrap gap-2">
              {procurementSteps.map((step) => (
                <Badge 
                  key={step.id}
                  className={`${step.color} text-white`}
                >
                  {step.id}. {step.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaterfallGanttChart;