
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ProjectWithPayments, Payment } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface CreatePaymentPayload {
  projectId: string;
  payment: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    contractorId?: string;
    contractorName: string;
    contractorContact: string;
    // Method-specific fields
    bankName?: string;
    accountNumber?: string;
    checkNumber?: string;
    mobileNumber?: string;
    mobileOperator?: string;
    receiverName?: string;
  };
}

export const useCreateProjectPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, payment }: CreatePaymentPayload) => {
      // First get the project to validate the payment
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw new Error(projectError.message);

      // Get inspections for this project
      const { data: inspections } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false })
        .limit(1);
      
      const latestInspection = inspections?.[0];
      
      // Create the new payment record
      const { data, error } = await supabase
        .from('payments')
        .insert({
          project_id: projectId,
          amount: payment.amount,
          payment_date: payment.paymentDate,
          payment_method: payment.paymentMethod,
          progress_at_payment: (project as any).progress,
          inspection_id: latestInspection?.id,
          transaction_id: `TX-${Date.now()}`,
          contractor_id: payment.contractorId,
          contractor_name: payment.contractorName,
          contractor_contact: payment.contractorContact,
          bank_name: payment.bankName,
          account_number: payment.accountNumber,
          check_number: payment.checkNumber,
          mobile_number: payment.mobileNumber,
          mobile_operator: payment.mobileOperator,
          receiver_name: payment.receiverName,
        } as any)
        .select()
        .single();
      
      if (error) throw new Error(error.message);

      // Update project status to 'payé' if full amount
      if (payment.amount >= (project as any).budget) {
        await supabase
          .from('projects')
          .update({ status: 'payé' } as any)
          .eq('id', projectId);
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      toast({
        title: 'Paiement réussi',
        description: `Transfert de ${(data as any).amount.toLocaleString()} MRU complété`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Échec du paiement',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useProjectPayments = (projectId: string) => {
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project-with-payments', projectId],
    queryFn: async (): Promise<ProjectWithPayments | null> => {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', projectId)
        .order('payment_date', { ascending: false });

      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (paymentsError) throw paymentsError;
      if (inspectionsError) throw inspectionsError;

      return {
        ...(projectData as any),
        payments: paymentsData || [],
        inspections: inspectionsData || [],
      };
    },
    enabled: !!projectId,
  });

  const createPayment = async (paymentData: any) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          project_id: projectId,
          amount: paymentData.amount,
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method,
          progress_at_payment: paymentData.progress_at_payment,
          inspection_id: paymentData.inspection_id,
          transaction_id: paymentData.transaction_id,
          contractor_id: paymentData.contractor_id,
          contractor_name: paymentData.contractor_name,
          contractor_contact: paymentData.contractor_contact,
          bank_name: paymentData.bank_name,
          account_number: paymentData.account_number,
          check_number: paymentData.check_number,
          mobile_number: paymentData.mobile_number,
          mobile_operator: paymentData.mobile_operator,
          receiver_name: paymentData.receiver_name,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Update project progress if needed
      if (data && (data as any).progress_at_payment !== undefined) {
        await supabase
          .from('projects')
          .update({ progress: (data as any).progress_at_payment } as any)
          .eq('id', projectId);
      }

      toast({
        title: "Paiement ajouté",
        description: "Le paiement a été enregistré avec succès.",
      });

      return data;
    } catch (err) {
      console.error('Error creating payment:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le paiement.",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { project, isLoading: projectLoading, createPayment };
};
