/**
 * Storage Service
 * Implements business logic for file storage operations
 * Following hexagonal architecture principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { 
  IStorageRepository, 
  StorageFile, 
  UploadResult 
} from '@/domain/repositories/IStorageRepository';

export class StorageService {
  constructor(private storageRepository: IStorageRepository) {}

  /**
   * Upload file to storage
   */
  async uploadFile(bucket: string, path: string, file: File): Promise<UploadResult> {
    try {
      const result = await this.storageRepository.uploadFile(bucket, path, file);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to upload file');
      }

      if (!result.result) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'No upload result returned');
      }

      return result.result;
    } catch (error) {
      console.error('StorageService.uploadFile failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to upload file');
    }
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(bucket: string, path: string): string {
    try {
      return this.storageRepository.getPublicUrl(bucket, path);
    } catch (error) {
      console.error('StorageService.getPublicUrl failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get public URL');
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const result = await this.storageRepository.deleteFile(bucket, path);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete file');
      }
    } catch (error) {
      console.error('StorageService.deleteFile failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete file');
    }
  }

  /**
   * List files in bucket with optional prefix
   */
  async listFiles(bucket: string, prefix?: string): Promise<StorageFile[]> {
    try {
      const result = await this.storageRepository.listFiles(bucket, prefix);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to list files');
      }

      return result.files;
    } catch (error) {
      console.error('StorageService.listFiles failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to list files');
    }
  }

  /**
   * Download file
   */
  async downloadFile(bucket: string, path: string): Promise<Blob> {
    try {
      const result = await this.storageRepository.downloadFile(bucket, path);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to download file');
      }

      if (!result.data) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'No file data returned');
      }

      return result.data;
    } catch (error) {
      console.error('StorageService.downloadFile failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to download file');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(bucket: string, path: string): Promise<boolean> {
    try {
      const result = await this.storageRepository.fileExists(bucket, path);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to check file existence');
      }

      return result.exists;
    } catch (error) {
      console.error('StorageService.fileExists failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to check file existence');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(bucket: string, files: Array<{ path: string; file: File }>): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map(({ path, file }) => 
        this.uploadFile(bucket, path, file)
      );

      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads: UploadResult[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulUploads.push(result.value);
        } else {
          console.error(`Failed to upload file ${files[index].path}:`, result.reason);
        }
      });

      if (successfulUploads.length === 0) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'All file uploads failed');
      }

      return successfulUploads;
    } catch (error) {
      console.error('StorageService.uploadMultipleFiles failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to upload multiple files');
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(bucket: string, paths: string[]): Promise<void> {
    try {
      const deletePromises = paths.map(path => 
        this.deleteFile(bucket, path)
      );

      await Promise.allSettled(deletePromises);
    } catch (error) {
      console.error('StorageService.deleteMultipleFiles failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete multiple files');
    }
  }
}
