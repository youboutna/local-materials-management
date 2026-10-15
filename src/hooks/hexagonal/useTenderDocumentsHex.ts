/**
 * Hexagonal hooks for Tender Document Management
 * Uses application services for tender-document operations
 */

import { getTenderDocumentService } from '@/application/services/TenderDocumentService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

// Hook: Fetch tender documents (joined with linked document metadata)
export function useTenderDocumentsList(tenderId: string) {
  return useQuery({
    queryKey: ['tender-documents', tenderId],
    queryFn: async () => {
      const rows = await getTenderDocumentService().getTenderDocumentsWithDocument(tenderId);
      return (rows || []) as unknown as TenderDocumentWithDetails[];
    },
    enabled: !!tenderId
  });
}

// Hook: Fetch workflow step documents
export function useWorkflowStepDocumentsList(tenderId: string) {
  return useQuery({
    queryKey: ['workflow-step-documents', tenderId],
    queryFn: async (): Promise<TenderDocumentWithDetails[]> => {
      const rows = await getTenderDocumentService().getWorkflowStepDocuments(tenderId);
      return (rows || []) as unknown as TenderDocumentWithDetails[];
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
      return getTenderDocumentService().createTenderLevelDocument({
        tenderId,
        projectId,
        title: documentData.title,
        description: documentData.description ?? '',
        fileUrl,
        fileName,
        mimeType: fileType,
        fileSize,
        category: documentData.category,
        subcategory: documentData.subcategory,
        isRequired: documentData.is_required ?? true,
        isSubmitted: true,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-documents', tenderId] });
    }
  });
}
