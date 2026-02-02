/**
 * Hexagonal hooks for Tender Document Management
 * Centralizes tender document operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TenderDocumentWithDetails, TenderDocumentCategory, TenderDocumentSubcategory } from '@/types/tender';

// Hook: Fetch tender documents
export function useTenderDocumentsList(tenderId: string) {
  return useQuery({
    queryKey: ['tender-documents', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tender_documents')
        .select(`
          *,
          document:documents(
            id,
            title,
            description,
            file_url,
            file_name,
            mime_type,
            file_size
          )
        `)
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Query error:', error);
        return [] as TenderDocumentWithDetails[];
      }

      return (data || []) as TenderDocumentWithDetails[];
    },
    enabled: !!tenderId
  });
}

// Hook: Fetch workflow step documents
export function useWorkflowStepDocumentsList(tenderId: string) {
  return useQuery({
    queryKey: ['workflow-step-documents', tenderId],
    queryFn: async () => {
      // First get all steps for this tender
      const { data: steps, error: stepsError } = await supabase
        .from('tender_steps')
        .select('id, title, step_number')
        .eq('tender_id', tenderId);

      if (stepsError) throw stepsError;
      if (!steps?.length) return [];

      // Get all documents for these steps
      const stepIds = steps.map(s => s.id);
      const { data: stepDocs, error: docsError } = await supabase
        .from('tender_step_documents')
        .select(`
          *,
          document:documents(*),
          step:tender_steps(title, step_number)
        `)
        .in('step_id', stepIds);

      if (docsError) throw docsError;

      // Transform to match TenderDocumentWithDetails format
      return (stepDocs || []).map(doc => ({
        id: doc.id,
        tender_id: tenderId,
        document_id: doc.document_id,
        category: doc.document_type as TenderDocumentCategory || 'administrative',
        subcategory: TenderDocumentSubcategory.WORKFLOW_STEP,
        is_required: doc.is_required,
        reviewer_notes: doc.reviewer_notes,
        status: doc.status as TenderDocumentStatus,
        created_at: doc.created_at,
        updated_at: doc.created_at,
        document: doc.document,
        step_info: {
          step_title: doc.step?.title,
          step_number: doc.step?.step_number
        }
      }));
    },
    enabled: !!tenderId
  });
}

// Hook: Upload tender document
export function useUploadTenderDocument(tenderId: string, projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      fileUrl, 
      fileName, 
      fileType, 
      fileSize,
      documentData 
    }: { 
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      documentData: {
        category: TenderDocumentCategory;
        subcategory: TenderDocumentSubcategory;
        title: string;
        description?: string;
        is_required?: boolean;
      };
    }) => {
      // Create document record
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          title: documentData.title,
          description: documentData.description,
          file_url: fileUrl,
          file_name: fileName,
          mime_type: fileType,
          file_size: fileSize,
          document_type: 'tender' as const
        })
        .select()
        .single();

      if (docError) throw docError;

      // Create tender document record
      const { data: tenderDoc, error: tenderDocError } = await supabase
        .from('tender_documents')
        .insert({
          document_id: document.id,
          tender_id: tenderId,
          project_id: projectId || null,
          category: documentData.category,
          subcategory: documentData.subcategory,
          is_required: documentData.is_required ?? true,
          is_submitted: true,
          submission_date: new Date().toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (tenderDocError) throw tenderDocError;

      return { document, tenderDoc };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-documents', tenderId] });
    }
  });
}

enum TenderDocumentSubcategory {
  WORKFLOW_STEP = 'workflow_step',
  ADMINISTRATIVE = 'administrative',
  TECHNICAL = 'technical',
  FINANCIAL = 'financial'
}

enum TenderDocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVISION = 'needs_revision'
}
