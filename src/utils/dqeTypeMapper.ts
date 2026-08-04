/**
 * dqeTypeMapper — normalisation multilingue du cycle de vie DQE.
 *
 * Cycle : previsionnel → quotation/devis → decompte → facture
 * Pur TS (aucune dépendance React/Supabase) : utilisable par services et UI.
 */

export type DQEType =
  | 'previsionnel'
  | 'quotation'
  | 'devis'
  | 'decompte'
  | 'facture'
  | 'invoice'
  | 'estimate'
  | 'progress_invoice';

/** Type de ligne persistée (`btp.boq_lines.line_type`) déduit du type DQE. */
export type DQELineType = 'estimate' | 'progress_invoice' | 'invoice';

export const DQE_TYPE_MAPPING: Record<string, DQEType> = {
  // Français — prévisionnel
  previsionnel: 'previsionnel',
  prevision: 'previsionnel',
  previsionnelle: 'previsionnel',
  preliminary: 'previsionnel',

  // Quotation / Devis
  quotation: 'quotation',
  devis: 'devis',
  offre: 'devis',
  proposal: 'devis',
  quote: 'devis',

  // Décompte
  decompte: 'decompte',
  progress: 'decompte',
  avancement: 'decompte',

  // Facture
  facture: 'facture',
  invoice: 'facture',
  facturation: 'facture',

  // Estimation
  estimate: 'estimate',
  estimation: 'estimate',
  dqe: 'estimate',

  // Décompte progressif
  progress_invoice: 'progress_invoice',
  decompte_progressif: 'progress_invoice',
};

const KNOWN_TYPES: DQEType[] = [
  'previsionnel',
  'quotation',
  'devis',
  'decompte',
  'facture',
  'invoice',
  'estimate',
  'progress_invoice',
];

function slug(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Normalise n'importe quelle valeur métier (FR/EN) vers un type DQE canonique. */
export function normalizeDQEType(raw?: string | null): DQEType {
  if (!raw) return 'previsionnel';
  const normalized = slug(String(raw));
  if (DQE_TYPE_MAPPING[normalized]) return DQE_TYPE_MAPPING[normalized];
  if ((KNOWN_TYPES as string[]).includes(normalized)) return normalized as DQEType;
  return 'previsionnel';
}

/** Déduit le `line_type` persisté depuis le type DQE. */
export function getDQELineType(type?: string | null): DQELineType {
  const normalized = normalizeDQEType(type);
  if (normalized === 'facture' || normalized === 'invoice') return 'invoice';
  if (normalized === 'decompte' || normalized === 'progress_invoice') return 'progress_invoice';
  return 'estimate';
}

const DQE_TYPE_LABELS: Record<DQEType, { fr: string; en: string; ar: string }> = {
  previsionnel: { fr: 'Prévisionnel', en: 'Preliminary', ar: 'تقديري' },
  quotation: { fr: 'Devis', en: 'Quotation', ar: 'عرض سعر' },
  devis: { fr: 'Devis', en: 'Quotation', ar: 'عرض سعر' },
  decompte: { fr: 'Décompte', en: 'Progress', ar: 'تقدم' },
  facture: { fr: 'Facture', en: 'Invoice', ar: 'فاتورة' },
  invoice: { fr: 'Facture', en: 'Invoice', ar: 'فاتورة' },
  estimate: { fr: 'Estimation', en: 'Estimate', ar: 'تقدير' },
  progress_invoice: { fr: 'Décompte progressif', en: 'Progress Invoice', ar: 'فاتورة مرحلية' },
};

/** Libellé lisible d'un type DQE dans la langue demandée. */
export function getDQETypeLabel(type?: string | null, lang: 'fr' | 'en' | 'ar' = 'fr'): string {
  const normalized = normalizeDQEType(type);
  return DQE_TYPE_LABELS[normalized]?.[lang] ?? DQE_TYPE_LABELS.previsionnel[lang];
}
