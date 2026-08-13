import { describe, expect, it } from 'vitest';
import { PhaseWeightingService } from '@/application/services/PhaseWeightingService';

describe('PhaseWeightingService — plafonnement des progressions', () => {
  it('clampe la progression d’une phase > 100 à 100 dans le TEP pondéré', () => {
    const result = PhaseWeightingService.computeWeightedProgress([
      { id: 'ph1', name: 'Phase 1', weight: 1, progress: 999 },
    ]);
    expect(result.progress).toBe(100);
  });

  it('clampe une progression négative à 0', () => {
    const result = PhaseWeightingService.computeWeightedProgress([
      { id: 'ph1', name: 'Phase 1', weight: 1, progress: -50 },
    ]);
    expect(result.progress).toBe(0);
  });

  it('le TEP pondéré global reste borné [0,100] même avec plusieurs phases aberrantes', () => {
    const result = PhaseWeightingService.computeWeightedProgress([
      { id: 'ph1', name: 'Phase 1', weight: 1, progress: 200 },
      { id: 'ph2', name: 'Phase 2', weight: 1, progress: -20 },
    ]);
    expect(result.progress).toBeGreaterThanOrEqual(0);
    expect(result.progress).toBeLessThanOrEqual(100);
  });
});
