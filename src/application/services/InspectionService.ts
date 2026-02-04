// Inspection Service - Hexagonal Architecture
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { Inspection, InspectionStatus } from '@/domain/entities/Inspection';
import { AppError, ErrorLogger, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  InspectionDocumentDTO,
  InspectionExecutionDataDTO,
  InspectionPaymentValidationDTO
} from '@/dtos/entities/InspectionDTO';

export class InspectionService {
  private repository: IInspectionRepository;

  constructor(repository?: IInspectionRepository) {
    this.repository = repository || RepositoryFactory.getInspectionRepository();
  }

  /**
   * Get all inspections
   */
  async getAllInspections(): Promise<Inspection[]> {
    try {
      return await this.repository.findAll();
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getAllInspections');
      throw error;
    }
  }

  /**
   * Get inspection by ID
   */
  async getInspectionById(id: string): Promise<Inspection | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getInspectionById');
      throw error;
    }
  }

  /**
   * Get inspections by project ID
   */
  async getInspectionsByProject(projectId: string): Promise<Inspection[]> {
    try {
      return await this.repository.findByProjectId(projectId);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getInspectionsByProject');
      throw error;
    }
  }

  /**
   * Create inspection
   */
  async createInspection(data: Omit<InspectionExecutionDataDTO, 'id'>): Promise<Inspection> {
    try {
      const newInspection = Inspection.create({
        id: crypto.randomUUID(),
        projectId: data.projectId || '',
        phaseId: data.phaseId || undefined,
        stepId: data.stepId || undefined,
        inspector: data.inspector || '',
        date: data.date || new Date().toISOString(),
        comments: data.comments || undefined
      });
      
      await this.repository.save(newInspection);
      return newInspection;
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.createInspection');
      throw error;
    }
  }

  /**
   * Update inspection
   */
  async updateInspection(id: string, updates: InspectionExecutionDataDTO): Promise<Inspection> {
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new AppError('NOT_FOUND' as ErrorCode, 'Inspection not found');
      }
      await this.repository.update(id, updates as Record<string, unknown>);
      return { ...existing, ...updates } as Inspection;
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.updateInspection');
      throw error;
    }
  }

  /**
   * Delete inspection
   */
  async deleteInspection(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.deleteInspection');
      throw error;
    }
  }

  /**
   * Get inspections by phase
   */
  async getInspectionsByPhase(phaseId: string): Promise<Inspection[]> {
    try {
      return await this.repository.findByPhaseId(phaseId);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getInspectionsByPhase');
      throw error;
    }
  }

  /**
   * Get inspections by step
   */
  async getInspectionsByStep(stepId: string): Promise<Inspection[]> {
    try {
      return await this.repository.findByStepId(stepId);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getInspectionsByStep');
      throw error;
    }
  }

  /**
   * Get inspections by status
   */
  async getInspectionsByStatus(status: InspectionStatus): Promise<Inspection[]> {
    try {
      return await this.repository.findByStatus(status);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getInspectionsByStatus');
      throw error;
    }
  }

  /**
   * Get inspections by inspector
   */
  async getInspectionsByInspector(inspectorId: string): Promise<Inspection[]> {
    try {
      return await this.repository.findByInspector(inspectorId);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getInspectionsByInspector');
      throw error;
    }
  }

  /**
   * Get inspections scheduled between dates
   */
  async getInspectionsScheduledBetween(startDate: string, endDate: string): Promise<Inspection[]> {
    try {
      return await this.repository.findScheduledBetween(startDate, endDate);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getInspectionsScheduledBetween');
      throw error;
    }
  }

  /**
   * Get upcoming inspections
   */
  async getUpcomingInspections(days: number = 7): Promise<Inspection[]> {
    try {
      return await this.repository.findUpcoming(days);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getUpcomingInspections');
      throw error;
    }
  }

  /**
   * Get overdue inspections
   */
  async getOverdueInspections(): Promise<Inspection[]> {
    try {
      return await this.repository.findOverdue();
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getOverdueInspections');
      throw error;
    }
  }

  /**
   * Complete inspection
   */
  async completeInspection(id: string, data: InspectionExecutionDataDTO): Promise<Inspection> {
    try {
      const existingInspection = await this.repository.findById(id);
      if (!existingInspection) {
        throw new AppError('NOT_FOUND' as ErrorCode, 'Inspection not found');
      }

      const updates: InspectionExecutionDataDTO = {
        status: 'completed',
        progressAtInspection: data.progressAtInspection,
        comments: data.comments,
        updatedAt: new Date().toISOString()
      };

      await this.repository.update(id, updates as Record<string, unknown>);
      return { ...existingInspection, ...updates } as Inspection;
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.completeInspection');
      throw error;
    }
  }

  /**
   * Cancel inspection
   */
  async cancelInspection(id: string, data: InspectionExecutionDataDTO): Promise<Inspection> {
    try {
      const existingInspection = await this.repository.findById(id);
      if (!existingInspection) {
        throw new AppError('NOT_FOUND' as ErrorCode, 'Inspection not found');
      }

      const updates: InspectionExecutionDataDTO = {
        status: 'cancelled',
        comments: data.comments,
        updatedAt: new Date().toISOString()
      };

      await this.repository.update(id, updates as Record<string, unknown>);
      return { ...existingInspection, ...updates } as Inspection;
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.cancelInspection');
      throw error;
    }
  }

  /**
   * Get inspection statistics by project
   */
  async getInspectionStatsByProject(projectId: string): Promise<Record<InspectionStatus, number>> {
    try {
      return await this.repository.countByStatus(projectId);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getInspectionStatsByProject');
      throw error;
    }
  }

  /**
   * Get average completion time for project
   */
  async getAverageCompletionTime(projectId: string): Promise<number> {
    try {
      return await this.repository.getAverageCompletionTime(projectId);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getAverageCompletionTime');
      throw error;
    }
  }

  /**
   * Upload documents for inspection
   */
  async uploadDocuments(inspectionId: string, files: File[]): Promise<InspectionDocumentDTO[]> {
    try {
      if (!inspectionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      if (!files || files.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Files are required');
      }

      const uploadedDocuments: InspectionDocumentDTO[] = [];
      
      // For now, simulate document upload as storage service is not available
      // TODO: Implement proper document upload when storage service is available
      console.warn('InspectionService.uploadDocuments: Storage service not available');
      
      for (const file of files) {
        const document: InspectionDocumentDTO = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: file.type || 'unknown',
          name: file.name,
          inspectionId,
          uploadedAt: new Date().toISOString()
        };
        
        uploadedDocuments.push(document);
      }
      
      return uploadedDocuments;
    } catch (error) {
      console.error('InspectionService.uploadDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to upload documents');
    }
  }

  /**
   * Get inspection with execution data
   */
  async getInspectionExecutionData(inspectionId: string): Promise<InspectionExecutionDataDTO | null> {
    try {
      const inspection = await this.repository.findById(inspectionId);
      
      if (!inspection) return null;
      
      return {
        id: inspection.id,
        status: inspection.status,
        progressAtInspection: inspection.progressAtInspection,
        comments: inspection.comments ?? undefined,
        documents: inspection.documents?.map(doc => ({
          id: doc.id,
          type: doc.type,
          name: doc.name,
          url: doc.url,
          uploadedAt: doc.uploadedAt,
          inspectionId: inspection.id
        })) || [],
        completedAt: inspection.completedAt,
        projectId: inspection.projectId,
        phaseId: inspection.phaseId,
        stepId: inspection.stepId,
        inspector: inspection.inspector,
        date: inspection.date
      };
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getInspectionExecutionData');
      throw error;
    }
  }

  /**
   * Update inspection with execution data
   */
  async updateInspectionExecution(data: InspectionExecutionDataDTO): Promise<InspectionExecutionDataDTO> {
    try {
      if (!data.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      const validStatus = ['scheduled', 'in_progress', 'completed', 'cancelled'].includes(data.status)
        ? data.status as InspectionStatus
        : 'scheduled';
      
      await this.updateInspection(data.id, {
        status: validStatus,
        progressAtInspection: data.progressAtInspection,
        comments: data.comments,
        updatedAt: new Date().toISOString()
      } as Record<string, unknown>);
      
      return {
        id: data.id,
        status: data.status,
        progressAtInspection: data.progressAtInspection,
        comments: data.comments,
        documents: data.documents,
        completedAt: data.completedAt
      };
    } catch (error) {
      console.error('InspectionService.updateInspectionExecution failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update inspection execution');
    }
  }

  /**
   * Update inspection payment validation
   */
  async updateInspectionPaymentValidation(id: string, data: InspectionPaymentValidationDTO): Promise<Inspection> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      if (!data.status) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Status is required');
      }

      return this.updateInspection(id, {
        status: data.status as InspectionStatus,
        comments: data.comments,
        // Add payment-related fields if they exist in the entity
        ...(data.payment_type && { payment_type: data.payment_type }),
        ...(data.payment_status && { payment_status: data.payment_status }),
        ...(data.project_id && { project_id: data.project_id }),
        ...(data.inspection_id && { inspection_id: data.inspection_id }),
        ...(data.rejection_notes && { rejection_notes: data.rejection_notes }),
      });
    } catch (error) {
      console.error('InspectionService.updateInspectionPaymentValidation failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update inspection payment validation');
    }
  }
}
