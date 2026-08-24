/**
 * PhaseEditWorkflowDialog — Mode 2 : workflow d'édition complet multi-étapes.
 *
 * Étapes : Général → Planification → Ressources → Intervenants → Documents →
 * Paiements → Validation. Les étapes de saisie (Général / Planification)
 * alimentent un brouillon enregistré à la fin ; les étapes relationnelles
 * réutilisent les vues existantes (une donnée = une source).
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Building2, Calendar, CreditCard,
  FileText, Loader2, Package, Save, CheckCircle2, Pencil, Users,
} from 'lucide-react';
import PhaseResourcesTab from './PhaseResourcesTab';
import PhaseStakeholdersTab from './PhaseStakeholdersTab';
import PhaseDocuments from '@/components/project/PhaseDocuments';
import PhasePayments from '@/components/project/PhasePayments';
import {
  PhaseEditDraft,
  draftDurationDays,
  validatePhaseDraft,
  validatePhaseDraftStep,
} from './PhaseEditDraft';
import { formatAmount2, formatPercent2 } from '@/utils/reportNumbers';
import { T } from '@/components/i18n/T';

type StepId = 'general' | 'planning' | 'resources' | 'stakeholders' | 'documents' | 'payments' | 'validation';

const STEPS: Array<{ id: StepId; label: string; icon: React.ElementType }> = [
  { id: 'general', label: 'Général', icon: Pencil },
  { id: 'planning', label: 'Planification', icon: Calendar },
  { id: 'resources', label: 'Ressources', icon: Package },
  { id: 'stakeholders', label: 'Intervenants', icon: Building2 },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'validation', label: 'Validation', icon: CheckCircle2 },
];

interface PhaseEditWorkflowDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  phaseId: string;
  value: PhaseEditDraft;
  isSaving?: boolean;
  /** Compteurs affichés dans le récapitulatif */
  summary: {
    team: number;
    documents: number;
    payments: number;
    tasks: number;
    completedTasks: number;
  };
  onSave: (draft: PhaseEditDraft) => Promise<void> | void;
}

const PhaseEditWorkflowDialog: React.FC<PhaseEditWorkflowDialogProps> = ({
  isOpen,
  onOpenChange,
  projectId,
  phaseId,
  value,
  isSaving = false,
  summary,
  onSave,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<PhaseEditDraft>(value);

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
      setStepIndex(0);
    }
  }, [isOpen, value]);

  const current = STEPS[stepIndex];
  const stepValidation = validatePhaseDraftStep(current.id, draft);
  const globalValidation = useMemo(() => validatePhaseDraft(draft), [draft]);
  const duration = draftDurationDays(draft);

  const goNext = () => {
    if (!stepValidation.isValid) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const handleSave = async () => {
    if (!globalValidation.isValid) return;
    await onSave(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" aria-hidden="true" />
            <T k="auto.phaseeditworkflow.titre" fallback="Édition de la phase" />
          </DialogTitle>
          <DialogDescription>
            <T
              k="auto.phaseeditworkflow.description"
              fallback="Révision complète en plusieurs étapes ; l'enregistrement s'effectue à la dernière étape."
            />
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === stepIndex;
              return (
                <Button
                  key={step.id}
                  size="sm"
                  variant={isActive ? 'default' : idx < stepIndex ? 'secondary' : 'outline'}
                  onClick={() => setStepIndex(idx)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Étape ${idx + 1} : ${step.label}`}
                >
                  <Icon className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  {step.label}
                </Button>
              );
            })}
          </div>
          <Progress value={((stepIndex + 1) / STEPS.length) * 100} className="h-1.5" />
        </div>

        <Separator />

        {/* Contenu de l'étape */}
        <div className="min-h-[280px] space-y-4">
          {current.id === 'general' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  <T k="auto.phaseeditworkflow.nom" fallback="Nom de la phase" /> <span className="text-destructive">*</span>
                </Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label><T k="auto.phaseeditworkflow.description_champ" fallback="Description" /></Label>
                <Textarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label><T k="auto.phaseeditworkflow.budget" fallback="Budget (MRU)" /></Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.estimatedCost}
                  onChange={(e) => setDraft({ ...draft, estimatedCost: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}

          {current.id === 'planning' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label><T k="auto.phaseeditworkflow.date_debut" fallback="Date de début" /></Label>
                <Input
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label><T k="auto.phaseeditworkflow.date_fin" fallback="Date de fin" /></Label>
                <Input
                  type="date"
                  value={draft.endDate}
                  onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label><T k="auto.phaseeditworkflow.progression" fallback="Progression (%)" /></Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.progress}
                  onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) || 0 })}
                />
              </div>
              <p className="sm:col-span-3 text-xs text-muted-foreground">
                <T k="auto.phaseeditworkflow.duree" fallback="Durée" /> : {duration}{' '}
                <T k="auto.phaseeditworkflow.jours" fallback="jours" /> · {summary.completedTasks}/{summary.tasks}{' '}
                <T k="auto.phaseeditworkflow.taches" fallback="tâches" />
              </p>
            </div>
          )}

          {current.id === 'resources' && <PhaseResourcesTab phaseId={phaseId} projectId={projectId} />}
          {current.id === 'stakeholders' && <PhaseStakeholdersTab phaseId={phaseId} projectId={projectId} />}
          {current.id === 'documents' && <PhaseDocuments phaseId={phaseId} projectId={projectId} />}
          {current.id === 'payments' && (
            <PhasePayments
              phaseId={phaseId}
              projectId={projectId}
              phaseName={draft.name}
              phaseBudget={draft.estimatedCost}
            />
          )}

          {current.id === 'validation' && (
            <div className="space-y-3">
              <div className="rounded-md border p-4 space-y-2 text-sm">
                <p className="font-medium">📋 {draft.name || '—'}</p>
                <p className="text-muted-foreground">
                  📅 {draft.startDate || '—'} → {draft.endDate || '—'} ({duration}{' '}
                  <T k="auto.phaseeditworkflow.jours" fallback="jours" />)
                </p>
                <p className="text-muted-foreground">💰 {formatAmount2(draft.estimatedCost)}</p>
                <p className="text-muted-foreground">📊 {formatPercent2(draft.progress)}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {summary.team}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {summary.documents}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> {summary.payments}
                  </Badge>
                </div>
              </div>
              {!globalValidation.isValid && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <ul className="list-disc pl-4">
                      {globalValidation.errors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {current.id !== 'validation' && !stepValidation.isValid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <ul className="list-disc pl-4">
                  {stepValidation.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
            disabled={stepIndex === 0}
            aria-label="Étape précédente"
          >
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            <T k="auto.phaseeditworkflow.precedent" fallback="Précédent" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isSaving}>
              <T k="auto.phaseeditworkflow.annuler" fallback="Annuler" />
            </Button>
            {stepIndex < STEPS.length - 1 && (
              <Button size="sm" variant="outline" onClick={goNext} disabled={!stepValidation.isValid} aria-label="Étape suivante">
                <T k="auto.phaseeditworkflow.suivant" fallback="Suivant" />
                <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={isSaving || !globalValidation.isValid} aria-label="Enregistrer la phase">
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4 mr-1" aria-hidden="true" />
              )}
              <T k="auto.phaseeditworkflow.enregistrer" fallback="Enregistrer" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhaseEditWorkflowDialog;
