/**
 * LocalStorageAdapter
 * Implements IStorageProvider using browser localStorage + Object URLs.
 * DEV_MODE only — not for production.
 */
import { IStorageProvider } from '@/domain/interfaces/IStorageProvider';

const BUCKET_KEY = 'dev_storage_bucket';

interface StoredFile {
  path: string;
  name: string;
  size: number;
  contentType: string;
  dataUrl: string;
  metadata?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

function loadAll(): Record<string, StoredFile> {
  try {
    return JSON.parse(localStorage.getItem(BUCKET_KEY) ?? '{}');
  } catch {
    return {};
  }
}
function saveAll(v: Record<string, StoredFile>) {
  try {
    localStorage.setItem(BUCKET_KEY, JSON.stringify(v));
  } catch (e) {
    console.warn('[LocalStorageAdapter] quota exceeded', e);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });
}

export class LocalStorageAdapter implements IStorageProvider {
  async uploadFile(
    file: File,
    path: string,
    options?: { contentType?: string; metadata?: Record<string, string>; upsert?: boolean }
  ) {
    try {
      const all = loadAll();
      if (all[path] && !options?.upsert) {
        return { success: false, error: 'File already exists' };
      }
      const dataUrl = await fileToDataUrl(file);
      const now = new Date().toISOString();
      all[path] = {
        path,
        name: file.name,
        size: file.size,
        contentType: options?.contentType ?? file.type,
        dataUrl,
        metadata: options?.metadata,
        created_at: all[path]?.created_at ?? now,
        updated_at: now,
      };
      saveAll(all);
      return { success: true, url: `local://${path}` };
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'upload failed' };
    }
  }

  async downloadFile(path: string) {
    const f = loadAll()[path];
    if (!f) return { success: false, error: 'not found' };
    const res = await fetch(f.dataUrl);
    return { success: true, data: await res.blob() };
  }

  async deleteFile(path: string) {
    const all = loadAll();
    delete all[path];
    saveAll(all);
    return { success: true };
  }

  async getPublicUrl(path: string) {
    const f = loadAll()[path];
    if (!f) return { success: false, error: 'not found' };
    return { success: true, url: f.dataUrl };
  }

  async listFiles(prefix = '') {
    const files = Object.values(loadAll())
      .filter((f) => f.path.startsWith(prefix))
      .map((f) => ({
        name: f.name,
        size: f.size,
        created_at: f.created_at,
        updated_at: f.updated_at,
      }));
    return { success: true, files };
  }

  async fileExists(path: string) {
    return !!loadAll()[path];
  }
}
