/**
 * Storage Repository Interface
 * Defines the contract for file storage operations
 * Following hexagonal architecture principles
 */

export interface StorageFile {
  id: string;
  name: string;
  path: string;
  bucket: string;
  size?: number;
  contentType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadResult {
  path: string;
  publicUrl: string;
  size?: number;
  contentType?: string;
}

export interface IStorageRepository {
  /**
   * Upload file to storage
   */
  uploadFile(bucket: string, path: string, file: File): Promise<{ result: UploadResult | null; error: Error | null }>;

  /**
   * Get public URL for file
   */
  getPublicUrl(bucket: string, path: string): string;

  /**
   * Delete file from storage
   */
  deleteFile(bucket: string, path: string): Promise<{ error: Error | null }>;

  /**
   * List files in bucket with optional prefix
   */
  listFiles(bucket: string, prefix?: string): Promise<{ files: StorageFile[]; error: Error | null }>;

  /**
   * Download file
   */
  downloadFile(bucket: string, path: string): Promise<{ data: Blob | null; error: Error | null }>;

  /**
   * Check if file exists
   */
  fileExists(bucket: string, path: string): Promise<{ exists: boolean; error: Error | null }>;
}
