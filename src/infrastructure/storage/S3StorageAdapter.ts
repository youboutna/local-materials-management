/**
 * S3StorageAdapter
 * Implements IStorageProvider against an S3-compatible endpoint (MinIO, AWS S3, R2…).
 *
 * NOTE: For production usage, signed URLs / SigV4 must be produced by a backend
 * (edge function or lightweight service) — the browser cannot safely hold static
 * S3 credentials. This adapter therefore delegates the signing step to a
 * configurable signer function.
 */
import { IStorageProvider } from '@/domain/interfaces/IStorageProvider';

export interface S3AdapterOptions {
  endpoint: string; // e.g. https://s3.eu-west-3.amazonaws.com or MinIO URL
  bucket: string;
  region?: string;
  publicBaseUrl?: string; // optional CDN / bucket-website URL
  /**
   * Returns a pre-signed URL (PUT for upload, GET for download) obtained from the backend.
   * Required for real S3/MinIO deployments.
   */
  sign?: (op: 'PUT' | 'GET' | 'DELETE', path: string) => Promise<string>;
}

export class S3StorageAdapter implements IStorageProvider {
  constructor(private opts: S3AdapterOptions) {}

  private publicUrl(path: string) {
    const base =
      this.opts.publicBaseUrl ??
      `${this.opts.endpoint.replace(/\/$/, '')}/${this.opts.bucket}`;
    return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }

  async uploadFile(file: File, path: string, options?: { contentType?: string }) {
    try {
      if (!this.opts.sign) {
        return { success: false, error: 'S3 signer not configured' };
      }
      const url = await this.opts.sign('PUT', path);
      const res = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': options?.contentType ?? file.type },
      });
      if (!res.ok) throw new Error(`upload failed: ${res.status}`);
      return { success: true, url: this.publicUrl(path) };
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'upload failed' };
    }
  }

  async downloadFile(path: string) {
    try {
      const url = this.opts.sign ? await this.opts.sign('GET', path) : this.publicUrl(path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`download failed: ${res.status}`);
      return { success: true, data: await res.blob() };
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'download failed' };
    }
  }

  async deleteFile(path: string) {
    try {
      if (!this.opts.sign) return { success: false, error: 'S3 signer not configured' };
      const url = await this.opts.sign('DELETE', path);
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error(`delete failed: ${res.status}`);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'delete failed' };
    }
  }

  async getPublicUrl(path: string) {
    return { success: true, url: this.publicUrl(path) };
  }

  async listFiles(_prefix?: string) {
    // Listing requires signed backend endpoint; return empty in browser.
    return { success: true, files: [] };
  }

  async fileExists(path: string) {
    try {
      const res = await fetch(this.publicUrl(path), { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }
}
