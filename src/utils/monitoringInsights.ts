/**
 * Dérive les indicateurs « Suivi & Évaluation » d'un projet à partir des
 * données réelles hydratées par l'architecture (aucune valeur simulée).
 * Pure TypeScript — applicable à tout type de projet.
 */
import {
  MONITORING_AXIS_LIST,
  type MonitoringAxis,
  type MonitoringAxisCode,
} from '@/config/referentials/reports/monitoring-indicators.referential';

export interface MonitoringInsightInput {
  progress?: number | null;
  budget?: number | null;
  actualCost?: number | null;
  phasesCount?: number;
  interventionZonesCount?: number;
  inspectionsCount?: number;
  documentsCount?: number;
  /** @deprecated remplacé par `activeAlertsCount` (AlertService dérivé). */
  highRisksCount?: number;
  /** Alertes actives (MetricAlertRulesService) — axe « Maîtrise des risques ». */
  activeAlertsCount?: number;
}

export type MonitoringAppreciation = 'good' | 'warning' | 'critical' | 'unknown';

export interface MonitoringInsight {
  code: MonitoringAxisCode;
  label: string;
  decisionQuestion: string;
  indicatorLabel: string;
  /** Valeur formatée à 2 décimales, ou 'n/d'. */
  value: string;
  rawValue: number | null;
  appreciation: MonitoringAppreciation;
  appreciationLabel: string;
}

const twoDigits = (value: number | null): string =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : 'n/d';

const APPRECIATION_LABELS: Record<MonitoringAppreciation, string> = {
  good: 'Satisfaisant',
  warning: 'À surveiller',
  critical: 'Critique',
  unknown: 'Non renseigné',
};

function appreciate(axis: MonitoringAxis, value: number | null): MonitoringAppreciation {
  if (value === null || !Number.isFinite(value)) return 'unknown';
  if (!axis.thresholds) return 'good';
  const { good, warning } = axis.thresholds;
  if (axis.lowerIsBetter) {
    if (value <= good) return 'good';
    if (value <= warning) return 'warning';
    return 'critical';
  }
  if (value >= good) return 'good';
  if (value >= warning) return 'warning';
  return 'critical';
}

function resolveValue(code: MonitoringAxisCode, input: MonitoringInsightInput): number | null {
  const num = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;

  switch (code) {
    case 'planification':
      return num(input.phasesCount);
    case 'avancement':
      return num(input.progress);
    case 'execution_budgetaire':
      return input.budget && input.budget > 0
        ? ((input.actualCost || 0) / input.budget) * 100
        : null;
    case 'couverture_territoriale':
      return num(input.interventionZonesCount);
    case 'controle_qualite':
      return num(input.inspectionsCount);
    case 'documentation':
      return num(input.documentsCount);
    case 'maitrise_risques':
      return num(input.activeAlertsCount) ?? num(input.highRisksCount);
    default:
      return null;
  }
}

export function buildMonitoringInsights(input: MonitoringInsightInput): MonitoringInsight[] {
  return MONITORING_AXIS_LIST.map((axis) => {
    const rawValue = resolveValue(axis.code, input);
    const appreciation = appreciate(axis, rawValue);
    return {
      code: axis.code,
      label: axis.label,
      decisionQuestion: axis.decisionQuestion,
      indicatorLabel: axis.indicatorLabel,
      value: twoDigits(rawValue),
      rawValue,
      appreciation,
      appreciationLabel: APPRECIATION_LABELS[appreciation],
    };
  });
}
