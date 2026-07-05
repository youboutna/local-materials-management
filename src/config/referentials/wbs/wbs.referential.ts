/**
 * WBS Referential — Phases × Milestones × Tasks
 * Composable WBS reused by QuantityTakeoff, Tender Estimator, DQE Import,
 * and future BOQ surfaces (situations de travaux, DGD, avenants).
 *
 * Kept as configuration (not DB) so business teams can edit without a migration.
 */

export interface WbsTask {
  id: string;
  label: string;
}

export interface WbsMilestone {
  id: string;
  label: string;
  tasks: WbsTask[];
}

export interface WbsPhase {
  id: string;
  label: string;
  milestones: WbsMilestone[];
}

export const WBS_REFERENTIAL: WbsPhase[] = [
  {
    id: 'gros-oeuvre',
    label: 'Gros œuvre',
    milestones: [
      {
        id: 'fondations',
        label: 'Fondations',
        tasks: [
          { id: 'terrassement', label: 'Terrassement' },
          { id: 'beton-proprete', label: 'Béton de propreté' },
          { id: 'semelles', label: 'Semelles' },
          { id: 'longrines', label: 'Longrines' },
        ],
      },
      {
        id: 'elevation',
        label: 'Élévation',
        tasks: [
          { id: 'poteaux', label: 'Poteaux' },
          { id: 'poutres', label: 'Poutres' },
          { id: 'dalles', label: 'Dalles' },
          { id: 'murs-porteurs', label: 'Murs porteurs' },
        ],
      },
      {
        id: 'hors-eau',
        label: 'Hors d’eau',
        tasks: [
          { id: 'charpente', label: 'Charpente' },
          { id: 'couverture', label: 'Couverture' },
          { id: 'etancheite', label: 'Étanchéité' },
        ],
      },
    ],
  },
  {
    id: 'second-oeuvre',
    label: 'Second œuvre',
    milestones: [
      {
        id: 'hors-air',
        label: 'Hors d’air',
        tasks: [
          { id: 'menuiseries-ext', label: 'Menuiseries extérieures' },
          { id: 'cloisons', label: 'Cloisons' },
          { id: 'isolation', label: 'Isolation' },
        ],
      },
      {
        id: 'reseaux',
        label: 'Réseaux',
        tasks: [
          { id: 'plomberie', label: 'Plomberie' },
          { id: 'electricite', label: 'Électricité' },
          { id: 'cvc', label: 'CVC (chauffage/ventilation/clim)' },
        ],
      },
    ],
  },
  {
    id: 'vrd',
    label: 'VRD',
    milestones: [
      {
        id: 'reseaux-ext',
        label: 'Réseaux extérieurs',
        tasks: [
          { id: 'eau-potable', label: 'Eau potable' },
          { id: 'assainissement', label: 'Assainissement' },
          { id: 'electricite-ext', label: 'Électricité extérieure' },
        ],
      },
      {
        id: 'voirie',
        label: 'Voirie',
        tasks: [
          { id: 'terrassement-vrd', label: 'Terrassement VRD' },
          { id: 'chaussee', label: 'Chaussée' },
          { id: 'bordures', label: 'Bordures & trottoirs' },
        ],
      },
    ],
  },
  {
    id: 'finitions',
    label: 'Finitions',
    milestones: [
      {
        id: 'revetements',
        label: 'Revêtements',
        tasks: [
          { id: 'sols', label: 'Sols' },
          { id: 'murs', label: 'Murs' },
          { id: 'plafonds', label: 'Plafonds' },
          { id: 'peinture', label: 'Peinture' },
        ],
      },
      {
        id: 'equipements',
        label: 'Équipements',
        tasks: [
          { id: 'sanitaires', label: 'Sanitaires' },
          { id: 'menuiseries-int', label: 'Menuiseries intérieures' },
          { id: 'signaletique', label: 'Signalétique' },
        ],
      },
    ],
  },
];

// Convenience lookups
export function getPhase(phaseId?: string | null): WbsPhase | undefined {
  if (!phaseId) return undefined;
  return WBS_REFERENTIAL.find((p) => p.id === phaseId);
}

export function getMilestone(
  phaseId?: string | null,
  milestoneId?: string | null
): WbsMilestone | undefined {
  return getPhase(phaseId)?.milestones.find((m) => m.id === milestoneId);
}

export function getTask(
  phaseId?: string | null,
  milestoneId?: string | null,
  taskId?: string | null
): WbsTask | undefined {
  return getMilestone(phaseId, milestoneId)?.tasks.find((t) => t.id === taskId);
}

export interface WbsRef {
  phaseId?: string;
  milestoneId?: string;
  taskId?: string;
}

export function formatWbsPath(ref: WbsRef): string {
  const p = getPhase(ref.phaseId)?.label;
  const m = getMilestone(ref.phaseId, ref.milestoneId)?.label;
  const t = getTask(ref.phaseId, ref.milestoneId, ref.taskId)?.label;
  return [p, m, t].filter(Boolean).join(' › ');
}
