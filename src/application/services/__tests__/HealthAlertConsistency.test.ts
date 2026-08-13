import { describe, expect, it } from 'vitest';
import { MetricAlertRulesService } from '@/application/services/MetricAlertRulesService';
import { ProjectMetricsOrchestrator } from '@/application/services/ProjectMetricsOrchestrator';

/**
 * Preuve de cohérence score de santé ⇔ alertes actives (MetricAlertRulesService) :
 * un projet avec CPI non évaluable ET SPI < 0,8 ne peut jamais afficher un score
 * de santé « bon » (statut `healthy`, seuil ≥ 75).
 */
describe('Cohérence score de santé / alertes actives', () => {
  it('CPI non évaluable + SPI < 0,8 ⇒ au moins une alerte critique/avertissement et score non « bon »', () => {
    const spi = 0.65;
    const cpi = null;
    const alerts = MetricAlertRulesService.evaluate({
      spi,
      cpi,
      progress: 60,
      plannedProgress: 70,
      scheduleGapPercent: (spi - 1) * 100,
      openRisksCount: 0,
    });

    expect(alerts.some((a) => a.code === 'schedule_critical')).toBe(true);
    expect(alerts.some((a) => a.code === 'cost_not_engaged')).toBe(true);

    const health = ProjectMetricsOrchestrator.buildHealth({
      progress: 60,
      plannedProgress: 70,
      spi,
      cpi,
      openRisksCount: 0,
      alerts,
    });

    expect(health.overallScore).toBeLessThan(75);
    expect(health.status).not.toBe('healthy');
  });

  it('projet sain (SPI/CPI ≥ 1, aucune alerte critique) peut atteindre un score « bon »', () => {
    const spi = 1.05;
    const cpi = 1.05;
    const alerts = MetricAlertRulesService.evaluate({
      spi,
      cpi,
      progress: 95,
      plannedProgress: 90,
      scheduleGapPercent: (spi - 1) * 100,
      openRisksCount: 0,
    });

    expect(alerts.every((a) => a.level !== 'critical')).toBe(true);

    const health = ProjectMetricsOrchestrator.buildHealth({
      progress: 95,
      plannedProgress: 90,
      spi,
      cpi,
      openRisksCount: 0,
      alerts,
    });

    expect(health.overallScore).toBeGreaterThanOrEqual(75);
    expect(health.status).toBe('healthy');
  });

  it('le score de santé unique de l’orchestrateur est identique quel que soit le point d’entrée', () => {
    const project = {
      id: 'p1',
      title: 'Projet test',
      budget: 1_000_000,
      progress: 20,
      startDate: '2024-01-01',
      endDate: '2025-01-01',
    };
    const a = ProjectMetricsOrchestrator.compute({ project, actualCost: 0, asOf: new Date('2024-08-01') });
    const b = ProjectMetricsOrchestrator.compute({ project, actualCost: 0, asOf: new Date('2024-08-01') });
    expect(a.health).toEqual(b.health);
  });
});
