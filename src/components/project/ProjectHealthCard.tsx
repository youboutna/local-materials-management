import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Layers
} from 'lucide-react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Phase {
  id: string;
  name: string;
  status: string;
  progress: number;
}

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface ProjectHealthCardProps {
  project: {
    id: string;
    title: string;
    description?: string;
    status: string;
    progress: number;
    budget?: number;
    spent?: number;
    location?: string;
    startDate?: string;
    endDate?: string;
    teamSize?: number;
    phases?: Phase[];
    stakeholders?: Stakeholder[];
    milestonesDue?: number;
    milestonesOverdue?: number;
  };
  variant?: 'default' | 'compact' | 'detailed';
  onClick?: () => void;
}

type HealthStatus = 'excellent' | 'good' | 'at_risk' | 'critical';

const ProjectHealthCard: React.FC<ProjectHealthCardProps> = ({
  project,
  variant = 'default',
  onClick
}) => {
  // Calculate health status based on multiple factors
  const healthAnalysis = useMemo(() => {
    const today = new Date();
    let score = 100;
    let issues: string[] = [];
    let strengths: string[] = [];

    // Check schedule performance
    if (project.startDate && project.endDate) {
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      const totalDays = differenceInDays(endDate, startDate);
      const elapsedDays = differenceInDays(today, startDate);
      const expectedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
      
      const scheduleVariance = project.progress - expectedProgress;
      
      if (scheduleVariance < -20) {
        score -= 40;
        issues.push('Retard significatif sur le planning');
      } else if (scheduleVariance < -10) {
        score -= 20;
        issues.push('Léger retard sur le planning');
      } else if (scheduleVariance >= 0) {
        strengths.push('Dans les temps');
      }
    }

    // Check budget performance
    if (project.budget && project.spent) {
      const budgetUsage = (project.spent / project.budget) * 100;
      const expectedBudgetUsage = project.progress; // Expected budget usage based on progress
      
      if (budgetUsage > expectedBudgetUsage + 20) {
        score -= 30;
        issues.push('Dépassement budgétaire');
      } else if (budgetUsage > expectedBudgetUsage + 10) {
        score -= 15;
        issues.push('Budget à surveiller');
      } else if (budgetUsage <= expectedBudgetUsage) {
        strengths.push('Budget maîtrisé');
      }
    }

    // Check milestones
    if (project.milestonesOverdue && project.milestonesOverdue > 0) {
      score -= project.milestonesOverdue * 10;
      issues.push(`${project.milestonesOverdue} jalon(s) en retard`);
    }

    // Determine health status
    let status: HealthStatus;
    if (score >= 85) status = 'excellent';
    else if (score >= 70) status = 'good';
    else if (score >= 50) status = 'at_risk';
    else status = 'critical';

    return { score, status, issues, strengths };
  }, [project]);

  const getHealthColor = (status: HealthStatus) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'at_risk':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
    }
  };

  const getHealthIcon = (status: HealthStatus) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'good':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'at_risk':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getHealthLabel = (status: HealthStatus) => {
    switch (status) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Bon';
      case 'at_risk':
        return 'À risque';
      case 'critical':
        return 'Critique';
    }
  };

  // Calculate days remaining or overdue
  const daysInfo = useMemo(() => {
    if (!project.endDate) return null;
    const today = new Date();
    const endDate = new Date(project.endDate);
    const days = differenceInDays(endDate, today);
    
    if (days < 0) {
      return { value: Math.abs(days), label: 'jours de retard', isOverdue: true };
    } else if (days === 0) {
      return { value: 0, label: "Aujourd'hui", isOverdue: false };
    } else {
      return { value: days, label: 'jours restants', isOverdue: false };
    }
  }, [project.endDate]);

  // Mini timeline for phases
  const renderMiniTimeline = () => {
    if (!project.phases || project.phases.length === 0) return null;

    return (
      <div className="flex items-center gap-1 mt-3">
        {project.phases.slice(0, 6).map((phase, index) => (
          <TooltipProvider key={phase.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors",
                    phase.status === 'completed' ? 'bg-green-500' :
                    phase.status === 'in_progress' ? 'bg-blue-500' :
                    'bg-gray-200'
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{phase.name}</p>
                <p className="text-xs">{phase.progress}% - {phase.status}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {project.phases.length > 6 && (
          <span className="text-xs text-muted-foreground ml-1">
            +{project.phases.length - 6}
          </span>
        )}
      </div>
    );
  };

  // Render stakeholder avatars
  const renderStakeholders = () => {
    if (!project.stakeholders || project.stakeholders.length === 0) return null;

    return (
      <div className="flex items-center -space-x-2">
        {project.stakeholders.slice(0, 4).map((stakeholder) => (
          <TooltipProvider key={stakeholder.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 border-2 border-background">
                  <AvatarImage src={stakeholder.avatar} />
                  <AvatarFallback className="text-xs bg-primary/10">
                    {stakeholder.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{stakeholder.name}</p>
                <p className="text-xs text-muted-foreground">{stakeholder.role}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {project.stakeholders.length > 4 && (
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
            +{project.stakeholders.length - 4}
          </div>
        )}
      </div>
    );
  };

  const cardContent = (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-lg cursor-pointer group",
        healthAnalysis.status === 'critical' && "border-red-200",
        healthAnalysis.status === 'at_risk' && "border-orange-200"
      )}
      onClick={onClick}
    >
      {/* Health Indicator Strip */}
      <div className={cn("h-1", getHealthColor(healthAnalysis.status))} />

      <CardContent className={cn("p-4", variant === 'compact' && "p-3")}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            {project.description && variant !== 'compact' && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {project.description}
              </p>
            )}
          </div>
          
          {/* Health Badge */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  {getHealthIcon(healthAnalysis.status)}
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      healthAnalysis.status === 'excellent' && "bg-green-50 text-green-700 border-green-200",
                      healthAnalysis.status === 'good' && "bg-blue-50 text-blue-700 border-blue-200",
                      healthAnalysis.status === 'at_risk' && "bg-orange-50 text-orange-700 border-orange-200",
                      healthAnalysis.status === 'critical' && "bg-red-50 text-red-700 border-red-200"
                    )}
                  >
                    {getHealthLabel(healthAnalysis.status)}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-medium">Score de santé: {healthAnalysis.score}%</p>
                  {healthAnalysis.issues.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Problèmes:</p>
                      <ul className="text-xs list-disc pl-4">
                        {healthAnalysis.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {healthAnalysis.strengths.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Points forts:</p>
                      <ul className="text-xs list-disc pl-4">
                        {healthAnalysis.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Progress */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Mini Timeline */}
        {variant !== 'compact' && renderMiniTimeline()}

        {/* Metrics Row */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
          {project.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-[100px]">{project.location}</span>
            </div>
          )}
          
          {daysInfo && (
            <div className={cn(
              "flex items-center gap-1",
              daysInfo.isOverdue && "text-red-600"
            )}>
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {daysInfo.value > 0 ? `${daysInfo.value} ${daysInfo.label}` : daysInfo.label}
              </span>
            </div>
          )}

          {project.budget && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{(project.budget / 1000000).toFixed(1)}M</span>
            </div>
          )}

          {project.phases && (
            <div className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              <span>{project.phases.length} phases</span>
            </div>
          )}
        </div>

        {/* Stakeholders */}
        {variant === 'detailed' && project.stakeholders && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <span className="text-xs text-muted-foreground">Parties prenantes</span>
            {renderStakeholders()}
          </div>
        )}

        {/* Alerts */}
        {(project.milestonesOverdue && project.milestonesOverdue > 0) && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 rounded-md text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{project.milestonesOverdue} jalon(s) en retard</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (onClick) {
    return cardContent;
  }

  return (
    <Link to={`/projects/${project.id}`}>
      {cardContent}
    </Link>
  );
};

export default ProjectHealthCard;
