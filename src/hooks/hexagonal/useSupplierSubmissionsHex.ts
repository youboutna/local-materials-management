/**
 * Hexagonal hooks for Supplier Submission Dashboard
 * Centralizes supplier submission operations
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ExtendedSupabaseClient } from '@/types/supabase-helpers';

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
  subcategory: string;
  created_at: string;
  document?: {
    title: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    file_url: string;
    metadata?: any;
  };
}

export interface ActivityLog {
  id: string;
  submission_id: string;
  action: string;
  details: string;
  created_at: string;
}

// Hook: Fetch current user
export function useCurrentAuthUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });
}

// Hook: Fetch user's submissions
export function useSupplierSubmissions(userId?: string) {
  return useQuery({
    queryKey: ['supplier-submissions', userId],
    queryFn: async (): Promise<Submission[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('tender_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch tender titles separately
      const enrichedData = await Promise.all((data || []).map(async (submission: any) => {
        const { data: tender } = await supabase
          .from('tenders')
          .select('title, deadline_date')
          .eq('id', submission.tender_id)
          .single();

        return {
          ...submission,
          tender: tender || undefined
        };
      }));

      return enrichedData as Submission[];
    },
    enabled: !!userId
  });
}

// Hook: Fetch documents for selected submission
export function useSubmissionDocumentsList(submissionId?: string) {
  return useQuery({
    queryKey: ['submission-documents-list', submissionId],
    queryFn: async (): Promise<SubmissionDocument[]> => {
      if (!submissionId) return [];

      const { data, error } = await supabase
        .from('tender_submission_documents')
        .select(`
          *,
          document:documents(*)
        `)
        .eq('submission_id', submissionId);

      if (error) throw error;
      return data as SubmissionDocument[];
    },
    enabled: !!submissionId
  });
}

// Hook: Fetch activity logs for selected submission
export function useSubmissionActivityLogs(submissionId?: string) {
  return useQuery({
    queryKey: ['submission-activity', submissionId],
    queryFn: async (): Promise<ActivityLog[]> => {
      if (!submissionId) return [];

      const { data, error } = await (supabase as ExtendedSupabaseClient)
        .from('submission_activity_logs')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching activity logs:', error);
        return [];
      }
      return (data || []) as ActivityLog[];
    },
    enabled: !!submissionId
  });
}
