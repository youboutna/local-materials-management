// Inspection Service - Hexagonal Architecture
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { Inspection, InspectionStatus } from '@/domain/entities/Inspection';
import { AppError, ErrorLogger } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/application/services/RepositoryFactory';

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
  async createInspection(data: Omit<Inspection, 'id'>): Promise<Inspection> {
    try {
      return await this.repository.create(data);
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
      return await this.repository.update(id, updates);
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

  // ============= Legacy Methods for Backward Compatibility =============

  /**
   * Get inspections by project ID (Legacy method)
   */
  static async getInspectionsByProject(projectId: string): Promise<Inspection[]> {
    try {
      // Import the legacy service for backward compatibility
      const { InspectionService: LegacyInspectionService } = await import('@/services/InspectionService');
      return await LegacyInspectionService.getInspectionsByProject(projectId);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getInspectionsByProject');
      throw error;
    }
  }

  /**
   * Create inspection (Legacy method)
   */
  static async createInspection(data: any): Promise<any> {
    try {
      // Import the legacy service for backward compatibility
      const { InspectionService: LegacyInspectionService } = await import('@/services/InspectionService');
      return await LegacyInspectionService.createInspection(data);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.createInspection');
      throw error;
    }
  }

  /**
   * Update inspection (Legacy method)
   */
  static async updateInspection(id: string, data: any): Promise<any> {
    try {
      // Import the legacy service for backward compatibility
      const { InspectionService: LegacyInspectionService } = await import('@/services/InspectionService');
      return await LegacyInspectionService.updateInspection(id, data);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.updateInspection');
      throw error;
    }
  }

  /**
   * Delete inspection (Legacy method)
   */
  static async deleteInspection(id: string): Promise<void> {
    try {
      // Import the legacy service for backward compatibility
      const { InspectionService: LegacyInspectionService } = await import('@/services/InspectionService');
      await LegacyInspectionService.deleteInspection(id);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.deleteInspection');
      throw error;
    }
  }

  /**
   * Get inspection by ID (Legacy method)
   */
  static async getInspectionById(id: string): Promise<any> {
    try {
      // Import the legacy service for backward compatibility
      const { InspectionService: LegacyInspectionService } = await import('@/services/InspectionService');
      return await LegacyInspectionService.getInspectionById(id);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.getInspectionById');
      throw error;
    }
  }

  /**
   * Get inspections by project
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
   * Create new inspection
   */
  async createInspection(inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Inspection> {
    try {
      const newInspection = new Inspection(
        crypto.randomUUID(),
        inspection.projectId,
        inspection.phaseId,
        inspection.stepId,
        inspection.inspector,
        inspection.date,
        inspection.status,
        inspection.progressAtInspection,
        inspection.comments,
        inspection.documents,
        new Date().toISOString(),
        new Date().toISOString()
      );

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
      const existingInspection = await this.repository.findById(id);
      if (!existingInspection) {
        throw new AppError('NOT_FOUND' as any, 'Inspection not found');
      }

      await this.repository.update(id, updates);
      const updatedInspection = { ...existingInspection, ...updates } as Inspection;
      return updatedInspection;
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
      const existingInspection = await this.repository.findById(id);
      if (!existingInspection) {
        throw new AppError('NOT_FOUND' as any, 'Inspection not found');
      }

      await this.repository.delete(id);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InspectionService.deleteInspection');
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
      const completedInspection = { ...existingInspection, ...updates } as Inspection;
      return completedInspection;
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
      const cancelledInspection = { ...existingInspection, ...updates } as Inspection;
      return cancelledInspection;
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
}
