// Repository interface for Inspection entity
import { Inspection, InspectionStatus, Document } from '../entities/Inspection';

// Observation entity for inspections
export interface InspectionObservation {
  id: string;
  inspectionId: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// Checklist item for inspections
export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  completed: boolean;
  checked?: boolean;
  notes?: string;
  category?: string;
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
  
  // Document operations
  addDocument(document: { inspectionId: string; document: Document; uploadedAt: string; uploadedBy: string }): Promise<void>;
  findDocumentsByInspectionId(inspectionId: string): Promise<Document[]>;
  
  // Checklist operations
  getChecklistTemplate(inspectionType: string): Promise<ChecklistItem[]>;
}
