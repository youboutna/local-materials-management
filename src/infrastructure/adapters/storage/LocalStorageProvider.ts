/**
 * Local Storage Provider - Infrastructure Layer
 * Handles file storage operations using browser localStorage
 * Following hexagonal architecture principles
 */

import { IStorageProvider } from '@/domain/interfaces/IStorageProvider';
import { AppError, ErrorCode } from '@/utils/errorHandling';
/**
 * LocalStorage implementation of storage provider
 * Note: This is a simplified implementation for demo purposes
 * In production, you would use a proper file system or cloud storage
 */
export class LocalStorageProvider implements IStorageProvider {
  private storageKey: string;

  constructor(storageKey: string = 'app_storage') {
    this.storageKey = storageKey;
  }

  /**
   * Upload a file to localStorage (base64 encoded)
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
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      const filePath = `${this.storageKey}/${path}`;
      
      // Store in localStorage
      const storageData = this.getStorageData();
      storageData[filePath] = {
        name: file.name,
        size: file.size,
        type: file.type,
        contentType: options?.contentType || file.type,
        base64,
        metadata: options?.metadata || {},
        uploadedAt: new Date().toISOString()
      };
      
      this.setStorageData(storageData);

      return {
        success: true,
        url: `local://${filePath}`
      };
    } catch (error) {
      console.error('LocalStorageProvider.uploadFile failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Download a file from localStorage
   */
  async downloadFile(path: string): Promise<{
      success: boolean;
      data?: Blob;
      error?: string;
    }> {
    try {
      const filePath = `${this.storageKey}/${path}`;
      const storageData = this.getStorageData();
      const fileData = storageData[filePath];

      if (!fileData) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      // Convert base64 back to Blob
      const base64Data = fileData.base64.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileData.contentType });

      return {
        success: true,
        data: blob
      };
    } catch (error) {
      console.error('LocalStorageProvider.downloadFile failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a file from localStorage
   */
  async deleteFile(path: string): Promise<{
      success: boolean;
      error?: string;
    }> {
    try {
      const filePath = `${this.storageKey}/${path}`;
      const storageData = this.getStorageData();
      
      if (!storageData[filePath]) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      delete storageData[filePath];
      this.setStorageData(storageData);

      return {
        success: true
      };
    } catch (error) {
      console.error('LocalStorageProvider.deleteFile failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get public URL for a file (localStorage doesn't have public URLs)
   */
  async getPublicUrl(path: string): Promise<{
      success: boolean;
      url?: string;
      error?: string;
    }> {
    try {
      const filePath = `${this.storageKey}/${path}`;
      const storageData = this.getStorageData();
      
      if (!storageData[filePath]) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      return {
        success: true,
        url: `local://${filePath}`
      };
    } catch (error) {
      console.error('LocalStorageProvider.getPublicUrl failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List files in localStorage
   */
  async listFiles(prefix?: string): Promise<{
      success: boolean;
      files?: Array<{
        name: string;
        size: number;
        created_at: string;
        updated_at: string;
      }>;
      error?: string;
    }> {
    try {
      const storageData = this.getStorageData();
      const files = Object.keys(storageData)
        .filter(key => key.startsWith(`${this.storageKey}/`))
        .filter(key => !prefix || key.startsWith(`${this.storageKey}/${prefix}`))
        .map(key => {
          const file = storageData[key];
          return {
            name: file.name,
            size: file.size,
            created_at: file.uploadedAt,
            updated_at: file.uploadedAt
          };
        });

      return {
        success: true,
        files
      };
    } catch (error) {
      console.error('LocalStorageProvider.listFiles failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a file exists in localStorage
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const filePath = `${this.storageKey}/${path}`;
      const storageData = this.getStorageData();
      return !!storageData[filePath];
    } catch (error) {
      return false;
    }
  }

  /**
   * Helper method to convert file to base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Get storage data from localStorage
   */
  private getStorageData(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Set storage data in localStorage
   */
  private setStorageData(data: Record<string, any>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to set storage data:', error);
    }
  }
}
