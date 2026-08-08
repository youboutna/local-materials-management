import type React from 'react';

/**
 * DocumentHub DTOs — Contract types shared by all domain adapters.
 * Canonical home for hub document types (moved out of src/components/documents/hub/types.ts).
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
  facets: Record<string, string | null>;
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
  multi?: boolean;
};

export type UploadInput = {
  file: File;
  title: string;
  description?: string;
  category?: string | null;
  extras?: Record<string, unknown>;
};

export type DocumentHubContract = {
  scopeLabel: string;
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
  renderExtraUploadFields?: (ctx: {
    extras: Record<string, unknown>;
    setExtra: (key: string, value: unknown) => void;
  }) => React.ReactNode;
  uploadCategoryOptions?: DocumentFacetOption[];
  previewMode?: 'direct' | 'proxy';
  resolveBlobUrl?: (item: DocumentItem) => Promise<string | null>;
};

export type PreviewKind = 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'office' | 'unknown';
