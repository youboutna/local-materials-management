/**
 * FormSection — accessible card wrapper for workflow steps.
 * Pure presentation (no business logic). Stage tints are sourced from
 * design tokens (--stage-plan/exec/control/close) defined in index.css.
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LifecycleStage } from '@/utils/phaseHelpers';

const STAGE_BORDER: Record<LifecycleStage, string> = {
  PLANIFICATION: 'border-l-stage-plan',
  EXECUTION: 'border-l-stage-exec',
  CONTROLE: 'border-l-stage-control',
  CLOTURE: 'border-l-stage-close',
};

interface FormSectionProps {
  title: string;
  description?: string;
  stage?: LifecycleStage;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  /** Optional id used by aria-describedby for inner inputs. */
  describedById?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  stage = 'PLANIFICATION',
  icon,
  actions,
  className,
  children,
  describedById,
}) => {
  return (
    <Card
      className={cn('border-l-4 shadow-sm', STAGE_BORDER[stage], className)}
      role="region"
      aria-label={title}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 text-muted-foreground" aria-hidden="true">
              {icon}
            </div>
          )}
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription id={describedById} className="mt-1 text-sm">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
};

export default FormSection;
