import { describe, it, expect } from 'vitest';
import { AlignmentService, InMemoryAlignmentRepository } from '../AlignmentService';

describe('AlignmentService', () => {
  it('remembers and suggests alignments case-insensitively', async () => {
    const svc = new AlignmentService(new InMemoryAlignmentRepository());
    await svc.remember({ extractedName: 'Ciment CPA 42.5', resourceId: 'mat-1', resourceType: 'material' });
    const s = await svc.suggestResource('  ciment cpa 42.5  ');
    expect(s?.resourceId).toBe('mat-1');
  });

  it('increments occurrences on repeated remembers', async () => {
    const svc = new AlignmentService(new InMemoryAlignmentRepository());
    await svc.remember({ extractedName: 'Acier HA', resourceId: 'r1', resourceType: 'material' });
    const again = await svc.remember({ extractedName: 'Acier HA', resourceId: 'r1', resourceType: 'material' });
    expect(again.occurrences).toBeGreaterThanOrEqual(2);
  });

  it('batch suggest returns null for unknown', async () => {
    const svc = new AlignmentService(new InMemoryAlignmentRepository());
    await svc.remember({ extractedName: 'Sable', resourceId: 'r2', resourceType: 'material' });
    const out = await svc.batchSuggest(['Sable', 'Gravier']);
    expect(out['Sable']?.resourceId).toBe('r2');
    expect(out['Gravier']).toBeNull();
  });
});
