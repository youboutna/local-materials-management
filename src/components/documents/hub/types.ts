/**
 * DocumentHub — Contract types shared by all domain adapters.
 * Canonical types moved to `@/dtos/entities/DocumentHubDTO`; re-exported here for compatibility.
 */

export type {
  DocumentItem,
  DocumentFacetOption,
  DocumentFacetDef,
  UploadInput,
  DocumentHubContract,
  PreviewKind,
} from '@/dtos/entities/DocumentHubDTO';

export function getPreviewKind(mime: string | null | undefined): PreviewKind {
  if (!mime) return 'unknown';
  const m = mime.toLowerCase();
  if (m === 'application/pdf') return 'pdf';
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (m.startsWith('text/') || m === 'application/json' || m === 'application/xml') return 'text';
  if (
    m.includes('spreadsheet') ||
    m.includes('excel') ||
    m.includes('word') ||
    m.includes('presentation') ||
    m.includes('powerpoint') ||
    m.includes('officedocument')
  )
    return 'office';
  return 'unknown';
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}
