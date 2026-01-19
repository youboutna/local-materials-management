/**
 * Inspection Execution Use Cases
 */

import { IInspectionExecutionRepository, InspectionDocument } from '@/domain/repositories/IInspectionExecutionRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Upload Documents
export interface UploadDocumentsResult {
  success: boolean;
  documents: InspectionDocument[];
  error?: string;
}

export class UploadDocumentsUseCase {
  private inspectionExecutionRepository: IInspectionExecutionRepository;

  constructor(inspectionExecutionRepository?: IInspectionExecutionRepository) {
    this.inspectionExecutionRepository = inspectionExecutionRepository || RepositoryFactory.getInspectionExecutionRepository();
  }

  async execute(inspectionId: string, documents: File[]): Promise<UploadDocumentsResult> {
    try {
      const uploadedDocs = await this.inspectionExecutionRepository.uploadDocuments(inspectionId, documents);
      await this.inspectionExecutionRepository.createDocumentRecords(inspectionId, uploadedDocs);
      return { success: true, documents: uploadedDocs };
    } catch (error) {
      console.error('UploadDocumentsUseCase error:', error);
      return {
        success: false,
        documents: [],
        error: error instanceof Error ? error.message : 'Failed to upload documents'
      };
    }
  }
}

// Update Inspection
export interface UpdateInspectionResult {
  success: boolean;
  error?: string;
}

export class UpdateInspectionUseCase {
  private inspectionExecutionRepository: IInspectionExecutionRepository;

  constructor(inspectionExecutionRepository?: IInspectionExecutionRepository) {
    this.inspectionExecutionRepository = inspectionExecutionRepository || RepositoryFactory.getInspectionExecutionRepository();
  }

  async execute(inspectionId: string, status: string, progress?: number, comments?: string): Promise<UpdateInspectionResult> {
    try {
      await this.inspectionExecutionRepository.updateInspection(inspectionId, status, progress, comments);
      return { success: true };
    } catch (error) {
      console.error('UpdateInspectionUseCase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update inspection'
      };
    }
  }
}

// Get Inspection by ID
export interface GetInspectionResult {
  success: boolean;
  inspection: any;
  error?: string;
}

export class GetInspectionUseCase {
  private inspectionExecutionRepository: IInspectionExecutionRepository;

  constructor(inspectionExecutionRepository?: IInspectionExecutionRepository) {
    this.inspectionExecutionRepository = inspectionExecutionRepository || RepositoryFactory.getInspectionExecutionRepository();
  }

  async execute(inspectionId: string): Promise<GetInspectionResult> {
    try {
      const inspection = await this.inspectionExecutionRepository.getInspectionById(inspectionId);
      return { success: true, inspection };
    } catch (error) {
      console.error('GetInspectionUseCase error:', error);
      return {
        success: false,
        inspection: null,
        error: error instanceof Error ? error.message : 'Failed to get inspection'
      };
    }
  }
}
