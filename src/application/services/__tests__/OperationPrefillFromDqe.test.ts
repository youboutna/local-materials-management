import { describe, it, expect } from 'vitest';
import { ProjectWorkbenchService } from '@/application/services/ProjectWorkbenchService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { SaveProjectOperationDTO } from '@/dtos/entities/ProjectWorkbenchDTO';

const form = { projectId: 'p', kind: 'consumption', occurredOn: '2026-11-04', label: 'Saisie libre', unit: '', currency: 'MRU', quantity: 1, amount: 0, resourceFamily: 'material' } as SaveProjectOperationDTO;
const line = (patch: Partial<BoqLineDTO>) => ({ id: 'l1', designation: 'Pose et tension', unit: 'ml', phaseId: 'ph1', ...patch }) as BoqLineDTO;

describe('Consommation pré-remplie depuis la ligne DQE', () => {
  it('reprend désignation, unité et phase de la ligne', () => {
    const patch = ProjectWorkbenchService.prefillFromLine(line({}), form);
    expect(patch).toMatchObject({ sourceLineId: 'l1', label: 'Pose et tension', unit: 'ml', phaseId: 'ph1' });
  });
  it('déduit la famille main d’œuvre de la ligne', () => {
    expect(ProjectWorkbenchService.prefillFromLine(line({ resourceType: 'labour' }), form).resourceFamily).toBe('human');
  });
  it('déduit la famille équipement par défaut', () => {
    expect(ProjectWorkbenchService.prefillFromLine(line({ resourceType: 'equipment' }), form).resourceFamily).toBe('equipment');
  });
  it('retire le rattachement quand aucune ligne n’est choisie', () => {
    expect(ProjectWorkbenchService.prefillFromLine(undefined, form)).toEqual({ sourceLineId: undefined });
  });
});
