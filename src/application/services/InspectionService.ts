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

  static async updateInspection(id: string, updates: Partial<InspectionExecutionDataDTO>): Promise<Inspection> {
    const service = new InspectionService();
    return service.updateInspection(id, updates);
  }

  async getAllInspections(): Promise<Inspection[]> {
    try { return await this.repository.findAll(); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getAllInspections'); throw error; }
  }

  async getInspectionById(id: string): Promise<Inspection | null> {
    try { return await this.repository.findById(id); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getInspectionById'); throw error; }
  }

  async getInspectionsByProject(projectId: string): Promise<Inspection[]> {
    try { return await this.repository.findByProjectId(projectId); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getInspectionsByProject'); throw error; }
  }

  async createInspection(data: Omit<InspectionExecutionDataDTO, 'id' | 'documents'>): Promise<Inspection> {
    try {
      const newInspection = Inspection.create({
        id: crypto.randomUUID(),
        projectId: data.projectId || '',
        phaseId: data.phaseId,
        stepId: data.stepId,
        inspector: data.inspector || '',
        date: data.date || new Date().toISOString(),
        comments: data.comments
      });
      await this.repository.save(newInspection);
      return newInspection;
    } catch (error) { ErrorLogger.log(error as Error, 'InspectionService.createInspection'); throw error; }
  }

  async updateInspection(id: string, updates: Partial<InspectionExecutionDataDTO>): Promise<Inspection> {
    try {
      const existing = await this.repository.findById(id);
      if (!existing) throw new AppError('NOT_FOUND' as ErrorCode, 'Inspection not found');
      
      const entityUpdates: Partial<Inspection> = {
        status: updates.status ? Inspection.mapStringToStatus(updates.status) : undefined,
        progressAtInspection: updates.progressAtInspection,
        comments: updates.comments ?? undefined,
      } as Partial<Inspection>;
      
      await this.repository.update(id, entityUpdates);
      
      return Inspection.create({
        id: existing.id,
        projectId: existing.projectId,
        phaseId: existing.phaseId,
        stepId: existing.stepId,
        inspector: existing.inspector,
        date: existing.date,
        status: updates.status ? Inspection.mapStringToStatus(updates.status) : existing.status,
        progressAtInspection: updates.progressAtInspection ?? existing.progressAtInspection,
        comments: updates.comments ?? existing.comments,
        completedAt: updates.completedAt ?? existing.completedAt,
        completedBy: updates.completedBy ?? existing.completedBy
      });
    } catch (error) { ErrorLogger.log(error as Error, 'InspectionService.updateInspection'); throw error; }
  }

  async deleteInspection(id: string): Promise<void> {
    try { await this.repository.delete(id); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.deleteInspection'); throw error; }
  }

  async getInspectionsByPhase(phaseId: string): Promise<Inspection[]> {
    try { return await this.repository.findByPhaseId(phaseId); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getInspectionsByPhase'); throw error; }
  }

  async getInspectionsByStep(stepId: string): Promise<Inspection[]> {
    try { return await this.repository.findByStepId(stepId); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getInspectionsByStep'); throw error; }
  }

  async getInspectionsByStatus(status: InspectionStatus): Promise<Inspection[]> {
    try { return await this.repository.findByStatus(status); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getInspectionsByStatus'); throw error; }
  }

  async getInspectionsByInspector(inspectorId: string): Promise<Inspection[]> {
    try { return await this.repository.findByInspector(inspectorId); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getInspectionsByInspector'); throw error; }
  }

  async getInspectionsScheduledBetween(startDate: string, endDate: string): Promise<Inspection[]> {
    try { return await this.repository.findScheduledBetween(startDate, endDate); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getInspectionsScheduledBetween'); throw error; }
  }

  async getUpcomingInspections(days: number = 7): Promise<Inspection[]> {
    try { return await this.repository.findUpcoming(days); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getUpcomingInspections'); throw error; }
  }

  async getOverdueInspections(): Promise<Inspection[]> {
    try { return await this.repository.findOverdue(); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getOverdueInspections'); throw error; }
  }

  async completeInspection(id: string, data: Partial<InspectionExecutionDataDTO>): Promise<Inspection> {
    try {
      const existing = await this.repository.findById(id);
      if (!existing) throw new AppError('NOT_FOUND' as ErrorCode, 'Inspection not found');

      await this.repository.update(id, {
        status: InspectionStatus.Completed,
        progressAtInspection: data.progressAtInspection,
        comments: data.comments ?? undefined,
        completedAt: new Date().toISOString()
      } as Partial<Inspection>);
      
      return Inspection.create({
        id: existing.id,
        projectId: existing.projectId,
        phaseId: existing.phaseId,
        stepId: existing.stepId,
        inspector: existing.inspector,
        date: existing.date,
        status: InspectionStatus.Completed,
        progressAtInspection: data.progressAtInspection ?? existing.progressAtInspection,
        comments: data.comments ?? existing.comments,
        completedAt: new Date().toISOString()
      });
    } catch (error) { ErrorLogger.log(error as Error, 'InspectionService.completeInspection'); throw error; }
  }

  async cancelInspection(id: string, data: Partial<InspectionExecutionDataDTO>): Promise<Inspection> {
    try {
      const existing = await this.repository.findById(id);
      if (!existing) throw new AppError('NOT_FOUND' as ErrorCode, 'Inspection not found');

      await this.repository.update(id, {
        status: InspectionStatus.Cancelled,
        comments: data.comments ?? undefined
      } as Partial<Inspection>);
      
      return Inspection.create({
        id: existing.id,
        projectId: existing.projectId,
        phaseId: existing.phaseId,
        stepId: existing.stepId,
        inspector: existing.inspector,
        date: existing.date,
        status: InspectionStatus.Cancelled,
        progressAtInspection: existing.progressAtInspection,
        comments: data.comments ?? existing.comments
      });
    } catch (error) { ErrorLogger.log(error as Error, 'InspectionService.cancelInspection'); throw error; }
  }

  async getInspectionStatsByProject(projectId: string): Promise<Record<InspectionStatus, number>> {
    try { return await this.repository.countByStatus(projectId); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getInspectionStatsByProject'); throw error; }
  }

  async getAverageCompletionTime(projectId: string): Promise<number> {
    try { return await this.repository.getAverageCompletionTime(projectId); }
    catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getAverageCompletionTime'); throw error; }
  }

  async uploadDocuments(inspectionId: string, files: File[]): Promise<InspectionDocumentDTO[]> {
    try {
      if (!inspectionId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      if (!files || files.length === 0) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Files are required');

      return files.map(file => ({
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: file.type || 'unknown',
        name: file.name,
        inspectionId,
        uploadedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('InspectionService.uploadDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to upload documents');
    }
  }

  async getInspectionExecutionData(inspectionId: string): Promise<InspectionExecutionDataDTO | null> {
    try {
      const inspection = await this.repository.findById(inspectionId);
      if (!inspection) return null;
      
      return {
        id: inspection.id,
        status: inspection.status as string,
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
        completedAt: inspection.completedAt ?? undefined,
        projectId: inspection.projectId,
        phaseId: inspection.phaseId ?? undefined,
        stepId: inspection.stepId ?? undefined,
        inspector: inspection.inspector?.name,
        date: inspection.date
      };
    } catch (error) { ErrorLogger.log(error as Error, 'InspectionService.getInspectionExecutionData'); throw error; }
  }

  async updateInspectionExecution(data: InspectionExecutionDataDTO): Promise<InspectionExecutionDataDTO> {
    try {
      if (!data.id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      await this.updateInspection(data.id, { status: data.status, progressAtInspection: data.progressAtInspection, comments: data.comments });
      return { id: data.id, status: data.status, progressAtInspection: data.progressAtInspection, comments: data.comments, documents: data.documents, completedAt: data.completedAt };
    } catch (error) {
      console.error('InspectionService.updateInspectionExecution failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update inspection execution');
    }
  }

  async updateInspectionPaymentValidation(id: string, data: InspectionPaymentValidationDTO): Promise<Inspection> {
    try {
      if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      if (!data.status) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Status is required');
      return this.updateInspection(id, { status: data.status, comments: data.comments });
    } catch (error) {
      console.error('InspectionService.updateInspectionPaymentValidation failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update inspection payment validation');
    }
  }
}
