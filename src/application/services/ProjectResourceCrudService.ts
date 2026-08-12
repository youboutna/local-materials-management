/**
 * ProjectResourceCrudService — CRUD service for btp.project_resources
 * UI -> Hook -> Service -> Repository -> DB (no direct Supabase in components)
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import type {
  IProjectResourceRepository,
  ProjectResourceRow,
} from '@/domain/repositories/IProjectResourceRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface ProjectResourceInput {
  projectId: string;
  phaseId?: string | null;
  name: string;
  type: string;
  notes?: string | null;
  costPerUnit?: number | null;
  quantity?: number | null;
  unit?: string | null;
}

export class ProjectResourceCrudService {
  constructor(private repository: IProjectResourceRepository) {}

  async getByProject(projectId: string): Promise<ProjectResourceRow[]> {
    if (!projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    return this.repository.findByProjectId(projectId);
  }

  async create(input: ProjectResourceInput): Promise<ProjectResourceRow> {
    this.validate(input);
    return this.repository.create(this.toRow(input));
  }

  async createMany(inputs: ProjectResourceInput[]): Promise<ProjectResourceRow[]> {
    inputs.forEach((i) => this.validate(i));
    return this.repository.createMany(inputs.map((i) => this.toRow(i)));
  }

  async update(id: string, updates: Partial<ProjectResourceInput>): Promise<ProjectResourceRow> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Resource ID is required');
    return this.repository.update(id, this.toRow(updates as ProjectResourceInput, true));
  }

  async remove(id: string): Promise<void> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Resource ID is required');
    await this.repository.delete(id);
  }

  private validate(input: ProjectResourceInput): void {
    if (!input.projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    if (!input.name?.trim()) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Resource name is required');
    if (!input.type) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Resource type is required');
  }

  private toRow(input: Partial<ProjectResourceInput>, partial = false): Partial<ProjectResourceRow> {
    const row: Record<string, unknown> = {};
    const set = (key: string, value: unknown) => {
      if (!partial || value !== undefined) row[key] = value;
    };
    set('project_id', input.projectId);
    set('name', input.name);
    set('type', input.type);
    set('notes', input.notes ?? null);
    set('cost_per_unit', input.costPerUnit ?? null);
    set('quantity', input.quantity ?? null);
    set('unit', input.unit ?? null);
    if (input.phaseId !== undefined) row.phase_id = input.phaseId;
    return row as Partial<ProjectResourceRow>;
  }
}

let instance: ProjectResourceCrudService | null = null;

export function getProjectResourceCrudService(): ProjectResourceCrudService {
  if (!instance) {
    instance = new ProjectResourceCrudService(RepositoryFactory.getProjectResourceRepository());
  }
  return instance;
}
