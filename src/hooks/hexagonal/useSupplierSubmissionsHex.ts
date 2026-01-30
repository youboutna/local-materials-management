/**
 * Hexagonal hooks for Supplier Submission Dashboard
 * Centralizes supplier submission operations
 */

import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
      // Placeholder - would use TenderSubmissionService
      console.log('Supplier submissions not implemented for supplier:', supplierId);
      return [];
    },
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSubmissionDocumentsHex = (submissionId?: string) => {
  // Placeholder - would use DocumentService
  return useQuery({
    queryKey: ['submission-documents', submissionId],
    queryFn: async (): Promise<SubmissionDocument[]> => {
      console.log('Submission documents not implemented for submission:', submissionId);
      return [];
    },
    enabled: !!submissionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSubmissionStatsHex = (supplierId?: string) => {
  // Placeholder - would use AnalyticsService
  return useQuery({
    queryKey: ['submission-stats', supplierId],
    queryFn: async () => {
      console.log('Submission stats not implemented for supplier:', supplierId);
      return {
        total: 0,
        submitted: 0,
        under_review: 0,
        approved: 0,
        rejected: 0
      };
    },
    enabled: !!supplierId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSubmissionDocumentsList = (submissionId?: string) => {
  // Alias for useSubmissionDocumentsHex to match component import
  return useSubmissionDocumentsHex(submissionId);
};

export const useSubmissionActivityLogs = (submissionId?: string) => {
  // Placeholder - would use ActivityLogService
  return useQuery({
    queryKey: ['submission-activity-logs', submissionId],
    queryFn: async (): Promise<ActivityLog[]> => {
      console.log('Activity logs not implemented for submission:', submissionId);
      return [];
    },
    enabled: !!submissionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
