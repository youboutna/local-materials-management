import { StorageService, getStorageService} from '@/application/services/StorageService';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

export interface ProjectData {
  id: string;
  project_type?: string;
  funding_source?: string;
  [key: string]: any;
}

export interface Inspection {
  id: string;
  project_id: string;
  progress_at_inspection?: number;
  status: string;
  date?: string;
  [key: string]: any;
}

export interface InvoiceFormData {
  project_id: string;
  inspection_id?: string;
  progress_percentage: number;
  invoice_amount: number;
  work_description: string;
  quantities_executed?: any;
  lot_details?: any;
}

export interface WorkflowRequirements {
  requiresConsultant: boolean;
  requiresMinistry: boolean;
  requiresDonor: boolean;
}

export const useProgressInvoiceFormHex = (projectId?: string) => {
  const queryClient = useQueryClient();

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project-data', projectId],
    queryFn: async (): Promise<ProjectData | null> => {
      if (!projectId) return null;
      const projectRepo = RepositoryFactory.getProjectRepository();
      const data = await projectRepo.findById(projectId);
      return data as unknown as ProjectData;
    },
    enabled: !!projectId,
    retry: 3, retryDelay: 1000
  });

  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ['project-inspections', projectId],
    queryFn: async (): Promise<Inspection[]> => {
      if (!projectId) return [];
      const inspectionRepo = RepositoryFactory.getInspectionRepository();
      const data = await inspectionRepo.findByProjectId(projectId);
      return ((data || []) as any[]).filter((i: any) => i.status === 'approved') as Inspection[];
    },
    enabled: !!projectId,
    retry: 3, retryDelay: 1000
  });

  const { data: previousProgress = 0, isLoading: previousProgressLoading } = useQuery({
    queryKey: ['previous-progress', projectId],
    queryFn: async (): Promise<number> => {
      if (!projectId) return 0;
      return 0;
    },
    enabled: !!projectId,
    retry: 3, retryDelay: 1000
  });

  const createProgressInvoiceMutation = useMutation({
    mutationFn: async ({ data, uploadedDocs }: { data: InvoiceFormData; uploadedDocs?: string[] }) => {
      if (data.progress_percentage <= previousProgress) {
        throw new Error(`Le taux d'avancement doit être supérieur à ${previousProgress}%`);
      }
      throw new Error('Progress invoice service not yet migrated to hexagonal');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['previous-progress', projectId] });
      toast({ title: 'Facture créée', description: "La facture d'avancement a été soumise avec succès" });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message || 'Impossible de créer la facture', variant: 'destructive' });
    }
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `progress_invoices/${fileName}`;
      const storageService = getStorageService();
      const result = await storageService.uploadFile({ bucket: 'documents', path: filePath, file });
      return result.publicUrl;
    },
    onSuccess: () => {
      toast({ title: 'Document téléchargé', description: 'Le document a été ajouté à la facture' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de télécharger le document', variant: 'destructive' });
    }
  });

  const workflowRequirements: WorkflowRequirements = React.useMemo(() => {
    if (!projectData) return { requiresConsultant: false, requiresMinistry: false, requiresDonor: false };
    const projectType = projectData.project_type?.toLowerCase() || '';
    const fundingSource = (projectData.funding_source || '').toLowerCase();
    return {
      requiresConsultant: projectType === 'infrastructure' || projectType === 'construction',
      requiresMinistry: fundingSource.includes('ministère') || fundingSource.includes('ministry'),
      requiresDonor: fundingSource.includes('bailleur') || fundingSource.includes('donor') || fundingSource.includes('banque mondiale')
    };
  }, [projectData]);

  return {
    projectData, inspections, previousProgress, workflowRequirements,
    isLoading: projectLoading || inspectionsLoading || previousProgressLoading,
    createProgressInvoiceMutation, uploadFileMutation,
    createProgressInvoice: (data: InvoiceFormData, uploadedDocs?: string[]) => createProgressInvoiceMutation.mutateAsync({ data, uploadedDocs }),
    uploadFile: (file: File) => uploadFileMutation.mutateAsync(file),
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['project-data', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-inspections', projectId] });
      queryClient.invalidateQueries({ queryKey: ['previous-progress', projectId] });
    }
  };
};
