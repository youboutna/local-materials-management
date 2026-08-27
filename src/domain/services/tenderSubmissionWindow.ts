/**
 * Pure domain logic: fenêtre de soumission d'un appel d'offres.
 * Aucune dépendance React / Supabase.
 */

export interface TenderSubmissionWindowInput {
  status?: string | null;
  currentPhase?: number | null;
  deadlineDate?: string | Date | null;
  launchDate?: string | Date | null;
  /** Accès accordé via code secret : l'AO est nominativement partagé au fournisseur. */
  grantedBySecret?: boolean;
}

export interface TenderSubmissionWindowDTO {
  isOpen: boolean;
  canSubmit: boolean;
  deadline: Date | null;
  daysRemaining: number | null;
  tenderStatus: string;
  /** Motif lorsque canSubmit = false */
  reason?: 'deadline_passed' | 'not_published' | 'cancelled' | 'no_deadline';
}

/** Statuts métier considérés comme ouverts aux offres. */
const OPEN_STATUSES = new Set([
  'published',
  'publie',
  'publié',
  'open',
  'ouvert',
  'open_for_bids',
  'submission',
  'soumission',
  'in_progress',
  'en_cours',
]);

const CLOSED_STATUSES = new Set(['cancelled', 'annule', 'annulé', 'awarded', 'attribue', 'attribué']);

const toDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function computeTenderSubmissionWindow(
  input: TenderSubmissionWindowInput,
  now: Date = new Date(),
): TenderSubmissionWindowDTO {
  const status = (input.status ?? '').toString().toLowerCase().trim();
  const deadline = toDate(input.deadlineDate);
  const daysRemaining = deadline
    ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const base: TenderSubmissionWindowDTO = {
    isOpen: false,
    canSubmit: false,
    deadline,
    daysRemaining,
    tenderStatus: status,
  };

  if (CLOSED_STATUSES.has(status)) {
    return { ...base, reason: 'cancelled' };
  }

  // La date limite est la source de vérité principale.
  if (deadline && deadline.getTime() <= now.getTime()) {
    return { ...base, reason: 'deadline_passed' };
  }

  const statusAllows =
    OPEN_STATUSES.has(status) ||
    input.currentPhase === 2 ||
    // Un partage nominatif par code secret vaut invitation à soumissionner.
    input.grantedBySecret === true;

  if (!statusAllows) {
    return { ...base, reason: 'not_published' };
  }

  // Deadline future (ou absente mais AO ouvert) => soumission possible.
  return { ...base, isOpen: true, canSubmit: true, reason: undefined };
}
