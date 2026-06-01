/**
 * Inspection Statuses Referential
 *
 * Source de vérité des statuts inspection (label, couleur, transitions).
 * Remplace les maps en dur dans les composants (M5).
 */

export type InspectionStatusCode =
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface InspectionStatusDef {
  code: InspectionStatusCode;
  label: { fr: string; en?: string };
  /** Tailwind semantic token used for badges. */
  tone: 'default' | 'secondary' | 'destructive' | 'outline';
  /** Color hex for PDF / charts (no semantic tokens in PDF). */
  color: string;
  /** Allowed transitions from this state. */
  next: InspectionStatusCode[];
}

export const INSPECTION_STATUSES: Record<InspectionStatusCode, InspectionStatusDef> = {
  pending:     { code: 'pending',     label: { fr: 'En attente' },   tone: 'outline',     color: '#9ca3af', next: ['scheduled', 'cancelled'] },
  scheduled:   { code: 'scheduled',   label: { fr: 'Planifiée' },    tone: 'secondary',   color: '#3b82f6', next: ['in_progress', 'cancelled'] },
  in_progress: { code: 'in_progress', label: { fr: 'En cours' },     tone: 'default',     color: '#f59e0b', next: ['completed', 'failed', 'cancelled'] },
  completed:   { code: 'completed',   label: { fr: 'Terminée' },     tone: 'default',     color: '#10b981', next: [] },
  failed:      { code: 'failed',      label: { fr: 'Échouée' },      tone: 'destructive', color: '#ef4444', next: ['scheduled'] },
  cancelled:   { code: 'cancelled',   label: { fr: 'Annulée' },      tone: 'outline',     color: '#6b7280', next: [] },
};

export function getInspectionStatus(code: string | null | undefined): InspectionStatusDef {
  if (code && code in INSPECTION_STATUSES) {
    return INSPECTION_STATUSES[code as InspectionStatusCode];
  }
  return INSPECTION_STATUSES.pending;
}

export function getInspectionStatusLabel(code: string | null | undefined, lang: 'fr' | 'en' = 'fr'): string {
  const s = getInspectionStatus(code);
  return s.label[lang] || s.label.fr;
}

export function canTransition(from: InspectionStatusCode, to: InspectionStatusCode): boolean {
  return INSPECTION_STATUSES[from]?.next.includes(to) ?? false;
}
