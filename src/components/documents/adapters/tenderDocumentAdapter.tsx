/**
 * Tender Document Adapter
 * Fuses tender-level documents (btp.tender_documents), lot documents
 * (btp.tender_lot_documents) and workflow-step documents into a single
 * DocumentItem stream for the generic DocumentHub.
 */
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { btpClient } from '@/integrations/supabase/schema-clients';
import { supabase as rootSupabase } from '@/integrations/supabase/client';
import { useTenderLots } from '@/hooks/hexagonal/useTenderLotsHex';
import {
  useTenderLotDocuments,
  useCreateTenderLotDocument,
  useDeleteTenderLotDocument,
  useUploadTenderLotFile,
} from '@/hooks/hexagonal/useTenderLotDocumentsHex';
import {
  DocumentHubContract,
  DocumentItem,
  DocumentFacetDef,
  UploadInput,
} from '../hub/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TENDER_CATEGORY_LABELS: Record<string, string> = {
  administrative: 'Administratif',
  technical: 'Technique',
  financial: 'Financier',
};

function normalizeCategory(cat: string | null | undefined): string | null {
  if (!cat) return null;
  const c = String(cat).toLowerCase().trim();
  if (c.startsWith('admin')) return 'administrative';
  if (c.startsWith('tech')) return 'technical';
  if (c.startsWith('fin')) return 'financial';
  if (['administrative', 'technical', 'financial'].includes(c)) return c;
  return c;
}

