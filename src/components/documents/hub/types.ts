/**
 * DocumentHub — Contract types shared by all domain adapters.
 * Keeps the generic UI decoupled from Supabase / entity specifics.
 */

export type DocumentItem = {
  id: string;
  title: string;
  fileName: string | null;
  fileUrl: string | null;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
  category: string | null;
  status: string | null;
  /** Extra domain-specific labels displayed as badges / filterable. */
  facets: Record<string, string | null>;
  /** Untouched original record, in case actions need it. */
  raw?: unknown;
};

export type DocumentFacetOption = {
  value: string;
  label: string;
  count?: number;
};

export type DocumentFacetDef = {
  key: string;
  label: string;
  options: DocumentFacetOption[];
  /** true = multiple values may be selected. Defaults to false. */
  multi?: boolean;
};

export type UploadInput = {
  file: File;
  title: string;
  description?: string;
  category?: string | null;
  /** Domain-specific extras collected via extraUploadFields. */
  extras?: Record<string, unknown>;
};

export type DocumentHubContract = {
  /** Human label, e.g. "Documents de l'appel d'offres". */
  scopeLabel: string;
  /** Data hook — MUST be stable (defined once at module scope or memoized). */
  useDocuments: () => {
    data: DocumentItem[];
    isLoading: boolean;
    refetch: () => void;
  };
  facets: DocumentFacetDef[];
  categoryLabels?: Record<string, string>;
  canUpload: boolean;
  onUpload?: (input: UploadInput) => Promise<void>;
  onDelete?: (item: DocumentItem) => Promise<void>;
  onUpdate?: (item: DocumentItem, patch: Partial<DocumentItem>) => Promise<void>;
  /**
   * Render extra form fields inside the upload dialog.
   * `bind(key, value)` merges into UploadInput.extras.
   */
  renderExtraUploadFields?: (ctx: {
    extras: Record<string, unknown>;
    setExtra: (key: string, value: unknown) => void;
  }) => React.ReactNode;
  /** Categories that appear in upload dialog select. */
  uploadCategoryOptions?: DocumentFacetOption[];
  /**
   * Preview strategy:
   * - 'direct' (default) : the viewer opens fileUrl directly (fast, but exposes storage URL).
   * - 'proxy'            : the viewer fetches and streams the file through a blob: URL so the
   *                        underlying storage path is never in the DOM. Use this for private
   *                        disk/folder servers that must not leak.
   */
  previewMode?: 'direct' | 'proxy';
  /**
   * Optional custom resolver for `proxy` mode. Returns a blob URL (URL.createObjectURL) that
   * the viewer will revoke automatically. If omitted in proxy mode, the viewer uses fetch().
   */
  resolveBlobUrl?: (item: DocumentItem) => Promise<string | null>;
};

export type PreviewKind = 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'office' | 'unknown';

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
