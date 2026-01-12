/**
 * TenderWorkflowStepper - Visual stepper for tender process workflow
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText,
  Settings,
  Send,
  Inbox,
  BarChart3,
  Award,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Lock
} from 'lucide-react';
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type WorkflowStep = 
  | 'creation' 
  | 'configuration' 
  | 'publication' 
  | 'reception' 
  | 'evaluation' 
  | 'attribution';

interface TenderWorkflowStep {
  id: WorkflowStep;
  label: string;
  description: string;
  icon: React.ElementType;
  dueDate?: string;
  completedAt?: string;
  status: 'completed' | 'current' | 'upcoming' | 'locked';
}

interface TenderWorkflowStepperProps {
  tenderId: string;
  currentStep: WorkflowStep;
  steps: Partial<Record<WorkflowStep, { dueDate?: string; completedAt?: string }>>;
  onStepClick?: (step: WorkflowStep) => void;
  onAdvance?: () => void;
  compact?: boolean;
}

const WORKFLOW_STEPS: Omit<TenderWorkflowStep, 'status' | 'dueDate' | 'completedAt'>[] = [
  { id: 'creation', label: 'Création', description: 'Définition du besoin et type', icon: FileText },
  { id: 'configuration', label: 'Configuration', description: 'Lots, critères, délais', icon: Settings },
  { id: 'publication', label: 'Publication', description: 'Avis public, notifications', icon: Send },
  { id: 'reception', label: 'Réception', description: 'Soumissions fournisseurs', icon: Inbox },
  { id: 'evaluation', label: 'Évaluation', description: 'Scoring et analyse', icon: BarChart3 },
  { id: 'attribution', label: 'Attribution', description: 'Décision finale', icon: Award }
];

const TenderWorkflowStepper: React.FC<TenderWorkflowStepperProps> = ({
  tenderId,
  currentStep,
  steps,
  onStepClick,
  onAdvance,
  compact = false
}) => {
  const getStepIndex = (stepId: WorkflowStep) => {
    return WORKFLOW_STEPS.findIndex(s => s.id === stepId);
  };

  const currentIndex = getStepIndex(currentStep);

  const enrichedSteps: TenderWorkflowStep[] = WORKFLOW_STEPS.map((step, idx) => {
    const stepData = steps[step.id];
    let status: TenderWorkflowStep['status'];

    if (stepData?.completedAt) {
      status = 'completed';
    } else if (idx === currentIndex) {
      status = 'current';
    } else if (idx < currentIndex) {
      status = 'completed'; // Previous steps should be completed
    } else if (idx === currentIndex + 1) {
      status = 'upcoming';
    } else {
      status = 'locked';
    }

    return {
      ...step,
      status,
      dueDate: stepData?.dueDate,
      completedAt: stepData?.completedAt
    };
  });

  const completedCount = enrichedSteps.filter(s => s.status === 'completed').length;
  const progressPercent = (completedCount / enrichedSteps.length) * 100;

  const getStatusColor = (status: TenderWorkflowStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'current': return 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2';
      case 'upcoming': return 'bg-muted text-muted-foreground';
      case 'locked': return 'bg-muted/50 text-muted-foreground/50';
    }
  };

  const getLineColor = (status: TenderWorkflowStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'current': return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return isPast(parseISO(dueDate));
  };

  return (
    <Card className={cn(compact && "border-0 shadow-none")}>
      {!compact && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Processus d'Appel d'Offres
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {completedCount}/{enrichedSteps.length} étapes
              </span>
              <Progress value={progressPercent} className="w-24 h-2" />
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className={cn("pt-4", compact && "px-0")}>
        {/* Horizontal Stepper */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
            <div 
              className="h-full bg-success transition-all duration-500"
              style={{ width: `${(currentIndex / (enrichedSteps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {enrichedSteps.map((step, idx) => {
              const Icon = step.icon;
              const isClickable = step.status !== 'locked' && onStepClick;
              const overdue = step.status === 'current' && isOverdue(step.dueDate);

              return (
                <TooltipProvider key={step.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          "flex flex-col items-center gap-2 cursor-default",
                          isClickable && "cursor-pointer"
                        )}
                        onClick={() => isClickable && onStepClick(step.id)}
                      >
                        {/* Step Circle */}
                        <div className={cn(
                          "relative w-10 h-10 rounded-full flex items-center justify-center transition-all",
                          getStatusColor(step.status),
                          overdue && "ring-2 ring-destructive ring-offset-2"
                        )}>
                          {step.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : step.status === 'locked' ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}

                          {/* Current indicator */}
                          {step.status === 'current' && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                          )}

                          {/* Overdue indicator */}
                          {overdue && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                              <AlertTriangle className="h-3 w-3 text-white" />
                            </span>
                          )}
                        </div>

                        {/* Label */}
                        <div className="text-center">
                          <p className={cn(
                            "text-sm font-medium",
                            step.status === 'locked' && "text-muted-foreground/50"
                          )}>
                            {step.label}
                          </p>
                          {!compact && (
                            <p className="text-xs text-muted-foreground max-w-[80px] hidden md:block">
                              {step.description}
                            </p>
                          )}
                          {step.dueDate && step.status === 'current' && (
                            <Badge 
                              variant={overdue ? 'destructive' : 'outline'} 
                              className="text-xs mt-1"
                            >
                              {overdue ? 'En retard' : format(parseISO(step.dueDate), 'd MMM', { locale: fr })}
                            </Badge>
                          )}
                          {step.completedAt && (
                            <span className="text-xs text-success block mt-1">
                              ✓ {format(parseISO(step.completedAt), 'd MMM', { locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{step.label}</p>
                        <p className="text-xs">{step.description}</p>
                        {step.dueDate && (
                          <p className="text-xs">
                            Échéance: {format(parseISO(step.dueDate), 'd MMMM yyyy', { locale: fr })}
                          </p>
                        )}
                        {step.completedAt && (
                          <p className="text-xs text-success">
                            Terminé le: {format(parseISO(step.completedAt), 'd MMMM yyyy', { locale: fr })}
                          </p>
                        )}
                        {step.status === 'locked' && (
                          <p className="text-xs text-muted-foreground">
                            Terminez les étapes précédentes
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Current Step Actions */}
        {!compact && currentIndex < enrichedSteps.length - 1 && (
          <div className="mt-6 flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium">
                Étape actuelle: {enrichedSteps[currentIndex].label}
              </p>
              <p className="text-sm text-muted-foreground">
                {enrichedSteps[currentIndex].description}
              </p>
            </div>
            {onAdvance && (
              <Button onClick={onAdvance} className="gap-2">
                Passer à {enrichedSteps[currentIndex + 1].label}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Completion State */}
        {currentIndex === enrichedSteps.length - 1 && enrichedSteps[currentIndex].status === 'completed' && (
          <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-lg text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="font-medium text-success">Processus terminé</p>
            <p className="text-sm text-muted-foreground">
              L'appel d'offres a été attribué avec succès
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TenderWorkflowStepper;
