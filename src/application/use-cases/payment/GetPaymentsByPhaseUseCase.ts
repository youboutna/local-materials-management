// Get Payments by Phase Use Case
import { supabase } from '@/integrations/supabase/client';

export interface PhasePayment {
  id: string;
  projectId: string;
  phaseId: string | null;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  progressAtPayment: number;
  transactionId: string;
  contractorName: string;
  contractorContact: string | null;
  bankName: string | null;
  accountNumber: string | null;
  mobileNumber: string | null;
  mobileOperator: string | null;
  createdAt: string;
}

export interface GetPaymentsByPhaseResult {
  payments: PhasePayment[];
  totalPaid: number;
  paymentCount: number;
}

export class GetPaymentsByPhaseUseCase {
  async execute(phaseId: string): Promise<GetPaymentsByPhaseResult> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('phase_id', phaseId)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        return {
          payments: [],
          totalPaid: 0,
          paymentCount: 0
        };
      }

      const payments: PhasePayment[] = (data || []).map(p => ({
        id: p.id,
        projectId: p.project_id,
        phaseId: p.phase_id,
        amount: p.amount,
        paymentDate: p.payment_date,
        paymentMethod: p.payment_method,
        progressAtPayment: p.progress_at_payment,
        transactionId: p.transaction_id,
        contractorName: p.contractor_name,
        contractorContact: p.contractor_contact,
        bankName: p.bank_name,
        accountNumber: p.account_number,
        mobileNumber: p.mobile_number,
        mobileOperator: p.mobile_operator,
        createdAt: p.created_at
      }));

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      return {
        payments,
        totalPaid,
        paymentCount: payments.length
      };
    } catch (error) {
      console.error('GetPaymentsByPhaseUseCase error:', error);
      return {
        payments: [],
        totalPaid: 0,
        paymentCount: 0
      };
    }
  }

  async executeByProject(projectId: string): Promise<GetPaymentsByPhaseResult> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', projectId)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching project payments:', error);
        return {
          payments: [],
          totalPaid: 0,
          paymentCount: 0
        };
      }

      const payments: PhasePayment[] = (data || []).map(p => ({
        id: p.id,
        projectId: p.project_id,
        phaseId: p.phase_id,
        amount: p.amount,
        paymentDate: p.payment_date,
        paymentMethod: p.payment_method,
        progressAtPayment: p.progress_at_payment,
        transactionId: p.transaction_id,
        contractorName: p.contractor_name,
        contractorContact: p.contractor_contact,
        bankName: p.bank_name,
        accountNumber: p.account_number,
        mobileNumber: p.mobile_number,
        mobileOperator: p.mobile_operator,
        createdAt: p.created_at
      }));

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      return {
        payments,
        totalPaid,
        paymentCount: payments.length
      };
    } catch (error) {
      console.error('GetPaymentsByPhaseUseCase error:', error);
      return {
        payments: [],
        totalPaid: 0,
        paymentCount: 0
      };
    }
  }
}
