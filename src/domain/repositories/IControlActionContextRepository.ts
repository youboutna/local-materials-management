/** Port de lecture du contexte des actions de contrôle (assurances, inspections, garanties). */
export type ControlActionRecordKind = 'project' | 'insurance' | 'inspection' | 'bank_guarantee';

export interface IControlActionContextRepository {
  findRecord(kind: ControlActionRecordKind, id: string): Promise<Record<string, any> | null>;
  findActiveEmployees(department?: string): Promise<Record<string, any>[]>;
  findEmployeesByIds(ids: string[]): Promise<Record<string, any>[]>;
  findProjectOrganizations(projectId: string): Promise<Record<string, any>[]>;
  findEmployee(id: string): Promise<Record<string, any> | null>;
  findActiveSuppliers(): Promise<Record<string, any>[]>;
  findDocumentsByInspection(inspectionId: string): Promise<Record<string, any>[]>;
  /** Historique des actions tracées en notifications système. */
  findActionHistory(entityType: string, entityId?: string): Promise<Record<string, any>[]>;
}
