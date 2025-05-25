
export type StorageProvider = 'supabase' | 'ftp' | 'local' | 's3' | 'azure' | 'gcs';

export interface StorageConfig {
  provider: StorageProvider;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  bucket?: string;
  region?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  basePath?: string;
}

// Default configuration - can be overridden
let activeStorageConfig: StorageConfig = {
  provider: 'supabase',
  bucket: 'documents'
};

export const setStorageConfig = (config: StorageConfig): void => {
  activeStorageConfig = config;
  console.log(`Storage provider set to: ${config.provider}`);
};

export const getStorageConfig = (): StorageConfig => {
  return { ...activeStorageConfig };
};

export const isSupabaseStorage = (): boolean => {
  return activeStorageConfig.provider === 'supabase';
};

export const isFTPStorage = (): boolean => {
  return activeStorageConfig.provider === 'ftp';
};

export const isLocalStorage = (): boolean => {
  return activeStorageConfig.provider === 'local';
};
