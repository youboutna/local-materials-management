/**
 * Hexagonal hook for document storage operations
 * Replaces direct supabase.storage calls in components
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UploadResult {
  name: string;
  url: string;
  path: string;
  uploadedAt: string;
}

export function useStorageHex(bucketName: string = 'documents') {
  const queryClient = useQueryClient();

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }): Promise<UploadResult> => {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        name: file.name,
        url: publicUrl,
        path: filePath,
        uploadedAt: new Date().toISOString()
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage', bucketName] });
    },
    onError: (error) => {
      toast({ title: 'Erreur upload', description: error.message, variant: 'destructive' });
    }
  });

  // Upload multiple files
  const uploadMultipleMutation = useMutation({
    mutationFn: async ({ files, folder }: { files: File[]; folder: string }): Promise<UploadResult[]> => {
      const results = await Promise.all(
        files.map(async (file) => {
          const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
          const filePath = `${folder}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

          return {
            name: file.name,
            url: publicUrl,
            path: filePath,
            uploadedAt: new Date().toISOString()
          };
        })
      );

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage', bucketName] });
      toast({ title: 'Succès', description: 'Fichiers téléchargés' });
    },
    onError: (error) => {
      toast({ title: 'Erreur upload', description: error.message, variant: 'destructive' });
    }
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (filePath: string) => {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage', bucketName] });
      toast({ title: 'Succès', description: 'Fichier supprimé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Get public URL
  const getPublicUrl = (filePath: string): string => {
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    return publicUrl;
  };

  return {
    uploadFile: uploadMutation.mutateAsync,
    uploadFiles: uploadMultipleMutation.mutateAsync,
    deleteFile: deleteMutation.mutateAsync,
    getPublicUrl,
    isUploading: uploadMutation.isPending || uploadMultipleMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
