/**
 * QuantityTakeoffService - Hexagonal service for btp.quantity_takeoffs
 * UI -> Hook -> Service -> Repository -> DB (btp.quantity_takeoffs)
 * Replaces every direct supabase.from('quantity_takeoffs') call in components.
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import type { IQuantityTakeoffRepository } from '@/domain/repositories/IQuantityTakeoffRepository';
import type { QuantityTakeoffWithDetails } from '@/dtos/types/quantityTakeoff';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface QuantityTakeoffInput {
  projectId: string;
  materialId: string;
  elementType?: string | null;
  quantity: number;
  unit: string;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  note?: string | null;
  phaseId?: string | null;
}

export class QuantityTakeoffService {
  constructor(private repository: IQuantityTakeoffRepository) {}

  async getByProject(projectId: string): Promise<QuantityTakeoffWithDetails[]> {
    if (!projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    return this.repository.findByProjectId(projectId);
  }

  async create(input: QuantityTakeoffInput): Promise<QuantityTakeoffWithDetails> {
    this.validate(input);
    return this.repository.create(this.toRow(input));
  }

  async createMany(inputs: QuantityTakeoffInput[]): Promise<QuantityTakeoffWithDetails[]> {
    if (!inputs.length) return [];
    inputs.forEach((i) => this.validate(i));
    const repo = this.repository as IQuantityTakeoffRepository & {
      createMany?: (rows: unknown[]) => Promise<QuantityTakeoffWithDetails[]>;
    };
    const rows = inputs.map((i) => this.toRow(i));
    if (repo.createMany) return repo.createMany(rows);
    const created: QuantityTakeoffWithDetails[] = [];
    for (const row of rows) created.push(await this.repository.create(row));
    return created;
  }

  async update(id: string, updates: Partial<QuantityTakeoffInput>): Promise<QuantityTakeoffWithDetails> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Takeoff ID is required');
    return this.repository.update(id, this.toRow(updates as QuantityTakeoffInput, true));
  }

  /** Update with an already snake_case payload (legacy callers) */
  async updateRaw(id: string, updates: Record<string, unknown>): Promise<QuantityTakeoffWithDetails> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Takeoff ID is required');
    return this.repository.update(id, updates as never);
  }

  async remove(id: string): Promise<void> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Takeoff ID is required');
    await this.repository.delete(id);
  }

  async replaceForProject(projectId: string, inputs: QuantityTakeoffInput[]): Promise<QuantityTakeoffWithDetails[]> {
    if (!projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    const repo = this.repository as IQuantityTakeoffRepository & {
      deleteByProjectId?: (projectId: string) => Promise<void>;
    };
    if (repo.deleteByProjectId) {
      await repo.deleteByProjectId(projectId);
    } else {
      const existing = await this.repository.findByProjectId(projectId);
      for (const row of existing) await this.repository.delete((row as { id: string }).id);
    }
    return this.createMany(inputs.map((i) => ({ ...i, projectId })));
  }

  /**
   * Back-compat API (snake_case payload used by QuantityTakeoffForm / useCreateQuantityTakeoff)
   */
  async createQuantityTakeoff(payload: {
    project_id: string;
    material_id: string;
    element_type?: string;
    unit: string;
    length?: number;
    width?: number;
    height?: number;
    quantity?: number;
    unit_price?: number;
    phase_id?: string;
    milestone_id?: string;
    note?: string;
  }): Promise<QuantityTakeoffWithDetails> {
    const quantity =
      payload.quantity ??
      computeQuantity(payload.unit, payload.length, payload.width, payload.height);

    const row: Record<string, unknown> = {
      ...this.toRow({
        projectId: payload.project_id,
        materialId: payload.material_id,
        elementType: payload.element_type ?? null,
        quantity,
        unit: payload.unit,
        length: payload.length ?? null,
        width: payload.width ?? null,
        height: payload.height ?? null,
        note: payload.note ?? null,
      }),
    };
    if (payload.unit_price !== undefined) row.unit_price = payload.unit_price;
    if (payload.phase_id) row.phase_id = payload.phase_id;
    if (payload.milestone_id) row.milestone_id = payload.milestone_id;

    return this.repository.create(row);
  }

  async getTotalQuantityByUnit(projectId: string, unit: string): Promise<number> {
    if (!projectId || !unit) return 0;
    return this.repository.getTotalQuantityByUnit(projectId, unit);
  }

  async getTotalValue(projectId: string): Promise<number> {
    if (!projectId) return 0;
    return this.repository.getTotalValue(projectId);
  }

  private validate(input: QuantityTakeoffInput): void {
    if (!input.projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    if (!input.materialId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Material is required');
    if (!input.unit) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Unit is required');
    if (typeof input.quantity !== 'number' || Number.isNaN(input.quantity) || input.quantity < 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Quantity must be a positive number');
    }
  }

  /** DTO (camelCase) -> DB row (snake_case) */
  private toRow(input: Partial<QuantityTakeoffInput>, partial = false): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    const set = (key: string, value: unknown) => {
      if (!partial || value !== undefined) row[key] = value;
    };
    set('project_id', input.projectId);
    set('material_id', input.materialId);
    set('element_type', input.elementType ?? null);
    set('quantity', input.quantity);
    set('unit', input.unit);
    set('length', input.length ?? null);
    set('width', input.width ?? null);
    set('height', input.height ?? null);
    set('note', input.note ?? null);
    if (input.phaseId !== undefined) row.phase_id = input.phaseId;
    return row;
  }
}

/** Quantity derived from dimensions when not explicitly provided */
export function computeQuantity(
  unit: string,
  length?: number,
  width?: number,
  height?: number,
): number {
  const l = length ?? 0;
  const w = width ?? 1;
  const h = height ?? 1;
  if (unit === 'm³') return l * w * h;
  if (unit === 'm²') return l * w;
  if (unit === 'm') return l;
  return 1;
}

let instance: QuantityTakeoffService | null = null;

export function getQuantityTakeoffService(): QuantityTakeoffService {
  if (!instance) {
    instance = new QuantityTakeoffService(RepositoryFactory.getQuantityTakeoffRepository());
  }
  return instance;
}
