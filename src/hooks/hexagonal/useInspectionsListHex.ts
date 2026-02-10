/**
 * Hexagonal hook for Inspections List
 * Uses InspectionService instead of direct Supabase access
 */

import { useQuery } from '@tanstack/react-query';
import { InspectionService } from '@/application/services/InspectionService';
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
      const inspections = await InspectionService.getInspectionsByProject(projectId);
      
      return inspections.map((item) => ({
        id: item.id,
        date: item.date,
        status: (item.status || 'pending') as StatusType,
        inspector: item.inspector,
        progress_at_inspection: item.progressAtInspection ?? 0,
        comments: item.comments ?? null,
        documents: item.documents ?? [],
      })) as InspectionData[];
    },
    enabled: !!projectId
  });
}
