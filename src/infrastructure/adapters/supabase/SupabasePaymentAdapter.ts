// Supabase Adapter for Payment Repository
import { Payment, PaymentMethod, PaymentStatus } from '@/domain/entities/Payment';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

export class SupabasePaymentAdapter implements IPaymentRepository {
  private mapToEntity(data: any): Payment {
    const projectRef = data.project_id ? { id: data.project_id } : null;
    const phaseRef = data.phase_id ? { id: data.phase_id } : null;
    const inspectionRef = data.inspection_id ? { id: data.inspection_id } : null;
    return new Payment(
      data.id,
      projectRef,
      phaseRef,
      inspectionRef,
      Number(data.amount) || 0,
      data.payment_date,
      (data.payment_method || 'bank_transfer') as PaymentMethod,
      (data.status || 'pending') as PaymentStatus,
      Number(data.progress_at_payment) || 0,
      data.transaction_id || null,
      data.contractor_id || null,
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
      data.updated_at,
      data.created_by || null,
      data.notes || null
    );
  }

  async findById(id: string): Promise<Payment | null> {
    const { data, error } = await supabase.from('payments').select('*').eq('id', id).single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').order('payment_date', { ascending: false });
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async save(payment: Payment): Promise<void> {
    const insertData = {
      id: payment.id,
      project_id: payment.projectRef?.id ?? null,
      phase_id: payment.phaseRef?.id ?? null,
      inspection_id: payment.inspectionRef?.id ?? null,
      amount: payment.amount,
      payment_date: payment.paymentDate,
      payment_method: payment.paymentMethod,
      progress_at_payment: payment.progressAtPayment,
      transaction_id: payment.transactionId || `TXN-${Date.now()}`,
      contractor_id: payment.contractorId,
      contractor_name: payment.contractorName,
      contractor_contact: payment.contractorContact,
      bank_name: payment.bankName,
      account_number: payment.accountNumber,
      check_number: payment.checkNumber,
      mobile_number: payment.mobileNumber,
      mobile_operator: payment.mobileOperator,
      receiver_name: payment.receiverName,
      status: payment.status,
      created_by: payment.createdBy,
      notes: payment.notes,
    };
    console.log('[SupabaseAdapter] insert data:', insertData);
    const { error } = await supabase.from('payments').insert(insertData);
    if (error) throw new Error(`Failed to save payment: ${error.message}`);
  }

  async update(id: string, data: Partial<Payment>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
    if (data.transactionId !== undefined) updateData.transaction_id = data.transactionId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.progressAtPayment !== undefined) updateData.progress_at_payment = data.progressAtPayment;
    if (data.paymentDate !== undefined) updateData.payment_date = data.paymentDate;
    if (data.contractorId !== undefined) updateData.contractor_id = data.contractorId;
    if (data.contractorName !== undefined) updateData.contractor_name = data.contractorName;
    if (data.contractorContact !== undefined) updateData.contractor_contact = data.contractorContact;
    if (data.bankName !== undefined) updateData.bank_name = data.bankName;
    if (data.accountNumber !== undefined) updateData.account_number = data.accountNumber;
    if (data.checkNumber !== undefined) updateData.check_number = data.checkNumber;
    if (data.mobileNumber !== undefined) updateData.mobile_number = data.mobileNumber;
    if (data.mobileOperator !== undefined) updateData.mobile_operator = data.mobileOperator;
    if (data.receiverName !== undefined) updateData.receiver_name = data.receiverName;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.projectRef !== undefined) {
      updateData.project_id = data.projectRef?.id ?? null;
      }
    if (data.phaseRef !== undefined) {
      updateData.phase_id = data.phaseRef?.id ?? null;
    }
    if (data.inspectionRef !== undefined) {
      updateData.inspection_id = data.inspectionRef?.id ?? null;
    }
   
    if (Object.keys(updateData).length === 0) return;
    const { error } = await supabase.from('payments').update(updateData).eq('id', id);
    if (error) throw new Error(`Failed to update payment: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete payment: ${error.message}`);
  }

  async findByProjectId(projectId: string): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').eq('project_id', projectId).order('payment_date', { ascending: false });
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByPhaseId(phaseId: string): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').eq('phase_id', phaseId).order('payment_date', { ascending: false });
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByStepId(stepId: string): Promise<Payment[]> {
    return [];
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').eq('status', status).order('payment_date', { ascending: false });
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByInspectionId(inspectionId: string): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').eq('inspection_id', inspectionId).order('payment_date', { ascending: false });
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByContractor(contractorIdOrName: string): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').or(`contractor_id.eq.${contractorIdOrName},contractor_name.ilike.%${contractorIdOrName}%`).order('payment_date', { ascending: false });
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findBetweenDates(startDate: string, endDate: string): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').gte('payment_date', startDate).lte('payment_date', endDate).order('payment_date', { ascending: true });
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async getTotalByProject(projectId: string): Promise<number> {
    const { data, error } = await supabase.from('payments').select('amount').eq('project_id', projectId);
    if (error || !data) return 0;
    return data.reduce((sum, d) => sum + (d.amount || 0), 0);
  }

  async getTotalByPhase(phaseId: string): Promise<number> {
    const { data, error } = await supabase.from('payments').select('amount').eq('phase_id', phaseId);
    if (error || !data) return 0;
    return data.reduce((sum, d) => sum + (d.amount || 0), 0);
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