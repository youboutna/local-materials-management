
import { supabase } from '@/integrations/supabase/client';
import { StorageProvider, UploadResult, DownloadResult, DeleteResult } from './StorageProvider';
import { getStorageConfig } from '@/config/storage';

export class SupabaseStorageProvider implements StorageProvider {
  private bucket: string;

  constructor() {
    const config = getStorageConfig();
    this.bucket = config.bucket || 'documents';
  }

  async upload(file: File, path?: string): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop();
      const baseName = file.name.replace(`.${fileExt}`, '');
      const uniqueId = crypto.randomUUID();
      const fileName = path || `${baseName}-${uniqueId}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(fileName, file, {
          upsert: false // Prevent overwriting existing files
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: urlData } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(fileName);

      return {
        success: true,
        url: urlData.publicUrl,
        fileName: file.name,
        size: file.size
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  async download(url: string, fileName: string): Promise<DownloadResult> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, error: 'Download failed' };
      }
      
      const blob = await response.blob();
      return { success: true, blob };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Download failed' 
      };
    }
  }

  async delete(url: string): Promise<DeleteResult> {
    try {
      // Extract path from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([fileName]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      };
    }
  }

  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      return !error && data.some(bucket => bucket.name === this.bucket);
    } catch {
      return false;
    }
  }
}
