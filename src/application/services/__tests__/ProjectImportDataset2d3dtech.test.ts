/**
 * Jeu de données réel 2D3DTECH (v3.3.0) — vérifie le fan-out des blocs racine
 * (phases / jalons / tâches / lignes DQE / parties prenantes) vers les projets.
 */
import dataset from '@/tests/fixtures/projectImport2d3dtech.fixture.json';
import { describe, expect, it } from 'vitest';
import { ProjectImportExportService } from '../ProjectImportExportService';

const service = new ProjectImportExportService({} as never);
const normalized = service.normalizeDataset(dataset);
const raw = dataset as unknown as Record<string, unknown[]>;

const sum = (key: 'phases' | 'milestones' | 'tasks' | 'dqeLines' | 'stakeholders') =>
  normalized.projects.reduce((acc, p) => acc + (p[key]?.length ?? 0), 0);

describe('Dataset 2D3DTECH — normalisation & fan-out', () => {
  it('reprend les 8 projets et les référentiels associés', () => {
    expect(normalized.projects).toHaveLength(8);
    expect(normalized.organizations).toHaveLength(6);
    expect(normalized.suppliers).toHaveLength(9);
    expect(normalized.employees).toHaveLength(8);
    expect(service.validateImportRows(normalized.projects)).toEqual([]);
  });

  it('rattache toutes les collections racine aux projets', () => {
    expect(sum('phases')).toBe(raw.phases.length);
    expect(sum('milestones')).toBe(raw.milestones.length);
    expect(sum('tasks')).toBe(raw.tasks.length);
    expect(sum('dqeLines')).toBe(raw.boqLines.length);
    expect(sum('stakeholders')).toBe(raw.stakeholders.length);
  });

  it('normalise les lignes DQE (désignation, TVA en taux décimal, total HT)', () => {
    const project = normalized.projects[0];
    const line = project.dqeLines?.[0] as unknown as Record<string, unknown>;
    expect(line.designation).toBe('Études topographiques');
    expect(line.unit).toBe('forfait');
    expect(line.vatRate).toBeCloseTo(0.16);
    expect(line.totalPrice).toBe(250000);
    expect(line.documentRef).toBe('DQE-MOUDOUN-2025-001');
  });

  it('conserve le rattachement de phase des jalons et tâches', () => {
    const project = normalized.projects[0];
    const phaseIds = new Set((project.phases ?? []).map((p) => p.id));
    expect(phaseIds.size).toBeGreaterThan(0);
    expect((project.milestones ?? []).every((m) => !m.phaseId || phaseIds.has(m.phaseId))).toBe(true);
    expect((project.tasks ?? []).every((t) => !t.phaseId || phaseIds.has(t.phaseId))).toBe(true);
  });

  it('déduit le type d’entité des parties prenantes', () => {
    const stakeholders = normalized.projects.flatMap((p) => p.stakeholders ?? []);
    expect(stakeholders.length).toBeGreaterThan(0);
    expect(stakeholders.every((s) => !!s.stakeholderEntityType)).toBe(true);
    expect(stakeholders.some((s) => s.stakeholderEntityType === 'organization')).toBe(true);
    expect(stakeholders.some((s) => s.stakeholderEntityType === 'supplier')).toBe(true);
  });

  it('cohérence total HT des lignes / document DQE déclaré', () => {
    const docs = (raw.dqeDocuments as Array<Record<string, unknown>>);
    for (const project of normalized.projects) {
      const totalHt = (project.dqeLines ?? []).reduce(
        (acc, l) => acc + Number((l as unknown as { totalPrice?: number }).totalPrice ?? 0),
        0,
      );
      if (totalHt === 0) continue;
      const doc = docs.find((d) => d.projectId === project.id);
      expect(doc, `document DQE manquant pour ${project.title}`).toBeTruthy();
      const declared = Number(doc?.totalHT ?? 0);
      expect(Math.abs(totalHt - declared) / declared).toBeLessThan(0.02);
    }
  });
});

