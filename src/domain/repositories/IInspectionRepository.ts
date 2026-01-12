// Repository interface for Inspection entity
import { Inspection, InspectionStatus } from '../entities/Inspection';

export interface IInspectionRepository {
  // CRUD operations
  findById(id: string): Promise<Inspection | null>;
  findAll(): Promise<Inspection[]>;
  save(inspection: Inspection): Promise<void>;
  update(id: string, data: Partial<Inspection>): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByProjectId(projectId: string): Promise<Inspection[]>;
  findByPhaseId(phaseId: string): Promise<Inspection[]>;
  findByStepId(stepId: string): Promise<Inspection[]>;
  findByStatus(status: InspectionStatus): Promise<Inspection[]>;
  findByInspector(inspectorId: string): Promise<Inspection[]>;
  
  // Date-based queries
  findScheduledBetween(startDate: string, endDate: string): Promise<Inspection[]>;
  findUpcoming(days: number): Promise<Inspection[]>;
  findOverdue(): Promise<Inspection[]>;
  
  // Statistics
  countByStatus(projectId: string): Promise<Record<InspectionStatus, number>>;
  getAverageCompletionTime(projectId: string): Promise<number>;
}
