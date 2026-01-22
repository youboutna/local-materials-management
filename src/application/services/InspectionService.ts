// Inspection Service - Hexagonal Architecture
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { Inspection, InspectionStatus } from '@/domain/entities/Inspection';
import { AppError, ErrorLogger } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Types for inspection execution
export interface InspectionDocument {
  id: string;
  type: string;
  name: string;
  url?: string;
  uploadedAt?: string;
  inspectionId: string;
}

export interface InspectionExecutionData {
  id: string;
  status: string;
  progressAtInspection?: number;
  comments?: string;
  documents: InspectionDocument[];
  completedAt?: string;
  completedBy?: string;
}

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
  async createInspection(data: Partial<Inspection>): Promise<Inspection> {
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
  async updateInspection(id: string, updates: Partial<Inspection>): Promise<Inspection> {
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new AppError('NOT_FOUND' as any, 'Inspection not found');
      }
      await this.repository.update(id, updates);
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
  async completeInspection(id: string, progress: number, comments?: string): Promise<Inspection> {
    try {
      const existingInspection = await this.repository.findById(id);
      if (!existingInspection) {
        throw new AppError('NOT_FOUND' as any, 'Inspection not found');
      }

      const updates: Partial<Inspection> = {
        status: 'completed',
        progressAtInspection: progress,
        comments: comments || existingInspection.comments,
        updatedAt: new Date().toISOString()
      };

      await this.repository.update(id, updates);
      return { ...existingInspection, ...updates } as Inspection;
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.completeInspection');
      throw error;
    }
  }

  /**
   * Cancel inspection
   */
  async cancelInspection(id: string, reason?: string): Promise<Inspection> {
    try {
      const existingInspection = await this.repository.findById(id);
      if (!existingInspection) {
        throw new AppError('NOT_FOUND' as any, 'Inspection not found');
      }

      const updates: Partial<Inspection> = {
        status: 'cancelled',
        comments: reason ? `${existingInspection.comments}\n\nCancelled: ${reason}` : existingInspection.comments,
        updatedAt: new Date().toISOString()
      };

      await this.repository.update(id, updates);
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
  async uploadDocuments(inspectionId: string, files: File[]): Promise<InspectionDocument[]> {
    try {
      const uploadedDocuments: InspectionDocument[] = [];
      
      for (const file of files) {
        // Simulate document upload - in real implementation, this would use StorageService
        const document: InspectionDocument = {
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
      ErrorLogger.log(error as Error, 'InspectionService.uploadDocuments');
      throw new Error('Failed to upload documents');
    }
  }

  /**
   * Get inspection with execution data
   */
  async getInspectionExecutionData(inspectionId: string): Promise<InspectionExecutionData | null> {
    try {
      const inspection = await this.repository.findById(inspectionId);
      
      if (!inspection) {
        return null;
      }

      return {
        id: inspection.id,
        status: inspection.status,
        progressAtInspection: inspection.progressAtInspection,
        comments: inspection.comments,
        documents: inspection.documents || [],
        completedAt: inspection.updatedAt
      };
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getInspectionExecutionData');
      throw new Error('Failed to get inspection execution data');
    }
  }

  /**
   * Update inspection with execution data
   */
  async updateInspectionExecution(data: InspectionExecutionData): Promise<InspectionExecutionData> {
    try {
      const updatedInspection = await this.updateInspection(data.id, {
        status: data.status,
        progressAtInspection: data.progressAtInspection,
        comments: data.comments,
        documents: data.documents,
        completedAt: data.completedAt,
        updatedAt: new Date().toISOString()
      });
      
      return {
        ...updatedInspection,
        documents: data.documents
      };
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.updateInspectionExecution');
      throw new Error('Failed to update inspection execution');
    }
  }

  // Static methods for backward compatibility
  static async getInspectionsByProject(projectId: string): Promise<Inspection[]> {
    const service = new InspectionService();
    return service.getInspectionsByProject(projectId);
  }

  static async createInspection(data: any): Promise<Inspection> {
    const service = new InspectionService();
    return service.createInspection(data);
  }

  static async updateInspection(id: string, data: any): Promise<Inspection> {
    const service = new InspectionService();
    return service.updateInspection(id, data);
  }

  static async deleteInspection(id: string): Promise<void> {
    const service = new InspectionService();
    return service.deleteInspection(id);
  }

  static async getInspectionById(id: string): Promise<Inspection | null> {
    const service = new InspectionService();
    return service.getInspectionById(id);
  }
}
