/**
 * Hexagonal hook for inspection monitoring operations
 * Uses services instead of direct supabase calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { AuthService } from '@/application/services/AuthService';
import { InspectionService } from '@/application/services/InspectionService';
import { StorageService } from '@/application/services/StorageService';
import { toast } from '@/hooks/use-toast';

export interface MonitoringInspection {
  id: string;
  project_id: string;
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: number;
  comments?: string | null;
  created_at: string;
  updated_at: string;
  phase_id?: string | null;
  documents?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size?: number;
  }[];
}

export interface MonitoringProject {
  id: string;
  title: string;
  project_reference?: string | null;
}

interface ScheduleInspectionData {
  projectId: string;
  inspectorId: string;
  date: string;
  additionalData?: {
    target_progress?: number;
    requirements?: string;
  };
}

interface UpdateInspectionStatusData {
  inspectionId: string;
  status: string;
  progress?: number;
  documents?: File[];
}

export function useInspectionMonitoringHex(options?: {
  filterByInspector?: boolean;
  inspectorName?: string;
}) {
  const queryClient = useQueryClient();
  const inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());

  // Fetch inspections - map domain Inspection -> flat MonitoringInspection (camelCase strings)
  const inspectionsQuery = useQuery({
    queryKey: ['inspection-monitoring', options?.inspectorName],
    queryFn: async (): Promise<MonitoringInspection[]> => {
      const data = await inspectionService.getAllInspections();
      const list = (data || []).map((i: any): MonitoringInspection => {
        const insp = i.inspector;
        const inspectorName = typeof insp === 'string'
          ? insp
          : (insp?.name || insp?.id || '');
        const dateRaw = i.date instanceof Date ? i.date.toISOString() : (i.date || '');
        return {
          id: i.id,
          project_id: i.projectId || i.project_id || '',
          inspector: inspectorName,
          date: dateRaw,
          status: typeof i.status === 'string' ? i.status : String(i.status ?? 'pending'),
          progress_at_inspection: i.progressAtInspection ?? i.progress_at_inspection ?? 0,
          comments: i.comments ?? null,
          created_at: i.createdAt || i.created_at || '',
          updated_at: i.updatedAt || i.updated_at || '',
          phase_id: i.phaseId ?? i.phase_id ?? null,
          documents: Array.isArray(i.documents) ? i.documents : [],
        };
      });
      if (options?.filterByInspector && options?.inspectorName) {
        const needle = options.inspectorName.toLowerCase();
        return list.filter(x => x.inspector.toLowerCase().includes(needle));
      }
      return list;
    }
  });

  // Fetch projects placeholder
  const projectsQuery = useQuery({
    queryKey: ['monitoring-projects'],
    queryFn: async (): Promise<MonitoringProject[]> => {
      return [];
    }
  });

  // Get current user info
  const userQuery = useQuery({
    queryKey: ['current-user-inspector'],
    queryFn: async () => {
      const authService = new AuthService(RepositoryFactory.getAuthRepository());
      const user = await authService.getCurrentUser();
      if (!user) return null;
      return { type: 'user', name: user.full_name || user.email || '' };
    }
  });

  // Update inspection mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MonitoringInspection> }) => {
      await inspectionService.updateInspection(id, data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-monitoring'] });
      toast({ title: 'Succès', description: 'Inspection mise à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Schedule inspection mutation
  const scheduleMutation = useMutation({
    mutationFn: async (data: ScheduleInspectionData) => {
      const created = await inspectionService.createInspection({
        projectId: data.projectId,
        inspector: data.inspectorId,
        date: data.date,
        status: 'scheduled' as any,
        progressAtInspection: data.additionalData?.target_progress || 0,
        comments: data.additionalData?.requirements || undefined,
      });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-monitoring'] });
      toast({ title: 'Succès', description: 'Inspection programmée' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Update status with documents upload
  const updateStatusMutation = useMutation({
    mutationFn: async ({ inspectionId, status, progress }: UpdateInspectionStatusData) => {
      await inspectionService.updateInspection(inspectionId, {
        status,
        progressAtInspection: progress,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-monitoring'] });
      toast({ title: 'Succès', description: 'Statut mis à jour' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Send notification mutation (placeholder)
  const sendNotificationMutation = useMutation({
    mutationFn: async (_params: {
      recipientId: string;
      title: string;
      message: string;
      type: string;
      relatedId: string;
      metadata?: Record<string, unknown>;
    }) => {
      // Placeholder - would use NotificationService
    }
  });

  // Helpers
  const getProjectTitle = (projectId: string) => {
    return projectsQuery.data?.find(p => p.id === projectId)?.title || projectId;
  };

  return {
    inspections: inspectionsQuery.data || [],
    projects: projectsQuery.data || [],
    currentUser: userQuery.data,
    isLoading: inspectionsQuery.isLoading || projectsQuery.isLoading,
    error: inspectionsQuery.error,
    
    updateInspection: updateMutation.mutate,
    scheduleInspection: scheduleMutation.mutate,
    updateInspectionStatus: updateStatusMutation.mutate,
    sendNotification: sendNotificationMutation.mutate,
    
    isUpdating: updateMutation.isPending,
    isScheduling: scheduleMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    
    getProjectTitle,
    refetch: () => {
      inspectionsQuery.refetch();
      projectsQuery.refetch();
    }
  };
}
