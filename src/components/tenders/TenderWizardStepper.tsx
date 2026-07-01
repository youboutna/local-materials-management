/**
 * TenderWizardStepper
 * Stepper horizontal 5 étapes pour la création/édition d'un appel d'offres.
 * Remplace les onglets denses actuels de TenderManagement.
 *
 * @see docs/ARCHITECTURE_REFERENTIELS.md, .lovable/plan.md Lot 1
 */

import { useState, useMemo, type ReactNode } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TENDER_WIZARD_STEPS, type TenderWizardStepCode } from '@/config/referentials/tender';

export interface TenderWizardStepperProps {
  currentStep?: TenderWizardStepCode;
  onStepChange?: (step: TenderWizardStepCode) => void;
  completedSteps?: Set<TenderWizardStepCode>;
  renderStep: (step: TenderWizardStepCode) => ReactNode;
  onCancel?: () => void;
  onSave?: () => void;
  saveLabel?: string;
  disabled?: boolean;
}

export function TenderWizardStepper({
  currentStep,
  onStepChange,
  completedSteps = new Set(),
  renderStep,
  onCancel,
  onSave,
  saveLabel = 'Enregistrer',
  disabled,
}: TenderWizardStepperProps) {
  const [internalStep, setInternalStep] = useState<TenderWizardStepCode>(TENDER_WIZARD_STEPS[0].code);
  const active = currentStep ?? internalStep;
  const setActive = (s: TenderWizardStepCode) => {
    setInternalStep(s);
    onStepChange?.(s);
  };

  const activeIndex = useMemo(
    () => TENDER_WIZARD_STEPS.findIndex((s) => s.code === active),
    [active],
  );

  const goPrev = () => {
    if (activeIndex > 0) setActive(TENDER_WIZARD_STEPS[activeIndex - 1].code);
  };
  const goNext = () => {
    if (activeIndex < TENDER_WIZARD_STEPS.length - 1) setActive(TENDER_WIZARD_STEPS[activeIndex + 1].code);
  };
  const isLast = activeIndex === TENDER_WIZARD_STEPS.length - 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Stepper header */}
      <ol className="flex w-full items-center gap-1 overflow-x-auto rounded-lg border bg-card p-2">
        {TENDER_WIZARD_STEPS.map((step, idx) => {
          const isActive = step.code === active;
          const isDone = completedSteps.has(step.code);
          return (
            <li key={step.code} className="flex flex-1 min-w-[140px] items-center gap-2">
              <button
                type="button"
                onClick={() => setActive(step.code)}
                className={cn(
                  'flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-left transition-colors',
                  isActive && 'bg-primary/10 border border-primary/30',
                  !isActive && isDone && 'text-emerald-600 hover:bg-muted',
                  !isActive && !isDone && 'text-muted-foreground hover:bg-muted',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                    isActive && 'bg-primary text-primary-foreground',
                    !isActive && isDone && 'bg-emerald-100 text-emerald-700',
                    !isActive && !isDone && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">{step.label}</span>
                  <span className="text-xs text-muted-foreground hidden lg:inline">{step.description}</span>
                </span>
              </button>
              {idx < TENDER_WIZARD_STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Step content */}
      <div className="rounded-lg border bg-card p-4">{renderStep(active)}</div>

      {/* Nav bar */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
          Annuler
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={goPrev} disabled={disabled || activeIndex === 0}>
            Précédent
          </Button>
          {!isLast ? (
            <Button type="button" onClick={goNext} disabled={disabled}>
              Suivant
            </Button>
          ) : (
            <Button type="button" onClick={onSave} disabled={disabled}>
              {saveLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TenderWizardStepper;
