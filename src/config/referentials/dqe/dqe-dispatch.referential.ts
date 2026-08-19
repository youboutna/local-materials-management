/**
 * DQE_DISPATCH_REFERENTIAL — règles de transfert des lignes DQE vers le WBS.
 *
 * Aucune valeur métier codée en dur dans les services ou l'UI : le mapping
 * « Lot → Phase / Jalon / Tâche » est décrit ici et consommé par
 * `BoqDispatchService`.
 */

export interface DqeDispatchRule {
  /** Détection du lot à partir du code / catégorie / métadonnées d'une ligne. */
  lotPattern: string;
  /** Template du code de phase (variables : {lot}). */
  phaseCodeTemplate: string;
  /** Template du libellé de phase (variables : {lot}, {lotLabel}). */
  phaseNameTemplate: string;
  /** Type de phase persisté (normalisé côté transformer). */
  phaseType: string;
  /** Template du libellé de jalon de fin de lot. */
  milestoneTitleTemplate: string;
  /** Poids par défaut du jalon (0-1). */
  milestoneWeight: number;
  /** Statut initial des tâches créées. */
  taskStatus: string;
  /** Priorité initiale des tâches créées. */
  taskPriority: string;
}

export interface DqeDispatchReferential {
  /** Clé de lot appliquée aux lignes sans lot identifiable. */
  fallbackLot: string;
  /** Libellé du lot de repli. */
  fallbackLotLabel: string;
  /** Règle générique appliquée à tous les lots. */
  rule: DqeDispatchRule;
  /** Statuts de lignes DQE éligibles au transfert. */
  transferableStatuses: string[];
  /** Seuil d'écart budgétaire (ratio) déclenchant une alerte lors de la validation. */
  budgetDiscrepancyThreshold: number;
  /** Sévérité de l'alerte budgétaire. */
  budgetAlertSeverity: 'low' | 'medium' | 'high' | 'critical';
  /** Options d'arbitrage proposées au validateur. */
  validationOptions: { code: 'A' | 'B' | 'C'; label: string; description: string }[];
}

export const DQE_DISPATCH_REFERENTIAL: DqeDispatchReferential = {
  fallbackLot: 'HANDOVER',
  fallbackLotLabel: 'Réception & clôture',
  rule: {
    lotPattern: '^\\s*(L\\d+|LOT\\s*\\d+|HANDOVER)',
    phaseCodeTemplate: 'EXECUTION_{lot}',
    phaseNameTemplate: 'Exécution {lotLabel}',
    phaseType: 'execution',
    milestoneTitleTemplate: 'Achèvement {lotLabel}',
    milestoneWeight: 0.1,
    taskStatus: 'pending',
    taskPriority: 'medium',
  },
  transferableStatuses: ['submitted', 'validated', 'invoiced', 'paid'],
  budgetDiscrepancyThreshold: 0.01,
  budgetAlertSeverity: 'high',
  validationOptions: [
    { code: 'A', label: 'Ajuster le budget projet', description: "Le budget du projet est aligné sur le total DQE." },
    { code: 'B', label: 'Ajuster le DQE', description: 'Les lignes DQE sont ramenées au budget restant.' },
    { code: 'C', label: 'Importer avec écart', description: "L'écart est conservé et signalé au chef de projet." },
  ],
};

/** Extrait la clé de lot d'une ligne DQE (code, catégorie ou métadonnée `lot`). */
export function resolveDqeLot(candidates: (string | null | undefined)[]): string {
  const re = new RegExp(DQE_DISPATCH_REFERENTIAL.rule.lotPattern, 'i');
  for (const candidate of candidates) {
    const match = (candidate ?? '').match(re);
    if (match) return match[1].toUpperCase().replace(/\s+/g, '').replace(/^LOT/, 'L');
  }
  return DQE_DISPATCH_REFERENTIAL.fallbackLot;
}

/** Applique un template `{lot}` / `{lotLabel}`. */
export function applyDispatchTemplate(template: string, lot: string, lotLabel?: string): string {
  return template
    .replace(/\{lot\}/g, lot)
    .replace(/\{lotLabel\}/g, lotLabel ?? (lot === DQE_DISPATCH_REFERENTIAL.fallbackLot
      ? DQE_DISPATCH_REFERENTIAL.fallbackLotLabel
      : `lot ${lot}`));
}

/* ------------------------------------------------------------------ *
 * Effort & main d'œuvre — dérivation quantité / unité / délai / taux
 * ------------------------------------------------------------------ */

export interface DqeLaborReferential {
  /** Unités assimilées à de la main d'œuvre (homme·jour). */
  laborDayUnitPattern: string;
  /** Unités assimilées à de la main d'œuvre horaire (homme·heure). */
  laborHourUnitPattern: string;
  /** Unités de durée pure (mois). */
  monthUnitPattern: string;
  /** Heures ouvrées par jour (conversion homme·heure -> homme·jour). */
  hoursPerDay: number;
  /** Jours ouvrés par mois. */
  daysPerMonth: number;
  /** Effectif par défaut mobilisé sur une tâche de main d'œuvre. */
  defaultCrewSize: number;
  /** Durée minimale d'une tâche générée (jours). */
  minDurationDays: number;
  /** Durée par défaut d'une tâche non-main d'œuvre (jours) si aucune date héritée. */
  fallbackDurationDays: number;
}

