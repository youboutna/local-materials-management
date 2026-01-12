// Supabase Adapter for Payment Repository
import { supabase } from '@/integrations/supabase/client';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { Payment, PaymentStatus, PaymentMethod } from '@/domain/entities/Payment';

export class SupabasePaymentAdapter implements IPaymentRepository {
  private mapToEntity(data: any): Payment {
    return new Payment(
      data.id,
      data.project_id,
      data.phase_id || null,
      data.step_id || null,
      data.inspection_id || null,
      data.amount || 0,
      data.payment_date,
      (data.payment_method || 'bank_transfer') as PaymentMethod,
      (data.status || 'pending_validation') as PaymentStatus,
      data.progress_at_payment || 0,
      data.transaction_id || null,
      data.contractor_name || '',
      data.contractor_contact || '',
      data.bank_name || null,
      data.account_number || null,
      data.check_number || null,
      data.mobile_number || null,
      data.mobile_operator || null,
      data.receiver_name || null,
      [],
      data.created_at,
      data.updated_at
    );
  }

  async findById(id: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async save(payment: Payment): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .insert({
        id: payment.id,
        project_id: payment.projectId,
        amount: payment.amount,
        payment_date: payment.paymentDate,
        payment_method: payment.paymentMethod,
        progress_at_payment: payment.progressAtPayment,
        transaction_id: payment.transactionId || `TXN-${Date.now()}`,
        contractor_name: payment.contractorName,
        contractor_contact: payment.contractorContact,
        bank_name: payment.bankName,
        account_number: payment.accountNumber,
        check_number: payment.checkNumber,
        mobile_number: payment.mobileNumber,
        mobile_operator: payment.mobileOperator,
        receiver_name: payment.receiverName
      });

    if (error) throw new Error(`Failed to save payment: ${error.message}`);
  }

  async update(id: string, data: Partial<Payment>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
    if (data.transactionId !== undefined) updateData.transaction_id = data.transactionId;

    const { error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(`Failed to update payment: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete payment: ${error.message}`);
  }

  async findByProjectId(projectId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('project_id', projectId)
      .order('payment_date', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByPhaseId(phaseId: string): Promise<Payment[]> {
    // Payments don't have phase_id in current schema
    return [];
  }

  async findByStepId(stepId: string): Promise<Payment[]> {
    // Payments don't have step_id in current schema
    return [];
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    // Payments don't have status in current schema - return all
    return this.findAll();
  }

  async findByInspectionId(inspectionId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (error || !data) return [];
    return data
      .filter(d => d.inspection_id === inspectionId)
      .map(d => this.mapToEntity(d));
  }

  async findByContractor(contractorName: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .ilike('contractor_name', `%${contractorName}%`)
      .order('payment_date', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findBetweenDates(startDate: string, endDate: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .order('payment_date', { ascending: true });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async getTotalByProject(projectId: string): Promise<number> {
    const { data, error } = await supabase
      .from('payments')
      .select('amount')
      .eq('project_id', projectId);

    if (error || !data) return 0;
    return data.reduce((sum, d) => sum + (d.amount || 0), 0);
  }

  async getTotalByPhase(phaseId: string): Promise<number> {
    const payments = await this.findByPhaseId(phaseId);
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }

  async getTotalByStatus(projectId: string): Promise<Record<PaymentStatus, number>> {
    const payments = await this.findByProjectId(projectId);
    const totals: Record<string, number> = {};
    
    payments.forEach(p => {
      totals[p.status] = (totals[p.status] || 0) + p.amount;
    });

    return totals as Record<PaymentStatus, number>;
  }

  async getPaymentSummary(projectId: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    rejected: number;
  }> {
    const payments = await this.findByProjectId(projectId);
    
    return {
      total: payments.reduce((sum, p) => sum + p.amount, 0),
      paid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      pending: payments.filter(p => p.isPending()).reduce((sum, p) => sum + p.amount, 0),
      rejected: payments.filter(p => p.status === 'rejected').reduce((sum, p) => sum + p.amount, 0)
    };
  }
}
