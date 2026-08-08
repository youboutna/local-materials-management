/**
 * Hexagonal hook for document storage operations
 * Provides file upload functionality through StorageService
 */

import { StorageService, getStorageService} from '@/application/services/StorageService';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UploadResult {
  name: string;
  url: string;
  path: string;
  uploadedAt: string;
}

export function useStorageHex(bucketName: string = 'documents') {
  const queryClient = useQueryClient();
  const storageService = getStorageService();

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }): Promise<UploadResult> => {
      try {
        console.info('USE_STORAGE_HEX_001: Starting file upload', {
          code: 'USE_STORAGE_HEX_001',
          message: 'Début du téléchargement de fichier',
          bucketName,
          fileName: file.name,
          fileSize: file.size,
          folder,
          stack: new Error().stack
        });

        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${folder}/${fileName}`;

        console.info('USE_STORAGE_HEX_002: Uploading to storage service', {
          code: 'USE_STORAGE_HEX_002',
          message: 'Téléchargement vers le service de stockage',
          bucketName,
          filePath,
          stack: new Error().stack
        });

        const result = await storageService.uploadFile({
          bucket: bucketName,
          path: filePath,
          file: file
        });

        console.info('USE_STORAGE_HEX_003: File uploaded successfully', {
          code: 'USE_STORAGE_HEX_003',
          message: 'Fichier téléchargé avec succès',
          bucketName,
          filePath,
          stack: new Error().stack
        });

        const publicUrl = storageService.getPublicUrl({
          bucket: bucketName,
          path: filePath
        });

        console.info('USE_STORAGE_HEX_004: Public URL generated', {
          code: 'USE_STORAGE_HEX_004',
          message: 'URL publique générée avec succès',
          bucketName,
          filePath,
          publicUrl,
          stack: new Error().stack
        });

        return {
          name: file.name,
          url: publicUrl,
          path: filePath,
          uploadedAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('USE_STORAGE_HEX_005: File upload failed', {
          code: 'USE_STORAGE_HEX_005',
          message: 'Échec du téléchargement de fichier',
          bucketName,
          fileName: file.name,
          folder,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      console.info('USE_STORAGE_HEX_006: Upload mutation success', {
        code: 'USE_STORAGE_HEX_006',
        message: 'Mutation de téléchargement réussie',
        bucketName,
        fileName: variables.file.name,
        resultPath: result.path,
        stack: new Error().stack
      });
      
      queryClient.invalidateQueries({ queryKey: ['storage', bucketName] });
      toast({ 
        title: 'Succès', 
        description: `Fichier "${variables.file.name}" téléchargé avec succès` 
      });
    },
    onError: (error: Error, variables) => {
      console.error('USE_STORAGE_HEX_007: Upload mutation error', {
        code: 'USE_STORAGE_HEX_007',
        message: 'Erreur dans la mutation de téléchargement',
        bucketName,
        fileName: variables.file.name,
        technicalError: error,
        stack: new Error().stack
      });
      
      toast({ 
        title: 'Erreur de téléchargement', 
        description: `Impossible de télécharger "${variables.file.name}"`,
        variant: 'destructive' 
      });
    }
  });

  // Upload multiple files
  const uploadMultipleMutation = useMutation({
    mutationFn: async ({ files, folder }: { files: File[]; folder: string }): Promise<UploadResult[]> => {
      try {
        console.info('USE_STORAGE_HEX_008: Starting multiple files upload', {
          code: 'USE_STORAGE_HEX_008',
          message: 'Début du téléchargement multiple de fichiers',
          bucketName,
          filesCount: files.length,
          folder,
          fileNames: files.map(f => f.name),
          stack: new Error().stack
        });

        const results = await Promise.all(
          files.map(async (file, index) => {
            try {
              const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 9)}-${file.name}`;
              const filePath = `${folder}/${fileName}`;

              console.info('USE_STORAGE_HEX_009: Uploading individual file', {
                code: 'USE_STORAGE_HEX_009',
                message: `Téléchargement du fichier ${index + 1}/${files.length}`,
                bucketName,
                fileName: file.name,
                filePath,
                stack: new Error().stack
              });

              const fileUploadDto = {
                bucket: bucketName,
                path: filePath,
                file: file
              };

              const result = await storageService.uploadFile(fileUploadDto);
              const publicUrl = storageService.getPublicUrl({
                bucket: bucketName,
                path: filePath
              });

              return {
                name: file.name,
                url: publicUrl,
                path: filePath,
                uploadedAt: new Date().toISOString()
              };
            } catch (fileError) {
              console.error('USE_STORAGE_HEX_010: Individual file upload failed', {
                code: 'USE_STORAGE_HEX_010',
                message: `Échec du téléchargement du fichier ${file.name}`,
                bucketName,
                fileName: file.name,
                technicalError: fileError,
                stack: new Error().stack
              });
              throw fileError;
            }
          })
        );

        console.info('USE_STORAGE_HEX_011: Multiple files uploaded successfully', {
          code: 'USE_STORAGE_HEX_011',
          message: 'Téléchargement multiple réussi',
          bucketName,
          filesCount: results.length,
          stack: new Error().stack
        });

        return results;
      } catch (error) {
        console.error('USE_STORAGE_HEX_012: Multiple files upload failed', {
          code: 'USE_STORAGE_HEX_012',
          message: 'Échec du téléchargement multiple',
          bucketName,
          filesCount: files.length,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    onSuccess: (results, variables) => {
      console.info('USE_STORAGE_HEX_013: Multiple upload mutation success', {
        code: 'USE_STORAGE_HEX_013',
        message: 'Mutation de téléchargement multiple réussie',
        bucketName,
        filesCount: results.length,
        stack: new Error().stack
      });
      
      queryClient.invalidateQueries({ queryKey: ['storage', bucketName] });
      toast({ 
        title: 'Succès', 
        description: `${results.length} fichiers téléchargés avec succès` 
      });
    },
    onError: (error: Error, variables) => {
      console.error('USE_STORAGE_HEX_014: Multiple upload mutation error', {
        code: 'USE_STORAGE_HEX_014',
        message: 'Erreur dans la mutation de téléchargement multiple',
        bucketName,
        filesCount: variables.files.length,
        technicalError: error,
        stack: new Error().stack
      });
      
      toast({ 
        title: 'Erreur de téléchargement', 
        description: `Impossible de télécharger ${variables.files.length} fichiers`,
        variant: 'destructive' 
      });
    }
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (filePath: string) => {
      try {
        console.info('USE_STORAGE_HEX_015: Starting file deletion', {
          code: 'USE_STORAGE_HEX_015',
          message: 'Début de la suppression de fichier',
          bucketName,
          filePath,
          stack: new Error().stack
        });

        await storageService.deleteFile({
          bucket: bucketName,
          path: filePath
        });

        console.info('USE_STORAGE_HEX_016: File deleted successfully', {
          code: 'USE_STORAGE_HEX_016',
          message: 'Fichier supprimé avec succès',
          bucketName,
          filePath,
          stack: new Error().stack
        });
      } catch (error) {
        console.error('USE_STORAGE_HEX_017: File deletion failed', {
          code: 'USE_STORAGE_HEX_017',
          message: 'Échec de la suppression de fichier',
          bucketName,
          filePath,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    onSuccess: (_, filePath) => {
      console.info('USE_STORAGE_HEX_018: Delete mutation success', {
        code: 'USE_STORAGE_HEX_018',
        message: 'Mutation de suppression réussie',
        bucketName,
        filePath,
        stack: new Error().stack
      });
      
      queryClient.invalidateQueries({ queryKey: ['storage', bucketName] });
      toast({ 
        title: 'Succès', 
        description: 'Fichier supprimé avec succès' 
      });
    },
    onError: (error: Error, filePath) => {
      console.error('USE_STORAGE_HEX_019: Delete mutation error', {
        code: 'USE_STORAGE_HEX_019',
        message: 'Erreur dans la mutation de suppression',
        bucketName,
        filePath,
        technicalError: error,
        stack: new Error().stack
      });
      
      toast({ 
        title: 'Erreur de suppression', 
        description: 'Impossible de supprimer le fichier',
        variant: 'destructive' 
      });
    }
  });

  // Get public URL
  const getPublicUrl = (filePath: string): string => {
    try {
      console.info('USE_STORAGE_HEX_020: Generating public URL', {
        code: 'USE_STORAGE_HEX_020',
        message: 'Génération de l\'URL publique',
        bucketName,
        filePath,
        stack: new Error().stack
      });
      
      const url = storageService.getPublicUrl({
        bucket: bucketName,
        path: filePath
      });
      
      console.info('USE_STORAGE_HEX_021: Public URL generated successfully', {
        code: 'USE_STORAGE_HEX_021',
        message: 'URL publique générée avec succès',
        bucketName,
        filePath,
        url,
        stack: new Error().stack
      });
      
      return url;
    } catch (error) {
      console.error('USE_STORAGE_HEX_022: Public URL generation failed', {
        code: 'USE_STORAGE_HEX_022',
        message: 'Échec de la génération de l\'URL publique',
        bucketName,
        filePath,
        technicalError: error,
        stack: new Error().stack
      });
      throw error;
    }
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
