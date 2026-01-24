/**
 * Audit Entries Hook - Hexagonal Architecture
 * Uses InspectionService for audit data retrieval
 * Legacy interface maintained for backward compatibility
 */

import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { InspectionService } from '@/application/services/InspectionService';

export type AuditEntry = {
  id: string;
  date: string;
  status: string;
  comments: string | null;
  created_at: string;
};

const fetchAuditEntries = async (
  phaseId?: string | null, 
  projectId?: string | null
): Promise<AuditEntry[]> => {
  if (!phaseId && !projectId) return [];

  try {
    const inspectionRepository = RepositoryFactory.getInspectionRepository();
    const inspectionService = new InspectionService(inspectionRepository);
    
    let inspections: any[] = [];
    
    if (projectId) {
      // Get inspections for project
      inspections = await inspectionService.getInspectionsByProject(projectId);
    } else {
      // Get all inspections and filter by phase
      inspections = await inspectionService.getAllInspections();
    }
    
    // Filter by phase if provided
    if (phaseId) {
      inspections = inspections.filter((i: any) => i.phaseId === phaseId || i.phase_id === phaseId);
    }
    
    // Transform to AuditEntry format and limit to 10
    return inspections
      .slice(0, 10)
      .map((inspection: any) => ({
        id: inspection.id,
        date: inspection.date || inspection.createdAt || '',
        status: inspection.status || '',
        comments: inspection.comments || null,
        created_at: inspection.createdAt || inspection.created_at || ''
      }));
  } catch (error) {
    console.error('Error fetching audit entries:', error);
    return [];
  }
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
