/**
 * SignedUrlStorageAdapter — IStorageProvider for S3 / MinIO / GCS / Azure / FTP.
 *
 * The browser never holds provider credentials: every operation asks the
 * server-side `storage-signer` function for a short-lived signed URL
 * (S3/MinIO/GCS/Azure) or proxies the transfer (FTP).
 */
import type { IStorageProvider } from '@/domain/interfaces/IStorageProvider';

export type SignedStorageKind = 's3' | 'minio' | 'gcs' | 'azure' | 'ftp';

export interface StorageSignerGateway {
  invokeFunction<T = unknown>(name: string, body: Record<string, unknown>): Promise<{ data: T | null; error: { message: string } | null }>;
}

interface SignResponse { url: string; method: string; headers?: Record<string, string> }
interface ListResponse { files: { name: string; size: number; updatedAt: string }[] }

const FUNCTION = 'storage-signer';
const errorMessage = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export class SignedUrlStorageAdapter implements IStorageProvider {
  constructor(
    private readonly provider: SignedStorageKind,
    private readonly gateway: StorageSignerGateway,
    private readonly defaultBucket?: string,
    private readonly fetchImpl: typeof fetch = (...args) => fetch(...args),
  ) {}

  private async call<T>(body: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.gateway.invokeFunction<T>(FUNCTION, { provider: this.provider, bucket: this.defaultBucket, ...body });
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Empty storage signer response');
    const failure = (data as { error?: string }).error;
    if (failure) throw new Error(failure);
    return data;
  }

  private async sign(op: 'PUT' | 'GET' | 'DELETE', path: string, bucket?: string) {
    return this.call<SignResponse>({ op, path, ...(bucket ? { bucket } : {}) });
  }

  async uploadFile(file: File, path: string, options?: { contentType?: string }) {
    try {
      if (this.provider === 'ftp') {
        await this.call({ op: 'FTP_UPLOAD', path, data: await toBase64(file) });
        return { success: true, url: path };
      }
      const signed = await this.sign('PUT', path);
      const res = await this.fetchImpl(signed.url, {
        method: 'PUT', body: file,
        headers: { 'Content-Type': options?.contentType ?? (file.type || 'application/octet-stream'), ...(signed.headers ?? {}) },
      });
      if (!res.ok) throw new Error(`Upload failed [${res.status}]: ${await res.text()}`);
      // Keep the original object key: callers persist keys, never generated URLs.
      return { success: true, url: path };
    } catch (e) {
      return { success: false, error: errorMessage(e, 'Upload failed') };
    }
  }

  async downloadFile(path: string, bucket?: string) {
    try {
      if (this.provider === 'ftp') {
        const { data } = await this.call<{ data: string }>({ op: 'FTP_DOWNLOAD', path });
        const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
        return { success: true, data: new Blob([bytes]) };
      }
      const signed = await this.sign('GET', path, bucket);
      const res = await this.fetchImpl(signed.url);
      if (!res.ok) throw new Error(`Download failed [${res.status}]`);
      return { success: true, data: await res.blob() };
    } catch (e) {
      return { success: false, error: errorMessage(e, 'Download failed') };
    }
  }

  async deleteFile(path: string, bucket?: string) {
    try {
      if (this.provider === 'ftp') {
        await this.call({ op: 'DELETE', path });
        return { success: true };
      }
      const signed = await this.sign('DELETE', path, bucket);
      const res = await this.fetchImpl(signed.url, { method: 'DELETE', headers: signed.headers });
      if (!res.ok && res.status !== 404) throw new Error(`Delete failed [${res.status}]`);
      return { success: true };
    } catch (e) {
      return { success: false, error: errorMessage(e, 'Delete failed') };
    }
  }

  /** Private providers: a time-limited read URL replaces a public URL. */
  async getPublicUrl(path: string, bucket?: string) {
    try {
      if (this.provider === 'ftp') return { success: false, error: 'FTP files have no browser URL; download them instead' };
      const signed = await this.sign('GET', path, bucket);
      return { success: true, url: signed.url };
    } catch (e) {
      return { success: false, error: errorMessage(e, 'URL signing failed') };
    }
  }

  async listFiles(prefix?: string, bucket?: string) {
    try {
      const { files } = await this.call<ListResponse>({ op: 'LIST', prefix, ...(bucket ? { bucket } : {}) });
      return { success: true, files: files.map((f) => ({ name: f.name, size: f.size, createdAt: f.updatedAt, updatedAt: f.updatedAt })) };
    } catch (e) {
      return { success: false, error: errorMessage(e, 'Listing failed') };
    }
  }

  async fileExists(path: string) {
    const res = await this.listFiles(path);
    return !!res.files?.some((f) => f.name === path || path.endsWith(`/${f.name}`));
  }
}
