/**
 * IPhaseMaterialRepository — port for btp.phase_materials (resources of a phase).
 * Each row links a material to a phase/project with a committed quantity.
 */
export interface PhaseMaterialRow {
  id: string;
  projectId: string | null;
  phaseId: string;
  materialId: string;
  quantity: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PhaseMaterialInput {
  projectId?: string | null;
  phaseId: string;
  materialId: string;
  quantity: number;
}

export interface IPhaseMaterialRepository {
  findByPhaseId(phaseId: string): Promise<PhaseMaterialRow[]>;
  findByProjectId(projectId: string): Promise<PhaseMaterialRow[]>;
  /** Idempotent upsert keyed on (phase_id, material_id): creates or updates the quantity. */
  upsert(input: PhaseMaterialInput): Promise<PhaseMaterialRow>;
}
