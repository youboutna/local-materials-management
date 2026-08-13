/**
 * ProjectMetricsOrchestrator — SOURCE UNIQUE DE VÉRITÉ des métriques projet.
 *
 * Agrège PhaseWeightingService (pondération), EvmService (EVM),
 * MetricAlertRulesService (alertes dérivées) et le référentiel « Suivi &
 * Évaluation » (7 axes), puis applique le formatage unifié (espace comme
 * séparateur de milliers, virgule décimale, 2 décimales).
 *
 * Les trois consommateurs — Dashboard Monitoring, tableau Suivi & Évaluation,
 * Rapport PDF — lisent EXCLUSIVEMENT ce jeu de données : plus de calcul local.
 *
 * Pure TS — aucun import React.
 */

import { EvmService, type EvmResult } from '@/application/services/EvmService';
import { PertService, type PertActivityInput, type PertResult } from '@/application/services/PertService';
import {
  PhaseWeightingService,
  type PhaseWeight,
  type WeightablePhase,
} from '@/application/services/PhaseWeightingService';
import {
  MetricAlertRulesService,
  type DerivedAlert,
} from '@/application/services/MetricAlertRulesService';
import {
  buildMonitoringInsights,
  type MonitoringInsight,
} from '@/utils/monitoringInsights';
import {
  formatAmount2,
  formatIndex2,
  formatNumber2,
  formatPercent2,
  formatSigned2,
} from '@/utils/reportNumbers';

export interface OrchestratorPhaseInput extends WeightablePhase {
  status?: string | null;
  actualCost?: number | null;
}

export interface ProjectMetricsInput {
  project: {
    id?: string;
    title?: string;
    budget?: number | null;
    progress?: number | null;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    interventionZones?: unknown[] | null;
    currency?: string | null;
  };
  phases?: OrchestratorPhaseInput[];
  /** Coût réel constaté hors phases (paiements, décomptes…). */
  actualCost?: number | null;
  inspectionsCount?: number;
  documentsCount?: number;
  /** Risques (bruts) — l'ouverture est déduite du statut. */
  risks?: Array<{ status?: string | null; impact?: string | null; severity?: string | null; riskLevel?: string | null }>;
  /**
   * Durée PERT estimée (jours) — rétro-compatibilité. Si absent, le PERT est
   * calculé par `PertService` depuis `pertActivities` (ou les phases).
   */
  pertExpectedDuration?: number | null;
  /** Activités PERT (tâches ou phases). À défaut, les phases sont utilisées. */
  pertActivities?: PertActivityInput[];
  /** Jalons projet — source UNIQUE de la progression jalons. */
  milestones?: Array<{ id?: string; name?: string | null; status?: string | null; progress?: number | null; dueDate?: string | Date | null }>;
  asOf?: Date;
}

export interface MilestoneProgressModel {
  total: number;
  completed: number;
  overdue: number;
  /** Progression jalons [0..100] — moyenne des avancements, 100 si complété. */
  progress: number;
}

export interface HealthScoreModel {
  /** Score global [0..100] — cohérent avec les alertes actives. */
  overallScore: number;
  schedule: number;
  cost: number;
  scope: number;
  risk: number;
  status: 'critical' | 'at_risk' | 'acceptable' | 'healthy';
  statusLabel: string;
}


export interface GanttPhaseModel {
  id: string;
  name: string;
  start: number;
  end: number;
  /** Avancement BRUT de la phase [0..100]. */
  progress: number;
  /** Poids normalisé [0..1]. */
  weight: number;
  /** Source du poids : manuel / budget / durée / égal. */
  weightBasis: string;
  weightBasisLabel: string;
  status?: string | null;
}

export interface GanttModel {
  start: number;
  end: number;
  today: number | null;
  years: number[];
  phases: GanttPhaseModel[];
  /** Jalons de progression (0/25/50/75/100) positionnés sur la frise. */
  milestones: Array<{ label: string; ratio: number; reached: boolean; date: number }>;
  isEmpty: boolean;
}

