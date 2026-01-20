/**
 * Supabase Storage Adapter
 * Implements IStorageRepository for Supabase storage
 * Following hexagonal architecture principles
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  IStorageRepository, 
  StorageFile, 
  UploadResult 
} from '@/domain/repositories/IStorageRepository';

export class SupabaseStorageAdapter implements IStorageRepository {
  /**
   * Upload file to storage
   */
  async uploadFile(bucket: string, path: string, file: File): Promise<{ result: UploadResult | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);

      if (error) {
        return { result: null, error };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      const result: UploadResult = {
        path: data.path,
        publicUrl,
        size: file.size,
        content_type: file.type
      };

      return { result, error: null };
    } catch (error) {
      return { result: null, error: error as Error };
    }
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, path: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * List files in bucket with optional prefix
   */
  async listFiles(bucket: string, prefix?: string): Promise<{ files: StorageFile[]; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(prefix);

      if (error) {
        return { files: [], error };
      }

      const files: StorageFile[] = data.map(file => ({
        id: file.id,
        name: file.name,
        path: `${prefix || ''}${file.name}`,
        bucket,
        size: file.metadata?.size || 0,
        content_type: file.metadata?.mimetype,
        created_at: file.created_at,
        updated_at: file.updated_at
      }));

      return { files, error: null };
    } catch (error) {
      return { files: [], error: error as Error };
    }
  }

  /**
   * Download file
   */
  async downloadFile(bucket: string, path: string): Promise<{ data: Blob | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(bucket: string, path: string): Promise<{ exists: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop() || ''
        });

      if (error) {
        return { exists: false, error };
      }

      const exists = data.some(file => file.name === path.split('/').pop());
      return { exists, error: null };
    } catch (error) {
      return { exists: false, error: error as Error };
    }
  }
}
