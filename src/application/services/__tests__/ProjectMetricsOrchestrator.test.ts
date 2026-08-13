import { describe, expect, it } from 'vitest';
import { ProjectMetricsOrchestrator } from '@/application/services/ProjectMetricsOrchestrator';

/**
 * Preuve de cohérence : Dashboard, Suivi & Évaluation et Rapport PDF lisent le
 * MÊME objet `ProjectMetrics` — donc les mêmes valeurs et le même formatage.
 * Cas de référence : Boucle 33 kV Kaédi (budget 450 000 000, 1 phase à 95 %).
 */
const INPUT = {
  project: {
    id: 'p1',
    title: 'Boucle 33 kV Kaédi',
    budget: 450_000_000.1,
    progress: 25,
    startDate: '2020-06-01',
    endDate: '2024-06-01',
    interventionZones: [{ name: 'Kaédi' }],
    currency: 'MRU',
  },
  phases: [
    { id: 'ph1', name: 'Boucle 33 kV', progress: 95, startDate: '2020-06-01', endDate: '2024-06-01' },
  ],
  actualCost: 0,
  inspectionsCount: 0,
  documentsCount: 1,
  risks: [],
  pertExpectedDuration: 1485.3499999,
  asOf: new Date('2026-01-01'),
};

describe('ProjectMetricsOrchestrator', () => {
  const metrics = ProjectMetricsOrchestrator.compute(INPUT as any);

  it('formate les montants avec espace, virgule et 2 décimales', () => {
    expect(metrics.formatted.budget).toBe('450 000 000,10 MRU');
    expect(metrics.formatted.budget).not.toContain('/');
  });

  it('rend l’écart budget non évaluable quand aucun coût n’est engagé', () => {
    expect(metrics.evm.costPerformanceIndex).toBeNull();
    expect(metrics.budgetVariance).toBe(0);
    expect(metrics.formatted.budgetVariance).toContain('non évaluable');
    expect(metrics.costPerformanceLabel).toContain('Non évaluable');
  });

  it('expose une durée de référence unique et une durée PERT en estimation', () => {
    expect(metrics.referenceDurationDays).toBe(1461);
    expect(metrics.formatted.pertDuration).toBe('1 485,35 jours (estimation)');
  });

  it('aligne l’écart d’avancement sur le SPI (retard = négatif)', () => {
    expect(metrics.evm.schedulePerformanceIndex).not.toBeNull();
    expect(metrics.scheduleGapPercent).toBeLessThan(0);
    expect(metrics.formatted.scheduleGap.startsWith('+')).toBe(false);
  });

  it('déclenche des alertes cohérentes et alimente l’axe risques', () => {
    const codes = metrics.alerts.map((a) => a.code);
    expect(codes).toContain('cost_not_engaged');
    const risk = metrics.insights.find((i) => i.code === 'maitrise_risques');
    expect(risk?.rawValue).toBe(metrics.alerts.filter((a) => a.level !== 'info').length);
  });

  it('produit un Gantt calendaire avec jalons 0/25/50/75/100 et source du poids', () => {
    expect(metrics.gantt.isEmpty).toBe(false);
    expect(metrics.gantt.milestones.map((m) => m.ratio)).toEqual([0, 25, 50, 75, 100]);
    expect(metrics.gantt.phases[0].weightBasisLabel).toBeTruthy();
  });

  it('garantit une progression projet pondérée unique (≠ progression brute de phase)', () => {
    expect(metrics.progress).toBe(95);
    expect(metrics.gantt.phases[0].progress).toBe(95);
    expect(metrics.formatted.progress).toBe('95,00%');
  });
});
