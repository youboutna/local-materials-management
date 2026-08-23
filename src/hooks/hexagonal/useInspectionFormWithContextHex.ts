export async function createInspectionWithContextHex(params: {
  projectId: string;
  date: string;
  status: string;
  inspectorName: string;
  progress: number;
  comments: string | null;
  phaseId: string | null;
}) {
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  const { data: inspection, error } = await btpClient.from('inspections')
    .insert({
      project_id: params.projectId,
      date: params.date,
      status: params.status,
      inspector: params.inspectorName,
      progress_at_inspection: params.progress,
      comments: params.comments,
      phase_id: params.phaseId,
    })
    .select()
    .single();

  if (error) throw error;
  return inspection;
}
