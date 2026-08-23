/**
 * Hexagonal hook for consultant validation of progress invoices
 * Encapsulates btpClient access for ConsultantValidationPanel
 */
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAuthService } from '@/application/services/AuthService';

export interface ProgressInvoice {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  progressPercentage: number;
  previousProgress: number;
  totalContractAmount: number;
  invoiceAmount: number;
  workDescription: string;
  status: string;
  submittedAt: string;
  projectId: string;
  inspectionId: string;
  supportingDocuments: string[];
  projects?: {
    title: string;
    projectType: string;
    fundingSource: string;
  };
  invoice_number?: string;
  invoice_type?: string;
  progress_percentage?: number;
  previous_progress?: number;
  total_contract_amount?: number;
  invoice_amount?: number;
  work_description?: string;
  submitted_at?: string;
  project_id?: string;
  inspection_id?: string;
  supporting_documents?: string[];
}

export function useConsultantInvoiceValidationHex() {
  const [invoices, setInvoices] = useState<ProgressInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const authService = getAuthService();

  const loadPendingInvoices = async () => {
    try {
      setLoading(true);
      const { btpClient } = await import('@/integrations/supabase/schema-clients');
      const { data, error } = await btpClient.from('progress_invoices')
        .select('*')
        .eq('status', 'submitted')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = (data || []).map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number || '',
        invoice_number: invoice.invoice_number || '',
        invoiceType: invoice.invoice_type || 'progress',
        invoice_type: invoice.invoice_type || 'progress',
        progressPercentage: invoice.progress_percentage || 0,
        progress_percentage: invoice.progress_percentage || 0,
        previousProgress: invoice.previous_progress || 0,
        previous_progress: invoice.previous_progress || 0,
        totalContractAmount: invoice.total_contract_amount || 0,
        total_contract_amount: invoice.total_contract_amount || 0,
        invoiceAmount: invoice.invoice_amount || 0,
        invoice_amount: invoice.invoice_amount || 0,
        workDescription: invoice.work_description || '',
        work_description: invoice.work_description || '',
        status: invoice.status || 'draft',
        submittedAt: invoice.submitted_at || '',
        submitted_at: invoice.submitted_at || '',
        projectId: invoice.project_id || '',
        project_id: invoice.project_id || '',
        inspectionId: invoice.inspection_id || '',
        inspection_id: invoice.inspection_id || '',
        supportingDocuments: invoice.supporting_documents || [],
        supporting_documents: invoice.supporting_documents || [],
        submitted_by: invoice.submitted_by || '',
        created_at: invoice.created_at || '',
        updated_at: invoice.updated_at || '',
        projects: invoice.projects ? {
          title: invoice.projects.title || '',
          projectType: invoice.projects.project_type || '',
          fundingSource: invoice.projects.funding_source || ''
        } : undefined
      } as ProgressInvoice));

      setInvoices(transformedData);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les factures',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateInvoice = async (params: {
    invoiceId: string;
    approved: boolean;
    comments: string;
    serviceFaitDocumentId: string | null;
  }) => {
    const { invoiceId, approved, comments, serviceFaitDocumentId } = params;
    const { btpClient } = await import('@/integrations/supabase/schema-clients');

    const user = await authService.getCurrentUser();
    if (!user) throw new Error('Non authentifié');

    const employee = { id: user.id, name: user.email || 'Unknown', email: user.email || '' };

    const { data: currentInvoice } = await btpClient
      .from('progress_invoices')
      .select('workflow_history')
      .eq('id', invoiceId)
      .single();

    const workflowHistory = (currentInvoice?.workflow_history as any[]) || [];
    const newWorkflowEntry = {
      action: approved ? 'consultant_approved' : 'consultant_rejected',
      timestamp: new Date().toISOString(),
      user_id: user.id,
      employee_id: employee.id,
      comments,
      status: approved ? 'consultant_approved' : 'consultant_rejected',
    };

    const newStatus = approved ? 'consultant_approved' : 'consultant_rejected';
    const updateData: any = {
      status: newStatus,
      consultant_id: employee.id,
      consultant_validated_at: new Date().toISOString(),
      consultant_comments: comments,
      consultant_approval_status: approved ? 'approved' : 'rejected',
      workflow_history: [...workflowHistory, newWorkflowEntry],
    };

    if (serviceFaitDocumentId) {
      updateData.service_fait_document_id = serviceFaitDocumentId;
    }

    const { error: updateError } = await btpClient
      .from('progress_invoices')
      .update(updateData)
      .eq('id', invoiceId);

    if (updateError) throw updateError;

    return { employee };
  };

  return { invoices, loading, loadPendingInvoices, validateInvoice };
}
