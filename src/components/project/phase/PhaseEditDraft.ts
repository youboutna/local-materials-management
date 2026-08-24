/**
 * PhaseEditDraft — Modèle de brouillon d'édition d'une phase.
 *
 * Doctrine : « Une donnée = une source ». Le mode onglet (sauvegarde partielle)
 * et le mode workflow (sauvegarde globale) manipulent le MÊME brouillon typé,
 * puis délèguent la persistance au même service (PhaseService.updatePhase).
 */
import type { PhaseViewModel } from '@/utils/phaseViewModel';

export interface PhaseEditDraft {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedCost: number;
  progress: number;
  status: string;
}

/** Construit un brouillon depuis le view-model persisté. */
export const toPhaseEditDraft = (vm: PhaseViewModel): PhaseEditDraft => ({
  name: vm.title ?? '',
  description: vm.description ?? '',
  startDate: (vm.startDate ?? '').slice(0, 10),
  endDate: (vm.endDate ?? '').slice(0, 10),
  estimatedCost: vm.budget ?? 0,
  progress: vm.progress ?? 0,
  status: String(vm.status ?? 'pending'),
});

/** Durée en jours dérivée des dates du brouillon (0 si dates invalides). */
export const draftDurationDays = (draft: Pick<PhaseEditDraft, 'startDate' | 'endDate'>): number => {
  if (!draft.startDate || !draft.endDate) return 0;
  const start = new Date(draft.startDate).getTime();
  const end = new Date(draft.endDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return Math.round((end - start) / 86_400_000);
};

export interface PhaseDraftValidation {
  isValid: boolean;
  errors: string[];
}

/** Validation par étape (P2) — pure, sans dépendance UI. */
export const validatePhaseDraftStep = (step: string, draft: PhaseEditDraft): PhaseDraftValidation => {
  const errors: string[] = [];

  if (step === 'general') {
    if (!draft.name.trim()) errors.push('Le nom de la phase est obligatoire.');
    if (draft.estimatedCost < 0) errors.push('Le budget ne peut pas être négatif.');
  }

  if (step === 'planning') {
    if (draft.startDate && draft.endDate && new Date(draft.endDate) < new Date(draft.startDate)) {
      errors.push('La date de fin doit être postérieure à la date de début.');
    }
    if (draft.progress < 0 || draft.progress > 100) {
      errors.push('La progression doit être comprise entre 0 et 100 %.');
    }
  }

  return { isValid: errors.length === 0, errors };
};

/** Validation globale (toutes les étapes de saisie). */
export const validatePhaseDraft = (draft: PhaseEditDraft): PhaseDraftValidation => {
  const all = ['general', 'planning'].flatMap((s) => validatePhaseDraftStep(s, draft).errors);
  return { isValid: all.length === 0, errors: all };
};
