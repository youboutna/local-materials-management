
import { useState } from 'react';
import { StorageFactory } from '@/application/services/StorageFactory';
import { UploadResult, DownloadResult, DeleteResult } from '@/application/services/storage/StorageProvider';

export const useDocumentStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const storageProvider = StorageFactory.createProvider();

  const uploadFile = async (file: File, path?: string): Promise<UploadResult> => {
    setUploading(true);
    try {
      const result = await storageProvider.uploadFile(file, path || file.name);
      return result;
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (url: string, fileName: string): Promise<DownloadResult> => {
    setDownloading(true);
    try {
      const result = await storageProvider.downloadFile(url);
      
      if (result.success && result.data) {
        // Create download link
        const downloadUrl = window.URL.createObjectURL(result.data);
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
    return await storageProvider.deleteFile(url);
  };

  const validateConnection = async (): Promise<boolean> => {
    // Basic validation - try to list files to check connectivity
    try {
      const result = await storageProvider.listFiles();
      return result.success;
    } catch (error) {
      console.error('Storage connection validation failed:', error);
      return false;
    }
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
