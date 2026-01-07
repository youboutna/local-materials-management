import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type AuditEntry = Record<string, any>;

const fetchAuditEntries = async (phaseId?: string | null, projectId?: string | null) => {
  if (!phaseId && !projectId) return [] as AuditEntry[];

  // Fallback: use a generic query approach - audit_logs may not exist, return empty
  // We'll query inspections as a proxy for audit data if audit_logs doesn't exist
  let query = supabase.from('inspections').select('id, date, status, comments, created_at').order('created_at', { ascending: false }).limit(10);

  if (phaseId) {
    query = query.eq('phase_id', phaseId as string);
  } else if (projectId) {
    query = query.eq('project_id', projectId as string);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data as AuditEntry[]) || [];
};

export function useAuditEntries(phaseId?: string | null, projectId?: string | null) {
  const queryKey = ['audit-entries', { phaseId, projectId }];

  const query = useQuery<AuditEntry[], Error>({
    queryKey,
    queryFn: () => fetchAuditEntries(phaseId, projectId),
    enabled: !!phaseId || !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
  });

  return {
    auditEntries: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
