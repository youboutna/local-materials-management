/**
 * Workflow Step Service - Hexagonal Architecture
 * Business logic for workflow step management with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IWorkflowStepRepository } from '@/domain/repositories/IWorkflowStepRepository';
import { 
  WorkflowStepDTO, 
  StepDocumentDTO, 
  WorkflowProgressDTO, 
  DocumentUploadDTO 
} from '@/types/workflow-dto';

/**
 * Service for managing workflow steps with hexagonal architecture
 */
export class WorkflowStepService {
  private workflowStepRepository: IWorkflowStepRepository;

  constructor() {
    this.workflowStepRepository = RepositoryFactory.getWorkflowStepRepository();
  }

  /**
   * Get all workflow steps for a tender with calculated metadata
   */
  async getTenderWorkflowSteps(tenderId: string): Promise<WorkflowStepDTO[]> {
    try {
      if (!tenderId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }

      const steps = await this.workflowStepRepository.findByTenderId(tenderId);
      
      // Get documents for all steps in one query
      const stepDocuments = await this.getStepDocumentsForSteps(
        steps.map(step => step.id)
      );

      // Transform and validate data
      return steps.map(step => this.validateAndTransformStep(step, stepDocuments));
    } catch (error) {
      console.error('Error getting tender workflow steps:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get tender workflow steps',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update workflow step status
   */
  async updateStepStatus(
    stepId: string, 
    status: string, 
    dates?: {
      submission_date?: string;
      review_deadline?: string;
      approval_deadline?: string;
      due_date?: string;
    }
  ): Promise<void> {
    try {
      if (!stepId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Step ID is required');
      }

      if (!status) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Status is required');
      }

      // Validate step exists
      const existingStep = await this.workflowStepRepository.findById(stepId);
      if (!existingStep) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Workflow step not found');
      }

      // Validate status transition
      this.validateStatusTransition(existingStep.status, status);

      // Prepare update data
      const updateData: {
        updated_at: string;
        submission_date?: string;
        review_deadline?: string;
        approval_deadline?: string;
        actual_completion_date?: string;
      } = {
        updated_at: new Date().toISOString()
      };

      // Add date fields
      if (dates.submission_date) updateData.submission_date = dates.submission_date;
      if (dates.review_deadline) updateData.review_deadline = dates.review_deadline;
      if (dates.approval_deadline) updateData.approval_deadline = dates.approval_deadline;
      if (dates.due_date) updateData.due_date = dates.due_date;

      await this.workflowStepRepository.update(stepId, updateData);
    } catch (error) {
      console.error('Error updating step status:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to update step status',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Upload document for workflow step
   */
  async uploadStepDocument(
    stepId: string,
    uploadData: DocumentUploadDTO
  ): Promise<StepDocumentDTO> {
    try {
      if (!stepId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Step ID is required');
      }

      // Validate upload data
      this.validateDocumentUploadData(uploadData);

      // Upload file to storage
      const uploadResult = await this.uploadFileToStorage(
        uploadData.file,
        stepId,
        'document'
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new AppError(
          ErrorCode.INTERNAL_ERROR,
          'Failed to upload file to storage'
        );
      }

      // Create document record
      const documentData = {
        step_id: stepId,
        document_type: uploadData.documentType,
        file_name: uploadData.file.name,
        file_size: uploadData.file.size,
        mime_type: uploadData.file.type,
        file_url: uploadResult.url,
        uploaded_by: uploadData.uploadedBy,
        uploaded_at: new Date().toISOString()
      };

      const document = await this.workflowStepRepository.createDocument(documentData);
      return this.validateAndTransformDocument(document);
    } catch (error) {
      console.error('Error uploading step document:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to upload step document',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get workflow progress for a tender
   */
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
      const pendingSteps = steps.filter(step => 
        step.status === 'pending'
      ).length;

      return {
        tender_id: tenderId,
        total_steps: totalSteps,
        completed_steps: completedSteps,
        in_progress_steps: inProgressSteps,
        pending_steps: pendingSteps,
        progress_percentage: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
        last_updated: new Date().toISOString()
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

  /**
   * Get step documents for multiple steps
   */
  private async getStepDocumentsForSteps(stepIds: string[]): Promise<StepDocumentDTO[]> {
    try {
      const documents = await this.workflowStepRepository.findDocumentsByStepIds(stepIds);
      
      // Group documents by step_id
      const documentsByStep = documents.reduce((acc, doc) => {
        if (!acc[doc.step_id]) acc[doc.step_id] = [];
        acc[doc.step_id].push(doc);
        return acc;
      }, {} as Record<string, StepDocumentDTO[]>);

      return documents;
    } catch (error) {
      console.error('Error getting step documents for steps:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get step documents for steps',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Validate and transform step data
   */
  private validateAndTransformStep(step: {
    id: string;
    tender_id: string;
    step_number: number;
    title: string;
    description?: string;
    status: string;
    due_date?: string;
    submission_date?: string;
    review_deadline?: string;
    approval_deadline?: string;
    actual_completion_date?: string;
    procurement_phase?: string;
    procurement_stage?: string;
    required_documents: string[];
    can_upload_documents: boolean;
    tasks_completed: number;
    tasks_total: number;
    created_at: string;
    updated_at: string;
  }, stepDocuments: StepDocumentDTO[]): WorkflowStepDTO {
    // Count completed tasks
    const completedTasks = stepDocuments.filter(doc => 
      ['approved', 'submitted'].includes(doc.status)
    ).length;

    return {
      id: step.id,
      tender_id: step.tender_id,
      step_number: step.step_number,
      title: step.title,
      description: step.description || null,
      status: this.normalizeStatus(step.status),
      due_date: step.due_date || null,
      submission_date: step.submission_date || null,
      review_deadline: step.review_deadline || null,
      approval_deadline: step.approval_deadline || null,
      actual_completion_date: step.actual_completion_date || null,
      procurement_phase: step.procurement_phase || null,
      procurement_stage: step.procurement_stage || null,
      required_documents: step.required_documents || [],
      can_upload_documents: this.canUploadDocuments(step.status),
      tasks_completed: completedTasks,
      tasks_total: Math.max(step.required_documents?.length || 0, stepDocuments.length, 1),
      created_at: step.created_at,
      updated_at: step.updated_at
    };
  }

  /**
   * Validate and transform document data
   */
  private validateAndTransformDocument(doc: {
    id: string;
    step_id: string;
    document_type: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    file_url: string;
    uploaded_by: string;
    uploaded_at: string;
    status?: string;
  }): StepDocumentDTO {
    return {
      id: doc.id,
      step_id: doc.step_id,
      document_type: doc.document_type,
      file_name: doc.file_name,
      file_size: doc.file_size,
      mime_type: doc.mime_type,
      file_url: doc.file_url,
      uploaded_by: doc.uploaded_by,
      uploaded_at: doc.uploaded_at,
      status: this.normalizeDocumentStatus(doc.status || 'pending'),
      can_share: this.canShareDocument(doc.status || 'pending')
    };
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'pending': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'submitted', 'cancelled'],
      'submitted': ['under_review', 'rejected', 'approved'],
      'under_review': ['approved', 'rejected', 'requires_changes'],
      'requires_changes': ['submitted'],
      'approved': ['completed'],
      'completed': [],
      'rejected': ['submitted'],
      'cancelled': []
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Normalize status values
   */
  private normalizeStatus(status: string): WorkflowStepDTO['status'] {
    const statusMap: Record<string, WorkflowStepDTO['status']> = {
      'pending': 'pending',
      'in_progress': 'in_progress',
      'submitted': 'submitted',
      'under_review': 'under_review',
      'approved': 'approved',
      'rejected': 'rejected',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'requires_changes': 'requires_changes'
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Normalize document status
   */
  private normalizeDocumentStatus(status: string): StepDocumentDTO['status'] {
    const statusMap: Record<string, StepDocumentDTO['status']> = {
      'pending': 'pending',
      'submitted': 'submitted',
      'approved': 'approved',
      'rejected': 'rejected'
    };

    return statusMap[status] || 'pending';
  }

  /**
   * Check if documents can be uploaded for this status
   */
  private canUploadDocuments(status: string): boolean {
    return ['pending', 'in_progress'].includes(status);
  }

  /**
   * Check if document can be shared for this status
   */
  private canShareDocument(status: string): boolean {
    return ['approved', 'submitted'].includes(status);
  }

  /**
   * Validate document upload data
   */
  private validateDocumentUploadData(uploadData: DocumentUploadDTO): void {
    if (!uploadData.file) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'File is required');
    }

    if (!uploadData.documentType) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document type is required');
    }

    if (!uploadData.uploadedBy) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Uploader ID is required');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (uploadData.file.size > maxSize) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'File size exceeds 10MB limit');
    }

    // Validate file type
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

  /**
   * Upload file to storage
   */
  private async uploadFileToStorage(
    file: File,
    stepId: string,
    fileType: string
  ): Promise<{
    success: boolean;
    url: string | null;
    error: string | null;
  }> {
    try {
      // This would integrate with your storage service
      // For now, return a mock response
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilePath = `workflow-steps/${stepId}/${timestamp}_${sanitizedFileName}`;
      
      // Mock successful upload
      return {
        success: true,
        url: `https://storage.example.com/${uniqueFilePath}`,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        url: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
