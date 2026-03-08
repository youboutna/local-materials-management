// @ts-nocheck
// Workflow Step Service - handles all workflow step operations
import { supabase } from '@/integrations/supabase/client';
import { WorkflowStepDTO, StepDocumentDTO, WorkflowProgressDTO, DocumentUploadDTO } from '@/types/workflow-dto';

export class WorkflowStepService {
  
  /**
   * Get all workflow steps for a tender with calculated metadata
   */
  static async getTenderWorkflowSteps(tenderId: string): Promise<WorkflowStepDTO[]> {
    const { data: steps, error: stepsError } = await supabase
      .from('tender_steps')
      .select('*')
      .eq('tender_id', tenderId)
      .order('step_number', { ascending: true });

    if (stepsError) throw stepsError;

    if (!steps?.length) return [];

    // Get documents for all steps in one query
    const stepIds = steps.map(step => step.id);
    const { data: documents } = await supabase
      .from('tender_step_documents')
      .select(`
        *,
        document:documents(
          id, title, description, file_url, file_name, mime_type, file_size
        )
      `)
      .in('step_id', stepIds);

    // Transform to DTOs with calculated metadata
    return steps.map(step => {
      const stepDocuments = documents?.filter(doc => doc.step_id === step.id) || [];
      const completedTasks = stepDocuments.filter(doc => 
        doc.status === 'approved' || doc.status === 'submitted'
      ).length;
      const totalTasks = Math.max(step.required_documents?.length || 0, stepDocuments.length, 1);
      
      return {
        id: step.id,
        tender_id: step.tender_id,
        step_number: step.step_number,
        title: step.title,
        description: step.description ?? undefined,
        status: this.normalizeStatus(step.status),
        due_date: step.due_date ?? undefined,
        submission_date: step.submission_date ?? undefined,
        review_deadline: step.review_deadline ?? undefined,
        approval_deadline: step.approval_deadline ?? undefined,
        actual_completion_date: step.actual_completion_date ?? undefined,
        procurement_phase: step.procurement_phase ?? undefined,
        procurement_stage: step.procurement_stage ?? undefined,
        required_documents: step.required_documents || [],
        can_upload_documents: this.canUploadDocuments(step.status),
        tasks_completed: completedTasks,
        tasks_total: totalTasks,
        created_at: step.created_at,
        updated_at: step.updated_at
      };
    });
  }

  /**
   * Get documents for a specific step
   */
  static async getStepDocuments(stepId: string): Promise<StepDocumentDTO[]> {
    const { data, error } = await supabase
      .from('tender_step_documents')
      .select(`
        *,
        document:documents(
          id, title, description, file_url, file_name, mime_type, file_size
        )
      `)
      .eq('step_id', stepId);

    if (error) throw error;

    return (data || []).map(doc => ({
      id: doc.id,
      step_id: doc.step_id,
      document_id: doc.document_id,
      document_type: doc.document_type,
      is_required: doc.is_required,
      status: ['pending', 'submitted', 'approved', 'rejected'].includes(doc.status)
        ? doc.status as StepDocumentDTO['status']
        : 'pending',
      submitted_at: doc.submitted_at ?? undefined,
      reviewer_notes: doc.reviewer_notes ?? undefined,
      document: {
        id: doc.document?.id || '',
        title: doc.document?.title || '',
        description: doc.document?.description ?? undefined,
        file_url: doc.document?.file_url ?? undefined,
        file_name: doc.document?.file_name ?? undefined,
        mime_type: doc.document?.mime_type ?? undefined,
        file_size: doc.document?.file_size ?? undefined,
      },
      can_share: this.canShareDocument(doc.status)
    }));
  }

  /**
   * Upload document for a workflow step
   */
  static async uploadStepDocument(uploadData: DocumentUploadDTO, projectId?: string): Promise<void> {
    const { file, step_id, title, description, category, subcategory, is_required } = uploadData;
    
    // Upload file
    const timestamp = new Date().getTime();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilePath = `tender-steps/${step_id}/${timestamp}_${sanitizedFileName}`;
    
    const uploadResult = await this.uploadFile(file, uniqueFilePath);
    
    if (!uploadResult.success || !uploadResult.url) {
      throw new Error(`File upload failed: ${uploadResult.error || 'Unknown error'}`);
    }

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert([{
        title,
        description,
        file_url: uploadResult.url,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        document_type: 'tender',
        project_id: projectId,
        status: 'draft'
      }])
      .select()
      .single();

    if (docError) throw new Error(`Document creation failed: ${docError.message}`);

    // Link document to step
    const { error: linkError } = await supabase
      .from('tender_step_documents')
      .insert([{
        step_id,
        document_id: document.id,
        document_type: category,
        is_required,
        status: 'submitted'
      }]);

    if (linkError) throw new Error(`Document linking failed: ${linkError.message}`);
  }

