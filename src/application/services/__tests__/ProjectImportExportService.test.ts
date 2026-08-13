import dataset from '@/tests/fixtures/projectImportDataset.fixture.json';
import type { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { describe, expect, it } from 'vitest';
import {
  ProjectImportExportService,
  type ProjectImportDataset,
} from '../ProjectImportExportService';

const service = new ProjectImportExportService({} as never);
const fixture = dataset as unknown as ProjectImportDataset;

describe('ProjectImportExportService — fixture round-trip', () => {
  it('valide le jeu complet sans perdre de projet', () => {
    expect(fixture.projects).toHaveLength(8);
    expect(service.validateImportRows(fixture.projects)).toEqual([]);
  });

  it('normalise budget, dates, référence et organisation', () => {
    const source = fixture.projects[0];
    const dto = service.mapImportRowToCreateDTO(source);

    expect(dto.title).toBe(source.title);
    expect(dto.externalRef).toBe(source.id);
    expect(dto.projectReference).toBe(source.reference);
    expect(dto.organizationId).toBe(source.organizationId);
    expect(dto.budget).toBe(typeof source.budget === 'number' ? source.budget : source.budget?.total);
    expect(dto.budgetSources).toEqual(typeof source.budget === 'object' ? source.budget?.sources : undefined);
    expect(dto.startDate).toBe(source.timeline?.startDate);
  });

  it('préserve les clés stables lors du retour vers le template', () => {
    const source = fixture.projects[0];
    const dto = service.mapImportRowToCreateDTO(source) as unknown as ProjectDTO;
    const exported = service.toImportRow({
      ...dto,
      id: 'persisted-project-id',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(exported.externalRef).toBe(source.id);
    expect(exported.reference).toBe(source.reference);
    expect(exported.organizationId).toBe(source.organizationId);
    expect(exported.title).toBe(source.title);
  });
});
describe('Normalisation phase_type (contrainte CHECK project_phases)', () => {
  it('mappe les codes métier vers les valeurs de phase_type autorisées', async () => {
    const { PhaseTransformer } = await import('@/dtos/transforms/PhaseTransformer');
    const cases: Record<string, string> = {
      ETUDES: 'etudes',
      TRAVAUX: 'travaux',
      EXECUTION: 'execution',
      RECEPTION: 'reception',
      HANDOVER: 'handover',
      ANALYSE: 'analyse',
      standard: 'standard',
      custom: 'custom',
      'Pré-Faisabilité': 'standard',
    };
    for (const [input, expected] of Object.entries(cases)) {
      expect(PhaseTransformer.normalizeDbPhaseType(input)).toBe(expected);
    }
    expect(PhaseTransformer.normalizeDbPhaseType(undefined)).toBe('standard');
  });

  it('conserve le code métier dans phase_code', async () => {
    const { PhaseTransformer } = await import('@/dtos/transforms/PhaseTransformer');
    const row = PhaseTransformer.toDB({ name: 'Études', phaseType: 'ETUDES' } as never);
    expect(row['phase_type']).toBe('etudes');
    expect(row['phase_code']).toBe('ETUDES');
  });
});


