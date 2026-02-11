/**
 * Storage Factory - Hexagonal Architecture
 * Factory for creating storage providers with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { SupabaseStorageProvider } from '@/infrastructure/storage/SupabaseStorageProvider';
import { LocalStorageProvider } from '@/infrastructure/storage/LocalStorageProvider';
import { getStorageConfig } from '@/config/storage';
import { IStorageProvider } from '@/domain/interfaces/IStorageProvider';
/**
 * Factory class for creating storage providers
 * Following hexagonal architecture principles
 */
export class StorageFactory {
  /**
   * Create storage provider based on configuration
   */
  static createProvider(): IStorageProvider {
    try {
      const config = getStorageConfig();
      
      switch (config.provider) {
        case 'supabase':
          return new SupabaseStorageProvider();
        case 'local':
          return new LocalStorageProvider();
        case 's3':
          throw new AppError(
            ErrorCode.NOT_IMPLEMENTED,
            'S3 storage provider not yet implemented'
          );
        case 'azure':
          throw new AppError(
            ErrorCode.NOT_IMPLEMENTED,
            'Azure storage provider not yet implemented'
          );
        case 'gcs':
          throw new AppError(
            ErrorCode.NOT_IMPLEMENTED,
            'Google Cloud Storage provider not yet implemented'
          );
        default:
          console.warn(`Unknown storage provider: ${config.provider}, falling back to supabase`);
          return new SupabaseStorageProvider();
      }
    } catch (error) {
      console.error('Error creating storage provider:', error);
      // Fallback to supabase provider
      return new SupabaseStorageProvider();
    }
  }

  /**
   * Get available storage providers
   */
  static getAvailableProviders(): string[] {
    return ['supabase', 'local', 's3', 'azure', 'gcs'];
  }

  /**
   * Validate storage provider configuration
   */
  static validateProviderConfig(provider: string): { isValid: boolean; error?: string } {
    const availableProviders = this.getAvailableProviders();
    
    if (!availableProviders.includes(provider)) {
      return {
        isValid: false,
        error: `Invalid storage provider: ${provider}. Available providers: ${availableProviders.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Test storage provider connectivity
   */
  static async testProviderConnectivity(provider: string): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = this.validateProviderConfig(provider);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Create a temporary provider instance for testing
      const testProvider = this.createProvider();
      
      // Test basic connectivity (implementation depends on provider)
      if (provider === 'supabase') {
        // Test Supabase connectivity
        const testResult = await testProvider.listFiles('test');
        return { success: !testResult.error };
      } else if (provider === 'local') {
        // Test local storage connectivity
        const testResult = await testProvider.listFiles('test');
        return { success: !testResult.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error testing storage provider connectivity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get provider capabilities
   */
  static getProviderCapabilities(provider: string): {
    supportsStreaming: boolean;
    supportsResumableUpload: boolean;
    maxFileSize: number;
    supportedFormats: string[];
  } {
    const capabilities: Record<string, any> = {
      supabase: {
        supportsStreaming: true,
        supportsResumableUpload: false,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip']
      },
      local: {
        supportsStreaming: false,
        supportsResumableUpload: false,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip']
      },
      s3: {
        supportsStreaming: true,
        supportsResumableUpload: true,
        maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
        supportedFormats: ['*'] // All formats
      },
      azure: {
        supportsStreaming: true,
        supportsResumableUpload: true,
        maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB
        supportedFormats: ['*'] // All formats
      },
      gcs: {
        supportsStreaming: true,
        supportsResumableUpload: true,
        maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
        supportedFormats: ['*'] // All formats
      }
    };

    return capabilities[provider] || capabilities.supabase;
  }
}

// Export singleton instance for backward compatibility
export const storageFactory = StorageFactory;
