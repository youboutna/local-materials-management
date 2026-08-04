/**
 * dqeStatusMapper — normalisation multilingue des statuts de lignes DQE
 * vers les valeurs acceptées par `btp.boq_lines.status`.
 */
import type { BoqStatus } from '@/domain/boq/BoqLine';

const STATUS_MAPPING: Record<string, BoqStatus> = {
  termine: 'validated',
  completed: 'validated',
  valide: 'validated',
  validated: 'validated',
  en_cours: 'submitted',
  'en cours': 'submitted',
  in_progress: 'submitted',
  soumis: 'submitted',
  submitted: 'submitted',
  planifie: 'draft',
  planned: 'draft',
  brouillon: 'draft',
  draft: 'draft',
  annule: 'rejected',
  cancelled: 'rejected',
  rejete: 'rejected',
  rejected: 'rejected',
  facture: 'invoiced',
  invoiced: 'invoiced',
  paye: 'paid',
  paid: 'paid',
  archive: 'archived',
  archived: 'archived',
};

/** Mappe un statut métier (FR/EN, accentué ou non) vers un `BoqStatus`. */
export function mapDqeStatus(status?: string | null): BoqStatus {
  const normalized = (status ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');
  return STATUS_MAPPING[normalized] ?? 'draft';
}
