/**
 * Hexagonal hook for Business Documents operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StorageService } from '@/application/services/StorageService';
import { AuthService } from '@/application/services/AuthService';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessDocumentFormData {
  title: string;
  description?: string;
  amount?: number;
  supplier?: string;
  invoice_date?: string;
  due_date?: string;
  file: File;
}

export function useUploadBusinessDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: BusinessDocumentFormData & { projectId?: string }) => {
      // Upload file
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `business-docs/${fileName}`;

      const storageService = new StorageService();
      const { error: uploadError } = await storageService.uploadFile('documents', filePath, formData.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const publicUrl = storageService.getPublicUrl('documents', filePath);

      // Get current user
      const authService = new AuthService();
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Save document record
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          title: formData.title,
          description: formData.description,
          file_name: formData.file.name,
          file_url: publicUrl,
          file_size: formData.file.size,
          mime_type: formData.file.type,
          project_id: formData.projectId,
          uploaded_by: user.id,
          metadata: {
            amount: formData.amount,
            supplier: formData.supplier,
            invoice_date: formData.invoice_date,
            due_date: formData.due_date,
          },
          document_type: 'business_document',
        });

      if (docError) throw docError;

      return { success: true, url: publicUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-documents'] });
    },
  });
}
