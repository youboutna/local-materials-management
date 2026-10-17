/** Converts stored file references to bucket-relative storage requests. */
export class StorageReferenceTransformer {
  static toStorageRequest(reference: string, defaultBucket = 'documents'): { bucket: string; path: string } | null {
    if (/^local:\/\//i.test(reference)) {
      return { bucket: defaultBucket, path: reference.slice('local://'.length) };
    }
    if (/^(blob:|data:)/i.test(reference)) return null;
    if (/^https?:\/\//i.test(reference)) {
      const url = new URL(reference);
      const match = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)/.exec(url.pathname);
      if (!match) return null;
      return { bucket: decodeURIComponent(match[1]), path: decodeURIComponent(match[2]) };
    }
    const path = reference.replace(/^\/+/, '');
    return { bucket: defaultBucket, path };
  }
}