import { describe, expect, it } from 'vitest';
import { EvmService } from '@/application/services/EvmService';

describe('EvmService — moteur EVM unique', () => {
  it('CPI est null (jamais 0 ni 1) quand aucune dépense n’est engagée', () => {
    const result = EvmService.compute({
      budget: 1_000_000,
      progress: 40,
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      actualCost: 0,
    });

    expect(result.costPerformanceIndex).toBeNull();
    expect(result.costVariance).toBeNull();
    expect(result.estimateAtCompletion).toBeNull();
    expect(result.estimateToComplete).toBeNull();
    expect(result.varianceAtCompletion).toBeNull();
    expect(result.costStatus).toBe('not_available');
  });

  it('CPI devient évaluable dès qu’un coût réel est engagé', () => {
    const result = EvmService.compute({
      budget: 1_000_000,
      progress: 50,
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      actualCost: 400_000,
    });

    expect(result.costPerformanceIndex).not.toBeNull();
    expect(result.costPerformanceIndex).toBeCloseTo(500_000 / 400_000, 3);
    expect(result.costVariance).toBeCloseTo(100_000, 2);
  });

  it('SPI est null quand la planned value est nulle (dates absentes ou projet non démarré)', () => {
    const result = EvmService.compute({
      budget: 500_000,
      progress: 10,
      actualCost: 50_000,
    });

    expect(result.schedulePerformanceIndex).toBeNull();
    expect(result.scheduleStatus).toBe('not_available');
  });

  it('plafonne l’avancement projet fourni à 100, jamais au-delà', () => {
    const result = EvmService.compute({
      budget: 1_000_000,
      progress: 150,
    });

    expect(result.progress).toBe(100);
  });

  it('plafonne le TEP pondéré par phase à 100 même si une phase dépasse 100', () => {
    const result = EvmService.compute({
      budget: 1_000_000,
      phases: [
        { id: 'ph1', name: 'Phase 1', weight: 1, progress: 150 as unknown as number },
      ],
    });

    expect(result.progress).toBeLessThanOrEqual(100);
    expect(result.progress).toBe(100);
  });

  it('toLegacyMetrics expose 0 comme sentinelle explicite (compat DTO) et signale via hasActualCost', () => {
    const result = EvmService.compute({ budget: 1_000_000, progress: 30, actualCost: 0 });
    const legacy = EvmService.toLegacyMetrics(result);

    expect(legacy.costPerformanceIndex).toBe(0);
    expect(legacy.hasActualCost).toBe(false);
  });
});
