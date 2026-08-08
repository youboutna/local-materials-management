import { sendTenderSubmissionNotification } from '@/application/services/TenderSubmissionNotificationService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { SubmissionSecretService } from './SubmissionSecretService';

import { CreateTenderSubmissionDTO } from '@/dtos/entities/TenderDTO';
export interface UploadedDocument {
  file: File;
  category: 'administrative' | 'technical' | 'financial';
  subcategory: string;
}

export class TenderSubmissionService {
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

  static async createSubmissionWithDocuments(
    submissionData: CreateTenderSubmissionDTO,
    documents: UploadedDocument[],
    uploadFile: (file: File, path: string) => Promise<{ success: boolean; url?: string; error?: string }>,
    onProgress?: (step: 'creating' | 'uploading' | 'generating', current?: number, total?: number) => void
  ) {
    try {
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
        throw new AppError(ErrorCode.DATABASE_ERROR, 'Aucune soumission créée');
      }

      try {
        onProgress?.('uploading', 0, documents.length);
        let uploadedCount = 0;
        
        for (const doc of documents) {
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

        // Generate secret code
        onProgress?.('generating');
        const expiresAt = SubmissionSecretService.getDefaultExpirationDate(30);
        const secretData = await SubmissionSecretService.createSubmissionSecret({
          submission_id: submission.id,
          expires_at: expiresAt,
          max_access: 50
        });

        // Get tender details for notification
        const tenderRepository = RepositoryFactory.getTenderRepository();
        const tender = await tenderRepository.findById(submissionData.tender_id);

        const adminEmails: string[] = [];

        if (secretData?.secretCode) {
          sendTenderSubmissionNotification({
            supplier_email: submissionData.supplier_email,
            supplier_name: submissionData.supplier_name,
            tender_title: tender?.title || 'Appel d\'offres',
            submission_id: submission.id,
            secret_code: secretData.secretCode,
            admin_emails: adminEmails
          }).catch(err => console.error('Email notification failed:', err));
        }

        return submission;
      } catch (uploadError) {
        await supabase
          .from('tender_submissions')
          .delete()
          .eq('id', submission.id);
        
        throw uploadError;
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error creating submission:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la création de la soumission');
    }
  }

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
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la récupération de la soumission');
    }
  }

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
      console.error('Error getting user submission:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la récupération de la soumission');
    }
  }

  static async createSubmission(submissionData: CreateTenderSubmissionDTO) {
    try {
      const hasExisting = await this.hasExistingSubmission(
        submissionData.tender_id,
        submissionData.user_id
      );

      if (hasExisting) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Vous avez déjà soumis une candidature pour cet appel d\'offres');
      }

      const { data: submission, error } = await supabase
        .from('tender_submissions')
        .insert({
          tender_id: submissionData.tender_id,
          user_id: submissionData.user_id,
          supplier_name: submissionData.supplier_name || '',
          supplier_email: submissionData.supplier_email || '',
          submission_date: submissionData.submission_date || new Date().toISOString(),
          status: submissionData.status || 'submitted'
        })
        .select()
        .single();

      if (error || !submission) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Erreur: ${error?.message || 'Submission not created'}`);
      }

      const submissionSecret = await SubmissionSecretService.createSubmissionSecret({
        submission_id: submission.id,
        expires_at: SubmissionSecretService.getDefaultExpirationDate(30),
        max_access: 50
      });

      const tenderRepository = RepositoryFactory.getTenderRepository();
      const tender = await tenderRepository.findById(submissionData.tender_id);

      await sendTenderSubmissionNotification({
        tender_title: tender?.title || 'Appel d\'offres',
        supplier_email: submission.supplier_email || '',
        supplier_name: submission.supplier_name || '',
        submission_id: submission.id,
        secret_code: submissionSecret.secretCode,
        admin_emails: []
      });

      return submission;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error creating submission:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la création de la soumission');
    }
  }

  static async uploadDocuments(submissionId: string, documents: UploadedDocument[]): Promise<void> {
    try {
      for (const doc of documents) {
        const fileName = `${Date.now()}-${doc.file.name}`;
        const filePath = `tender-submissions/${submissionId}/${fileName}`;

        const { error: uploadError } = await supabaseClient.storage
          .from('tender-documents')
          .upload(filePath, doc.file);

        if (uploadError) throw uploadError;

        const { error: docError } = await supabase
          .from('tender_submission_documents')
          .insert({
            submission_id: submissionId,
            document_id: crypto.randomUUID(),
            category: doc.category,
            subcategory: doc.subcategory,
            created_at: new Date().toISOString()
          });

        if (docError) throw docError;
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors du téléchargement des documents');
    }
  }

  static async getSubmissionDocuments(submissionId: string): Promise<unknown[]> {
    try {
      const { data, error } = await supabase
        .from('tender_submission_documents')
        .select('*')
        .eq('submission_id', submissionId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting submission documents:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la récupération des documents');
    }
  }

  static async updateSubmissionStatus(
    submissionId: string,
    status: 'submitted' | 'under_review' | 'approved' | 'rejected',
    reviewComment?: string
  ): Promise<void> {
    try {
      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString()
      };
      if (reviewComment) updateData.review_comment = reviewComment;

      const { error } = await supabase
        .from('tender_submissions')
        .update(updateData)
        .eq('id', submissionId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating submission status:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la mise à jour du statut');
    }
  }

  static async getTenderSubmissions(tenderId: string): Promise<unknown[]> {
    try {
      const { data, error } = await supabase
        .from('tender_submissions')
        .select('*')
        .eq('tender_id', tenderId)
        .order('submission_date', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting tender submissions:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la récupération des soumissions');
    }
  }

  static async getSubmissionStats(tenderId: string) {
    try {
      const { data, error } = await supabase
        .from('tender_submissions')
        .select('status')
        .eq('tender_id', tenderId);
      if (error) throw error;

      const stats = { total: data?.length || 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 };
      data?.forEach(s => { (stats as any)[s.status]++; });
      return stats;
    } catch (error) {
      console.error('Error getting submission stats:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la récupération des statistiques');
    }
  }
}