export function useTenderDocumentAdapter(tenderId: string, projectId?: string): DocumentHubContract {
  const qc = useQueryClient();
  const { data: lots = [] } = useTenderLots(tenderId);
  const { data: lotDocs = [] } = useTenderLotDocuments(tenderId);

  const createLotDoc = useCreateTenderLotDocument(tenderId);
  const uploadLotFile = useUploadTenderLotFile();
  const deleteLotDoc = useDeleteTenderLotDocument(tenderId);

  const lotOptions = useMemo(
    () =>
      (lots as any[]).map((l) => ({
        id: l.id as string,
        number: (l.number ?? 1) as number,
        title: (l.title ?? '') as string,
        label: `Lot ${l.number ?? 1}${l.title ? ` — ${l.title}` : ''}`,
      })),
    [lots]
  );

  // Tender-level documents (btp.tender_documents joined w/ documents)
  const tenderDocsQuery = useQuery({
    queryKey: ['tender-docs-adapter', tenderId],
    enabled: !!tenderId,
    queryFn: async () => {
      const { data, error } = await btpClient
        .from('tender_documents' as any)
        .select(
          `*, document:documents(id, title, description, file_url, file_name, mime_type, file_size)`
        )
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false });
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('[tenderDocumentAdapter] tender_documents fetch failed:', error);
        return [] as any[];
      }
      return (data ?? []) as any[];
    },
  });

  const items: DocumentItem[] = useMemo(() => {
    const out: DocumentItem[] = [];

    // Lot documents
    for (const d of lotDocs as any[]) {
      const lot = d.lotId ? lotOptions.find((l) => l.id === d.lotId) : null;
      const lotLabel = d.lotId ? (lot ? lot.label : 'Lot') : 'Communs à tous les lots';
      out.push({
        id: `lot-${d.id}`,
        title: d.title || d.fileName || 'Document',
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        mimeType: d.mimeType,
        fileSize: d.fileSize,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        category: normalizeCategory(d.category),
        status: null,
        facets: {
          lot: lotLabel,
          scope: d.lotId ? 'Lot' : 'Communs',
        },
        raw: { source: 'lot', record: d },
      });
    }

    // Tender-level documents
    for (const t of tenderDocsQuery.data ?? []) {
      const doc = t.document ?? {};
      out.push({
        id: `tender-${t.id}`,
        title: doc.title || t.subcategory || 'Document',
        fileName: doc.file_name ?? null,
        fileUrl: doc.file_url ?? null,
        mimeType: doc.mime_type ?? null,
        fileSize: doc.file_size ?? null,
        createdAt: t.created_at,
        updatedAt: t.updated_at ?? t.created_at,
        category: normalizeCategory(t.category),
        status: t.status ?? null,
        facets: {
          lot: 'Global appel d\'offres',
          scope: 'Global',
        },
        raw: { source: 'tender', record: t },
      });
    }

    return out;
  }, [lotDocs, lotOptions, tenderDocsQuery.data]);

  const facets: DocumentFacetDef[] = useMemo(
    () => [
      {
        key: 'scope',
        label: 'Portée',
        options: [
          { value: 'Global', label: 'Global' },
          { value: 'Communs', label: 'Communs aux lots' },
          { value: 'Lot', label: 'Par lot' },
        ],
      },
      {
        key: 'lot',
        label: 'Lot',
        options: [
          { value: 'Global appel d\'offres', label: 'Global' },
          { value: 'Communs à tous les lots', label: 'Communs' },
          ...lotOptions.map((l) => ({ value: l.label, label: l.label })),
        ],
      },
    ],
    [lotOptions]
  );

  const useDocumentsHook = () => ({
    data: items,
    isLoading: tenderDocsQuery.isLoading,
    refetch: () => {
      tenderDocsQuery.refetch();
      qc.invalidateQueries({ queryKey: ['tender-lot-documents', tenderId] });
    },
  });

  const onUpload = async (input: UploadInput) => {
    const scope = (input.extras?.scope as string) ?? 'lot';
    const lotId = (input.extras?.lotId as string | null) ?? null;

    // Upload file to storage first (reuse lot bucket path for all tender docs)
    const { publicUrl } = await uploadLotFile.mutateAsync({ tenderId, file: input.file });

    if (scope === 'tender') {
      // Insert into documents + tender_documents
      const { data: doc, error: docErr } = await btpClient
        .from('documents' as any)
        .insert({
          title: input.title,
          description: input.description ?? null,
          file_url: publicUrl,
          file_name: input.file.name,
          mime_type: input.file.type,
          file_size: input.file.size,
          document_type: 'tender',
        })
        .select()
        .single();
      if (docErr) throw docErr;
      const { data: userData } = await rootSupabase.auth.getUser();
      const { error: tdErr } = await btpClient.from('tender_documents' as any).insert({
        document_id: (doc as any).id,
        tender_id: tenderId,
        project_id: projectId ?? null,
        category: input.category ?? 'administrative',
        subcategory: 'other',
        is_required: false,
        is_submitted: true,
        submission_date: new Date().toISOString(),
        status: 'pending',
        uploaded_by: userData.user?.id ?? null,
      } as any);
      if (tdErr) throw tdErr;
      qc.invalidateQueries({ queryKey: ['tender-docs-adapter', tenderId] });
    } else {
      // scope === 'common' or 'lot'
      await createLotDoc.mutateAsync({
        tenderId,
        lotId: scope === 'lot' ? lotId : null,
        lotIds: scope === 'lot' && lotId ? [lotId] : [],
        title: input.title,
        description: input.description ?? null,
        category: input.category ?? null,
        fileUrl: publicUrl,
        fileName: input.file.name,
        fileSize: input.file.size,
        mimeType: input.file.type,
      });
    }
  };

  const onDelete = async (item: DocumentItem) => {
    const raw = item.raw as { source: 'lot' | 'tender'; record: any } | undefined;
    if (!raw) return;
    if (raw.source === 'lot') {
      await deleteLotDoc.mutateAsync(raw.record.id);
    } else {
      const { error } = await btpClient
        .from('tender_documents' as any)
        .delete()
        .eq('id', raw.record.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['tender-docs-adapter', tenderId] });
    }
  };

  return {
    scopeLabel: 'Documents de l\'appel d\'offres',
    useDocuments: useDocumentsHook,
    facets,
    categoryLabels: TENDER_CATEGORY_LABELS,
    canUpload: true,
    onUpload,
    onDelete,
    uploadCategoryOptions: [
      { value: 'administrative', label: 'Administratif' },
      { value: 'technical', label: 'Technique' },
      { value: 'financial', label: 'Financier' },
    ],
    renderExtraUploadFields: ({ extras, setExtra }) => {
      const scope = (extras.scope as string) ?? 'lot';
      const lotId = (extras.lotId as string) ?? (lotOptions[0]?.id ?? '');
      return (
        <>
          <div className="space-y-2">
            <Label>Portée</Label>
            <Select value={scope} onValueChange={(v) => setExtra('scope', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tender">Global appel d'offres</SelectItem>
                <SelectItem value="common">Commun à tous les lots</SelectItem>
                <SelectItem value="lot" disabled={lotOptions.length === 0}>
                  Lot spécifique
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {scope === 'lot' && lotOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Lot</Label>
              <Select value={lotId} onValueChange={(v) => setExtra('lotId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un lot" />
                </SelectTrigger>
                <SelectContent>
                  {lotOptions.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      );
    },
  };
}
