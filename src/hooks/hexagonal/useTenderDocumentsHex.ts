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

// Hook: Fetch tender documents
export function useTenderDocumentsList(tenderId: string) {
  return useQuery({
    queryKey: ['tender-documents', tenderId],
    queryFn: async () => {
      // Placeholder - tender document listing via TenderDocumentRepository
      const tenderDocRepo = RepositoryFactory.getTenderDocumentRepository();
      const docs = await tenderDocRepo.findAll();
      return (docs || []) as unknown as TenderDocumentWithDetails[];
    },
    enabled: !!tenderId
  });
}

// Hook: Fetch workflow step documents
export function useWorkflowStepDocumentsList(tenderId: string) {
  return useQuery({
    queryKey: ['workflow-step-documents', tenderId],
    queryFn: async (): Promise<TenderDocumentWithDetails[]> => {
      // Placeholder - would need workflow step document repository
      return [];
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
      const tenderDocRepo = RepositoryFactory.getTenderDocumentRepository();

      // Create document record
      const document = await docRepo.save({
        title: documentData.title,
        description: documentData.description || null,
        fileUrl: fileUrl,
        fileName: fileName,
        mimeType: fileType,
        fileSize: fileSize,
        documentType: 'tender'
      } as any);

      // Create tender document record
      const tenderDoc = await tenderDocRepo.save({
        documentId: (document as any).id,
        tenderId: tenderId,
        projectId: projectId || null,
        category: documentData.category,
        subcategory: documentData.subcategory,
        isRequired: documentData.is_required ?? true,
        isSubmitted: true,
        submissionDate: new Date().toISOString(),
        status: 'pending'
      } as any);

      return { document, tenderDoc };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-documents', tenderId] });
    }
  });
}
