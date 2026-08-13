/**
 * MetricAlertRulesService — règles de déclenchement des alertes dérivées des
 * métriques projet (source unique, pure TS, aucun import React).
 *
 * Ces alertes sont *calculées* (non persistées) et remontent dans les trois vues :
 * Dashboard, Suivi & Évaluation (axe « Maîtrise des risques ») et Rapport PDF.
 */

export type DerivedAlertLevel = 'critical' | 'warning' | 'info';

export interface DerivedAlert {
  code: string;
  level: DerivedAlertLevel;
  message: string;
  /** Valeur ayant déclenché la règle (formatée par l'orchestrateur). */
  detail?: string;
}

export interface AlertRuleInput {
  /** SPI (null = non évaluable). */
  spi: number | null;
  /** CPI (null = aucun coût engagé → non évaluable). */
  cpi: number | null;
  /** Avancement pondéré [0..100]. */
  progress: number;
  /** Avancement planifié temporel [0..100] ou null. */
  plannedProgress: number | null;
  /** Écart d'avancement relatif en % ((SPI − 1) × 100), null si SPI indisponible. */
  scheduleGapPercent: number | null;
  /** Nombre de risques ouverts (tous niveaux confondus). */
  openRisksCount: number;
}

const LEVEL_ORDER: Record<DerivedAlertLevel, number> = { critical: 0, warning: 1, info: 2 };

export class MetricAlertRulesService {
  static evaluate(input: AlertRuleInput): DerivedAlert[] {
    const alerts: DerivedAlert[] = [];
    const { spi, cpi, progress, plannedProgress, scheduleGapPercent, openRisksCount } = input;

    // --- Planning ---
    if (spi !== null) {
      if (spi < 0.8) {
        alerts.push({
          code: 'schedule_critical',
          level: 'critical',
          message: 'Retard significatif sur le planning',
          detail: `SPI = ${spi.toFixed(2)}`,
        });
      } else if (spi < 0.95) {
        alerts.push({
          code: 'schedule_warning',
          level: 'warning',
          message: 'Retard modéré sur le planning',
          detail: `SPI = ${spi.toFixed(2)}`,
        });
      }
    }

    // --- Coût ---
    if (cpi === null) {
      alerts.push({
        code: 'cost_not_engaged',
        level: 'warning',
        message: 'Aucune dépense engagée – risque de sous-exécution',
        detail: 'CPI non évaluable',
      });
    } else if (cpi < 0.8) {
      alerts.push({
        code: 'cost_critical',
        level: 'critical',
        message: 'Dépassement budgétaire',
        detail: `CPI = ${cpi.toFixed(2)}`,
      });
    }

    // --- Avancement à mi-parcours ---
    if (plannedProgress !== null && plannedProgress >= 50 && progress < 30) {
      alerts.push({
        code: 'progress_insufficient',
        level: 'critical',
        message: 'Progression insuffisante',
        detail: `${progress.toFixed(2)}% réalisé pour ${plannedProgress.toFixed(2)}% planifié`,
      });
    }

    // --- Risques ouverts ---
    if (openRisksCount > 3) {
      alerts.push({
        code: 'risks_high_count',
        level: 'warning',
        message: 'Nombre élevé de risques non traités',
        detail: `${openRisksCount} risques ouverts`,
      });
    }

    // --- Écart d'avancement défavorable ---
    if (scheduleGapPercent !== null && scheduleGapPercent < -10) {
      alerts.push({
        code: 'progress_gap_unfavourable',
        level: 'critical',
        message: 'Écart défavorable',
        detail: `Écart d'avancement = ${scheduleGapPercent.toFixed(2)}%`,
      });
    }

    return alerts.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
  }
}
