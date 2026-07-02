
import { StorageProvider, UploadResult, DownloadResult, DeleteResult } from './StorageProvider';
import { getStorageConfig } from '@/config/storage';

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor() {
    const config = getStorageConfig();
    this.basePath = config.basePath || '/uploads';
  }

  async upload(file: File, path?: string): Promise<UploadResult> {
    try {
      // For browser-based local storage simulation
      // In a real implementation, this would need a backend API
      const fileName = path || `${Date.now()}_${file.name}`;
      const fileUrl = `${this.basePath}/${fileName}`;
      
      // Store file info in localStorage for simulation
      const fileData = {
        name: fileName,
        size: file.size,
        type: file.type,
        url: fileUrl,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`file_${fileName}`, JSON.stringify(fileData));
      
      return {
        success: true,
        url: fileUrl,
        fileName: file.name,
        size: file.size
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Local upload failed' 
      };
    }
  }

  async download(url: string, fileName: string): Promise<DownloadResult> {
    try {
      // For local storage simulation
      const fileKey = url.split('/').pop();
      const fileData = localStorage.getItem(`file_${fileKey}`);
      
      if (!fileData) {
        return { success: false, error: 'File not found in local storage' };
      }
      
      // Create a dummy blob for simulation
      const blob = new Blob(['Local file content simulation'], { type: 'text/plain' });
      return { success: true, blob };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Local download failed' 
      };
    }
  }

  async delete(url: string): Promise<DeleteResult> {
    try {
      const fileKey = url.split('/').pop();
      localStorage.removeItem(`file_${fileKey}`);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Local delete failed' 
      };
    }
  }

  getPublicUrl(path: string): string {
    return `${this.basePath}/${path}`;
  }

  async validateConnection(): Promise<boolean> {
    try {
      // Test localStorage availability
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  }
}
