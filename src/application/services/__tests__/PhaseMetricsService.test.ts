import { describe, expect, it } from 'vitest';
import { PhaseMetricsService, normalizeProgressPercent } from '../PhaseMetricsService';

describe('normalizeProgressPercent', () => {
  it('borne les valeurs aberrantes (régression 807500%)', () => {
    expect(normalizeProgressPercent(807500)).toBe(100);
    expect(normalizeProgressPercent(-5)).toBe(0);
    expect(normalizeProgressPercent('26')).toBe(26);
    expect(normalizeProgressPercent(undefined)).toBe(0);
  });
});

describe('PhaseMetricsService.computeProgress', () => {
  it('dérive la progression des tâches quand la base est à 0', () => {
    const result = PhaseMetricsService.computeProgress({
      storedProgress: 0,
      totalTasks: 4,
      completedTasks: 2,
    });
    expect(result.value).toBe(50);
    expect(result.source).toBe('tasks');
  });

  it('signale une divergence entre valeur persistée et faits', () => {
    const result = PhaseMetricsService.computeProgress({
      storedProgress: 90,
      totalTasks: 4,
      completedTasks: 1,
    });
    expect(result.value).toBe(90);
    expect(result.derivedValue).toBe(25);
    expect(result.isDivergent).toBe(true);
  });
});

describe('PhaseMetricsService.computeFinancials', () => {
  it('agrège budget, paiements et dépassement', () => {
    const result = PhaseMetricsService.computeFinancials({
      estimatedCost: 1000,
      actualCost: 200,
      paymentAmounts: [500, 700],
    });
    expect(result.paidAmount).toBe(1200);
    expect(result.spent).toBe(1200);
    expect(result.remaining).toBe(-200);
    expect(result.isOverBudget).toBe(true);
    expect(result.consumptionRate).toBe(120);
  });
});

describe('PhaseMetricsService.computeCompletionReadiness', () => {
  it('bloque la clôture et expose des motifs actionnables', () => {
    const result = PhaseMetricsService.computeCompletionReadiness({
      progress: 60,
      totalTasks: 3,
      completedTasks: 1,
    });
    expect(result.canComplete).toBe(false);
    expect(result.reasonKeys).toContain('phase.completion.progress_insufficient');
    expect(result.reasonKeys).toContain('phase.completion.tasks_pending');
  });

  it('autorise la clôture quand tout est terminé', () => {
    const result = PhaseMetricsService.computeCompletionReadiness({
      progress: 100,
      totalTasks: 2,
      completedTasks: 2,
      stepsCount: 1,
      completedSteps: 1,
    });
    expect(result.canComplete).toBe(true);
  });
});
