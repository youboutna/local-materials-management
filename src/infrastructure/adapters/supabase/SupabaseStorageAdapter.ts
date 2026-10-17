/**
 * src/infrastructure/supabase/adapters/SupabaseStorageAdapter.ts
 * Supabase Storage Adapter
 * Implements IStorageProvider for Supabase storage
 * Following hexagonal architecture principles
 */

import { IStorageProvider } from '@/domain/interfaces/IStorageProvider';
import { StorageReferenceTransformer } from '@/dtos/transforms/StorageReferenceTransformer';

export class SupabaseStorageAdapter implements IStorageProvider {
  private defaultBucket: string = 'documents';

  /**
   * Upload file to storage
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
      const { supabase } = await import('@/integrations/supabase/client');
      const bucket = options?.metadata?.bucket || this.defaultBucket;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          contentType: options?.contentType || file.type,
          upsert: options?.upsert || false,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return {
        success: true,
        url: publicUrlData.publicUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Download a file from storage
   */
  async downloadFile(path: string, bucket = this.defaultBucket): Promise<{
    success: boolean;
    data?: Blob;
    error?: string;
  }> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const reference = StorageReferenceTransformer.toStorageRequest(path, bucket);
      if (!reference) throw new Error('Invalid storage reference');
      const { data, error } = await supabase.storage
        .from(reference.bucket)
        .download(reference.path);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(path: string, bucket = this.defaultBucket): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const reference = StorageReferenceTransformer.toStorageRequest(path, bucket);
      if (!reference) throw new Error('Invalid storage reference');
      const { error } = await supabase.storage
        .from(reference.bucket)
        .remove([reference.path]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  /**
   * Get public URL for a file
   */
  async getPublicUrl(path: string, bucket = this.defaultBucket): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const reference = StorageReferenceTransformer.toStorageRequest(path, bucket);
      if (!reference) throw new Error('Invalid storage reference');
      const { data } = supabase.storage
        .from(reference.bucket)
        .getPublicUrl(reference.path);

      return { success: true, url: data.publicUrl };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get public URL',
      };
    }
  }

  /**
   * List files in storage
   */
  async listFiles(prefix?: string, bucket = this.defaultBucket): Promise<{
    success: boolean;
    files?: Array<{
      name: string;
      size: number;
      createdAt: string;
      updatedAt: string;
    }>;
    error?: string;
  }> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(prefix);

      if (error) {
        return { success: false, error: error.message };
      }

      const files = data.map((file) => ({
        name: file.name,
        size: file.metadata?.size || 0,
        createdAt: file.created_at || new Date().toISOString(),
        updatedAt: file.updated_at || new Date().toISOString(),
      }));

      return { success: true, files };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files',
      };
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(path: string, bucket = this.defaultBucket): Promise<boolean> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const reference = StorageReferenceTransformer.toStorageRequest(path, bucket);
      if (!reference) return false;
      const pathParts = reference.path.split('/');
      const fileName = pathParts.pop() || '';
      const prefix = pathParts.join('/');

      const { data, error } = await supabase.storage
        .from(reference.bucket)
        .list(prefix, {
          search: fileName,
        });

      if (error) {
        return false;
      }

      return data.some((file) => file.name === fileName);
    } catch {
      return false;
    }
  }

  /**
   * Set default bucket
   */
  setDefaultBucket(bucket: string): void {
    this.defaultBucket = bucket;
  }

  /**
   * Upload with custom bucket (convenience method)
   */
  async uploadToBucket(
    bucket: string,
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
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          contentType: options?.contentType || file.type,
          upsert: options?.upsert || false,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return {
        success: true,
        url: publicUrlData.publicUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }
}