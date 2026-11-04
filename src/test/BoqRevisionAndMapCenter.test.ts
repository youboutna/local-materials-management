import { describe, it, expect } from 'vitest';
import { BoqRevisionService } from '@/application/services/boq/BoqRevisionService';
import { ProjectWorkbenchTransformer } from '@/dtos/transforms/ProjectWorkbenchTransformer';
import { INFRA_DEFAULT_MAP_CENTER } from '@/config/referentials/projects/project-workbench.referential';

describe('BOQ revision', () => {
  it('copies validated lines as draft under a new document linked to the original', () => {
    const [r] = BoqRevisionService.buildRevisionLines(
      [{ id: 'l1', source: 'project' as never, contextId: 'p', designation: 'x', unit: 'm3', quantity: 5, status: 'validated', documentId: 'd1' }],
      'd2', 'd1');
    expect(r.id).toBeUndefined();
    expect(r.status).toBe('draft');
    expect(r.documentId).toBe('d2');
    expect(r.sourceDocumentId).toBe('d1');
    expect(r.quantity).toBe(5);
    expect((r.metadata as Record<string, unknown>).revision).toBe(1);
  });
});

describe('map center', () => {
  it('uses project coordinates when no zone exists', () => {
    expect(ProjectWorkbenchTransformer.mapCenter({ latitude: 16.15, longitude: -13.5 }).center).toEqual([16.15, -13.5]);
  });
  it('falls back to the referential default', () => {
    expect(ProjectWorkbenchTransformer.mapCenter({}).center).toEqual([INFRA_DEFAULT_MAP_CENTER.lat, INFRA_DEFAULT_MAP_CENTER.lng]);
  });
});
