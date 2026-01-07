/**
 * WorkflowKanban - Vue Kanban interactive des étapes avec actions intégrées
 * Permet de visualiser et gérer les étapes, inspections et paiements en un seul endroit
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  MoreVertical,
  ClipboardCheck,
  DollarSign,
  FileText,
  Play,
  Eye,
  Calendar,
  Download,
  Edit,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhaseStepDTO } from '@/types/phase-dto';
import { StepItem } from '@/types/unified-workflow';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StepWorkflowStatus {
  inspectionStatus: 'approved' | 'pending' | 'none';
  paymentStatus: 'paid' | 'available' | 'blocked';
  totalPaid: number;
  latestInspection: { id: string; date: string } | null;
}

interface WorkflowKanbanProps {
  // Accept legacy PhaseStepDTO or unified StepItem
  steps: PhaseStepDTO[] | StepItem[];
  phaseProgress: number;
  getStepWorkflowStatus: (step: PhaseStepDTO | StepItem) => StepWorkflowStatus;
  onScheduleInspection: (stepId: string) => void;
  onUpdateProgress: (stepId: string) => void;
  onRequestPayment: (stepId: string, canRequest: boolean) => void;
  onViewInspection: (inspectionId: string) => void;
  onViewPayment?: (stepId: string) => void;
  formatCurrency: (amount: number) => string;
}

const WorkflowKanban: React.FC<WorkflowKanbanProps> = ({
  steps,
  phaseProgress,
  getStepWorkflowStatus,
  onScheduleInspection,
  onUpdateProgress,
  onRequestPayment,
  onViewInspection,
  onViewPayment,
  formatCurrency,
}) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // helpers to safely access optional legacy fields when step may be unified StepItem
  const getTasks = (step: PhaseStepDTO | StepItem) => {
    if ('tasks' in step && Array.isArray((step as PhaseStepDTO).tasks)) return (step as PhaseStepDTO).tasks;
    return [] as Array<unknown>;
  };

  const getEstimatedDuration = (step: PhaseStepDTO | StepItem) => {
    if ('estimated_duration_days' in step) return (step as PhaseStepDTO).estimated_duration_days || null;
    if ('estimatedDuration' in step) return (step as unknown as { estimatedDuration?: number }).estimatedDuration ?? null;
    return null;
  };

  const getDescription = (step: PhaseStepDTO | StepItem) => {
    if ('description' in step) return (step as unknown as { description?: string }).description;
    return undefined;
  };

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'delayed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      completed: { label: '✅ Terminée', className: 'bg-green-100 text-green-800 border-green-200' },
      in_progress: { label: '🟡 En cours', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      delayed: { label: '🔴 Retard', className: 'bg-red-100 text-red-800 border-red-200' },
      pending: { label: '🔵 À venir', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    };
    const config = configs[status] || configs.pending;
    return <Badge variant="outline" className={cn("text-xs", config.className)}>{config.label}</Badge>;
  }, []);

  const getInspectionBadge = useCallback((workflowStatus: StepWorkflowStatus) => {
    if (workflowStatus.latestInspection) {
      const date = format(parseISO(workflowStatus.latestInspection.date), 'd MMM yy', { locale: fr });
      if (workflowStatus.inspectionStatus === 'approved') {
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            ✅ {date}
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
          ⏳ {date}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
        Non planifiée
      </Badge>
    );
  }, []);

  const getPaymentBadge = useCallback((workflowStatus: StepWorkflowStatus) => {
    if (workflowStatus.paymentStatus === 'paid') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
          💰 Payé
        </Badge>
      );
    }
    if (workflowStatus.paymentStatus === 'available') {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs animate-pulse">
          💵 Disponible
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
        0%
      </Badge>
    );
  }, []);

  const getContextualActions = useCallback((step: PhaseStepDTO | StepItem, workflowStatus: StepWorkflowStatus) => {
    const actions: Array<{
      icon: React.ReactNode;
      label: string;
      onClick: () => void;
      highlight?: boolean;
      disabled?: boolean;
    }> = [];

    // Add progress update action for non-completed steps
    if (step.status !== 'completed') {
      actions.push({
        icon: <TrendingUp className="h-4 w-4" />,
        label: '📝 Saisir avancement',
        onClick: () => onUpdateProgress(step.id),
      });
    }

    // Add inspection action
    if (workflowStatus.inspectionStatus === 'none' && step.status !== 'pending') {
      actions.push({
        icon: <Calendar className="h-4 w-4" />,
        label: '🗓️ Programmer inspection',
        onClick: () => onScheduleInspection(step.id),
      });
    } else if (workflowStatus.latestInspection) {
      const inspectionId = workflowStatus.latestInspection.id;
      actions.push({
        icon: <Eye className="h-4 w-4" />,
        label: 'Voir PV',
        onClick: () => onViewInspection(inspectionId),
      });
    }

    // Add payment action
    if (workflowStatus.paymentStatus === 'available') {
      actions.push({
        icon: <DollarSign className="h-4 w-4" />,
        label: '💰 Demander paiement',
        onClick: () => onRequestPayment(step.id, true),
        highlight: true,
      });
    } else if (workflowStatus.paymentStatus === 'paid' && onViewPayment) {
      actions.push({
        icon: <Download className="h-4 w-4" />,
        label: 'Télécharger facture',
        onClick: () => onViewPayment(step.id),
      });
    }

    return actions;
  }, [onUpdateProgress, onScheduleInspection, onViewInspection, onRequestPayment, onViewPayment]);

  if (steps.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium mb-2">Aucune étape définie</h3>
          <p className="text-sm text-muted-foreground">
            Ajoutez des étapes à cette phase pour suivre le workflow
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Tableau de bord des étapes
            </CardTitle>
            <Badge variant="secondary">
              {steps.filter(s => s.status === 'completed').length}/{steps.length} terminées
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
            <div className="col-span-4">Étape</div>
            <div className="col-span-2 text-center">Statut</div>
            <div className="col-span-2 text-center">Progression</div>
            <div className="col-span-2 text-center">Inspection</div>
            <div className="col-span-2 text-center">Paiement</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y">
            {steps.map((step, index) => {
              const workflowStatus = getStepWorkflowStatus(step);
              const actions = getContextualActions(step, workflowStatus);
              const isExpanded = expandedStep === step.id;
              
              return (
                <div key={step.id} className="group">
                  {/* Main Row */}
                  <div 
                    className={cn(
                      "grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors cursor-pointer",
                      step.status === 'completed' && "bg-green-50/50",
                      step.status === 'in_progress' && "bg-blue-50/50",
                      isExpanded && "bg-muted/30",
                      "hover:bg-muted/50"
                    )}
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  >
                    {/* Step Name */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        step.status === 'completed' && "bg-green-500 text-white",
                        step.status === 'in_progress' && "bg-blue-500 text-white",
                        step.status !== 'completed' && step.status !== 'in_progress' && "bg-muted text-muted-foreground"
                      )}>
                        {step.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{step.name}</p>
                        {(() => {
                          const tasks = getTasks(step);
                          if (tasks.length > 0) {
                            const completed = (tasks as Array<Record<string, unknown>>).filter(t => (t.status as unknown as string) === 'completed').length;
                            return (
                              <p className="text-xs text-muted-foreground">
                                {completed}/{tasks.length} tâches
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 text-center">
                      {getStatusBadge(step.status)}
                    </div>

                    {/* Progress */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <Progress value={step.progress} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-10 text-right">{step.progress}%</span>
                      </div>
                    </div>

                    {/* Inspection */}
                    <div className="col-span-2 text-center">
                      {getInspectionBadge(workflowStatus)}
                    </div>

                    {/* Payment */}
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      {getPaymentBadge(workflowStatus)}
                      
                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {actions.map((action, i) => (
                            <DropdownMenuItem
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick();
                              }}
                              className={cn(
                                action.highlight && "bg-primary/10 text-primary font-medium"
                              )}
                              disabled={action.disabled}
                            >
                              {action.icon}
                              <span className="ml-2">{action.label}</span>
                            </DropdownMenuItem>
                          ))}
                          {actions.length === 0 && (
                            <DropdownMenuItem disabled>
                              Aucune action disponible
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 py-4 bg-muted/20 border-t space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Description */}
                        {(() => {
                          const desc = getDescription(step);
                          if (desc) {
                            return (
                              <div className="md:col-span-2">
                                <h5 className="text-sm font-medium mb-2">Description</h5>
                                <p className="text-sm text-muted-foreground">{desc}</p>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Quick Stats */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Détails</h5>
                          <div className="space-y-1 text-sm">
                            {(() => {
                              const est = getEstimatedDuration(step);
                              if (est) {
                                return (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Durée estimée:</span>
                                    <span>{est} jours</span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            {workflowStatus.totalPaid > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Montant payé:</span>
                                <span className="text-green-600 font-medium">
                                  {formatCurrency(workflowStatus.totalPaid)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <Separator />
                      <div className="flex flex-wrap gap-2">
                        {actions.map((action, i) => (
                          <Button
                            key={i}
                            size="sm"
                            variant={action.highlight ? 'default' : 'outline'}
                            onClick={action.onClick}
                            disabled={action.disabled}
                            className={cn(
                              "gap-2",
                              action.highlight && "bg-primary"
                            )}
                          >
                            {action.icon}
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default WorkflowKanban;
