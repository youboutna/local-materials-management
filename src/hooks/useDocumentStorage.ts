
import { useState } from 'react';
import { StorageFactory } from '@/services/storage/StorageFactory';
import { UploadResult, DownloadResult, DeleteResult } from '@/services/storage/StorageProvider';

export const useDocumentStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const storageProvider = StorageFactory.createProvider();

  const uploadFile = async (file: File, path?: string): Promise<UploadResult> => {
    setUploading(true);
    try {
      const result = await storageProvider.upload(file, path);
      return result;
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (url: string, fileName: string): Promise<DownloadResult> => {
    setDownloading(true);
    try {
      const result = await storageProvider.download(url, fileName);
      
      if (result.success && result.blob) {
        // Create download link
        const downloadUrl = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }
      
      return result;
    } finally {
      setDownloading(false);
    }
  };

  const deleteFile = async (url: string): Promise<DeleteResult> => {
    return await storageProvider.delete(url);
  };

  const validateConnection = async (): Promise<boolean> => {
    return await storageProvider.validateConnection();
  };

  return {
    uploadFile,
    downloadFile,
    deleteFile,
    validateConnection,
    uploading,
    downloading
  };
};
