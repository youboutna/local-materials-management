import { describe, expect, it } from 'vitest';
import { BoqCategoryResolver } from './BoqCategoryResolver';

describe('BoqCategoryResolver', () => {
  it('maps French construction designations to the static WBS fallback', () => {
    const resolved = BoqCategoryResolver.resolve('Béton de propreté sous semelles', { unit: 'm3' });

    expect(resolved.phaseId).toBe('gros-oeuvre');
    expect(resolved.milestoneId).toBe('fondations');
    expect(resolved.taskId).toBe('beton-proprete');
    expect(resolved.dqeCategoryCode).toBe('GENIE_CIVIL');
    expect(resolved.resourceType).toBe('material');
  });

  it('uses the selected referential for dynamic phase, milestone and task classification', () => {
    const resolved = BoqCategoryResolver.resolve('Tirage et raccordement des câbles BT', {
      referentialCode: 'DISTRIBUTION_RURALE',
      unit: 'ml',
    });

    expect(resolved.phaseId).toBe('INSTALLATION');
    expect(resolved.milestoneId).toBe('CABLE_INSTALLATION');
    expect(resolved.taskId).toBe('INSTALL_CABLES');
  });

  it('detects labour and equipment resources independently from WBS matching', () => {
    expect(BoqCategoryResolver.resolve('Chef d’équipe électricien', { unit: 'H/J' }).resourceType).toBe('labour');
    expect(BoqCategoryResolver.resolve('Location pelle hydraulique chantier', { unit: 'u' }).resourceType).toBe('equipment');
  });
});