/**
 * Hexagonal hook for document storage operations
 * Replaces direct supabase.storage calls in components
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { StorageService } from '@/application/services/StorageService';
import { toast } from '@/hooks/use-toast';

interface UploadResult {
  name: string;
  url: string;
  path: string;
  uploadedAt: string;
}

export function useStorageHex(bucketName: string = 'documents') {
  const queryClient = useQueryClient();
  const storageService = new StorageService(RepositoryFactory.getStorageRepository());

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }): Promise<UploadResult> => {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${folder}/${fileName}`;

      const result = await storageService.uploadFile(bucketName, filePath, file);

      const publicUrl = storageService.getPublicUrl(bucketName, filePath);

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

          const result = await storageService.uploadFile(bucketName, filePath, file);

          const publicUrl = storageService.getPublicUrl(bucketName, filePath);

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
      await storageService.deleteFile(bucketName, filePath);
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
    return storageService.getPublicUrl(bucketName, filePath);
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
