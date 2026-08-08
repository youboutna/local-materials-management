/**
 * Storage Provider Interface - Domain Layer
 * Defines the contract for storage providers
 * Following hexagonal architecture principles
 */

export interface IStorageProvider {
  /**
   * Upload a file to storage
   */
  uploadFile(
    file: File,
    path: string,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
      upsert?: boolean;
    }
  ): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }>;

  /**
   * Download a file from storage
   */
  downloadFile(path: string): Promise<{
    success: boolean;
    data?: Blob;
    error?: string;
  }>;

  /**
   * Delete a file from storage
   */
  deleteFile(path: string): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }>;

  /**
   * List files in storage
   */
  listFiles(prefix?: string): Promise<{
    success: boolean;
    files?: Array<{
      name: string;
      size: number;
      createdAt: string;
      updatedAt: string;
    }>;
    error?: string;
  }>;

  /**
   * Check if a file exists
   */
  fileExists(path: string): Promise<boolean>;
}