  /**
   * Update step status and optionally update dates
   */
  static async updateStepStatus(stepId: string, status: string, dates?: {
    submission_date?: string;
    review_deadline?: string;
    approval_deadline?: string;
    due_date?: string;
  }): Promise<void> {
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };

    // Add date fields if provided
    if (dates) {
      if (dates.submission_date) updateData.submission_date = dates.submission_date;
      if (dates.review_deadline) updateData.review_deadline = dates.review_deadline;
      if (dates.approval_deadline) updateData.approval_deadline = dates.approval_deadline;
      if (dates.due_date) updateData.due_date = dates.due_date;
    }

    const { error } = await supabase
      .from('tender_steps')
      .update(updateData)
      .eq('id', stepId);

    if (error) throw error;
  }

  /**
   * Update step dates only
   */
  static async updateStepDates(stepId: string, dates: {
    submission_date?: string;
    review_deadline?: string;
    approval_deadline?: string;
    due_date?: string;
  }): Promise<void> {
    const updateData: any = { 
      updated_at: new Date().toISOString() 
    };

    if (dates.submission_date) updateData.submission_date = dates.submission_date;
    if (dates.review_deadline) updateData.review_deadline = dates.review_deadline;
    if (dates.approval_deadline) updateData.approval_deadline = dates.approval_deadline;
    if (dates.due_date) updateData.due_date = dates.due_date;

    const { error } = await supabase
      .from('tender_steps')
      .update(updateData)
      .eq('id', stepId);

    if (error) throw error;
  }

  /**
   * Get workflow progress for a tender
   */
  static async getTenderProgress(tenderId: string): Promise<WorkflowProgressDTO> {
    const steps = await this.getTenderWorkflowSteps(tenderId);
    
    const completedSteps = steps.filter(step => 
      step.status === 'completed' || step.status === 'approved'
    ).length;
    
    const inProgressSteps = steps.filter(step => 
      step.status === 'in_progress'
    ).length;
    
    const currentStep = steps.find(step => 
      step.status === 'in_progress' || step.status === 'pending'
    );
    
    return {
      tender_id: tenderId,
      total_steps: steps.length,
      completed_steps: completedSteps,
      in_progress_steps: inProgressSteps,
      progress_percentage: steps.length > 0 ? (completedSteps / steps.length) * 100 : 0,
      current_step: currentStep
    };
  }

  /**
   * Normalize backend status to DTO status
   */
  private static normalizeStatus(status: string): WorkflowStepDTO['status'] {
    const s = (status || '').toLowerCase();
    if (['in_progress', 'started', 'start', 'open', 'ongoing', 'en_cours'].includes(s)) return 'in_progress';
    if (['completed', 'done', 'finished', 'terminee', 'terminée'].includes(s)) return 'completed';
    if (['approved', 'approuvee', 'approuvée', 'validated'].includes(s)) return 'approved';
    return 'pending';
  }

  /**
   * Business logic: determine if documents can be uploaded for a step
   */
  private static canUploadDocuments(status: string): boolean {
    const norm = this.normalizeStatus(status);
    return ['pending', 'in_progress'].includes(norm);
  }

  /**
   * Business logic: determine if document can be shared
   */
  private static canShareDocument(status: string): boolean {
    return ['submitted', 'approved'].includes(status);
  }

  /**
   * Upload file using Supabase Storage
   */
  private static async uploadFile(file: File, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage error:', error);
        return {
          success: false,
          error: error.message,
          url: null
        };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      return {
        success: true,
        error: null,
        url: publicUrl
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        url: null
      };
    }
  }

  /**
   * Create workflow step for testing
   */
  static async createWorkflowStep(stepData: {
    tender_id: string;
    title: string;
    description?: string;
    step_number: number;
    procurement_phase?: string;
    procurement_stage?: string;
    required_documents?: string[];
    status?: string;
  }): Promise<WorkflowStepDTO> {
    const { data, error } = await supabase
      .from('tender_steps')
      .insert([{
        ...stepData,
        status: stepData.status || 'pending',
        required_documents: stepData.required_documents || []
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tender_id: data.tender_id,
      step_number: data.step_number,
      title: data.title,
      description: data.description ?? undefined,
      status: data.status as WorkflowStepDTO['status'],
      due_date: data.due_date ?? undefined,
      submission_date: data.submission_date ?? undefined,
      review_deadline: data.review_deadline ?? undefined,
      approval_deadline: data.approval_deadline ?? undefined,
      actual_completion_date: data.actual_completion_date ?? undefined,
      procurement_phase: data.procurement_phase ?? undefined,
      procurement_stage: data.procurement_stage ?? undefined,
      required_documents: data.required_documents || [],
      can_upload_documents: this.canUploadDocuments(data.status),
      tasks_completed: 0,
      tasks_total: Math.max(data.required_documents?.length || 0, 1),
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}