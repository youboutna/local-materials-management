
import { StorageProvider } from './StorageProvider';
import { SupabaseStorageProvider } from './SupabaseStorageProvider';
import { FTPStorageProvider } from './FTPStorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { getStorageConfig } from '@/config/storage';

export class StorageFactory {
  static createProvider(): StorageProvider {
    const config = getStorageConfig();
    
    switch (config.provider) {
      case 'supabase':
        return new SupabaseStorageProvider();
      case 'ftp':
        return new FTPStorageProvider();
      case 'local':
        return new LocalStorageProvider();
      case 's3':
        // Could add S3Provider here
        throw new Error('S3 storage provider not yet implemented');
      case 'azure':
        // Could add AzureProvider here
        throw new Error('Azure storage provider not yet implemented');
      case 'gcs':
        // Could add GCSProvider here
        throw new Error('Google Cloud Storage provider not yet implemented');
      default:
        return new SupabaseStorageProvider();
    }
  }
}
