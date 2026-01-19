import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

  // Fetch project data
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project-data', projectId],
    queryFn: async (): Promise<ProjectData | null> => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    retry: 3,
    retryDelay: 1000
  });

  // Fetch inspections for project
  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ['project-inspections', projectId],
    queryFn: async (): Promise<Inspection[]> => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'approved')
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
    retry: 3,
    retryDelay: 1000
  });

  // Fetch previous progress
  const { data: previousProgress = 0, isLoading: previousProgressLoading } = useQuery({
    queryKey: ['previous-progress', projectId],
    queryFn: async (): Promise<number> => {
      if (!projectId) return 0;
      
      const { data, error } = await (supabase as any)
        .from('progress_invoices')
        .select('progress_percentage')
        .eq('project_id', projectId)
        .in('status', ['paid', 'payment_processing'])
        .order('progress_percentage', { ascending: false })
        .limit(1);

      if (error && error.code !== 'PGRST116') throw error;
      
      const invoiceData = data?.[0] as any;
      return invoiceData?.progress_percentage || 0;
    },
    enabled: !!projectId,
    retry: 3,
    retryDelay: 1000
  });

  // Create progress invoice mutation
  const createProgressInvoiceMutation = useMutation({
    mutationFn: async ({ 
      data, 
      uploadedDocs 
    }: { 
      data: InvoiceFormData; 
      uploadedDocs?: string[] 
    }) => {
      // Validate progress increment
      if (data.progress_percentage <= previousProgress) {
        throw new Error(`Le taux d'avancement doit être supérieur à ${previousProgress}%`);
      }

      // Create progress invoice using database function
      const { data: invoiceResult, error } = await (supabase as any)
        .rpc('create_progress_invoice', {
          p_project_id: data.project_id,
          p_inspection_id: data.inspection_id || null,
          p_progress_percentage: data.progress_percentage,
          p_invoice_amount: data.invoice_amount,
          p_work_description: data.work_description,
          p_quantities_executed: data.quantities_executed || [],
          p_lot_details: data.lot_details || [],
        });

      if (error) throw error;

      const createdInvoice = invoiceResult as any;

      // Update invoice with supporting documents
      if (uploadedDocs && uploadedDocs.length > 0 && createdInvoice?.id) {
        await (supabase as any)
          .from('progress_invoices')
          .update({ supporting_documents: uploadedDocs })
          .eq('id', createdInvoice.id);
      }

      return createdInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['previous-progress', projectId] });
      toast({
        title: 'Facture créée',
        description: 'La facture d\'avancement a été soumise avec succès',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la facture',
        variant: 'destructive',
      });
    }
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `progress_invoices/${fileName}`;

      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onSuccess: (publicUrl) => {
      toast({
        title: 'Document téléchargé',
        description: 'Le document a été ajouté à la facture',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le document',
        variant: 'destructive',
      });
    }
  });

  // Calculate workflow requirements based on project data
  const workflowRequirements: WorkflowRequirements = React.useMemo(() => {
    if (!projectData) {
      return {
        requiresConsultant: false,
        requiresMinistry: false,
        requiresDonor: false
      };
    }

    const projectType = projectData.project_type?.toLowerCase() || '';
    const fundingSource = (projectData.funding_source || '').toLowerCase();
    
    return {
      requiresConsultant: projectType === 'infrastructure' || projectType === 'construction',
      requiresMinistry: fundingSource.includes('ministère') || fundingSource.includes('ministry'),
      requiresDonor: fundingSource.includes('bailleur') || fundingSource.includes('donor') || fundingSource.includes('banque mondiale')
    };
  }, [projectData]);

  return {
    projectData,
    inspections,
    previousProgress,
    workflowRequirements,
    isLoading: projectLoading || inspectionsLoading || previousProgressLoading,
    createProgressInvoiceMutation,
    uploadFileMutation,
    createProgressInvoice: (data: InvoiceFormData, uploadedDocs?: string[]) => 
      createProgressInvoiceMutation.mutateAsync({ data, uploadedDocs }),
    uploadFile: (file: File) => uploadFileMutation.mutateAsync(file),
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['project-data', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-inspections', projectId] });
      queryClient.invalidateQueries({ queryKey: ['previous-progress', projectId] });
    }
  };
};
