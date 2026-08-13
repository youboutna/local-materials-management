/**
 * Universal Document Viewer — contrat unique pour TOUS les modules
 * (projets, organisations, matériaux, appels d'offres, DQE, factures, parseur/uploader…)
 *
 * Le viewer accepte n'importe quelle forme d'entrée (DocumentDTO camelCase,
 * ligne DB snake_case, DocumentItem du Hub, ou fichier local non encore persisté)
 * et la normalise en `ViewableDocument`.
 */

export type ViewerSourceKind = 'remote' | 'local';

export interface ViewableDocument {
  id: string | null;
  title: string;
  fileName: string | null;
  fileUrl: string | null;
  /** Fichier local (aperçu avant upload / avant mise à jour) */
  file?: File | Blob | null;
  mimeType: string | null;
  fileSize: number | null;
  status: string | null;
  documentType: string | null;
  category: string | null;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** Contexte métier libre affiché en badges (projet, lot, fournisseur…) */
  context?: Record<string, string | null | undefined>;
  source: ViewerSourceKind;
}

export interface DocumentViewerOptions {
  /** Masque l'URL réelle du stockage (blob:) — activé par défaut */
  proxy?: boolean;
  /** Autorise le changement de statut depuis la visionneuse */
  allowStatusChange?: boolean;
  /** Callback appelé après changement de statut réussi */
  onStatusChanged?: (id: string, status: string) => void;
  /** Override de la persistance du statut (modules non hexagonaux) */
  onStatusChange?: (id: string, status: string) => Promise<void> | void;
  onDelete?: (doc: ViewableDocument) => void;
  /** Résolution personnalisée du contenu (stockage privé, signed URL, etc.) */
  resolveBlobUrl?: (doc: ViewableDocument) => Promise<string | null>;
}

const pick = (o: Record<string, any>, ...keys: string[]) => {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
};

const toIso = (v: any): string | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

function guessMime(name?: string | null): string | null {
  if (!name) return null;
  const ext = name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', csv: 'text/csv',
    txt: 'text/plain', json: 'application/json', xml: 'application/xml',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    mp4: 'video/mp4', mp3: 'audio/mpeg',
  };
  return ext ? map[ext] ?? null : null;
}

/** Normalise toute entrée (DTO, ligne DB, DocumentItem, File) en ViewableDocument */
export function normalizeViewable(
  input: any,
  extra?: Partial<ViewableDocument>
): ViewableDocument {
  if (input instanceof File) {
    return {
      id: null,
      title: extra?.title ?? input.name,
      fileName: input.name,
      fileUrl: null,
      file: input,
      mimeType: input.type || guessMime(input.name),
      fileSize: input.size,
      status: extra?.status ?? null,
      documentType: extra?.documentType ?? null,
      category: extra?.category ?? null,
      description: extra?.description ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      context: extra?.context,
      source: 'local',
    };
  }

  const o = (input ?? {}) as Record<string, any>;
  const fileName = pick(o, 'fileName', 'file_name', 'name');
  return {
    id: pick(o, 'id', 'documentId', 'document_id'),
    title: pick(o, 'title', 'name', 'documentName', 'document_name') ?? fileName ?? 'Document',
    fileName,
    fileUrl: pick(o, 'fileUrl', 'file_url', 'url', 'publicUrl', 'public_url'),
    file: o.file ?? null,
    mimeType: pick(o, 'mimeType', 'mime_type', 'contentType', 'content_type') ?? guessMime(fileName),
    fileSize: pick(o, 'fileSize', 'file_size', 'size'),
    status: pick(o, 'status', 'documentStatus', 'document_status'),
    documentType: pick(o, 'documentType', 'document_type', 'type'),
    category: pick(o, 'category', 'documentCategory', 'document_category'),
    description: pick(o, 'description', 'notes'),
    createdAt: toIso(pick(o, 'createdAt', 'created_at', 'uploadedAt', 'uploaded_at')),
    updatedAt: toIso(pick(o, 'updatedAt', 'updated_at')),
    context: extra?.context ?? o.facets ?? undefined,
    source: 'remote',
    ...extra,
  };
}

/** Statuts métier proposés dans la visionneuse */
export const VIEWER_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'pending_review', label: 'En attente de revue' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'rejected', label: 'Rejeté' },
  { value: 'archived', label: 'Archivé' },
];

export function viewerStatusLabel(status?: string | null): string {
  return VIEWER_STATUS_OPTIONS.find((s) => s.value === status)?.label ?? (status || 'Brouillon');
}
