import type { UploadResult, DownloadResult, DeleteResult } from '@/domain/interfaces/StorageResults';
export type { UploadResult, DownloadResult, DeleteResult };

export interface StorageProvider {
  upload(file: File, path?: string): Promise<UploadResult>;
  download(url: string, fileName: string): Promise<DownloadResult>;
  delete(url: string): Promise<DeleteResult>;
  getPublicUrl(path: string): string;
  validateConnection(): Promise<boolean>;
}
