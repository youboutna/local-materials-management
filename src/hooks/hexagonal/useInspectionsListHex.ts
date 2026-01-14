/**
 * Hexagonal hook for Inspections List
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatusType } from '@/components/StatusBadge';

export interface InspectionData {
  id: string;
  date: string;
  status: StatusType;
  inspector: string;
  progress_at_inspection: number;
  comments?: string | null;
  documents?: { name: string; url: string }[];
}

export function useInspectionsListHex(projectId: string) {
  return useQuery({
    queryKey: ['inspections-list', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId as any)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        status: item.status as StatusType,
        inspector: item.inspector,
        progress_at_inspection: item.progress_at_inspection,
        comments: item.comments,
        documents: item.documents as { name: string; url: string }[] | undefined
      })) as InspectionData[];
    },
    enabled: !!projectId
  });
}
