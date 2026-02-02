/**
 * Hexagonal hook for Inspections List
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatusType } from '@/components/StatusBadge';
import type { Json } from '@supabase/supabase-js'

export interface InspectionData {
  id: string;
  date: string;
  status: StatusType;
  inspector: string;
  progress_at_inspection: number;
  comments?: string | null;
  documents?: { name: string; url: string }[];
}

interface InspectionRow {
  id: string
  date: string
  status: string
  inspector: string
  progress_at_inspection: number
  comments?: string | null
  documents?: Json
  project_id: string
}

export function useInspectionsListHex(projectId: string) {
  return useQuery({
    queryKey: ['inspections-list', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: InspectionRow) => ({
        id: item.id,
        date: item.date,
        status: item.status as StatusType,
        inspector: item.inspector,
        progress_at_inspection: item.progress_at_inspection,
        comments: item.comments,
        documents: item.documents && typeof item.documents === 'string' 
          ? (JSON.parse(item.documents) as { name: string; url: string }[]) 
          : item.documents
      })) as InspectionData[];
    },
    enabled: !!projectId
  });
}
