/**
 * PhaseWithStepsView - Vue pour phases avec étapes
 * Affiche les étapes avec leurs jalons et actions intégrées
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Layers, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { StepNode } from "./StepNode";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";



import { Step } from '@/dtos/entities/PhaseDTO';
interface PhaseWithStepsViewProps {
  phase: {
    id: string;
    phase_name?: string;
    project_id?: string;
    steps?: Step[];
  };
  projectId?: string;
  onStepClick?: (step: Step) => void;
  onScheduleInspection?: (stepId?: string) => void;
  onRequestPayment?: (stepId?: string) => void;
  onAddStep?: () => void;
  onMilestoneAction?: (action: string, milestone: any, stepId?: string) => void;
  className?: string;
}

export const PhaseWithStepsView: React.FC<PhaseWithStepsViewProps> = ({
  phase,
  projectId,
  onStepClick,
  onScheduleInspection,
  onRequestPayment,
  onAddStep,
  onMilestoneAction,
  className,
}) => {
  const steps = phase.steps || [];
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const completedSteps = steps.filter(s => s.status === "completed").length;
  const inProgressSteps = steps.filter(s => s.status === "in_progress").length;

  if (steps.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune étape définie</h3>
          <p className="text-muted-foreground mb-4">
            Cette phase n'a pas encore d'étapes configurées.
          </p>
          {onAddStep && (
            <Button onClick={onAddStep}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une étape
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Étapes de la phase ({steps.length})
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {completedSteps} terminée{completedSteps > 1 ? "s" : ""} • {inProgressSteps} en cours
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              {onAddStep && (
                <Button variant="ghost" size="sm" onClick={onAddStep}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {steps
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((step) => (
                  <StepNode
                    key={step.id}
                    step={step}
                    phaseId={phase.id}
                    projectId={projectId || phase.project_id}
                    expanded={expandedSteps.includes(step.id)}
                    onToggle={() => toggleStep(step.id)}
                    onClick={() => onStepClick?.(step)}
                    onScheduleInspection={onScheduleInspection}
                    onRequestPayment={onRequestPayment}
                    onMilestoneAction={(action, milestone) => 
                      onMilestoneAction?.(action, milestone, step.id)
                    }
                  />
                ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default PhaseWithStepsView;