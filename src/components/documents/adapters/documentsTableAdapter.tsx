/**
 * Generic adapter that maps the public `documents` table into the DocumentHub contract.
 * Reused by project/phase/inspection/supplier/material specializations.
 */
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentsTableAdapterOptions } from '@/dtos/entities/DocumentDTO';
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

function normalizeStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

export function useDocumentsTableAdapterHex(opts: DocumentsTableAdapterOptions): DocumentHubContract {
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

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let q: any = supabase.from('documents').select('*');
      for (const f of filters) {
        if (f.column === 'metadata_material_id') {
          q = q.contains('metadata', { material_id: f.value });
        } else {
          q = q.eq(f.column, f.value);
        }
      }
      q = q.order('created_at', { ascending: false }).limit(500);
      const { data, error } = await q;
      if (error) {
        console.warn('[documentsTableAdapter] fetch failed', error);
        return [] as any[];
      }
      return (data ?? []) as any[];
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
    const { error: insErr } = await supabase.from('documents').insert(insertPayload as any);
    if (insErr) throw insErr;
    qc.invalidateQueries({ queryKey });
  };

  const onDelete = async (item: DocumentItem) => {
    const { error } = await supabase.from('documents').delete().eq('id', item.id);
    if (error) throw error;
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