/**
 * Hexagonal hooks for Tender Document Upload
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '@/application/services/StorageService';
import { DocumentService } from '@/application/services/DocumentService';
import { TenderService } from '@/application/services/TenderService';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { TenderDocumentCategory, TenderDocumentSubcategory } from '@/dtos/transforms/TenderDocumentDTO';

export type TenderCategory = TenderDocumentCategory;
export type TenderSubcategory = TenderDocumentSubcategory;

export interface TenderDocumentUploadData {
  projectId: string;
  title: string;
  description: string;
  category: TenderCategory;
  subcategory: TenderSubcategory;
  file: File;
}

export function useUploadTenderDocumentHex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TenderDocumentUploadData) => {
      // Upload file
      const storageService = new StorageService(RepositoryFactory.getStorageRepository());
      const uploadData = await storageService.uploadFile('documents', `tender/${data.projectId}/${data.file.name}`, data.file);

      // Create document record using hexagonal service
      const documentService = new DocumentService(RepositoryFactory.getDocumentRepository());
      const docData = await documentService.createDocument({
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        fileUrl: uploadData.path,
        type: "contract" as const
      });

      // Create tender document record using hexagonal service
      const tenderService = new TenderService(
        RepositoryFactory.getTenderRepository(),
        RepositoryFactory.getParsedInvoiceRepository(),
        RepositoryFactory.getTenderDocumentRepository()
      );
      await tenderService.createTenderDocument({
        project_id: data.projectId,
        category: data.category,
        subcategory: data.subcategory,
        is_required: true,
        is_submitted: true,
        status: "draft",
        document_id: docData.id
      });

      return docData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tender-documents', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.projectId] });
    }
  });
}
