// Generic settings are browser-readable configuration, never a secret store.
const PUBLIC_KEYS = new Set(['VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY']);
export const isSensitiveSetting = (key: string): boolean =>
  !PUBLIC_KEYS.has(key) && /secret|password|token|jwt|api.?key|access.?key|private.?key|client.?secret/i.test(key);

export function assertSafeSetting(key: string, value: unknown): void {
  if (isSensitiveSetting(key)) throw new Error('Private credentials must be configured in server secrets, not Settings');
  if (typeof value === 'string') {
    if (/^sb_secret_|^[a-z]+:\/\/[^/]*:[^/]*@/i.test(value)) throw new Error('Private credentials cannot be stored in Settings');
    const part = value.split('.')[1];
    if (part) {
      try {
        const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.role === 'service_role') throw new Error('Service-role keys belong in server secrets');
      } catch (error) {
        if (error instanceof Error && error.message === 'Service-role keys belong in server secrets') throw error;
      }
    }
  }
  if (value && typeof value === 'object') {
    for (const [nestedKey, nestedValue] of Object.entries(value)) assertSafeSetting(nestedKey, nestedValue);
  }
}
export function safeSettings<T extends { key: string; configuration?: unknown; value?: unknown }>(rows: T[]): T[] {
  return rows.filter((row) => {
    try { assertSafeSetting(row.key, row.configuration ?? row.value); return true; } catch { return false; }
  });
}