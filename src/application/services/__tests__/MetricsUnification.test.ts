import { describe, expect, it } from 'vitest';
import { EvmService } from '@/application/services/EvmService';
import { PertService } from '@/application/services/PertService';
import { ProjectCalculationService } from '@/application/services/ProjectCalculationService';
import { ProjectMetricsOrchestrator } from '@/application/services/ProjectMetricsOrchestrator';

const project = {
  id: 'p1',
  title: 'Projet électrique',
  budget: 450_000_000.1,
  progress: 25,
  startDate: '2024-01-01',
  endDate: '2028-01-01',
};

const phases = [
  {
    id: 'ph1',
    name: 'Travaux',
    weight: 100,
    budget: 450_000_000.1,
    startDate: '2024-01-01',
    endDate: '2028-01-01',
    progress: 95,
  },
];

describe('Unification des métriques projet', () => {
  it('A — un seul moteur EVM : ProjectCalculationService délègue à EvmService', () => {
    const metrics = ProjectMetricsOrchestrator.compute({ project, phases, asOf: new Date('2026-01-01') });
    const legacy = ProjectCalculationService.calculateEVMMetrics({
      ...(project as any),
      phases,
      tasks: [],
    });
    const direct = EvmService.toLegacyMetrics(metrics.evm);
    expect(legacy.earnedValue).toBeCloseTo(direct.earnedValue, 2);
    expect(legacy.plannedValue).toBeCloseTo(direct.plannedValue, 2);
  });

  it('A — CPI non évaluable sans dépense engagée (pas de « sous budget » par défaut)', () => {
    const metrics = ProjectMetricsOrchestrator.compute({ project, phases });
    expect(metrics.evm.costPerformanceIndex).toBeNull();
    expect(metrics.formatted.cpi).toBe('N/A');
    expect(metrics.budgetVarianceEvaluable).toBe(false);
    expect(metrics.formatted.budgetVariance).toContain('non évaluable');
    expect(metrics.costPerformanceLabel).toContain('Non évaluable');
  });

  it('A — progression unique et pondérée (plus de 25 % vs 95 %)', () => {
    const metrics = ProjectMetricsOrchestrator.compute({ project, phases });
    expect(metrics.progress).toBeCloseTo(95, 2);
    expect(metrics.formatted.progress).toBe('95,00%');
  });

  it('B — le modèle Gantt porte le calendrier réel et les jalons 0/25/50/75/100', () => {
    const metrics = ProjectMetricsOrchestrator.compute({ project, phases, asOf: new Date('2026-01-01') });
    expect(metrics.gantt.isEmpty).toBe(false);
    expect(metrics.gantt.milestones.map((m) => m.ratio)).toEqual([0, 25, 50, 75, 100]);
    expect(metrics.gantt.today).not.toBeNull();
  });

  it('C — un seul moteur PERT, durée de référence distincte de la durée PERT', () => {
    const metrics = ProjectMetricsOrchestrator.compute({ project, phases });
    const pert = PertService.compute([{ id: 'ph1', durationDays: 1461 }]);
    expect(metrics.pert.isEstimated).toBe(true);
    expect(metrics.pert.totalExpectedDuration).toBeCloseTo(pert.totalExpectedDuration, 0);
    expect(metrics.referenceDurationDays).toBe(1461);
  });

  it('D — score de santé cohérent avec les alertes critiques', () => {
    const health = ProjectMetricsOrchestrator.buildHealth({
      progress: 10,
      plannedProgress: 80,
      spi: 0.2,
      cpi: 0.3,
      openRisksCount: 5,
      alerts: [
        { code: 'a', level: 'critical', message: '' },
        { code: 'b', level: 'critical', message: '' },
        { code: 'c', level: 'critical', message: '' },
      ],
    });
    expect(health.overallScore).toBeLessThan(30);
    expect(health.status).toBe('critical');
  });

  it('E — progression jalons calculée par l’orchestrateur uniquement', () => {
    const mp = ProjectMetricsOrchestrator.buildMilestoneProgress(
      [
        { id: '1', status: 'completed' },
        { id: '2', status: 'in_progress', progress: 50 },
        { id: '3', status: 'planned', progress: 0, dueDate: '2020-01-01' },
      ],
      new Date('2026-01-01'),
    );
    expect(mp.total).toBe(3);
    expect(mp.completed).toBe(1);
    expect(mp.overdue).toBe(1);
    expect(mp.progress).toBeCloseTo(50, 2);
  });

  it('F — formatage unifié : espaces, virgule, 2 décimales', () => {
    const metrics = ProjectMetricsOrchestrator.compute({ project, phases });
    expect(metrics.formatted.budget).toBe('450 000 000,10 MRU');
    expect(metrics.formatted.referenceDuration).toBe('1 461,00 jours');
  });
});
