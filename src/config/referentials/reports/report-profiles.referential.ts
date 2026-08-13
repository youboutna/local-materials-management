/**
 * Report Profiles Referential
 *
 * Profils de rapport (Résumé, Détaillé, Financier, Gestion) → sections + profondeur
 * de hydratation. Plus aucun défaut en dur dans les composants.
 */

export type ReportProfile = 'summary' | 'detailed' | 'financial' | 'technical' | 'project_manager';

export type ReportSectionKey =
  | 'overview'
  | 'financial'
  | 'timeline'
  | 'materials'
  | 'phases'
  | 'inspections'
  | 'risks'
  | 'kpi'
  | 'milestones'
  | 'bankGuarantees'
  | 'insurance'
  | 'paymentBlocks'
  | 'suppliers'
  | 'documents'
  | 'employees'
  | 'escalationAlerts'
  | 'evmAnalysis'
  | 'pertAnalysis'
  | 'ganttChart'
  | 'monitoringEvaluation';

export const ALL_REPORT_SECTIONS: ReportSectionKey[] = [
  'overview', 'financial', 'timeline', 'materials', 'phases', 'inspections',
  'risks', 'kpi', 'milestones', 'bankGuarantees', 'insurance', 'paymentBlocks',
  'suppliers', 'documents', 'employees', 'escalationAlerts', 'evmAnalysis',
  'pertAnalysis', 'ganttChart', 'monitoringEvaluation',
];

export type ReportDepth = 'light' | 'full' | 'financial' | 'managerial';

/** Densité d'affichage d'une section dans un rendu PDF. */
export type SectionDensity = 'line' | 'compact' | 'full';

export interface SectionDisplayConfig {
  /** `line` = une seule ligne de synthèse, `compact` = tableau limité, `full` = tableau complet. */
  density: SectionDensity;
  /** Nombre maximum de lignes affichées (tableaux). */
  maxRows?: number;
}

export interface ReportProfileConfig {
  code: ReportProfile;
  label: { fr: string; en?: string };
  description: { fr: string; en?: string };
  depth: ReportDepth;
  includes: ReportSectionKey[];
  /** Densité par section (surcharge le défaut de densité du profil). */
  sectionDisplay?: Partial<Record<ReportSectionKey, SectionDisplayConfig>>;
}


export const REPORT_PROFILES: Record<ReportProfile, ReportProfileConfig> = {
  summary: {
    code: 'summary',
    label: { fr: 'Résumé exécutif', en: 'Executive summary' },
    description: { fr: 'Rapport concis avec les informations essentielles du projet' },
    depth: 'light',
    includes: [
      'overview', 'financial', 'timeline', 'phases', 'kpi', 'milestones',
      'risks', 'inspections', 'documents', 'evmAnalysis', 'pertAnalysis', 'ganttChart',
    ],
    sectionDisplay: {
      financial: { density: 'compact', maxRows: 3 },
      risks: { density: 'compact', maxRows: 3 },
      milestones: { density: 'line' },
      pertAnalysis: { density: 'line' },
      ganttChart: { density: 'line' },
      evmAnalysis: { density: 'compact' },
    },
  },

  detailed: {
    code: 'detailed',
    label: { fr: 'Rapport détaillé', en: 'Detailed report' },
    description: { fr: 'Rapport complet incluant toutes les sections du projet' },
    depth: 'full',
    includes: [...ALL_REPORT_SECTIONS],
  },
  financial: {
    code: 'financial',
    label: { fr: 'Analyse financière', en: 'Financial analysis' },
    description: { fr: 'Focus sur les flux financiers, EVM, garanties et blocages' },
    depth: 'financial',
    includes: [
      'overview', 'financial', 'phases', 'risks', 'kpi', 'bankGuarantees',
      'insurance', 'paymentBlocks', 'suppliers', 'escalationAlerts', 'evmAnalysis',
      'monitoringEvaluation',
    ],
  },
  technical: {
    code: 'technical',
    label: { fr: 'Rapport technique', en: 'Technical report' },
    description: { fr: 'Focus exécution technique : phases, jalons, matériaux, inspections, PERT/Gantt' },
    depth: 'full',
    includes: [
      'overview', 'timeline', 'materials', 'phases', 'inspections', 'milestones',
      'documents', 'employees', 'risks', 'kpi', 'pertAnalysis', 'ganttChart',
      'monitoringEvaluation',
    ],
  },
  project_manager: {
    code: 'project_manager',
    label: { fr: 'Chef de projet', en: 'Project manager' },
    description: { fr: 'Vue gestion : planning, ressources, conformité, inspections' },
    depth: 'managerial',
    includes: [
      'overview', 'financial', 'timeline', 'materials', 'phases', 'inspections',
      'risks', 'kpi', 'milestones', 'documents', 'employees', 'escalationAlerts',
      'evmAnalysis', 'pertAnalysis', 'ganttChart', 'monitoringEvaluation',
    ],
  },
};

