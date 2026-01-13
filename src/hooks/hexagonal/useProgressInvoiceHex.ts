import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectData {
  id: string;
  title: string;
  budget: number;
  project_type?: string;
  funding_source?: string;
}

interface InspectionData {
  id: string;
  date: string;
  progress_at_inspection: number;
  status: string;
}

interface WorkflowRequirements {
  requiresConsultant: boolean;
  requiresMinistry: boolean;
  requiresDonor: boolean;
}

interface InvoiceFormData {
  project_id: string;
  inspection_id?: string;
  progress_percentage: number;
  invoice_amount: number;
  work_description: string;
  quantities_executed?: any;
  lot_details?: any;
}

export function useProgressInvoiceHex() {
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [inspections, setInspections] = useState<InspectionData[]>([]);
  const [previousProgress, setPreviousProgress] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [workflowRequirements, setWorkflowRequirements] = useState<WorkflowRequirements>({
    requiresConsultant: false,
    requiresMinistry: false,
    requiresDonor: false
  });
  const { toast } = useToast();

  const loadProjectData = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProjectData(data as ProjectData);

      const projectType = data.project_type?.toLowerCase() || '';
      const fundingSource = (data as any).funding_source?.toLowerCase() || '';
      
      setWorkflowRequirements({
        requiresConsultant: projectType === 'infrastructure' || projectType === 'construction',
        requiresMinistry: fundingSource.includes('ministère') || fundingSource.includes('ministry'),
        requiresDonor: fundingSource.includes('bailleur') || fundingSource.includes('donor') || fundingSource.includes('banque mondiale')
      });
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const loadInspections = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'approved')
        .order('date', { ascending: false });

      if (error) throw error;
      setInspections(data || []);
    } catch (error) {
      console.error('Error loading inspections:', error);
    }
  };

  const loadPreviousProgress = async (projectId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('progress_invoices')
        .select('progress_percentage')
        .eq('project_id', projectId)
        .in('status', ['paid', 'payment_processing'])
        .order('progress_percentage', { ascending: false })
        .limit(1);

      if (error && error.code !== 'PGRST116') throw error;
      
      const invoiceData = data?.[0] as any;
      setPreviousProgress(invoiceData?.progress_percentage || 0);
    } catch (error) {
      console.error('Error loading previous progress:', error);
    }
  };

  const uploadDocument = async (file: File): Promise<string | null> => {
    try {
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

      setUploadedDocs(prev => [...prev, publicUrl]);
      toast({
        title: 'Document téléchargé',
        description: 'Le document a été ajouté à la facture',
      });
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le document',
        variant: 'destructive',
      });
      return null;
    }
  };

  const createInvoice = async (data: InvoiceFormData): Promise<boolean> => {
    setLoading(true);
    try {
      // Validate progress increment
      if (data.progress_percentage <= previousProgress) {
        toast({
          title: 'Erreur',
          description: `Le taux d'avancement doit être supérieur à ${previousProgress}%`,
          variant: 'destructive',
        });
        return false;
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
      if (uploadedDocs.length > 0 && createdInvoice?.id) {
        await (supabase as any)
          .from('progress_invoices')
          .update({ supporting_documents: uploadedDocs })
          .eq('id', createdInvoice.id);
      }

      toast({
        title: 'Facture créée',
        description: 'La facture d\'avancement a été soumise avec succès',
      });

      return true;
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la facture',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetDocuments = () => {
    setUploadedDocs([]);
  };

  return {
    // State
    loading,
    projectData,
    inspections,
    previousProgress,
    uploadedDocs,
    workflowRequirements,
    
    // Actions
    loadProjectData,
    loadInspections,
    loadPreviousProgress,
    uploadDocument,
    createInvoice,
    resetDocuments,
  };
}
