
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  size?: number;
}

export interface DownloadResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface StorageProvider {
  upload(file: File, path?: string): Promise<UploadResult>;
  download(url: string, fileName: string): Promise<DownloadResult>;
  delete(url: string): Promise<DeleteResult>;
  getPublicUrl(path: string): string;
  validateConnection(): Promise<boolean>;
}
