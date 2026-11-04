/** Port et DTO des alertes de supervision (indépendants du fournisseur). */
export interface MonitoringAlertDTO {
  id: string;
  alertType: string;
  priority: string;
  title: string;
  description: string | null;
  /** Contexte projet (obligatoire en base). */
  projectId: string;
  /** Contexte phase, porté par metadata.phase_id. */
  phaseId: string | null;
  /** @deprecated alias historique de projectId */
  stationId: string | null;
  status: string;
  escalationLevel: number;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  metadata: Record<string, unknown> | null;
  assignedTo: string | null;
  assignedActions: string[];
}

export interface CreateMonitoringAlertDTO {
  title: string;
  alertType?: string;
  priority?: string;
  description?: string;
  projectId?: string;
  phaseId?: string | null;
  /** @deprecated alias historique de projectId */
  stationId?: string;
  assignedTo?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateMonitoringAlertDTO {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  phaseId?: string | null;
  assignedTo?: string;
  escalationLevel?: number;
  resolutionNotes?: string;
}

export interface IMonitoringAlertRepository {
  findAll(): Promise<MonitoringAlertDTO[]>;
  findById(id: string): Promise<MonitoringAlertDTO | null>;
  findByProjectId(projectId: string): Promise<MonitoringAlertDTO[]>;
  create(data: CreateMonitoringAlertDTO): Promise<MonitoringAlertDTO>;
  update(id: string, data: UpdateMonitoringAlertDTO): Promise<void>;
  delete(id: string): Promise<void>;
  acknowledge(id: string): Promise<void>;
  resolve(id: string, resolutionNotes?: string): Promise<void>;
}
