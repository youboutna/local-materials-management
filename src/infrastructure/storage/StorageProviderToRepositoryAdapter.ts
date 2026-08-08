/**
 * Storage compatibility adapter
 * Bridges the provider-oriented IStorageProvider port (file-first API)
 * to the legacy bucket-oriented IStorageRepository port used by services.
 */

import { IStorageProvider } from '@/domain/interfaces/IStorageProvider';
import {
  IStorageRepository,
  StorageFile,
  UploadResult,
} from '@/domain/repositories/IStorageRepository';

const joinPath = (bucket: string, path: string) => path;

export class StorageProviderToRepositoryAdapter implements IStorageRepository {
  constructor(private readonly provider: IStorageProvider) {}

  async uploadFile(
    bucket: string,
    path: string,
    file: File
  ): Promise<{ result: UploadResult | null; error: Error | null }> {
    const res = await this.provider.uploadFile(file, joinPath(bucket, path), { upsert: true });
    if (!res.success) {
      return { result: null, error: new Error(res.error || 'Upload failed') };
    }
    return {
      result: {
        path,
        publicUrl: res.url || '',
        size: file.size,
        content_type: file.type,
      },
      error: null,
    };
  }

  getPublicUrl(bucket: string, path: string): string {
    // Provider exposes an async API; services expect a sync string.
    // Supabase-compatible public URL resolution is delegated lazily.
    const anyProvider = this.provider as unknown as {
      getPublicUrlSync?: (path: string) => string;
    };
    if (typeof anyProvider.getPublicUrlSync === 'function') {
      return anyProvider.getPublicUrlSync(joinPath(bucket, path));
    }
    return joinPath(bucket, path);
  }

  async deleteFile(bucket: string, path: string): Promise<{ error: Error | null }> {
    const res = await this.provider.deleteFile(joinPath(bucket, path));
    return { error: res.success ? null : new Error(res.error || 'Delete failed') };
  }

  async listFiles(
    bucket: string,
    prefix?: string
  ): Promise<{ files: StorageFile[]; error: Error | null }> {
    const res = await this.provider.listFiles(prefix);
    if (!res.success) {
      return { files: [], error: new Error(res.error || 'List failed') };
    }
    const files: StorageFile[] = (res.files || []).map((f) => ({
      id: f.name,
      name: f.name,
      path: prefix ? `${prefix}/${f.name}` : f.name,
      bucket,
      size: f.size,
      created_at: f.created_at,
      updated_at: f.updated_at,
    }));
    return { files, error: null };
  }

  async downloadFile(
    bucket: string,
    path: string
  ): Promise<{ data: Blob | null; error: Error | null }> {
    const res = await this.provider.downloadFile(joinPath(bucket, path));
    if (!res.success || !res.data) {
      return { data: null, error: new Error(res.error || 'Download failed') };
    }
    return { data: res.data, error: null };
  }

  async fileExists(
    bucket: string,
    path: string
  ): Promise<{ exists: boolean; error: Error | null }> {
    try {
      const exists = await this.provider.fileExists(joinPath(bucket, path));
      return { exists, error: null };
    } catch (e) {
      return { exists: false, error: e as Error };
    }
  }
}
