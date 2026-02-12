/**
 * Hexagonal hooks for Tender Document Management
 * Uses RepositoryFactory instead of direct Supabase access
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface TenderDocumentWithDetails {
  id: string;
  tender_id: string;
  document_id: string;
  category: string;
  subcategory?: string;
  is_required?: boolean;
  reviewer_notes?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
  document?: any;
  step_info?: { step_title?: string; step_number?: number };
}

type TenderDocumentCategory = string;

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

// Hook: Fetch tender documents
export function useTenderDocumentsList(tenderId: string) {
  return useQuery({
    queryKey: ['tender-documents', tenderId],
    queryFn: async () => {
      const tenderRepo = RepositoryFactory.getTenderRepository();
      const data = await tenderRepo.getDocuments(tenderId);
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
      const tenderRepo = RepositoryFactory.getTenderRepository();
      const stepDocs = await tenderRepo.getStepDocuments(tenderId);
      return (stepDocs || []).map((doc: any) => ({
        id: doc.id,
        tender_id: tenderId,
        document_id: doc.document_id,
        category: doc.document_type || 'administrative',
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
    mutationFn: async ({ fileUrl, fileName, fileType, fileSize, documentData }: {
      fileUrl: string; fileName: string; fileType: string; fileSize: number;
      documentData: { category: TenderDocumentCategory; subcategory: string; title: string; description?: string; is_required?: boolean; };
    }) => {
      const docRepo = RepositoryFactory.getDocumentRepository();
      const tenderRepo = RepositoryFactory.getTenderRepository();

      // Create document record
      const document = await docRepo.create({
        title: documentData.title,
        description: documentData.description,
        file_url: fileUrl,
        file_name: fileName,
        mime_type: fileType,
        file_size: fileSize,
        document_type: 'tender'
      } as any);

      // Create tender document record
      const tenderDoc = await tenderRepo.addDocument({
        document_id: (document as any).id,
        tender_id: tenderId,
        project_id: projectId || null,
        category: documentData.category,
        subcategory: documentData.subcategory,
        is_required: documentData.is_required ?? true,
        is_submitted: true,
        submission_date: new Date().toISOString(),
        status: 'pending'
      } as any);

      return { document, tenderDoc };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-documents', tenderId] });
    }
  });
}
