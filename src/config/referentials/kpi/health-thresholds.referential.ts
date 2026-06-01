/**
 * Health & Performance Thresholds Referential
 *
 * Centralise tous les seuils utilisés pour les badges de santé projet
 * (`ProjectCard.getProjectHealth`, H5) et les métriques de monitoring
 * (`PerformanceMetrics`, H8). Plus aucune valeur magique dans l'UI.
 */

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface ProjectHealthThresholds {
  /** Écart d'avancement (planifié − réel) en points. */
  progressGapWarning: number;
  progressGapCritical: number;
  /** Ratio budget consommé / budget total (0–1). */
  budgetRatioWarning: number;
  budgetRatioCritical: number;
}

export const PROJECT_HEALTH_THRESHOLDS: ProjectHealthThresholds = {
  progressGapWarning: 10,
  progressGapCritical: 20,
  budgetRatioWarning: 0.85,
  budgetRatioCritical: 0.95,
};

export function classifyProjectHealth(
  progressGapPts: number,
  budgetRatio: number,
  t: ProjectHealthThresholds = PROJECT_HEALTH_THRESHOLDS,
): HealthStatus {
  if (progressGapPts > t.progressGapCritical || budgetRatio > t.budgetRatioCritical) return 'critical';
  if (progressGapPts > t.progressGapWarning  || budgetRatio > t.budgetRatioWarning)  return 'warning';
  return 'healthy';
}

// ---------------------------------------------------------------------------
// Performance monitoring thresholds (HTTP + DB + erreurs)
// ---------------------------------------------------------------------------

export interface PerformanceThreshold {
  code: string;
  label: { fr: string };
  unit: 'ms' | '%' | 'count';
  /** Direction du jugement. */
  direction: 'higher_is_better' | 'lower_is_better';
  /** Seuils — convention : valeur ≤ good → vert (lower_is_better), ≤ warning → ambre. */
  good: number;
  warning: number;
}

export const PERFORMANCE_THRESHOLDS: Record<string, PerformanceThreshold> = {
  HTTP_RESPONSE_MS: { code: 'HTTP_RESPONSE_MS', label: { fr: 'Temps de réponse HTTP' }, unit: 'ms',    direction: 'lower_is_better',  good: 200, warning: 500 },
  ERROR_RATE_PCT:   { code: 'ERROR_RATE_PCT',   label: { fr: "Taux d'erreur" },         unit: '%',     direction: 'lower_is_better',  good: 1,   warning: 5 },
  DB_QUERY_MS:      { code: 'DB_QUERY_MS',      label: { fr: 'Temps requête DB' },      unit: 'ms',    direction: 'lower_is_better',  good: 50,  warning: 100 },
  SLOW_QUERIES:     { code: 'SLOW_QUERIES',     label: { fr: 'Requêtes lentes' },       unit: 'count', direction: 'lower_is_better',  good: 0,   warning: 5 },
  RETRY_ATTEMPTS:   { code: 'RETRY_ATTEMPTS',   label: { fr: 'Tentatives de retry' },   unit: 'count', direction: 'lower_is_better',  good: 0,   warning: 5 },
};

export type PerformanceStatus = 'good' | 'warning' | 'critical';

export function classifyPerformance(code: string, value: number): PerformanceStatus {
  const t = PERFORMANCE_THRESHOLDS[code];
  if (!t) return 'good';
  if (t.direction === 'lower_is_better') {
    if (value <= t.good) return 'good';
    if (value <= t.warning) return 'warning';
    return 'critical';
  }
  // higher_is_better
  if (value >= t.good) return 'good';
  if (value >= t.warning) return 'warning';
  return 'critical';
}

/** Mappe un statut de performance vers une classe tailwind sémantique. */
export const PERFORMANCE_STATUS_TEXT_CLASS: Record<PerformanceStatus, string> = {
  good: 'text-green-600',
  warning: 'text-yellow-600',
  critical: 'text-red-600',
};
