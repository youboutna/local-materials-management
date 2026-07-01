/**
 * DQE → Projet Mapping Referential
 * Règles de transformation d'un Devis Quantitatif Estimatif (lauréat)
 * en structure projet (phases, tâches, jalons, budget).
 *
 * Consommé par AwardedTenderToProjectService et AwardedTenderPreviewDialog.
 */

export type DqeMappingRule = 'lot_to_phase' | 'sublot_to_task' | 'item_to_task' | 'flat_all_tasks';

export interface DqeMappingConfig {
  /** Règle principale. Par défaut : lot=phase / sous-lot=tâche. */
  rule: DqeMappingRule;
  /** Seuils (%) de génération de jalons sur chaque phase (montant). */
  milestoneThresholds: number[];
  /** Durée par défaut d'une tâche si non renseignée (jours). */
  defaultTaskDurationDays: number;
  /** Durée par défaut d'une phase si non renseignée (jours). */
  defaultPhaseDurationDays: number;
  /** Poids de la première phase (démarrage) — bonus jours. */
  kickoffBufferDays: number;
  /** Générer un jalon final de réception. */
  generateFinalReceptionMilestone: boolean;
}

export const DEFAULT_DQE_MAPPING: DqeMappingConfig = {
  rule: 'lot_to_phase',
  milestoneThresholds: [25, 50, 75, 100],
  defaultTaskDurationDays: 15,
  defaultPhaseDurationDays: 60,
  kickoffBufferDays: 7,
  generateFinalReceptionMilestone: true,
};

/** Structure normalisée d'une ligne DQE (import Excel/PDF/manuel). */
export interface DqeLine {
  lotCode?: string;
  lotLabel?: string;
  sublotCode?: string;
  sublotLabel?: string;
  itemCode: string;
  designation: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/** Structure de sortie prête à être appliquée au projet. */
export interface MappedPhase {
  order: number;
  name: string;
  description?: string;
  amount: number;
  durationDays: number;
  tasks: MappedTask[];
  milestones: MappedMilestone[];
}

export interface MappedTask {
  order: number;
  name: string;
  amount: number;
  durationDays: number;
  quantity?: number;
  unit?: string;
  itemCode?: string;
}

export interface MappedMilestone {
  name: string;
  progressPercent: number;
  targetAmount: number;
}

/** Applique la règle de mapping à un ensemble de lignes DQE. */
export function mapDqeToProjectStructure(
  lines: DqeLine[],
  config: DqeMappingConfig = DEFAULT_DQE_MAPPING,
): MappedPhase[] {
  if (!lines || lines.length === 0) return [];

  if (config.rule === 'flat_all_tasks') {
    // Une seule phase, chaque ligne = tâche.
    const total = lines.reduce((s, l) => s + l.totalPrice, 0);
    return [{
      order: 1,
      name: 'Exécution',
      amount: total,
      durationDays: config.defaultPhaseDurationDays,
      tasks: lines.map((l, i) => ({
        order: i + 1,
        name: `${l.itemCode} — ${l.designation}`.slice(0, 200),
        amount: l.totalPrice,
        durationDays: config.defaultTaskDurationDays,
        quantity: l.quantity,
        unit: l.unit,
        itemCode: l.itemCode,
      })),
      milestones: buildMilestones('Exécution', total, config),
    }];
  }

  // Règle par défaut : lot → phase, sous-lot (ou ligne) → tâche.
  const lotMap = new Map<string, { label: string; lines: DqeLine[] }>();
  for (const line of lines) {
    const key = line.lotCode || line.lotLabel || 'LOT_DEFAULT';
    if (!lotMap.has(key)) {
      lotMap.set(key, { label: line.lotLabel || `Lot ${key}`, lines: [] });
    }
    lotMap.get(key)!.lines.push(line);
  }

  const phases: MappedPhase[] = [];
  let phaseOrder = 1;
  for (const [_, { label, lines: lotLines }] of lotMap) {
    const phaseAmount = lotLines.reduce((s, l) => s + l.totalPrice, 0);
    const tasks = buildTasks(lotLines, config);
    phases.push({
      order: phaseOrder++,
      name: label,
      amount: phaseAmount,
      durationDays: config.defaultPhaseDurationDays,
      tasks,
      milestones: buildMilestones(label, phaseAmount, config),
    });
  }

  return phases;
}

function buildTasks(lines: DqeLine[], config: DqeMappingConfig): MappedTask[] {
  // Regroupement par sous-lot si présent, sinon 1 tâche par ligne.
  const hasSublots = lines.some((l) => l.sublotCode || l.sublotLabel);
  if (!hasSublots) {
    return lines.map((l, i) => ({
      order: i + 1,
      name: `${l.itemCode} — ${l.designation}`.slice(0, 200),
      amount: l.totalPrice,
      durationDays: config.defaultTaskDurationDays,
      quantity: l.quantity,
      unit: l.unit,
      itemCode: l.itemCode,
    }));
  }
  const subMap = new Map<string, { label: string; total: number; itemCodes: string[] }>();
  for (const l of lines) {
    const key = l.sublotCode || l.sublotLabel || 'SUB_DEFAULT';
    const label = l.sublotLabel || `Sous-lot ${key}`;
    const entry = subMap.get(key) ?? { label, total: 0, itemCodes: [] };
    entry.total += l.totalPrice;
    entry.itemCodes.push(l.itemCode);
    subMap.set(key, entry);
  }
  return Array.from(subMap.values()).map((s, i) => ({
    order: i + 1,
    name: s.label,
    amount: s.total,
    durationDays: config.defaultTaskDurationDays,
    itemCode: s.itemCodes.join(', ').slice(0, 100),
  }));
}

function buildMilestones(phaseName: string, phaseAmount: number, config: DqeMappingConfig): MappedMilestone[] {
  const list: MappedMilestone[] = config.milestoneThresholds.map((pct) => ({
    name: `${phaseName} — ${pct}%`,
    progressPercent: pct,
    targetAmount: Math.round(phaseAmount * (pct / 100)),
  }));
  if (config.generateFinalReceptionMilestone && !list.some((m) => m.progressPercent === 100)) {
    list.push({ name: `${phaseName} — Réception`, progressPercent: 100, targetAmount: phaseAmount });
  }
  return list;
}

export function computeDqeTotals(lines: DqeLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.totalPrice, 0);
  const lotCount = new Set(lines.map((l) => l.lotCode || l.lotLabel || 'DEFAULT')).size;
  return { subtotal, lotCount, itemCount: lines.length };
}
