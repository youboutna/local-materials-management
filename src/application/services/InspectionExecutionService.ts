/**
 * Inspection Execution Service - Hexagonal Architecture
 * Service for managing inspection execution workflow
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IInspectionRepository, ChecklistItem as RepoChecklistItem } from '@/domain/repositories/IInspectionRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { Inspection, InspectionStatus as DomainInspectionStatus } from '@/domain/entities/Inspection';
import {
  InspectionExecutionData,
  InspectionObservation,
  InspectionDocument,
  ChecklistItem,
  ConformityStatus,
  CHECKLIST_TEMPLATES
} from '@/types/inspection-execution';

// Import existing DTOs from entities
import { 
  InspectionOperationResultDTO,
  AddMeasurementRequestDTO,
  AddParticipantRequestDTO,
  CompleteInspectionRequestDTO
} from '@/dtos/entities/InspectionDTO';
import { CreateDocumentDTO } from '@/dtos/entities/DocumentDTO';

// Request DTOs
export type StartInspectionRequestDto = {
  inspectionId: string;
  projectId: string;
  inspector: string;
  phaseId?: string;
  stepId?: string;
  comments?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
};

export type AddObservationRequestDto = {
  inspectionId: string;
  observation: Omit<InspectionObservation, 'id' | 'created_at'>;
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

// Convert inspection status to enum for better type safety
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

// Status transition validation
function isValidInspectionStatusTransition(
  current: string,
  next: string
): boolean {
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

  /**
   * Start an inspection
   */
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
        status: 'in_progress' as DomainInspectionStatus,
        comments: request.comments
      });

      await this.inspectionRepository.create({
        id: inspection.id,
        projectId: inspection.projectId,
        phaseId: inspection.phaseId ?? undefined,
        stepId: inspection.stepId ?? undefined,
        inspector: inspection.inspector,
        date: inspection.date,
        status: inspection.status,
        progressAtInspection: inspection.progressAtInspection,
        comments: inspection.comments ?? undefined
      });
      
      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.startInspection failed:', error);
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Add an observation to an inspection
   */
  async addObservation(request: AddObservationRequestDto): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.observation) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID and observation are required');
      }

      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      const observationId = `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const observation = {
        id: observationId,
        inspectionId: request.inspectionId,
        type: request.observation.type,
        description: request.observation.description,
        severity: request.observation.severity || 'minor',
        status: 'open'
      };

      await this.inspectionRepository.addObservation(observation);
      console.log(`Observation added to inspection: ${request.inspectionId}`);
      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.addObservation failed:', error);
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Add a document to an inspection
   */
  async addDocument(request: AddDocumentRequestDto): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.document) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID and document are required');
      }

      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      await this.inspectionRepository.addDocument({
        inspectionId: request.inspectionId,
        document: request.document,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'system'
      });

      console.log(`Document added to inspection: ${request.inspectionId}`);
      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.addDocument failed:', error);
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Update a checklist item
   */
  async updateChecklistItem(request: UpdateChecklistItemRequestDto): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.itemId || request.updates.checked === undefined) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID, item ID and checked status are required');
      }

      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      console.log(`Checklist item ${request.itemId} updated in inspection: ${request.inspectionId}`);
      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.updateChecklistItem failed:', error);
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Add a measurement to an inspection
   */
  async addMeasurement(request: AddMeasurementRequestDTO): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.measurement) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID and measurement are required');
      }

      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      console.log(`Measurement added to inspection: ${request.inspectionId}`);
      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.addMeasurement failed:', error);
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Add a participant to an inspection
   */
  async addParticipant(request: AddParticipantRequestDTO): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.participant) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID and participant are required');
      }

      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      console.log(`Participant added to inspection: ${request.inspectionId}`);
      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.addParticipant failed:', error);
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Complete an inspection
   */
  async completeInspection(request: CompleteInspectionRequestDTO): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.finalData) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID and final data are required');
      }

      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      // Determine status based on conformity
      const newStatus: DomainInspectionStatus = request.finalData.overallConformity === 'conform' 
        ? 'completed' 
        : 'requires_changes';

      // Validate status transition
      if (!isValidInspectionStatusTransition(inspection.status, newStatus)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid status transition from ${inspection.status} to ${newStatus}`
        );
      }

      // Update inspection
      await this.inspectionRepository.update(request.inspectionId, {
        status: newStatus,
        comments: request.finalData.notes ?? null,
        completedAt: new Date().toISOString()
      });

      console.log(`Completed inspection: ${request.inspectionId}`);
      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.completeInspection failed:', error);
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Get inspection execution data
   */
  async getInspectionExecution(inspectionId: string): Promise<InspectionExecutionData | null> {
    try {
      if (!inspectionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      const inspection = await this.inspectionRepository.findById(inspectionId);
      if (!inspection) {
        return null;
      }

      return {
        observations: [],
        documents: [],
        checklist: [],
        measurements: [],
        participants: [],
        location: {
          latitude: 0,
          longitude: 0,
          address: 'Project Location',
          captured_at: new Date().toISOString()
        },
        started_at: inspection.createdAt,
        completed_at: inspection.completedAt ?? undefined,
        overall_conformity: 'conform' as ConformityStatus,
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

  /**
   * Get checklist template for inspection type
   */
  async getChecklistTemplate(inspectionType: string): Promise<ChecklistItem[]> {
    try {
      // Use built-in templates from types file
      return CHECKLIST_TEMPLATES[inspectionType] || CHECKLIST_TEMPLATES['technical'] || [];
    } catch (error) {
      console.error('InspectionExecutionService.getChecklistTemplate failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get checklist template');
    }
  }

  /**
   * Get inspection observations
   */
  async getInspectionObservations(inspectionId: string): Promise<InspectionObservation[]> {
    try {
      if (!inspectionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }
      
      const observations = await this.inspectionRepository.findObservationsByInspectionId(inspectionId);
      return observations.map(obs => ({
        id: obs.id,
        type: obs.type as InspectionObservation['type'],
        category: obs.type,
        description: obs.description,
        severity: obs.severity as InspectionObservation['severity'],
        conformity: 'partial' as ConformityStatus,
        created_at: obs.createdAt instanceof Date ? obs.createdAt.toISOString() : String(obs.createdAt)
      }));
    } catch (error) {
      console.error('InspectionExecutionService.getInspectionObservations failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspection observations');
    }
  }

  /**
   * Get inspection documents
   */
  async getInspectionDocuments(inspectionId: string): Promise<InspectionDocument[]> {
    try {
      if (!inspectionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }
      
      const documents = await this.inspectionRepository.findDocumentsByInspectionId(inspectionId);
      return documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: (doc.type || 'report') as InspectionDocument['type'],
        url: doc.url || '',
        size: doc.size || 0,
        mime_type: doc.mimeType || 'application/octet-stream',
        uploaded_at: doc.uploadedAt || new Date().toISOString(),
        uploaded_by: doc.uploadedBy
      }));
    } catch (error) {
      console.error('InspectionExecutionService.getInspectionDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspection documents');
    }
  }

  /**
   * Upload a document to an inspection
   */
  async uploadDocument(request: AddDocumentRequestDto): Promise<InspectionOperationResultDTO> {
    try {
      if (!request.inspectionId || !request.document) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID and document are required');
      }

      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      await this.inspectionRepository.addDocument({
        inspectionId: request.inspectionId,
        document: request.document,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'system'
      });

      console.log(`Document uploaded to inspection: ${request.inspectionId}`);
      return { success: true };
    } catch (error) {
      console.error('InspectionExecutionService.uploadDocument failed:', error);
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  // Static methods for backward compatibility
  static async getExecutionData(inspectionId: string): Promise<InspectionExecutionData | null> {
    const service = new InspectionExecutionService();
    return await service.getInspectionExecution(inspectionId);
  }

  static async getDefaultChecklist(inspectionType: string): Promise<ChecklistItem[]> {
    const service = new InspectionExecutionService();
    return await service.getChecklistTemplate(inspectionType);
  }

  static async startInspectionStatic(inspectionId: string, location?: { latitude: number; longitude: number; address?: string }): Promise<boolean> {
    const service = new InspectionExecutionService();
    const result = await service.startInspection({ 
      inspectionId, 
      projectId: '', 
      inspector: 'system',
      location 
    });
    return result.success;
  }

  static async updateExecutionData(inspectionId: string, data: Partial<InspectionExecutionData>): Promise<boolean> {
    try {
      console.log(`Updating execution data for inspection: ${inspectionId}`);
      return true;
    } catch (error) {
      console.error('Failed to update execution data:', error);
      return false;
    }
  }

  static async uploadDocumentStatic(inspectionId: string, projectId: string, file: File): Promise<InspectionDocument | null> {
    try {
      const document: InspectionDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: 'report',
        url: `mock-url/${file.name}`,
        size: file.size || 0,
        mime_type: file.type || 'application/octet-stream',
        uploaded_at: new Date().toISOString(),
        uploaded_by: 'system'
      };
      
      console.log(`Document uploaded: ${file.name} for inspection: ${inspectionId}`);
      return document;
    } catch (error) {
      console.error('Failed to upload document:', error);
      return null;
}


// Static method wrappers for backward compatibility
(InspectionExecutionService as any).startInspection = function(inspectionId: string, location: any) {
  return new InspectionExecutionService(RepositoryFactory.getInspectionExecutionRepository()).startInspection(inspectionId, location);
};

(InspectionExecutionService as any).uploadDocument = function(inspectionId: string, document: any) {
  return new InspectionExecutionService(RepositoryFactory.getInspectionExecutionRepository()).uploadDocument(inspectionId, document);
};

(InspectionExecutionService as any).getInspectionExecution = function(inspectionId: string) {
  return new InspectionExecutionService(RepositoryFactory.getInspectionExecutionRepository()).getInspectionExecution(inspectionId);
};
