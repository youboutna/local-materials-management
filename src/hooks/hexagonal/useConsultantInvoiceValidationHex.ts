/**
 * Hexagonal hook for consultant validation of progress invoices
 * Encapsulates btpClient access for ConsultantValidationPanel
 */
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAuthService } from '@/application/services/AuthService';
import { getDecompteService } from '@/application/services/DecompteService';
import type { ConsultantProgressInvoiceDTO } from '@/dtos/entities/ConsultantProgressInvoiceDTO';

export type ProgressInvoice = ConsultantProgressInvoiceDTO;

export function useConsultantInvoiceValidationHex() {
  const [invoices, setInvoices] = useState<ProgressInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const authService = getAuthService();
  const decompteService = getDecompteService();

  const loadPendingInvoices = async () => {
    try {
      setLoading(true);
      setInvoices(await decompteService.getSubmittedProgressInvoices());
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

    const user = await authService.getCurrentUser();
    if (!user) throw new Error('Non authentifié');

    const employee = { id: user.id, name: user.email || 'Unknown', email: user.email || '' };
    await decompteService.validateConsultantInvoice({
      invoiceId,
      approved,
      comments,
      serviceFaitDocumentId,
      userId: employee.id,
    });

    return { employee };
  };

  return { invoices, loading, loadPendingInvoices, validateInvoice };
}