export const DQE_LABOR_REFERENTIAL: DqeLaborReferential = {
  laborDayUnitPattern: '^\\s*(j|jr|jour(s)?|homme\\s*[·./-]?\\s*jours?|jours?\\s*[·./-]?\\s*homme|hj|jh|h\\s*/\\s*j|j\\s*/\\s*h)\\s*$',
  laborHourUnitPattern: '^\\s*(h|hr|heure(s)?|homme\\s*[·./-]?\\s*heures?|hh)\\s*$',
  monthUnitPattern: '^\\s*(mois|m\\.?j|homme\\s*[·./-]?\\s*mois)\\s*$',
  hoursPerDay: 8,
  daysPerMonth: 22,
  defaultCrewSize: 1,
  minDurationDays: 1,
  fallbackDurationDays: 0,
};

export type DqeEffortKind = 'labor_day' | 'labor_hour' | 'month' | 'quantity';

export interface DqeEffortInput {
  quantity?: number | null;
  unit?: string | null;
  unitPrice?: number | null;
  totalHt?: number | null;
  /** Durée explicitement renseignée sur la ligne DQE (jours). */
  durationDays?: number | null;
  /** Effectif renseigné (sinon référentiel). */
  crewSize?: number | null;
  /** Dates héritées : tâche > étape > jalon > phase > projet. */
  inheritedStart?: string | null;
  inheritedEnd?: string | null;
}

export interface DqeEffortResult {
  kind: DqeEffortKind;
  isLabor: boolean;
  quantity: number;
  unit: string | null;
  /** Homme·jours total (main d'œuvre uniquement). */
  manDays: number | null;
  /** Durée calendaire estimée en jours (0 si indéterminée). */
  durationDays: number;
  /** Taux journalier (MRU/jour) si main d'œuvre, sinon null. */
  dailyRate: number | null;
  estimatedCost: number;
  startDate: string | null;
  endDate: string | null;
  /** Source de la durée retenue (traçabilité). */
  durationSource: 'line' | 'labor' | 'inherited' | 'referential' | 'none';
}

/** Classe une unité DQE selon le référentiel main d'œuvre. */
export function classifyDqeUnit(unit?: string | null): DqeEffortKind {
  const value = (unit ?? '').trim();
  if (!value) return 'quantity';
  if (new RegExp(DQE_LABOR_REFERENTIAL.laborDayUnitPattern, 'i').test(value)) return 'labor_day';
  if (new RegExp(DQE_LABOR_REFERENTIAL.laborHourUnitPattern, 'i').test(value)) return 'labor_hour';
  if (new RegExp(DQE_LABOR_REFERENTIAL.monthUnitPattern, 'i').test(value)) return 'month';
  return 'quantity';
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + Math.max(0, Math.round(days)));
  return d.toISOString();
}

function diffDays(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms > 0 ? Math.ceil(ms / 86_400_000) : 0;
}

/**
 * Dérive quantité / unité / délai / taux journalier d'une ligne DQE.
 * Aucune valeur métier codée en dur : tout provient de DQE_LABOR_REFERENTIAL.
 */
export function resolveDqeEffort(input: DqeEffortInput): DqeEffortResult {
  const ref = DQE_LABOR_REFERENTIAL;
  const quantity = Number(input.quantity ?? 0) || 0;
  const unit = input.unit?.trim() || null;
  const kind = classifyDqeUnit(unit);
  const isLabor = kind === 'labor_day' || kind === 'labor_hour' || kind === 'month';
  const unitPrice = Number(input.unitPrice ?? 0) || 0;
  const estimatedCost = Number(
    input.totalHt ?? (quantity * unitPrice),
  ) || 0;

  const crewSize = Math.max(1, Number(input.crewSize ?? ref.defaultCrewSize) || ref.defaultCrewSize);
  let manDays: number | null = null;
  if (kind === 'labor_day') manDays = quantity;
  else if (kind === 'labor_hour') manDays = quantity / ref.hoursPerDay;
  else if (kind === 'month') manDays = quantity * ref.daysPerMonth;

  let durationDays = 0;
  let durationSource: DqeEffortResult['durationSource'] = 'none';

  if (Number(input.durationDays ?? 0) > 0) {
    durationDays = Number(input.durationDays);
    durationSource = 'line';
  } else if (manDays && manDays > 0) {
    durationDays = Math.max(ref.minDurationDays, Math.ceil(manDays / crewSize));
    durationSource = 'labor';
  } else if (input.inheritedStart && input.inheritedEnd) {
    durationDays = diffDays(input.inheritedStart, input.inheritedEnd);
    durationSource = durationDays > 0 ? 'inherited' : 'none';
  } else if (ref.fallbackDurationDays > 0) {
    durationDays = ref.fallbackDurationDays;
    durationSource = 'referential';
  }

  // Taux journalier : coût total / durée effective (main d'œuvre uniquement).
  let dailyRate: number | null = null;
  if (isLabor) {
    if (kind === 'labor_day' && unitPrice > 0) dailyRate = unitPrice;
    else if (durationDays > 0 && estimatedCost > 0) dailyRate = estimatedCost / durationDays;
    else if (manDays && manDays > 0 && estimatedCost > 0) dailyRate = estimatedCost / manDays;
  }

  const startDate = input.inheritedStart ?? null;
  let endDate = input.inheritedEnd ?? null;
  if (startDate && durationDays > 0) {
    const computedEnd = addDays(startDate, durationDays);
    endDate = !endDate || new Date(computedEnd) < new Date(endDate) ? computedEnd : endDate;
  }

  return {
    kind,
    isLabor,
    quantity,
    unit,
    manDays: manDays !== null ? Number(manDays.toFixed(2)) : null,
    durationDays,
    dailyRate: dailyRate !== null ? Number(dailyRate.toFixed(2)) : null,
    estimatedCost,
    startDate,
    endDate,
    durationSource,
  };
}
