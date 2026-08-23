/**
 * Project Resource Repository Port (btp.project_resources)
 */

export interface ProjectResourceRow {
  id: string;
  projectId: string;
  phaseId?: string | null;
  name: string;
  type: string;
  notes?: string | null;
  costPerUnit?: number | null;
  quantity?: number | null;
  unit?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface IProjectResourceRepository {
  findByProjectId(projectId: string): Promise<ProjectResourceRow[]>;
  create(resource: Partial<ProjectResourceRow>): Promise<ProjectResourceRow>;
  createMany(resources: Partial<ProjectResourceRow>[]): Promise<ProjectResourceRow[]>;
  update(id: string, updates: Partial<ProjectResourceRow>): Promise<ProjectResourceRow>;
  delete(id: string): Promise<void>;
}
