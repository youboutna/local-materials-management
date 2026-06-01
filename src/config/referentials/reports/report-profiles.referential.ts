/**
 * Report Profiles Referential
 *
 * Profils de rapport (Résumé, Détaillé, Financier, Gestion) → sections + profondeur
 * de hydratation. Plus aucun défaut en dur dans les composants.
 */

export type ReportProfile = 'summary' | 'detailed' | 'financial' | 'project_manager';

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
  | 'ganttChart';

export const ALL_REPORT_SECTIONS: ReportSectionKey[] = [
  'overview', 'financial', 'timeline', 'materials', 'phases', 'inspections',
  'risks', 'kpi', 'milestones', 'bankGuarantees', 'insurance', 'paymentBlocks',
  'suppliers', 'documents', 'employees', 'escalationAlerts', 'evmAnalysis',
  'pertAnalysis', 'ganttChart',
];

export type ReportDepth = 'light' | 'full' | 'financial' | 'managerial';

export interface ReportProfileConfig {
  code: ReportProfile;
  label: { fr: string; en?: string };
  description: { fr: string; en?: string };
  depth: ReportDepth;
  includes: ReportSectionKey[];
}

export const REPORT_PROFILES: Record<ReportProfile, ReportProfileConfig> = {
  summary: {
    code: 'summary',
    label: { fr: 'Résumé exécutif', en: 'Executive summary' },
    description: { fr: 'Rapport concis avec les informations essentielles du projet' },
    depth: 'light',
    includes: ['overview', 'financial', 'timeline', 'phases', 'kpi', 'milestones'],
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
      'evmAnalysis', 'pertAnalysis', 'ganttChart',
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
};
