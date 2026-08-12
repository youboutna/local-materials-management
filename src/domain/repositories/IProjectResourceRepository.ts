/**
 * Project Resource Repository Port (btp.project_resources)
 */

export interface ProjectResourceRow {
  id: string;
  project_id: string;
  phase_id?: string | null;
  name: string;
  type: string;
  notes?: string | null;
  cost_per_unit?: number | null;
  quantity?: number | null;
  unit?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface IProjectResourceRepository {
  findByProjectId(projectId: string): Promise<ProjectResourceRow[]>;
  create(resource: Partial<ProjectResourceRow>): Promise<ProjectResourceRow>;
  createMany(resources: Partial<ProjectResourceRow>[]): Promise<ProjectResourceRow[]>;
  update(id: string, updates: Partial<ProjectResourceRow>): Promise<ProjectResourceRow>;
  delete(id: string): Promise<void>;
}