export interface ProjectMetrics {
  evm: EvmResult;
  /** Avancement projet PONDÉRÉ (valeur canonique unique). */
  progress: number;
  progressBasis: string;
  progressBasisLabel: string;
  weights: PhaseWeight[];
  /** Durée de référence unique = dates projet (jours). */
  referenceDurationDays: number | null;
  /** Durée PERT — estimation uniquement. */
  pertDurationDays: number | null;
  budget: number;
  actualCost: number;
  /** Écart budget : 0 quand aucun coût engagé (non évaluable). */
  budgetVariance: number;
  budgetVarianceEvaluable: boolean;
  budgetCommitmentRate: number;
  /** Écart d'avancement relatif en % = (SPI − 1) × 100 (négatif = retard). */
  scheduleGapPercent: number | null;
  costPerformanceLabel: string;
  schedulePerformanceLabel: string;
  alerts: DerivedAlert[];
  insights: MonitoringInsight[];
  gantt: GanttModel;
  /** Analyse PERT unique (estimation probabiliste). */
  pert: PertResult;
  /** Score de santé UNIQUE, cohérent avec les alertes. */
  health: HealthScoreModel;
  /** Progression jalons — source unique. */
  milestoneProgress: MilestoneProgressModel;
  /** Chaînes prêtes à l'affichage — formatage unifié garanti. */
  formatted: {
    progress: string;
    plannedProgress: string;
    budget: string;
    actualCost: string;
    budgetVariance: string;
    budgetCommitmentRate: string;
    spi: string;
    cpi: string;
    plannedValue: string;
    earnedValue: string;
    scheduleVariance: string;
    costVariance: string;
    referenceDuration: string;
    pertDuration: string;
    scheduleGap: string;
    healthScore: string;
    milestoneProgress: string;
  };

}

const WEIGHT_BASIS_LABELS: Record<string, string> = {
  explicit: 'manuel',
  budget: 'budget',
  duration: 'durée',
  equal: 'égal',
  project: 'projet',
};

const num = (value: unknown): number => {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? (n as number) : 0;
};

const clamp100 = (value: unknown): number => Math.max(0, Math.min(100, num(value)));

const RESOLVED_RISK_STATUSES = ['mitigated', 'closed', 'resolu', 'résolu', 'resolved', 'accepted'];

