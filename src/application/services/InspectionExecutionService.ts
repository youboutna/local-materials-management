/**
 * Inspection Execution Service - Hexagonal Architecture
 * Service for managing inspection execution workflow
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IInspectionRepository, ChecklistItem as RepoChecklistItem } from '@/domain/repositories/IInspectionRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { Inspection, InspectionStatus as DomainInspectionStatus } from '@/domain/entities/Inspection';

// Local type definitions
export interface InspectionExecutionData {
  id: string;
  inspectionId: string;
  status: 'in_progress' | 'completed' | 'paused';
  progressAtInspection: number;
  comments?: string;
  documents: InspectionDocument[];
  observations: InspectionObservation[];
  checklist: ChecklistItem[];
  projectId: string;
  inspector: string;
  date: string;
  // Extended fields
  measurements?: unknown[];
  participants?: unknown[];
  location?: { latitude: number; longitude: number; address?: string; captured_at?: string };
  started_at?: Date | string;
  completed_at?: string;
  overall_conformity?: ConformityStatus;
  progress_percentage?: number;
  summary?: string;
  recommendations?: string[];
  corrective_actions_required?: boolean;
}

export interface InspectionObservation {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved';
  photo?: string;
  createdAt: string;
  resolvedAt?: string;
  // Legacy aliases
  type?: string;
  category?: string;
  conformity?: string;
  created_at?: string;
}

export interface InspectionDocument {
  id: string;
  name: string;
  type: 'certificate' | 'checklist' | 'photo' | 'report' | 'scan';
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  size?: number;
  mime_type?: string;
  uploaded_at?: string;
  uploaded_by?: string;
}

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

export type ConformityStatus = 'conforme' | 'non_conforme' | 'en_attente';

export const CHECKLIST_TEMPLATES: Record<string, ChecklistItem[]> = {
  standard: [
    { id: '1', title: 'Vérification des plans', required: true, completed: false },
    { id: '2', title: 'Contrôle des matériaux', required: true, completed: false },
    { id: '3', title: 'Sécurité du chantier', required: true, completed: false }
  ]
};

import { 
  InspectionOperationResultDTO,
  AddMeasurementRequestDTO,
  AddParticipantRequestDTO,
  CompleteInspectionRequestDTO
} from '@/dtos/entities/InspectionDTO';
import { CreateDocumentDTO } from '@/dtos/entities/DocumentDTO';

export type StartInspectionRequestDto = {
  inspectionId: string;
  projectId: string;
  inspector: string;
  phaseId?: string;
  stepId?: string;
  comments?: string;
  location?: { latitude: number; longitude: number; address?: string };
};

export type AddObservationRequestDto = {
  inspectionId: string;
  observation: Omit<InspectionObservation, 'id' | 'createdAt'>;
};

export type AddDocumentRequestDto = {
  inspectionId: string;
  document: CreateDocumentDTO;
};

export type UpdateChecklistItemRequestDto = {
  inspectionId: string;
  itemId: string;
  updates: Partial<ChecklistItem>;
};

export enum InspectionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REQUIRES_REVIEW = 'requires_review',
  REQUIRES_CHANGES = 'requires_changes',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

function isValidInspectionStatusTransition(current: string, next: string): boolean {
  const validTransitions: Record<string, string[]> = {
    'pending': ['in_progress', 'cancelled'],
    'scheduled': ['in_progress', 'cancelled'],
    'requested': ['scheduled', 'in_progress', 'cancelled'],
    'in_progress': ['completed', 'requires_review', 'cancelled'],
    'completed': ['approved', 'rejected'],
    'requires_review': ['completed', 'requires_changes'],
    'requires_changes': ['in_progress'],
    'approved': [],
    'rejected': [],
    'cancelled': []
  };
  return validTransitions[current]?.includes(next) ?? false;
}

export class InspectionExecutionService {
  constructor(
    private inspectionRepository: IInspectionRepository = RepositoryFactory.getInspectionRepository()
  ) {}

  async startInspection(request: StartInspectionRequestDto): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.projectId || !request.inspector) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID and inspector are required');
      }

      const inspectionId = `insp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const inspection = Inspection.create({
        id: inspectionId,
        projectId: request.projectId,
        phaseId: request.phaseId,
        stepId: request.stepId,
        inspector: request.inspector,
        date: new Date().toISOString(),
        status: DomainInspectionStatus.InProgress,
        comments: request.comments
      });

      await this.inspectionRepository.create({
        id: inspection.id,
        date: inspection.date,
        status: inspection.status,
        inspector: inspection.inspector,
        progressAtInspection: inspection.progressAtInspection,
        comments: inspection.comments
      } as Partial<Inspection>);
      
      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.startInspection failed:', error);
      if (error instanceof AppError) return { success: false, error: error.message };
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async addObservation(request: AddObservationRequestDto): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.observation) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID and observation are required');
      }

      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');

      const observationId = `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const observation = {
        id: observationId,
        inspectionId: request.inspectionId,
        type: request.observation.type || 'general',
        description: request.observation.description,
        severity: request.observation.severity || 'low',
        status: 'open'
      };

      await this.inspectionRepository.addObservation(observation);
      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.addObservation failed:', error);
      if (error instanceof AppError) return { success: false, error: error.message };
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async addDocument(request: AddDocumentRequestDto): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.document) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID and document are required');
      }

      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');

      await this.inspectionRepository.addDocument({
        inspectionId: request.inspectionId,
        document: request.document,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'system'
      });

      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.addDocument failed:', error);
      if (error instanceof AppError) return { success: false, error: error.message };
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateChecklistItem(request: UpdateChecklistItemRequestDto): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.itemId || (request.updates.completed === undefined && request.updates.checked === undefined)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID, item ID and checked status are required');
      }

      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');

      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.updateChecklistItem failed:', error);
      if (error instanceof AppError) return { success: false, error: error.message };
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async addMeasurement(request: AddMeasurementRequestDTO): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.measurement) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID and measurement are required');
      }
      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.addMeasurement failed:', error);
      if (error instanceof AppError) return { success: false, error: error.message };
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async addParticipant(request: AddParticipantRequestDTO): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.participant) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID and participant are required');
      }
      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.addParticipant failed:', error);
      if (error instanceof AppError) return { success: false, error: error.message };
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async completeInspection(request: CompleteInspectionRequestDTO): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.finalData) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID and final data are required');
      }

      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');

      const newStatus: DomainInspectionStatus = request.finalData.overallConformity === 'conform' 
        ? DomainInspectionStatus.Completed 
        : DomainInspectionStatus.RequiresChanges;

      const currentStatusStr = inspection.status.toString().toLowerCase();
      const newStatusStr = newStatus === DomainInspectionStatus.Completed ? 'completed' : 'requires_changes';

      if (!isValidInspectionStatusTransition(currentStatusStr, newStatusStr)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid status transition from ${inspection.status} to ${newStatus}`);
      }

      await this.inspectionRepository.update(request.inspectionId, {
        status: newStatus,
        comments: request.finalData.notes ?? undefined,
        completedAt: new Date().toISOString()
      } as Partial<Inspection>);

      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.completeInspection failed:', error);
      if (error instanceof AppError) return { success: false, error: error.message };
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getInspectionExecution(inspectionId: string): Promise<InspectionExecutionData | null> {
    try {
      if (!inspectionId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');

      const inspection = await this.inspectionRepository.findById(inspectionId);
      if (!inspection) return null;

      return {
        id: inspectionId,
        inspectionId,
        status: 'in_progress',
        progressAtInspection: inspection.progressAtInspection,
        comments: inspection.comments,
        observations: [],
        documents: [],
        checklist: [],
        projectId: inspection.projectId || '',
        inspector: inspection.inspector?.name || '',
        date: inspection.date,
        measurements: [],
        participants: [],
        location: { latitude: 0, longitude: 0, address: 'Project Location', captured_at: new Date().toISOString() },
        started_at: inspection.createdAt,
        completed_at: inspection.completedAt ?? undefined,
        overall_conformity: 'conforme' as ConformityStatus,
        progress_percentage: inspection.progress ?? inspection.progressAtInspection ?? 0,
        summary: inspection.comments || '',
        recommendations: [],
        corrective_actions_required: false
      };
    } catch (error) {
      console.error('InspectionExecutionService.getInspectionExecution failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspection execution');
    }
  }

  async getChecklistTemplate(inspectionType: string): Promise<ChecklistItem[]> {
    try {
      return CHECKLIST_TEMPLATES[inspectionType] || CHECKLIST_TEMPLATES['standard'] || [];
    } catch (error) {
      console.error('InspectionExecutionService.getChecklistTemplate failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get checklist template');
    }
  }

  async getInspectionObservations(inspectionId: string): Promise<InspectionObservation[]> {
    try {
      if (!inspectionId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      const observations = await this.inspectionRepository.findObservationsByInspectionId(inspectionId);
      return observations.map(obs => ({
        id: obs.id,
        type: obs.type,
        category: obs.type,
        description: obs.description,
        severity: obs.severity as InspectionObservation['severity'],
        conformity: 'partial' as string,
        status: obs.status as InspectionObservation['status'],
        createdAt: obs.createdAt instanceof Date ? obs.createdAt.toISOString() : String(obs.createdAt),
        created_at: obs.createdAt instanceof Date ? obs.createdAt.toISOString() : String(obs.createdAt)
      }));
    } catch (error) {
      console.error('InspectionExecutionService.getInspectionObservations failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspection observations');
    }
  }

  async getInspectionDocuments(inspectionId: string): Promise<InspectionDocument[]> {
    try {
      if (!inspectionId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      const documents = await this.inspectionRepository.findDocumentsByInspectionId(inspectionId);
      return documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: (doc.type || 'report') as InspectionDocument['type'],
        url: doc.url || '',
        size: doc.size || 0,
        mime_type: doc.mimeType || 'application/octet-stream',
        uploaded_at: doc.uploadedAt || new Date().toISOString(),
        uploaded_by: doc.uploadedBy,
        uploadedAt: doc.uploadedAt || new Date().toISOString(),
        uploadedBy: doc.uploadedBy || ''
      }));
    } catch (error) {
      console.error('InspectionExecutionService.getInspectionDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspection documents');
    }
  }

  async uploadDocument(request: AddDocumentRequestDto): Promise<InspectionOperationResultDTO> {
    return this.addDocument(request);
  }
}
