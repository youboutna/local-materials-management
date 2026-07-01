/**
 * SupplierBidWizard
 * Wizard vertical 4 étapes pour la candidature fournisseur.
 * DPAO → DQE → Pièces → Récap & soumission.
 * Progress tracker persistant, garde deadline bloquante.
 *
 * @see .lovable/plan.md — Lot 2
 */

import { useState, useMemo, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, FileText, Calculator, FolderUp, Send, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BidWizardStepCode = 'dpao' | 'dqe' | 'documents' | 'submit';

interface BidWizardStep {
  code: BidWizardStepCode;
  label: string;
  description: string;
  icon: ReactNode;
}

const STEPS: BidWizardStep[] = [
  { code: 'dpao', label: 'DPAO', description: 'Téléchargez et consultez le dossier', icon: <FileText className="h-4 w-4" /> },
  { code: 'dqe', label: 'DQE', description: 'Devis Quantitatif Estimatif', icon: <Calculator className="h-4 w-4" /> },
  { code: 'documents', label: 'Pièces', description: 'Admin, technique, financier', icon: <FolderUp className="h-4 w-4" /> },
  { code: 'submit', label: 'Soumission', description: 'Récapitulatif et envoi', icon: <Send className="h-4 w-4" /> },
];

export interface SupplierBidWizardProps {
  tenderId: string;
  tenderTitle?: string;
  deadlineDate?: string | null;
  renderStep: (step: BidWizardStepCode, api: { markComplete: () => void; goNext: () => void; goPrev: () => void }) => ReactNode;
  onSubmit?: () => void | Promise<void>;
}

export function SupplierBidWizard({ tenderTitle, deadlineDate, renderStep, onSubmit }: SupplierBidWizardProps) {
  const [active, setActive] = useState<BidWizardStepCode>('dpao');
  const [completed, setCompleted] = useState<Set<BidWizardStepCode>>(new Set());

  const isDeadlinePassed = deadlineDate ? new Date(deadlineDate) < new Date() : false;
  const daysLeft = deadlineDate ? Math.ceil((new Date(deadlineDate).getTime() - Date.now()) / 86400000) : null;

  const activeIndex = STEPS.findIndex((s) => s.code === active);
  const progress = useMemo(() => Math.round((completed.size / STEPS.length) * 100), [completed]);

  const markComplete = () => setCompleted((prev) => new Set(prev).add(active));
  const goNext = () => activeIndex < STEPS.length - 1 && setActive(STEPS[activeIndex + 1].code);
  const goPrev = () => activeIndex > 0 && setActive(STEPS[activeIndex - 1].code);

  if (isDeadlinePassed) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
          <div>
            <p className="font-semibold text-destructive">Deadline dépassée</p>
            <p className="text-sm text-muted-foreground">Cet appel d'offres n'accepte plus de soumissions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      {/* Progress tracker vertical */}
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{tenderTitle ?? 'Candidature'}</CardTitle>
          {daysLeft !== null && (
            <p className={cn('text-xs flex items-center gap-1', daysLeft <= 7 ? 'text-destructive font-medium' : 'text-muted-foreground')}>
              <Clock className="h-3 w-3" /> {daysLeft} jour(s) restant(s)
            </p>
          )}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progression</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <ol className="space-y-1">
            {STEPS.map((s, idx) => {
              const isActive = s.code === active;
              const isDone = completed.has(s.code);
              return (
                <li key={s.code}>
                  <button
                    type="button"
                    onClick={() => setActive(s.code)}
                    className={cn(
                      'w-full text-left rounded-md px-2 py-2 flex items-start gap-2 transition-colors',
                      isActive && 'bg-primary/10 border border-primary/30',
                      !isActive && 'hover:bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs shrink-0',
                        isDone ? 'bg-emerald-100 text-emerald-700' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {isDone ? <Check className="h-3 w-3" /> : idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {s.icon}
                        <span className="text-sm font-medium">{s.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{s.description}</p>
                    </div>
                    {isDone && <Badge variant="secondary" className="h-4 text-[9px]">OK</Badge>}
                  </button>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {/* Step content */}
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border bg-card p-4 min-h-[400px]">
          {renderStep(active, { markComplete, goNext, goPrev })}
        </div>
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goPrev} disabled={activeIndex === 0}>
            Précédent
          </Button>
          {active !== 'submit' ? (
            <Button onClick={goNext}>Suivant</Button>
          ) : (
            <Button
              onClick={async () => { await onSubmit?.(); markComplete(); }}
              disabled={completed.size < STEPS.length - 1}
            >
              <Send className="h-4 w-4 mr-2" /> Soumettre ma candidature
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupplierBidWizard;
