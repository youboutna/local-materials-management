// Repository interface for Inspection entity
import { Inspection, InspectionStatus, InspectionDocument } from '../entities/Inspection';

// Observation entity for inspections
export interface InspectionObservation {
  id: string;
  inspectionId: string;
  type: string;
  description: string;
  severity: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Checklist item for inspections
export interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  isCompleted: boolean;
  status?: 'pending' | 'completed' | 'skipped';
  notes?: string;
}

export interface IInspectionRepository {
  // CRUD operations
  findById(id: string): Promise<Inspection | null>;
  findAll(): Promise<Inspection[]>;
  save(inspection: Inspection): Promise<void>;
  create(data: Partial<Inspection>): Promise<Inspection>;
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
  
  // Observation operations
  addObservation(observation: Omit<InspectionObservation, 'createdAt' | 'updatedAt'>): Promise<InspectionObservation>;
  findObservationsByInspectionId(inspectionId: string): Promise<InspectionObservation[]>;
  
  // Document operations
  addDocument(document: { inspectionId: string; document: unknown; uploadedAt: string; uploadedBy: string }): Promise<void>;
  findDocumentsByInspectionId(inspectionId: string): Promise<InspectionDocument[]>;
  
  // Checklist operations
  getChecklistTemplate(inspectionType: string): Promise<ChecklistItem[]>;
}
