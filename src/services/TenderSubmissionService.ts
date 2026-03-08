// @ts-nocheck
import { TenderRepository } from './TenderRepository';
import { SubmissionSecretService } from './SubmissionSecretService';
import { sendTenderSubmissionNotification } from './tenderSubmissionNotificationService';
import { supabase } from '@/integrations/supabase/client';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface CreateTenderSubmissionDTO {
  tender_id: string;
  user_id: string;
  supplier_name: string;
  supplier_email: string;
  submission_date?: string;
  status?: 'submitted' | 'under_review' | 'approved' | 'rejected';
}

export interface UploadedDocument {
  file: File;
  category: 'administrative' | 'technical' | 'financial';
  subcategory: string;
}

export class TenderSubmissionService {
  /**
   * Check if user already has a submission for a tender
   */
  static async hasExistingSubmission(tenderId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('tender_submissions')
        .select('id')
        .eq('tender_id', tenderId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking existing submission:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la vérification des soumissions existantes'
      );
    }
  }

  /**
   * Get user's submission for a tender
   */
  static async getUserSubmission(tenderId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('tender_submissions')
        .select('*')
        .eq('tender_id', tenderId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user submission:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la récupération de la soumission'
      );
    }
  }

  /**
   * Create a new tender submission with documents and secret code
   */
  static async createSubmissionWithDocuments(
    submissionData: CreateTenderSubmissionDTO,
    documents: UploadedDocument[],
    uploadFile: (file: File, path: string) => Promise<{ success: boolean; url?: string; error?: string }>,
    onProgress?: (step: 'creating' | 'uploading' | 'generating', current?: number, total?: number) => void
  ) {
    try {
      // Validate no existing submission
      const hasExisting = await this.hasExistingSubmission(
        submissionData.tender_id,
        submissionData.user_id
      );

      if (hasExisting) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Vous avez déjà soumissionné pour cet appel d\'offres'
        );
      }

      // Create submission record
      onProgress?.('creating');
      const { data: submission, error: submissionError } = await supabase
        .from('tender_submissions')
        .insert({
          tender_id: submissionData.tender_id,
          user_id: submissionData.user_id,
          supplier_name: submissionData.supplier_name,
          supplier_email: submissionData.supplier_email,
          submission_date: submissionData.submission_date || new Date().toISOString(),
          status: submissionData.status || 'submitted'
        })
        .select()
        .single();

      if (submissionError) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          `Erreur lors de la création de la soumission: ${submissionError.message}`
        );
      }

      if (!submission) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          'Aucune soumission créée'
        );
      }

      try {
        // Upload documents and link to submission
        onProgress?.('uploading', 0, documents.length);
        let uploadedCount = 0;
        
        for (const doc of documents) {
          // Sanitize file name to avoid path issues
          const sanitizedFileName = doc.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const uploadResult = await uploadFile(
            doc.file,
            `tender-submissions/${submissionData.tender_id}/${submission.id}/${sanitizedFileName}`
          );

          if (!uploadResult.success || !uploadResult.url) {
            throw new AppError(
              ErrorCode.VALIDATION_ERROR,
              uploadResult.error || 'Échec du téléchargement du fichier'
            );
          }

          // Create document record
          const { data: document, error: docError } = await supabase
            .from('documents')
            .insert({
              title: doc.file.name,
              description: `${doc.subcategory} pour soumission appel d'offres`,
              file_url: uploadResult.url,
              file_name: doc.file.name,
              mime_type: doc.file.type,
              file_size: doc.file.size,
              document_type: 'tender',
              uploaded_by: submissionData.user_id,
              metadata: {
                tender_id: submissionData.tender_id,
                submission_id: submission.id,
                category: doc.category,
                subcategory: doc.subcategory
              }
            })
            .select()
            .single();

          if (docError || !document) {
            throw new AppError(
              ErrorCode.DATABASE_ERROR,
              `Erreur lors de la création du document: ${docError?.message || 'Document non créé'}`
            );
          }

          // Link document to submission
          const { error: linkError } = await supabase
            .from('tender_submission_documents')
            .insert({
              submission_id: submission.id,
              document_id: document.id,
              category: doc.category,
              subcategory: doc.subcategory
            });

          if (linkError) {
            throw new AppError(
              ErrorCode.DATABASE_ERROR,
              `Erreur lors de la liaison du document: ${linkError.message}`
            );
          }
          
          uploadedCount++;
          onProgress?.('uploading', uploadedCount, documents.length);
        }

        // Generate secret code for evaluation access
        onProgress?.('generating');
        const expiresAt = SubmissionSecretService.getDefaultExpirationDate(30);
        const secretData = await SubmissionSecretService.createSubmissionSecret({
          submission_id: submission.id,
          expires_at: expiresAt,
          max_access: 50,
          evaluation_phase: 'evaluation',
          evaluation_stage: 'initial'
        });

        // Get tender details for notification
        const { data: tender } = await supabase
          .from('tenders')
          .select('title, project_id')
          .eq('id', submissionData.tender_id)
          .single();

        // Fetch admin notification emails from system settings
        const { data: settingsData } = await supabase
          .from('system_settings')
          .select('configuration')
          .eq('key', 'admin_notification_emails')
          .single();

        const adminEmails = ((settingsData?.configuration as { emails?: string[] })?.emails) || [];

        // Send email notifications (non-blocking - don't fail submission if email fails)
        if (secretData?.secret_code) {
          sendTenderSubmissionNotification({
            supplier_email: submissionData.supplier_email,
            supplier_name: submissionData.supplier_name,
            tender_title: tender?.title || 'Appel d\'offres',
            submission_id: submission.id,
            secret_code: secretData.secret_code,
            admin_emails: adminEmails
          }).catch(err => console.error('Email notification failed:', err));
        }

        return submission;
      } catch (uploadError) {
        // Rollback: delete submission if document upload fails
        await supabase
          .from('tender_submissions')
          .delete()
          .eq('id', submission.id);
        
        throw uploadError;
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error creating submission:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la création de la soumission'
      );
    }
  }

  /**
   * Get submission by ID
   */
  static async getSubmissionById(submissionId: string) {
    try {
      const { data, error } = await supabase
        .from('tender_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la récupération de la soumission'
      );
    }
  }

  /**
   * Update submission status
   */
  static async updateSubmissionStatus(
    submissionId: string,
    status: 'submitted' | 'under_review' | 'approved' | 'rejected'
  ) {
    try {
      const { data, error } = await supabase
        .from('tender_submissions')
        .update({ status })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating submission status:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la mise à jour du statut de la soumission'
      );
    }
  }
}