export class ProjectMetricsOrchestrator {
  static compute(input: ProjectMetricsInput): ProjectMetrics {
    const asOf = input.asOf ?? new Date();
    const project = input.project || {};
    const currency = project.currency || 'MRU';
    const phases = (input.phases || []).filter(Boolean);

    // --- 1. Pondération & avancement canonique ---
    const weighted = PhaseWeightingService.computeWeightedProgress(phases);
    const evm = EvmService.compute({
      budget: num(project.budget),
      progress: project.progress ?? 0,
      startDate: project.startDate ?? null,
      endDate: project.endDate ?? null,
      actualCost: input.actualCost ?? 0,
      phases,
      asOf,
    });

    const progress = evm.progress;
    const progressBasis = weighted.isEmpty ? 'project' : weighted.basis;

    // --- 2. Durées : référence = dates projet, PERT = estimation ---
    const referenceDurationDays =
      project.startDate && project.endDate
        ? Math.max(
            0,
            Math.round(
              (new Date(project.endDate as string).getTime() -
                new Date(project.startDate as string).getTime()) /
                86400000,
            ),
          )
        : null;

    // --- 3. Budget : écart non évaluable si aucun coût engagé ---
    const budget = num(project.budget);
    const actualCost = evm.actualCost;
    const budgetVarianceEvaluable = actualCost > 0;
    const budgetVariance = budgetVarianceEvaluable ? Number((actualCost - budget).toFixed(2)) : 0;

    // --- 4. Écart d'avancement relatif, cohérent avec le SPI ---
    const scheduleGapPercent =
      evm.schedulePerformanceIndex !== null
        ? Number(((evm.schedulePerformanceIndex - 1) * 100).toFixed(2))
        : null;

    // --- 5. Alertes dérivées ---
    const openRisksCount = (input.risks || []).filter((r) => {
      const status = String(r?.status ?? '').toLowerCase();
      return !RESOLVED_RISK_STATUSES.some((s) => status.includes(s));
    }).length;

    const alerts = MetricAlertRulesService.evaluate({
      spi: evm.schedulePerformanceIndex,
      cpi: evm.costPerformanceIndex,
      progress,
      plannedProgress: evm.plannedProgress,
      scheduleGapPercent,
      openRisksCount,
    });

    // --- 6. Suivi & Évaluation (7 axes) alimenté par les métriques + alertes ---
    const insights = buildMonitoringInsights({
      progress,
      budget,
      actualCost,
      phasesCount: phases.length,
      interventionZonesCount: Array.isArray(project.interventionZones)
        ? project.interventionZones.length
        : 0,
      inspectionsCount: input.inspectionsCount ?? 0,
      documentsCount: input.documentsCount ?? 0,
      activeAlertsCount: alerts.filter((a) => a.level !== 'info').length,
    });

    // --- 7. Modèle Gantt réutilisable (calendrier réel) ---
    const gantt = this.buildGantt(project, phases, weighted.weights, progress, asOf);

    // --- 8. PERT : moteur unique (activités fournies, sinon phases) ---
    const pert = PertService.compute(
      input.pertActivities && input.pertActivities.length > 0
        ? input.pertActivities
        : phases.map((p, i) => ({
            id: p.id || `phase-${i}`,
            name: p.name,
            startDate: p.startDate ?? null,
            endDate: p.endDate ?? null,
          })),
    );
    const pertDurationDays =
      input.pertExpectedDuration != null
        ? Number(num(input.pertExpectedDuration).toFixed(2))
        : pert.isEstimated
          ? pert.totalExpectedDuration
          : null;

    // --- 9. Progression jalons : source UNIQUE ---
    const milestoneProgress = this.buildMilestoneProgress(input.milestones, asOf);

    // --- 10. Score de santé UNIQUE, dérivé des métriques et des alertes ---
    const health = this.buildHealth({
      progress,
      plannedProgress: evm.plannedProgress,
      spi: evm.schedulePerformanceIndex,
      cpi: evm.costPerformanceIndex,
      openRisksCount,
      alerts,
    });


    const costPerformanceLabel =
      evm.costPerformanceIndex === null
        ? 'Non évaluable (aucune dépense engagée)'
        : evm.costPerformanceIndex >= 1
          ? 'Excellent'
          : evm.costPerformanceIndex >= 0.9
            ? 'Satisfaisant'
            : 'À améliorer';

    const schedulePerformanceLabel =
      evm.schedulePerformanceIndex === null
        ? 'Non évaluable (projet non démarré)'
        : evm.schedulePerformanceIndex >= 1
          ? 'Excellent'
          : evm.schedulePerformanceIndex >= 0.9
            ? 'Satisfaisant'
            : 'À améliorer';

    return {
      evm,
      progress,
      progressBasis,
      progressBasisLabel: WEIGHT_BASIS_LABELS[progressBasis] ?? progressBasis,
      weights: weighted.weights,
      referenceDurationDays,
      pertDurationDays,
      budget,
      actualCost,
      budgetVariance,
      budgetVarianceEvaluable,
      budgetCommitmentRate: evm.budgetCommitmentRate,
      scheduleGapPercent,
      costPerformanceLabel,
      schedulePerformanceLabel,
      alerts,
      insights,
      gantt,
      pert,
      health,
      milestoneProgress,
      formatted: {
        progress: formatPercent2(progress),
        plannedProgress: evm.plannedProgress === null ? 'N/A' : formatPercent2(evm.plannedProgress),
        budget: formatAmount2(budget, currency),
        actualCost: formatAmount2(actualCost, currency),
        budgetVariance: budgetVarianceEvaluable
          ? formatAmount2(budgetVariance, currency)
          : `${formatAmount2(0, currency)} (non évaluable)`,
        budgetCommitmentRate: formatPercent2(evm.budgetCommitmentRate),
        spi: formatIndex2(evm.schedulePerformanceIndex ?? 0, evm.schedulePerformanceIndex !== null),
        cpi: formatIndex2(evm.costPerformanceIndex ?? 0, evm.costPerformanceIndex !== null),
        plannedValue: formatAmount2(evm.plannedValue, currency),
        earnedValue: formatAmount2(evm.earnedValue, currency),
        scheduleVariance: formatAmount2(evm.scheduleVariance, currency),
        costVariance:
          evm.costVariance === null
            ? `${formatAmount2(0, currency)} (non évaluable)`
            : formatAmount2(evm.costVariance, currency),
        referenceDuration:
          referenceDurationDays === null ? 'Non renseignée' : `${formatNumber2(referenceDurationDays)} jours`,
        pertDuration:
          pertDurationDays === null
            ? 'Non estimée'
            : `${formatNumber2(pertDurationDays)} jours (estimation)`,
        scheduleGap: scheduleGapPercent === null ? 'Non évaluable' : formatSigned2(scheduleGapPercent, '%'),
        healthScore: `${formatNumber2(health.overallScore)}/100`,
        milestoneProgress: formatPercent2(milestoneProgress.progress),
      },
    };
  }

  /** Progression jalons — source UNIQUE (remplace MilestoneService.getMilestoneProgress). */
  static buildMilestoneProgress(
    milestones: ProjectMetricsInput['milestones'],
    asOf: Date = new Date(),
  ): MilestoneProgressModel {
    const list = (milestones || []).filter(Boolean);
    if (list.length === 0) return { total: 0, completed: 0, overdue: 0, progress: 0 };

    const isCompleted = (m: NonNullable<ProjectMetricsInput['milestones']>[number]) => {
      const status = String(m?.status ?? '').toLowerCase();
      return status.includes('complet') || status.includes('termin') || status.includes('achiev') || clamp100(m?.progress) >= 100;
    };

    const completed = list.filter(isCompleted).length;
    const overdue = list.filter((m) => {
      if (isCompleted(m)) return false;
      const due = m?.dueDate ? new Date(m.dueDate as string).getTime() : NaN;
      return Number.isFinite(due) && due < asOf.getTime();
    }).length;

    const progress = Number(
      (
        list.reduce((sum, m) => sum + (isCompleted(m) ? 100 : clamp100(m?.progress)), 0) / list.length
      ).toFixed(2),
    );

    return { total: list.length, completed, overdue, progress };
  }

