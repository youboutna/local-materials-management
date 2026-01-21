/**
 * Hexagonal hooks for Supplier Submission Dashboard
 * Centralizes supplier submission operations
 */

import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface Submission {
  id: string;
  tender_id: string;
  supplier_name: string;
  supplier_email: string;
  submission_date: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  secret_code?: string;
  created_at: string;
  updated_at: string;
  tender?: {
    title: string;
    deadline_date?: string;
  };
}

export interface SubmissionDocument {
  id: string;
  submission_id: string;
  document_id: string;
  category: string;
  document_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
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

export const useSubmissionDocumentsHex = (submissionId: string) => {
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
