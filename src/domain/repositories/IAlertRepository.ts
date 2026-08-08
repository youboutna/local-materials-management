/**
 * Interface for Alert Repository
 * Handles data access for project alerts
 */

export interface ProjectAlertDTO {
  id: string;
  project_id: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  acknowledged?: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface CreateProjectAlertRequestDto {
  project_id: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
}

export interface UpdateProjectAlertRequestDto {
  type?: string;
  severity?: string;
  title?: string;
  description?: string;
  acknowledged?: boolean;
  resolved?: boolean;
}

export interface AlertStatistics {
  total: number;
  active: number;
  resolved: number;
  acknowledged: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface IAlertRepository {
  // Basic CRUD operations
  findById(id: string): Promise<ProjectAlertDTO | null>;
  findByProjectId(projectId: string): Promise<ProjectAlertDTO[]>;
  findAll(): Promise<ProjectAlertDTO[]>;
  create(alertData: CreateProjectAlertRequestDto): Promise<ProjectAlertDTO>;
  update(id: string, updateData: UpdateProjectAlertRequestDto): Promise<ProjectAlertDTO>;
  delete(id: string): Promise<void>;

  // Alert-specific operations
  findActive(): Promise<ProjectAlertDTO[]>;
  findByType(type: string): Promise<ProjectAlertDTO[]>;
  findBySeverity(severity: string): Promise<ProjectAlertDTO[]>;
  acknowledge(id: string, userId: string): Promise<ProjectAlertDTO>;
  resolve(id: string, userId: string): Promise<ProjectAlertDTO>;

  // Statistics and analytics
  getStatistics(projectId?: string): Promise<AlertStatistics>;
  
  // Batch operations
  acknowledgeBatch(alertIds: string[], userId: string): Promise<ProjectAlertDTO[]>;
  resolveBatch(alertIds: string[], userId: string): Promise<ProjectAlertDTO[]>;
}
