/**
 * Generic adapter that maps the public `documents` table into the DocumentHub contract.
 * Reused by project/phase/inspection/supplier/material specializations.
 */
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import {
  DocumentFacetDef,
  DocumentFacetOption,
  DocumentHubContract,
  DocumentItem,
  UploadInput,
} from '../hub/types';

export type DocumentsTableFilter =
  | { column: 'project_id'; value: string }
  | { column: 'phase_id'; value: string }
  | { column: 'inspection_id'; value: string }
  | { column: 'supplier_id'; value: string }
  | { column: 'document_type'; value: string }
  | { column: 'metadata_material_id'; value: string };

export interface DocumentsTableAdapterOptions {
  scopeLabel: string;
  queryKey: unknown[];
  filters: DocumentsTableFilter[];
  /** Bucket name used when uploading through this adapter (defaults to 'documents'). */
  bucket?: string;
  /** File path prefix inside the bucket. */
  pathPrefix?: string;
  /** Categories offered in the upload dialog. */
  uploadCategoryOptions?: DocumentFacetOption[];
  /** Facets shown in the sidebar. */
  facets?: DocumentFacetDef[];
  categoryLabels?: Record<string, string>;
  /** Extra columns merged into every INSERT (e.g. project_id: xxx). */
  insertDefaults?: Record<string, unknown>;
  /** Optional secondary facet extractor to enrich each item (e.g. lot, phase name). */
  itemFacetBuilder?: (row: any) => Record<string, string | null>;
  /** Preview strategy — 'proxy' hides the underlying storage URL. */
  previewMode?: 'direct' | 'proxy';
}

function normalizeStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

export function useDocumentsTableAdapter(opts: DocumentsTableAdapterOptions): DocumentHubContract {
  const qc = useQueryClient();
  const {
    scopeLabel,
    queryKey,
    filters,
    bucket = 'documents',
    pathPrefix,
    uploadCategoryOptions,
    facets = [],
    categoryLabels,
    insertDefaults = {},
    itemFacetBuilder,
    previewMode = 'proxy',
  } = opts;

  const documentRepository = useMemo(() => RepositoryFactory.getDocumentRepository(), []);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const mappedFilters = filters.map((f) =>
        f.column === 'metadata_material_id'
          ? { column: 'material_id', value: f.value, op: 'contains' as const }
          : { column: f.column, value: f.value, op: 'eq' as const }
      );
      return await documentRepository.findRawByFilters(mappedFilters);
    },
  });

  const items: DocumentItem[] = useMemo(() => {
    return (query.data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title ?? row.file_name ?? 'Document',
      fileName: row.file_name ?? null,
      fileUrl: row.file_url ?? null,
      mimeType: row.mime_type ?? null,
      fileSize: row.file_size ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? row.created_at,
      category: normalizeStr(row.document_type),
      status: normalizeStr(row.status),
      facets: itemFacetBuilder ? itemFacetBuilder(row) : {},
      raw: row,
    }));
  }, [query.data, itemFacetBuilder]);

  const useDocuments = () => ({
    data: items,
    isLoading: query.isLoading,
    refetch: () => query.refetch(),
  });

  const onUpload = async (input: UploadInput) => {
    // 1. Upload file to Storage
    const safeName = input.file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${pathPrefix ?? scopeLabel.toLowerCase().replace(/\s+/g, '-')}/${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, input.file, {
      cacheControl: '3600',
      upsert: false,
      contentType: input.file.type,
    });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);

    // 2. Insert document row
    const filterDefaults: Record<string, unknown> = {};
    for (const f of filters) {
      if (f.column !== 'metadata_material_id') filterDefaults[f.column] = f.value;
    }
    const { data: userData } = await supabase.auth.getUser();

    const insertPayload: Record<string, unknown> = {
      title: input.title,
      description: input.description ?? null,
      file_url: pub.publicUrl,
      file_name: input.file.name,
      mime_type: input.file.type,
      file_size: input.file.size,
      document_type: input.category ?? 'other',
      uploaded_by: userData.user?.id ?? null,
      ...filterDefaults,
      ...insertDefaults,
      ...(input.extras ?? {}),
    };
    await documentRepository.insertRaw(insertPayload);
    qc.invalidateQueries({ queryKey });
  };

  const onDelete = async (item: DocumentItem) => {
    await documentRepository.delete(item.id);
    qc.invalidateQueries({ queryKey });
  };

  return {
    scopeLabel,
    useDocuments,
    facets,
    categoryLabels,
    canUpload: true,
    onUpload,
    onDelete,
    uploadCategoryOptions,
    previewMode,
  };
}
