/**
 * Hexagonal hook for Business Documents operations
 * Uses DocumentService + StorageService instead of direct Supabase access
 */

import { AuthService } from '@/application/services/AuthService';
import { DocumentService } from '@/application/services/DocumentService';
import { StorageService } from '@/application/services/StorageService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface BusinessDocumentFormData {
  title: string;
  description?: string;
  amount?: number;
  supplier?: string;
  invoice_date?: string;
  due_date?: string;
  reference?: string;
  file?: File;
}

export function useUploadBusinessDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: BusinessDocumentFormData & { projectId?: string }) => {
      if (!formData.file) throw new Error('File is required');

      // Upload file
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `business-docs/${fileName}`;

      const storageService = getStorageService();
      const uploadResult = await storageService.uploadFile({ bucket: 'documents', path: filePath, file: formData.file as File });

      // Get public URL
      const publicUrl = storageService.getPublicUrl({ bucket: 'documents', path: filePath });

      // Get current user
      const authService = getAuthService();
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Save document record via service
      const docService = new DocumentService(RepositoryFactory.getDocumentRepository());
      await docService.createDocument({
        title: formData.title,
        description: formData.description,
        fileName: formData.file.name,
        fileUrl: publicUrl,
        fileSize: formData.file.size,
        mimeType: formData.file.type,
        projectId: formData.projectId,
        uploadedBy: user.id,
        documentType: 'other',
        metadata: {
          amount: formData.amount,
          supplier: formData.supplier,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date,
        },
      });

      return { success: true, url: publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-documents'] });
    },
  });
}