export function getReportProfile(code: ReportProfile): ReportProfileConfig {
  return REPORT_PROFILES[code] ?? REPORT_PROFILES.detailed;
}

/**
 * Returns the default `Record<ReportSectionKey, boolean>` for a given profile.
 * Sections in `includes` → true, others → false.
 */
export function defaultSectionsFor(
  code: ReportProfile,
): Record<ReportSectionKey, boolean> {
  const profile = getReportProfile(code);
  const set = new Set(profile.includes);
  return ALL_REPORT_SECTIONS.reduce(
    (acc, key) => {
      acc[key] = set.has(key);
      return acc;
    },
    {} as Record<ReportSectionKey, boolean>,
  );
}

/** Section labels for UI (single source of truth, no hardcoded labels in components). */
export const REPORT_SECTION_LABELS: Record<ReportSectionKey, string> = {
  overview: 'Aperçu général',
  financial: 'Résumé financier',
  timeline: 'Calendrier',
  materials: 'Matériaux',
  phases: 'Phases',
  inspections: 'Inspections',
  risks: 'Analyse des risques',
  kpi: 'Indicateurs de performance',
  milestones: 'Jalons',
  bankGuarantees: 'Garanties bancaires',
  insurance: 'Assurances',
  paymentBlocks: 'Blocages de paiements',
  suppliers: 'Fournisseurs',
  documents: 'Documents',
  employees: 'Employés',
  escalationAlerts: "Alertes d'escalade",
  evmAnalysis: 'Analyse EVM',
  pertAnalysis: 'Analyse PERT',
  ganttChart: 'Diagramme de Gantt',
  monitoringEvaluation: 'Suivi & Évaluation',
};

/** Densité par défaut selon la profondeur du profil (aucun défaut en dur dans le PDF). */
const DEFAULT_DENSITY_BY_DEPTH: Record<ReportDepth, SectionDisplayConfig> = {
  light: { density: 'compact', maxRows: 3 },
  full: { density: 'full' },
  financial: { density: 'full', maxRows: 10 },
  managerial: { density: 'compact', maxRows: 5 },
};

/**
 * Densité d'affichage d'une section pour un profil donné.
 * Priorité : `sectionDisplay` du profil → défaut de la profondeur.
 */
export function getSectionDisplay(
  code: ReportProfile,
  section: ReportSectionKey,
): SectionDisplayConfig {
  const profile = getReportProfile(code);
  return profile.sectionDisplay?.[section] ?? DEFAULT_DENSITY_BY_DEPTH[profile.depth];
}

/** Nombre max de lignes d'un tableau de section (Infinity si non limité). */
export function getSectionMaxRows(
  code: ReportProfile,
  section: ReportSectionKey,
  fallback = Number.POSITIVE_INFINITY,
): number {
  return getSectionDisplay(code, section).maxRows ?? fallback;
}
