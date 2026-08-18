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
