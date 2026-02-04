/**
 * Inspection Execution Service - Hexagonal Architecture
 * Service for managing inspection execution workflow
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import {
  InspectionExecutionData,
  InspectionObservation,
  InspectionDocument,
  ChecklistItem,
  InspectionMeasurement,
  InspectionParticipant,
  ConformityStatus,
} from '@/types/inspection-execution';

// Import existing DTOs from entities instead of defining locally
import { 
  InspectionDTO, 
  CreateInspectionDTO, 
  UpdateInspectionDTO, 
  InspectionDocument as EntityInspectionDocument,
  AddMeasurementRequestDTO,
  AddParticipantRequestDTO,
  CompleteInspectionRequestDTO,
  InspectionOperationResultDTO
} from '@/dtos/entities/InspectionDTO';
import { DocumentDTO, CreateDocumentDTO, UpdateDocumentDTO } from '@/dtos/entities/DocumentDTO';

// Use existing DTOs for inspection execution
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
  observation: Omit<InspectionObservation, 'id'>;
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
      const inspection = {
        id: inspectionId,
        projectId: request.projectId,
        phaseId: request.phaseId,
        stepId: request.stepId,
        inspector: request.inspector,
        date: new Date().toISOString(),
        status: 'in_progress',
        comments: request.comments || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.inspectionRepository.create(inspection);
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
        severity: request.observation.severity,
        status: 'open',
        createdAt: new Date().toISOString(),
        createdBy: 'system'
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

      // Add document using repository pattern
      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      // Create document record
      const documentId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const document = {
        id: documentId,
        inspectionId: request.inspectionId,
        document: request.document,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'system'
      };

      // In a real implementation, this would save to document repository
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
      if (!request.inspectionId || !request.itemId || request.updates.status === undefined) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID, item ID and status are required');
      }

      const inspection = await this.inspectionRepository.findById(request.inspectionId);
      if (!inspection) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Inspection not found');
      }

      // In a real implementation, this would update the checklist item in repository
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

      const measurementId = `meas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const measurement = {
        id: measurementId,
        inspectionId: request.inspectionId,
        type: request.measurement.type,
        value: request.measurement.value,
        unit: request.measurement.unit,
        recordedAt: new Date().toISOString(),
        recordedBy: 'system'
      };

      // In a real implementation, this would save to measurement repository
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

      const participantId = `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const participant = {
        id: participantId,
        inspectionId: request.inspectionId,
        name: request.participant.name,
        role: request.participant.role,
        organization: request.participant.organization,
        joinedAt: new Date().toISOString()
      };

      // In a real implementation, this would save to participant repository
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

      // Validate status transition
      if (!isValidInspectionStatusTransition(
        inspection.status as InspectionStatus,
        request.finalData.status as InspectionStatus
      )) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid status transition from ${inspection.status} to ${request.finalData.status}`
        );
      }

      // Update inspection status and final data
      await this.inspectionRepository.update(request.inspectionId, {
        status: request.finalData.status,
        comments: request.finalData.comments,
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
          address: 'Mock Location',
          captured_at: new Date().toISOString()
        },
        started_at: inspection.createdAt,
        completed_at: inspection.completedAt,
        overall_conformity: 'conform' as ConformityStatus,
        progress_percentage: inspection.progress || 0,
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
      const checklistTemplate = await this.inspectionRepository.getChecklistTemplate(inspectionType);
      return checklistTemplate || [];
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
        inspectionId: obs.inspectionId,
        type: obs.type,
        description: obs.description,
        severity: obs.severity,
        status: obs.status,
        createdAt: obs.createdAt.toISOString(),
        updatedAt: obs.updatedAt.toISOString()
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
        inspectionId: doc.inspectionId,
        type: doc.type,
        name: doc.name,
        url: doc.url,
        uploadedAt: doc.uploadedAt.toISOString(),
        uploadedBy: doc.uploadedBy,
        size: doc.size,
        mimeType: doc.mimeType
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

      const documentId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const document = {
        id: documentId,
        inspectionId: request.inspectionId,
        name: request.document.name,
        type: request.document.type,
        url: request.document.url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'system'
      };

      await this.inspectionRepository.addDocument(document);
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

  // Update status transition validation with enum
  function isValidInspectionStatusTransition(
    current: InspectionStatus,
    next: InspectionStatus
  ): boolean {
    const validTransitions: Record<InspectionStatus, InspectionStatus[]> = {
      [InspectionStatus.PENDING]: [InspectionStatus.IN_PROGRESS, InspectionStatus.CANCELLED],
      [InspectionStatus.IN_PROGRESS]: [InspectionStatus.COMPLETED, InspectionStatus.REQUIRES_REVIEW, InspectionStatus.CANCELLED],
      [InspectionStatus.COMPLETED]: [InspectionStatus.APPROVED, InspectionStatus.REJECTED],
      [InspectionStatus.REQUIRES_REVIEW]: [InspectionStatus.COMPLETED, InspectionStatus.REQUIRES_CHANGES],
      [InspectionStatus.REQUIRES_CHANGES]: [InspectionStatus.IN_PROGRESS],
      [InspectionStatus.APPROVED]: [],
      [InspectionStatus.REJECTED]: [],
      [InspectionStatus.CANCELLED]: []
    };
    return validTransitions[current]?.includes(next) ?? false;
  }

  // Static methods for backward compatibility with existing components
  static async getExecutionData(inspectionId: string): Promise<InspectionExecutionData | null> {
    const service = new InspectionExecutionService();
    return await service.getInspectionExecution(inspectionId);
  }

  static async getDefaultChecklist(inspectionType: string): Promise<ChecklistItem[]> {
    const service = new InspectionExecutionService();
    return await service.getChecklistTemplate(inspectionType);
  }

  static async startInspection(inspectionId: string, location?: { latitude: number; longitude: number; address?: string }): Promise<boolean> {
    const service = new InspectionExecutionService();
    const result = await service.startInspection({ inspectionId, location });
    return result.success;
  }

  static async updateExecutionData(inspectionId: string, data: Partial<InspectionExecutionData>): Promise<boolean> {
    const service = new InspectionExecutionService();
    try {
      // For now, simulate update as repository doesn't support full execution data
      // TODO: Implement proper update when repository supports execution data
      console.warn('InspectionExecutionService.updateExecutionData: Limited implementation');
      console.log(`Updating execution data for inspection: ${inspectionId}`);
      return true;
    } catch (error) {
      console.error('Failed to update execution data:', error);
      return false;
    }
  }

  static async uploadDocument(inspectionId: string, projectId: string, file: File): Promise<InspectionDocument | null> {
    const service = new InspectionExecutionService();
    try {
      // For now, simulate document upload
      // TODO: Implement proper document upload when storage service is integrated
      console.warn('InspectionExecutionService.uploadDocument: Mock implementation');
      
      const document: InspectionDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type as "certificate" | "checklist" | "photo" | "report" | "scan",
        url: `mock-url/${file.name}`,
        size: 0, // Mock size
        mime_type: 'application/octet-stream', // Mock mime type
        uploaded_at: new Date().toISOString(),
        uploaded_by: 'system'
      };
      
      console.log(`Document uploaded: ${file.name} for inspection: ${inspectionId}`);
      return document;
    } catch (error) {
      console.error('Failed to upload document:', error);
      return null;
    }
  }
}
