
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ProjectWithPayments, Payment } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';

interface CreatePaymentPayload {
  projectId: string;
  payment: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
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
          progress_at_payment: project.progress,
          inspection_id: latestInspection?.id,
          transaction_id: `TX-${Date.now()}`,
        })
        .select()
        .single();
      
      if (error) throw new Error(error.message);

      // Update project status to 'payé' if full amount
      if (payment.amount >= project.budget) {
        await supabase
          .from('projects')
          .update({ status: 'payé' })
          .eq('id', projectId);
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      toast({
        title: 'Paiement réussi',
        description: `Transfert de ${data.amount.toLocaleString()} MRU complété`,
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
  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('project_id', projectId)
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    return data;
  };

  return { fetchPayments };
};