  /**
   * Score de santé UNIQUE : moyenne pondérée planning/coût/périmètre/risques,
   * puis pénalités par alerte (critique −15, avertissement −5). Garantit la
   * cohérence « 3 alertes critiques ⇒ score < 30 ».
   */
  static buildHealth(input: {
    progress: number;
    plannedProgress: number | null;
    spi: number | null;
    cpi: number | null;
    openRisksCount: number;
    alerts: DerivedAlert[];
  }): HealthScoreModel {
    const toScore = (index: number | null): number =>
      index === null ? 60 : Math.max(0, Math.min(100, Math.round(index * 100)));

    const schedule = toScore(input.spi);
    const cost = toScore(input.cpi);
    const scope = Math.round(clamp100(input.progress));
    const risk = Math.max(0, 100 - input.openRisksCount * 15);

    const base = (schedule * 0.3 + cost * 0.25 + scope * 0.25 + risk * 0.2);
    const penalty = input.alerts.reduce(
      (sum, a) => sum + (a.level === 'critical' ? 15 : a.level === 'warning' ? 5 : 0),
      0,
    );
    const overallScore = Math.max(0, Math.min(100, Math.round(base - penalty)));

    const status: HealthScoreModel['status'] =
      overallScore < 30 ? 'critical' : overallScore < 55 ? 'at_risk' : overallScore < 75 ? 'acceptable' : 'healthy';

    return {
      overallScore,
      schedule,
      cost,
      scope,
      risk,
      status,
      statusLabel: {
        critical: 'Critique',
        at_risk: 'À risque',
        acceptable: 'Acceptable',
        healthy: 'Bonne santé',
      }[status],
    };
  }


  /** Modèle de données du Gantt réutilisable (PDF & UI partagent ce modèle). */
  static buildGantt(
    project: ProjectMetricsInput['project'],
    phases: OrchestratorPhaseInput[],
    weights: PhaseWeight[],
    progress: number,
    asOf: Date,
  ): GanttModel {
    const weightById = new Map(weights.map((w) => [w.phaseId, w]));

    const rows: GanttPhaseModel[] = (phases || [])
      .map((phase, index) => {
        const id = phase.id || `phase-${index}`;
        const w = weightById.get(id);
        const start = new Date(
          (phase.startDate as string) ?? (project.startDate as string) ?? asOf.toISOString(),
        ).getTime();
        const end = new Date(
          (phase.endDate as string) ?? (project.endDate as string) ?? asOf.toISOString(),
        ).getTime();
        const basis = w?.basis ?? 'equal';
        return {
          id,
          name: phase.name || `Phase ${index + 1}`,
          start,
          end,
          progress: clamp100(phase.progress),
          weight: w?.weight ?? (phases.length ? 1 / phases.length : 0),
          weightBasis: basis,
          weightBasisLabel: WEIGHT_BASIS_LABELS[basis] ?? basis,
          status: phase.status ?? null,
        };
      })
      .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start);

    const projectStart = project.startDate ? new Date(project.startDate as string).getTime() : NaN;
    const projectEnd = project.endDate ? new Date(project.endDate as string).getTime() : NaN;

    const candidateStarts = [...rows.map((r) => r.start), projectStart].filter((n) => Number.isFinite(n));
    const candidateEnds = [...rows.map((r) => r.end), projectEnd].filter((n) => Number.isFinite(n));

    if (candidateStarts.length === 0 || candidateEnds.length === 0) {
      return { start: 0, end: 0, today: null, years: [], phases: [], milestones: [], isEmpty: true };
    }

    const start = Math.min(...candidateStarts);
    const end = Math.max(...candidateEnds);
    const span = end - start || 1;
    const now = asOf.getTime();

    const startYear = new Date(start).getFullYear();
    const endYear = new Date(end).getFullYear();
    const years = Array.from({ length: Math.max(1, endYear - startYear + 1) }, (_, i) => startYear + i);

    const milestones = [0, 25, 50, 75, 100].map((ratio) => ({
      label: `Jalon ${ratio}%`,
      ratio,
      reached: progress >= ratio,
      date: start + (span * ratio) / 100,
    }));

    return {
      start,
      end,
      today: now >= start && now <= end ? now : null,
      years,
      phases: rows,
      milestones,
      isEmpty: rows.length === 0,
    };
  }
}
