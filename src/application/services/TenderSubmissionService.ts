import { sendTenderSubmissionNotification } from '@/application/services/TenderSubmissionNotificationService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { SubmissionSecretService } from './SubmissionSecretService';
import { SupabaseTenderSubmissionEvaluationAdapter } from '@/infrastructure/adapters/supabase/SupabaseTenderSubmissionEvaluationAdapter';

export interface CreateTenderSubmissionDTO {
  tender_id: string;
  user_id: string;
  supplier_name: string;
  supplier_email: string;
  submission_date?: string;
  status?: 'submitted' | 'under_review' | 'approved' | 'rejected';
}

export interface TenderEvaluationUpdateDTO {
  status?: 'submitted' | 'under_review' | 'approved' | 'rejected';
  administrativeScore?: number;
  technicalScore?: number;
  financialScore?: number;
  totalScore?: number;
  evaluatorNotes?: string;
  reviewerId?: string;
  reviewedAt?: string;
}

export interface UploadedDocument {
  file: File;
  category: 'administrative' | 'technical' | 'financial';
  subcategory: string;
}

const repo = () => RepositoryFactory.getTenderSubmissionRepository();

export class TenderSubmissionService {
  static async hasExistingSubmission(tenderId: string, userId: string): Promise<boolean> {
    try {
      return !!(await repo().findByTenderAndUser(tenderId, userId));
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
      let submission: Record<string, any>;
      try {
        submission = await repo().insert({
          tenderId: submissionData.tender_id,
          userId: submissionData.user_id,
          supplierName: submissionData.supplier_name,
          supplierEmail: submissionData.supplier_email,
          submissionDate: submissionData.submission_date || new Date().toISOString(),
          status: submissionData.status || 'submitted',
        });
      } catch (e) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Erreur lors de la création de la soumission: ${(e as Error).message}`);
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

          try {
            await repo().attachDocument({
              submissionId: submission.id,
              tenderId: submissionData.tender_id,
              uploadedBy: submissionData.user_id,
              fileUrl: uploadResult.url,
              fileName: doc.file.name,
              mimeType: doc.file.type,
              fileSize: doc.file.size,
              category: doc.category,
              subcategory: doc.subcategory,
            });
          } catch (e) {
            throw new AppError(ErrorCode.DATABASE_ERROR, `Erreur lors de l'enregistrement du document: ${(e as Error).message}`);
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
        await repo().delete(submission.id);
        
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
      return await repo().findById(submissionId);
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la récupération de la soumission');
    }
  }

  static async getUserSubmission(tenderId: string, userId: string) {
    try {
      return await repo().findByTenderAndUser(tenderId, userId);
    } catch (error) {
      console.error('Error getting user submission:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la récupération de la soumission');
    }
  }

  /** Récupère les soumissions d'un AO avec leurs documents pour l'évaluation. */
  static async getTenderSubmissions(tenderId: string) {
    try {
      return await SupabaseTenderSubmissionEvaluationAdapter.getSubmissionsForTender(tenderId);
    } catch (error) {
      console.error('Error fetching tender submissions:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la récupération des soumissions');
    }
  }

  /** Met à jour les scores/notes/statut d'évaluation d'une soumission (DTO camelCase). */
  static async updateEvaluation(submissionId: string, update: TenderEvaluationUpdateDTO) {
    try {
      const dbUpdate: Record<string, unknown> = {};
      if (update.status !== undefined) dbUpdate.status = update.status;
      if (update.administrativeScore !== undefined) dbUpdate.administrative_score = update.administrativeScore;
      if (update.technicalScore !== undefined) dbUpdate.technical_score = update.technicalScore;
      if (update.financialScore !== undefined) dbUpdate.financial_score = update.financialScore;
      if (update.totalScore !== undefined) dbUpdate.total_score = update.totalScore;
      if (update.evaluatorNotes !== undefined) dbUpdate.evaluator_notes = update.evaluatorNotes;
      if (update.reviewerId !== undefined) dbUpdate.reviewer_id = update.reviewerId;
      if (update.reviewedAt !== undefined) dbUpdate.reviewed_at = update.reviewedAt;

      return await SupabaseTenderSubmissionEvaluationAdapter.updateEvaluation(submissionId, dbUpdate);
    } catch (error) {
      console.error('Error updating tender evaluation:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la mise à jour de l\'évaluation');
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

      let submission: Record<string, any>;
      try {
        submission = await repo().insert({
          tenderId: submissionData.tender_id,
          userId: submissionData.user_id,
          supplierName: submissionData.supplier_name || '',
          supplierEmail: submissionData.supplier_email || '',
          submissionDate: submissionData.submission_date || new Date().toISOString(),
          status: submissionData.status || 'submitted',
        });
      } catch (e) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Erreur: ${(e as Error).message}`);
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

  /** Liens soumission→document hydratés avec le document archivé (DocumentService/documents). */
  static async getSubmissionDocuments(submissionId: string): Promise<Array<Record<string, any>>> {
    try {
      return await repo().findDocuments(submissionId);
    } catch (error) {
      console.error('Error getting submission documents:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la récupération des documents');
    }
  }

  /** Soumissions déposées par un utilisateur fournisseur. */
  static async getSubmissionsByUser(userId: string) {
    try {
      return await repo().findByUser(userId);
    } catch (e) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Erreur lors de la récupération des soumissions: ${(e as Error).message}`);
    }
  }

  /** Journal d'activité tracé en base (trigger log_submission_status_change). */
  static async getSubmissionActivityLogs(submissionId: string) {
    try {
      return await repo().findActivityLogs(submissionId);
    } catch (e) {
      throw new AppError(ErrorCode.DATABASE_ERROR, `Erreur lors de la récupération de l'historique: ${(e as Error).message}`);
    }
  }

  /** Statistiques des soumissions d'un utilisateur fournisseur. */
  static async getSubmissionStatsByUser(userId: string) {
    const rows = await this.getSubmissionsByUser(userId);
    const stats = { total: rows.length, submitted: 0, under_review: 0, approved: 0, rejected: 0 };
    rows.forEach((r: any) => { if (r.status in stats) (stats as any)[r.status]++; });
    return stats;
  }

  static async updateSubmissionStatus(
    submissionId: string,
    status: 'submitted' | 'under_review' | 'approved' | 'rejected',
    reviewComment?: string
  ): Promise<void> {
    try {
      await repo().updateStatus(submissionId, status, reviewComment);
    } catch (error) {
      console.error('Error updating submission status:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la mise à jour du statut');
    }
  }

  static async getSubmissionStats(tenderId: string) {
    try {
      const statuses = await repo().listStatusesByTender(tenderId);
      const stats = { total: statuses.length, submitted: 0, under_review: 0, approved: 0, rejected: 0 };
      statuses.forEach(st => { if (st in stats) (stats as any)[st]++; });
      return stats;
    } catch (error) {
      console.error('Error getting submission stats:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Erreur lors de la récupération des statistiques');
    }
  }
}
