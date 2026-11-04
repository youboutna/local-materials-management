/**
 * Hexagonal hooks for Supplier Submission Dashboard
 * Centralizes supplier submission operations
 */

import { TenderSubmissionService } from '@/application/services/TenderSubmissionService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';

export interface Submission {
  id: string;
  tenderId: string; 
  supplierName: string; 
  supplierEmail: string; 
  submissionDate: string; 
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  secretCode?: string; 
  createdAt: string; 
  updatedAt: string; 
  tender?: {
    title: string;
    deadlineDate?: string; 
  };

  // Legacy snake_case for backward compatibility
  tender_id?: string; 
  supplier_name?: string; 
  supplier_email?: string; 
  submission_date?: string; 
  secret_code?: string; 
  created_at?: string; 
  updated_at?: string; 
}

export interface SubmissionDocument {
  id: string;
  submissionId: string; 
  documentId: string; 
  category: string;
  subcategory: string;
  document: {
    id: string;
    title: string;
    fileName: string; 
    fileUrl: string; 
    fileSize: number; 
    metadata?: Record<string, unknown>;
  };

  // Legacy snake_case for backward compatibility
  submission_id?: string; 
  document_id?: string; 
  file_name?: string; 
  file_url?: string; 
  file_size?: number; 
  uploaded_at: string;
}

export interface ActivityLog {
  id: string;
  submissionId: string; 
  action: string;
  details: string;
  created_at: string;
  user_id?: string;
}

export const useCurrentUserHex = () => {
  const authRepository = RepositoryFactory.getAuthRepository();
  
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const user = await authRepository.getCurrentUser();
      return user;
    }
  });
};

export const useSupplierSubmissionsHex = (supplierId?: string) => {
  const tenderRepository = RepositoryFactory.getTenderRepository();
  
  return useQuery({
    queryKey: ['supplier-submissions', supplierId],
    queryFn: async (): Promise<Submission[]> => {
      // Use hexagonal TenderSubmissionService
      if (!supplierId) return [];
      const submissions = await TenderSubmissionService.getSubmissionsByUser(supplierId);
      return submissions.map((sub: any) => ({
        id: sub.id,
        tenderId: sub.tender_id,
        supplierName: sub.supplier_name,
        supplierEmail: sub.supplier_email,
        submissionDate: sub.submission_date,
        status: sub.status,
        secretCode: sub.secret_code,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at
      }));
    },
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSubmissionDocumentsHex = (submissionId?: string) => {
  return useQuery({
    queryKey: ['submission-documents', submissionId],
    queryFn: async (): Promise<SubmissionDocument[]> => {
      const rows = await TenderSubmissionService.getSubmissionDocuments(submissionId!);
      return rows.map((r: any) => ({
        id: r.id,
        submissionId: r.submission_id,
        documentId: r.document_id,
        category: r.category,
        subcategory: r.subcategory ?? '',
        document: {
          id: r.document?.id ?? r.document_id,
          title: r.document?.title ?? '',
          fileName: r.document?.file_name ?? '',
          fileUrl: r.document?.file_url ?? '',
          fileSize: r.document?.file_size ?? 0,
          metadata: r.document?.metadata ?? undefined,
        },
        uploaded_at: r.created_at,
      }));
    },
    enabled: !!submissionId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSubmissionStatsHex = (supplierId?: string) => {
  return useQuery({
    queryKey: ['submission-stats', supplierId],
    queryFn: () => TenderSubmissionService.getSubmissionStatsByUser(supplierId!),
    enabled: !!supplierId,
    staleTime: 10 * 60 * 1000,
  });
};

export const useSubmissionDocumentsList = (submissionId?: string) => {
  // Alias for useSubmissionDocumentsHex to match component import
  return useSubmissionDocumentsHex(submissionId);
};

export const useSubmissionActivityLogs = (submissionId?: string) => {
  return useQuery({
    queryKey: ['submission-activity-logs', submissionId],
    queryFn: async (): Promise<ActivityLog[]> => {
      const rows = await TenderSubmissionService.getSubmissionActivityLogs(submissionId!);
      return rows.map(r => ({
        id: r.id,
        submissionId: r.submission_id,
        action: r.action,
        details: r.details ?? '',
        created_at: r.created_at,
        user_id: r.performed_by ?? undefined,
      }));
    },
    enabled: !!submissionId,
    staleTime: 5 * 60 * 1000,
  });
};
