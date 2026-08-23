import { useQuery } from '@tanstack/react-query';

export function useTenderLevelDocumentsHex(tenderId: string) {
  return useQuery({
    queryKey: ['tender-docs-adapter', tenderId],
    enabled: !!tenderId,
    queryFn: async () => {
      const { btpClient } = await import('@/integrations/supabase/schema-clients');
      const { data, error } = await btpClient
        .from('tender_documents' as any)
        .select(
          `*, document:documents(id, title, description, file_url, file_name, mime_type, file_size)`
        )
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false });
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('[useTenderLevelDocumentsHex] tender_documents fetch failed:', error);
        return [] as any[];
      }
      return (data ?? []) as any[];
    },
  });
}

export async function createTenderLevelDocumentHex(params: {
  tenderId: string;
  projectId?: string;
  title: string;
  description?: string | null;
  publicUrl: string;
  file: File;
  category?: string;
}) {
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  const { supabase: rootSupabase } = await import('@/integrations/supabase/client');

  const { data: doc, error: docErr } = await btpClient
    .from('documents' as any)
    .insert({
      title: params.title,
      description: params.description ?? null,
      file_url: params.publicUrl,
      file_name: params.file.name,
      mime_type: params.file.type,
      file_size: params.file.size,
      document_type: 'tender',
    })
    .select()
    .single();
  if (docErr) throw docErr;

  const { data: userData } = await rootSupabase.auth.getUser();
  const { error: tdErr } = await btpClient.from('tender_documents' as any).insert({
    document_id: (doc as any).id,
    tender_id: params.tenderId,
    project_id: params.projectId ?? null,
    category: params.category ?? 'administrative',
    subcategory: 'other',
    is_required: false,
    is_submitted: true,
    submission_date: new Date().toISOString(),
    status: 'pending',
    uploaded_by: userData.user?.id ?? null,
  } as any);
  if (tdErr) throw tdErr;
}

export async function deleteTenderLevelDocumentHex(id: string) {
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  const { error } = await btpClient
    .from('tender_documents' as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
