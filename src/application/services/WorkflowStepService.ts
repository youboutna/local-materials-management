/**
 * Workflow Step Service - Hexagonal Architecture
 * Business logic for workflow step management with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { 
  WorkflowStepDTO, 
  StepDocumentDTO, 
  WorkflowProgressDTO, 
  DocumentUploadDTO 
} from '@/dtos/types/workflow-dto';

/**
 * Service for managing workflow steps with hexagonal architecture.
 * Note: IWorkflowStepRepository not yet in RepositoryFactory - using fallback approach.
 */
export class WorkflowStepService {
  constructor() {}





  async getTenderWorkflowSteps(tenderId: string): Promise<WorkflowStepDTO[]> {
    try {
      if (!tenderId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }
      console.warn('WorkflowStepService: IWorkflowStepRepository not yet registered in RepositoryFactory');
      return [];
    } catch (error) {
      console.error('Error getting tender workflow steps:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get tender workflow steps',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async updateStepStatus(
    stepId: string, 
    status: string, 
    dates?: {
      submission_date?: string;
      review_deadline?: string;
      approval_deadline?: string;
      actual_completion_date?: string;
    }
  ): Promise<void> {
    try {
      if (!stepId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Step ID is required');
      }
      if (!status) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Status is required');
      }

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (dates?.submission_date) updateData.submission_date = dates.submission_date;
      if (dates?.review_deadline) updateData.review_deadline = dates.review_deadline;
      if (dates?.approval_deadline) updateData.approval_deadline = dates.approval_deadline;
      if (dates?.actual_completion_date) updateData.actual_completion_date = dates.actual_completion_date;

      console.warn('WorkflowStepService.updateStepStatus: Repository not yet registered');
    } catch (error) {
      console.error('Error updating step status:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to update step status',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async uploadStepDocument(
    stepId: string,
    uploadData: DocumentUploadDTO
  ): Promise<StepDocumentDTO> {
    try {
      if (!stepId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Step ID is required');
      }
      this.validateDocumentUploadData(uploadData);

      // Return mock document until repository is available
      return {
        id: crypto.randomUUID?.() || Date.now().toString(),
        step_id: stepId,
        document_id: crypto.randomUUID?.() || Date.now().toString(),
        document_type: uploadData.category,
        is_required: uploadData.is_required,
        status: 'pending',
        document: {
          id: '',
          title: uploadData.title,
          file_name: uploadData.file.name,
          file_size: uploadData.file.size,
          mime_type: uploadData.file.type
        },
        can_share: false
      };
    } catch (error) {
      console.error('Error uploading step document:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to upload step document',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async getWorkflowProgress(tenderId: string): Promise<WorkflowProgressDTO> {
    try {
      if (!tenderId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }

      const steps = await this.getTenderWorkflowSteps(tenderId);
      
      const totalSteps = steps.length;
      const completedSteps = steps.filter(step => 
        step.status === 'completed' || step.status === 'approved'
      ).length;
      const inProgressSteps = steps.filter(step => 
        step.status === 'in_progress'
      ).length;

      return {
        tender_id: tenderId,
        total_steps: totalSteps,
        completed_steps: completedSteps,
        in_progress_steps: inProgressSteps,
        progress_percentage: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting workflow progress:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get workflow progress',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private validateDocumentUploadData(uploadData: DocumentUploadDTO): void {
    if (!uploadData.file) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'File is required');
    }
    if (!uploadData.category) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document category is required');
    }

    const maxSize = 10 * 1024 * 1024;
    if (uploadData.file.size > maxSize) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'File size exceeds 10MB limit');
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (!allowedTypes.includes(uploadData.file.type)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'File type not allowed. Allowed types: PDF, DOC, DOCX, JPEG, PNG, GIF'
      );
    }
  }
}

let WorkflowStepServiceInstance: WorkflowStepService | null = null;
export function getWorkflowStepService(): WorkflowStepService {
  if (!WorkflowStepServiceInstance) {
    WorkflowStepServiceInstance = new WorkflowStepService();
  }
  return WorkflowStepServiceInstance;
}
