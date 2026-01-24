/**
 * Hexagonal hook for inspection monitoring operations
 * Replaces direct supabase calls in RoleBasedInspectionMonitoring.tsx
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
  documents?: any;
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
  const authService = new AuthService(RepositoryFactory.getAuthRepository());
  const inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());
  const storageService = new StorageService(RepositoryFactory.getStorageRepository());

  // Fetch inspections with optional filtering
  const inspectionsQuery = useQuery({
    queryKey: ['inspection-monitoring', options?.inspectorName],
    queryFn: async () => {
      const data = await inspectionService.getInspections(options?.inspectorName);
      return data as MonitoringInspection[];
    }
  });

  // Fetch projects for reference
  const projectsQuery = useQuery({
    queryKey: ['monitoring-projects'],
    queryFn: async () => {
      // This would need a ProjectService - for now using direct call as placeholder
      const data = await inspectionService.getProjects();
      return data as MonitoringProject[];
    }
  });

  // Get current user info for filtering
  const userQuery = useQuery({
    queryKey: ['current-user-inspector'],
    queryFn: async () => {
      const user = await authService.getCurrentUser();
      if (!user) return null;

      // Try employees
      const employee = await inspectionService.getEmployeeByUserId(user.id);
      if (employee) return { type: 'employee', name: employee.full_name };

      // Try suppliers
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('name, contact_person')
        .eq('user_id', user.id)
        .maybeSingle();

      if (supplier) return { type: 'supplier', name: supplier.contact_person || supplier.name };

      return null;
    }
  });

  // Update inspection mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MonitoringInspection> }) => {
      const { error } = await supabase
        .from('inspections')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-monitoring'] });
      toast({ title: 'Succès', description: 'Inspection mise à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Schedule inspection mutation
  const scheduleMutation = useMutation({
    mutationFn: async (data: ScheduleInspectionData) => {
      // Get inspector name
      let inspectorName = '';
      
      const { data: employee } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', data.inspectorId)
        .maybeSingle();

      if (employee) {
        inspectorName = employee.full_name;
      } else {
        const { data: supplier } = await supabase
          .from('suppliers')
          .select('name, contact_person')
          .eq('id', data.inspectorId)
          .maybeSingle();
        
        if (supplier) {
          inspectorName = supplier.contact_person || supplier.name;
        }
      }

      if (!inspectorName) throw new Error('Inspecteur non trouvé');

      const { data: inspection, error } = await supabase
        .from('inspections')
        .insert({
          project_id: data.projectId,
          inspector: inspectorName,
          date: data.date,
          status: 'scheduled',
          progress_at_inspection: data.additionalData?.target_progress || 0,
          comments: data.additionalData?.requirements || null
        })
        .select()
        .single();

      if (error) throw error;
      return inspection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-monitoring'] });
      toast({ title: 'Succès', description: 'Inspection programmée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Update status with documents upload
  const updateStatusMutation = useMutation({
    mutationFn: async ({ inspectionId, status, progress, documents }: UpdateInspectionStatusData) => {
      const inspection = inspectionsQuery.data?.find(i => i.id === inspectionId);
      if (!inspection) throw new Error('Inspection non trouvée');

      const updateData: any = { status };
      if (progress !== undefined) {
        updateData.progress_at_inspection = progress;
      }

      // Upload documents if any
      if (documents && documents.length > 0) {
        const uploadedDocs = await Promise.all(
          documents.map(async (file) => {
            const fileName = `${Date.now()}-${file.name}`;
            const filePath = `inspections/${inspection.project_id}/${fileName}`;

            const storageService = new StorageService();
            const { error: uploadError } = await storageService.uploadFile('documents', filePath, file);

            if (uploadError) throw uploadError;

            const publicUrl = storageService.getPublicUrl('documents', filePath);

            return { name: file.name, url: publicUrl, uploadedAt: new Date().toISOString() };
          })
        );

        updateData.documents = {
          ...(inspection.documents || {}),
          validation_documents: uploadedDocs
        };
      }

      const { error } = await supabase
        .from('inspections')
        .update(updateData)
        .eq('id', inspectionId);

      if (error) throw error;

      // Sync project progress if approved
      if (status === 'approved') {
        const { getInspectionApprovalSyncService } = await import('@/services/InspectionApprovalSyncService');
        const syncService = getInspectionApprovalSyncService();
        await syncService.synchronizeOnApproval({
          inspectionId,
          projectId: inspection.project_id,
          phaseId: inspection.phase_id,
          status,
          progressAtInspection: progress ?? inspection.progress_at_inspection,
          inspector: inspection.inspector,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-monitoring'] });
      toast({ title: 'Succès', description: 'Statut mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async ({ recipientId, title, message, type, relatedId, metadata }: {
      recipientId: string;
      title: string;
      message: string;
      type: string;
      relatedId: string;
      metadata?: any;
    }) => {
      const { error } = await supabase
        .from('notifications')
        .insert({ recipient_id: recipientId, title, message, type, related_id: relatedId, metadata });
      if (error) throw error;
    }
  });

  // Helpers
  const getProjectTitle = (projectId: string) => {
    return projectsQuery.data?.find(p => p.id === projectId)?.title || projectId;
  };

  return {
    // Data
    inspections: inspectionsQuery.data || [],
    projects: projectsQuery.data || [],
    currentUserInfo: userQuery.data,
    
    // Loading states
    isLoading: inspectionsQuery.isLoading || projectsQuery.isLoading,
    
    // Methods
    updateInspection: updateMutation.mutateAsync,
    scheduleInspection: scheduleMutation.mutateAsync,
    updateInspectionStatus: updateStatusMutation.mutateAsync,
    sendNotification: sendNotificationMutation.mutateAsync,
    refetch: () => {
      inspectionsQuery.refetch();
      projectsQuery.refetch();
    },
    
    // Helpers
    getProjectTitle,
    
    // Mutation states
    isUpdating: updateMutation.isPending,
    isScheduling: scheduleMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending
  };
}
