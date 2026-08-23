export async function getProjectCreatedByHex(projectId: string): Promise<string | null> {
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  const { data } = await btpClient.from('projects')
    .select('created_by')
    .eq('id', projectId)
    .single();
  return data?.created_by ?? null;
}
