/**
 * Supabase Storage Provider - Infrastructure Layer
 * Handles file storage operations using Supabase Storage
 * Following hexagonal architecture principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IStorageProvider } from '@/domain/interfaces/IStorageProvider';
import { supabase } from '@/integrations/supabase/client';

/**
 * Supabase implementation of storage provider
 */
export class SupabaseStorageProvider implements IStorageProvider {
  private bucket: string;

  constructor(bucket: string = 'documents') {
    this.bucket = bucket;
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
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
    }> {
    try {
      // NB: the bucket is already selected via .from(this.bucket) — do NOT prefix the path
      // with the bucket name again (it would create a nested "documents/documents/..." key
      // that collides across uploads and yields "The resource already exists").
      const filePath = path;

      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(filePath, file, {
          contentType: options?.contentType || file.type,
          upsert: options?.upsert ?? true,
          metadata: options?.metadata
        });

      if (error) {
        throw new AppError(
          ErrorCode.INTERNAL_ERROR,
          `Failed to upload file: ${error.message}`,
          error
        );
      }

      const { data: { publicUrl } } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: publicUrl
      };
    } catch (error) {
      console.error('SupabaseStorageProvider.uploadFile failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Download a file from Supabase Storage
   */
  async downloadFile(path: string): Promise<{
      success: boolean;
      data?: Blob;
      error?: string;
    }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .download(path);

      if (error) {
        throw new AppError(
          ErrorCode.INTERNAL_ERROR,
          `Failed to download file: ${error.message}`,
          error
        );
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('SupabaseStorageProvider.downloadFile failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(path: string): Promise<{
      success: boolean;
      error?: string;
    }> {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([path]);

      if (error) {
        throw new AppError(
          ErrorCode.INTERNAL_ERROR,
          `Failed to delete file: ${error.message}`,
          error
        );
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('SupabaseStorageProvider.deleteFile failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get public URL for a file
   */
  async getPublicUrl(path: string): Promise<{
      success: boolean;
      url?: string;
      error?: string;
    }> {
    try {
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(path);

      return {
        success: true,
        url: publicUrl
      };
    } catch (error) {
      console.error('SupabaseStorageProvider.getPublicUrl failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(prefix?: string): Promise<{
      success: boolean;
      files?: Array<{
        name: string;
        size: number;
        created_at: string;
        updated_at: string;
      }>;
      error?: string;
    }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .list(prefix || '', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw new AppError(
          ErrorCode.INTERNAL_ERROR,
          `Failed to list files: ${error.message}`,
          error
        );
      }

      return {
        success: true,
        files: data.map(file => ({
          name: file.name,
          size: (file.metadata?.size as number | undefined) || 0,
          created_at: file.created_at || '',
          updated_at: file.updated_at || ''
        }))
      };
    } catch (error) {
      console.error('SupabaseStorageProvider.listFiles failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const folder = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
      const fileName = path.includes('/') ? path.slice(path.lastIndexOf('/') + 1) : path;
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .list(folder, { search: fileName });

      return !error && !!data?.some(f => f.name === fileName);
    } catch (error) {
      return false;
    }
  }
}
