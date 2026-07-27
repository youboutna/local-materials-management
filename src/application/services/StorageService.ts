/**
 * Storage Service - Hexagonal Architecture
 * Business logic for file storage operations
 */

import {
    IStorageRepository,
    StorageFile,
    UploadResult
} from '@/domain/repositories/IStorageRepository';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Service DTOs for data exchange
export interface UploadFileRequestDto {
  bucket: string;
  path: string;
  file: File;
}

export interface GetPublicUrlRequestDto {
  bucket: string;
  path: string;
}

export interface DeleteFileRequestDto {
  bucket: string;
  path: string;
}

export interface ListFilesRequestDto {
  bucket: string;
  prefix?: string;
}

export interface DownloadFileRequestDto {
  bucket: string;
  path: string;
}

export interface FileExistsRequestDto {
  bucket: string;
  path: string;
}

export interface UploadMultipleFilesRequestDto {
  bucket: string;
  files: Array<{ path: string; file: File }>;
}

export interface DeleteMultipleFilesRequestDto {
  bucket: string;
  paths: string[];
}

export class StorageService {
  constructor(
    private storageRepository: IStorageRepository = RepositoryFactory.getStorageRepository()
  ) {}

  /**
   * Upload file to storage
   */
  async uploadFile(request: UploadFileRequestDto): Promise<UploadResult> {
    try {
      if (!request.bucket) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Bucket is required');
      }
      if (!request.path) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Path is required');
      }
      if (!request.file) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'File is required');
      }

      const result = await this.storageRepository.uploadFile(request.bucket, request.path, request.file);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to upload file');
      }

      if (!result.result) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'No upload result returned');
      }

      return result.result;
    } catch (error) {
      console.error('StorageService.uploadFile failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to upload file');
    }
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(request: GetPublicUrlRequestDto): string {
    try {
      if (!request.bucket) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Bucket is required');
      }
      if (!request.path) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Path is required');
      }

      return this.storageRepository.getPublicUrl(request.bucket, request.path);
    } catch (error) {
      console.error('StorageService.getPublicUrl failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get public URL');
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(request: DeleteFileRequestDto): Promise<void> {
    try {
      if (!request.bucket) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Bucket is required');
      }
      if (!request.path) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Path is required');
      }

      const result = await this.storageRepository.deleteFile(request.bucket, request.path);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete file');
      }
    } catch (error) {
      console.error('StorageService.deleteFile failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete file');
    }
  }

  /**
   * List files in bucket with optional prefix
   */
  async listFiles(request: ListFilesRequestDto): Promise<StorageFile[]> {
    try {
      if (!request.bucket) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Bucket is required');
      }

      const result = await this.storageRepository.listFiles(request.bucket, request.prefix);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to list files');
      }

      return result.files;
    } catch (error) {
      console.error('StorageService.listFiles failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to list files');
    }
  }

  /**
   * Download file
   */
  async downloadFile(request: DownloadFileRequestDto): Promise<Blob> {
    try {
      if (!request.bucket) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Bucket is required');
      }
      if (!request.path) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Path is required');
      }

      const result = await this.storageRepository.downloadFile(request.bucket, request.path);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to download file');
      }

      if (!result.data) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'No file data returned');
      }

      return result.data;
    } catch (error) {
      console.error('StorageService.downloadFile failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to download file');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(request: FileExistsRequestDto): Promise<boolean> {
    try {
      if (!request.bucket) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Bucket is required');
      }
      if (!request.path) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Path is required');
      }

      const result = await this.storageRepository.fileExists(request.bucket, request.path);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to check file existence');
      }

      return result.exists;
    } catch (error) {
      console.error('StorageService.fileExists failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to check file existence');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(request: UploadMultipleFilesRequestDto): Promise<UploadResult[]> {
    try {
      if (!request.bucket) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Bucket is required');
      }
      if (!request.files || request.files.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Files are required');
      }

      const uploadPromises = request.files.map(({ path, file }) => 
        this.uploadFile({ bucket: request.bucket, path, file })
      );

      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads: UploadResult[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulUploads.push(result.value);
        } else {
          console.error(`Failed to upload file ${request.files[index].path}:`, result.reason);
        }
      });

      if (successfulUploads.length === 0) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'All file uploads failed');
      }

      return successfulUploads;
    } catch (error) {
      console.error('StorageService.uploadMultipleFiles failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to upload multiple files');
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(request: DeleteMultipleFilesRequestDto): Promise<void> {
    try {
      if (!request.bucket) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Bucket is required');
      }
      if (!request.paths || request.paths.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Paths are required');
      }

      const deletePromises = request.paths.map(path => 
        this.deleteFile({ bucket: request.bucket, path })
      );

      await Promise.allSettled(deletePromises);
    } catch (error) {
      console.error('StorageService.deleteMultipleFiles failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete multiple files');
    }
  }
}
