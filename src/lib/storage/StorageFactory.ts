/**
 * Storage Factory for different storage providers
 */

import { getAppConfig, StorageProvider } from '@/config/app';

export interface StorageResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  size?: number;
}

export interface StorageService {
  upload(file: File, path?: string): Promise<StorageResult>;
  download(url: string, fileName: string): Promise<{ success: boolean; blob?: Blob; error?: string }>;
  delete(url: string): Promise<{ success: boolean; error?: string }>;
  getPublicUrl(path: string): string;
  validateConnection(): Promise<boolean>;
}

// Supabase Storage Service
class SupabaseStorageService implements StorageService {
  private supabase: any;
  private bucket: string;

  constructor() {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      this.supabase = supabase;
    });
    this.bucket = getAppConfig().storage.bucket || 'documents';
  }

  async upload(file: File, path?: string): Promise<StorageResult> {
    const filePath = path || `${Date.now()}-${file.name}`;
    
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, file);

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: { publicUrl } } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      fileName: file.name,
      size: file.size,
    };
  }

  async download(url: string, fileName: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return { success: true, blob };
    } catch (error) {
      return { success: false, error: 'Download failed' };
    }
  }

  async delete(url: string) {
    // Extract path from URL
    const path = url.split('/').pop();
    if (!path) return { success: false, error: 'Invalid URL' };

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([path]);

    return { success: !error, error: error?.message };
  }

  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage.listBuckets();
      return !error;
    } catch {
      return false;
    }
  }
}

// MinIO Storage Service
class MinIOStorageService implements StorageService {
  private endpoint: string;
  private bucket: string;

  constructor() {
    const config = getAppConfig();
    this.endpoint = config.storage.endpoint || 'http://localhost:9000';
    this.bucket = config.storage.bucket || 'documents';
  }

  async upload(file: File, path?: string): Promise<StorageResult> {
    // Implement MinIO upload logic
    return { success: false, error: 'MinIO upload not implemented' };
  }

  async download(url: string, fileName: string) {
    return { success: false, error: 'MinIO download not implemented' };
  }

  async delete(url: string) {
    return { success: false, error: 'MinIO delete not implemented' };
  }

  getPublicUrl(path: string): string {
    return `${this.endpoint}/${this.bucket}/${path}`;
  }

  async validateConnection(): Promise<boolean> {
    return false;
  }
}

// S3 Storage Service
class S3StorageService implements StorageService {
  async upload(file: File, path?: string): Promise<StorageResult> {
    return { success: false, error: 'S3 upload not implemented' };
  }

  async download(url: string, fileName: string) {
    return { success: false, error: 'S3 download not implemented' };
  }

  async delete(url: string) {
    return { success: false, error: 'S3 delete not implemented' };
  }

  getPublicUrl(path: string): string {
    return path;
  }

  async validateConnection(): Promise<boolean> {
    return false;
  }
}

// Storage Factory
export class StorageFactory {
  static createStorageService(): StorageService {
    const config = getAppConfig();
    
    switch (config.storage.provider) {
      case 'supabase':
        return new SupabaseStorageService();
      case 'minio':
        return new MinIOStorageService();
      case 's3':
        return new S3StorageService();
      case 'azure':
      case 'gcs':
      case 'ftp':
      case 'local':
      default:
        return new SupabaseStorageService(); // Fallback
    }
  }
}

// Export singleton
export const storageService = StorageFactory.createStorageService();