import { describe, it, expect, vi } from 'vitest';
import { TakeoffToBoqService } from '@/application/services/TakeoffToBoqService';
import type { IQuantityTakeoffRepository } from '@/domain/repositories/IQuantityTakeoffRepository';
import type { IBoqRepository } from '@/domain/repositories/IBoqRepository';
import type { IPhaseMaterialRepository } from '@/domain/repositories/IPhaseMaterialRepository';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { QuantityTakeoffWithDetails } from '@/dtos/types/quantityTakeoff';

const PROJECT_ID = 'proj-1';
const PHASE_ID = 'phase-1';
const MATERIAL_ID = 'mat-1';

function makeTakeoff(overrides: Partial<QuantityTakeoffWithDetails & { phase_id: string }> = {}) {
  return {
    id: 't1',
    project_id: PROJECT_ID,
    material_id: MATERIAL_ID,
    element_type: 'acier',
    unit: 'kg',
    length: 0,
    quantity: 540,
    created_at: '',
    updated_at: '',
    phase_id: PHASE_ID,
    material: { id: MATERIAL_ID, name: 'Acier', unit: 'kg', price_per_unit: 5000, category: 'metal' },
    ...overrides,
  } as unknown as QuantityTakeoffWithDetails;
}

function makeService(existingLines: BoqLineDTO[] = [], takeoffs = [makeTakeoff()]) {
  const takeoffRepo: IQuantityTakeoffRepository = {
    findByProjectId: vi.fn().mockResolvedValue(takeoffs),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getTotalQuantityByUnit: vi.fn(),
    getTotalValue: vi.fn(),
  };

  const created: BoqLineDTO[] = [];
  const boqRepo: IBoqRepository = {
    list: vi.fn().mockResolvedValue(existingLines),
    bulkCreate: vi.fn().mockImplementation(async (dtos: BoqLineDTO[]) => {
      created.push(...dtos);
      return dtos;
    }),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  };

  const upserted: unknown[] = [];
  const phaseMaterialRepo: IPhaseMaterialRepository = {
    findByPhaseId: vi.fn().mockResolvedValue([]),
    findByProjectId: vi.fn().mockResolvedValue([]),
    upsert: vi.fn().mockImplementation(async (input) => {
      upserted.push(input);
      return { id: 'pm1', ...input };
    }),
  };

  const service = new TakeoffToBoqService(takeoffRepo, boqRepo, phaseMaterialRepo);
  return { service, boqRepo, phaseMaterialRepo, created, upserted };
}

describe('TakeoffToBoqService.syncProject', () => {
  it('creates a boq_lines DQE entry and a phase resource from a single takeoff', async () => {
    const { service, created, upserted } = makeService();
    const result = await service.syncProject(PROJECT_ID);

    expect(result.boqLinesCreated).toBe(1);
    expect(result.resourcesUpserted).toBe(1);
    expect(created[0].quantity).toBe(540);
    expect(created[0].unitPrice).toBe(5000);
    expect(created[0].phaseId).toBe(PHASE_ID);
    expect(upserted[0]).toMatchObject({ phaseId: PHASE_ID, materialId: MATERIAL_ID, quantity: 540 });
  });

  it('computes total HT correctly (540 kg * 5000 MRU = 2 700 000 MRU)', async () => {
    const { service } = makeService();
    const result = await service.syncProject(PROJECT_ID);
    expect(result.totalHt).toBe(2_700_000);
  });

  it('is idempotent: re-running does not duplicate boq_lines nor inflate resource quantities', async () => {
    const takeoff = makeTakeoff();
    const existingLine: BoqLineDTO = {
      id: 'line-1',
      source: 'quantity_takeoff',
      contextId: PROJECT_ID,
      designation: 'Acier',
      unit: 'kg',
      quantity: 540,
      unitPrice: 5000,
      totalHt: 2_700_000,
      phaseId: PHASE_ID,
      materialId: MATERIAL_ID,
      note: `takeoff:${takeoff.id}`,
    };

    const { service, created } = makeService([existingLine], [takeoff]);
    const result = await service.syncProject(PROJECT_ID);

    expect(created.length).toBe(0);
    expect(result.boqLinesCreated).toBe(0);
    expect(result.boqLinesSkipped).toBe(1);
    expect(result.totalHt).toBe(2_700_000);
  });

  it('aggregates several takeoffs of the same material/phase into a single resource line', async () => {
    const t1 = makeTakeoff({ id: 't1', quantity: 300 });
    const t2 = makeTakeoff({ id: 't2', quantity: 240 });
    const { service, upserted } = makeService([], [t1, t2]);

    const result = await service.syncProject(PROJECT_ID);

    expect(result.resourcesUpserted).toBe(1);
    expect(upserted[0]).toMatchObject({ quantity: 540 });
  });

  it('skips resource sync when a takeoff has no phase attached', async () => {
    const takeoff = makeTakeoff({ phase_id: null as unknown as string });
    const { service, upserted } = makeService([], [takeoff]);

    const result = await service.syncProject(PROJECT_ID);

    expect(result.resourcesUpserted).toBe(0);
    expect(upserted.length).toBe(0);
  });
});
