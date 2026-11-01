import { describe, it, expect } from 'vitest';
import { ProjectImportTemplateService } from '../ProjectImportTemplateService';

const service = new ProjectImportTemplateService();

describe('existing template block drives the import', () => {
  it('lists Banque mondiale in the referential menu', () => {
    expect(service.listReferentials('fr').some(o => o.value === 'WORLD_BANK_PTBA')).toBe(true);
  });
  it('Banque mondiale imports Excel only', () => {
    expect(service.resolveImportProfile('WORLD_BANK_PTBA').formats).toEqual(['excel']);
  });
  it('business referentials keep JSON, CSV and Excel', () => {
    expect(service.resolveImportProfile('CUSTOM_STANDARD').formats).toEqual(['json', 'csv', 'excel']);
  });
});
