// Repository for Supplier Payment Requests
import { supabase } from '@/integrations/supabase/client';
// Local type for supplier_payment_requests table rows
interface SupplierPaymentRequestEntity {
  id: string;
  supplier_id: string;
  project_id: string | null;
  amount: number;
  description: string;
  payment_reason: string;
  supporting_documents: string[];
  status: string;
  requested_date: string;
  notes: string | null;
  approved_date: string | null;
  paid_date: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export class SupplierPaymentRepository {
  /**
   * Create a payment request
   */
  async createPaymentRequest(
    requestData: Omit<SupplierPaymentRequestEntity, 'id' | 'created_at' | 'updated_at' | 'approved_date' | 'paid_date'>
  ): Promise<SupplierPaymentRequestEntity> {
    const { data, error } = await supabase
      .from('supplier_payment_requests')
      .insert(requestData)
      .select()
      .single();

    if (error) throw error;
    return data as SupplierPaymentRequestEntity;
  }

  /**
   * Find payment requests by project
   */
  async findByProjectId(projectId: string): Promise<SupplierPaymentRequestEntity[]> {
    const { data, error } = await supabase
      .from('supplier_payment_requests')
      .select('*')
      .eq('project_id', projectId)
      .order('requested_date', { ascending: false });

    if (error) throw error;
    return (data || []) as SupplierPaymentRequestEntity[];
  }

  /**
   * Find payment requests by supplier
   */
  async findBySupplierId(supplierId: string): Promise<SupplierPaymentRequestEntity[]> {
    const { data, error } = await supabase
      .from('supplier_payment_requests')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('requested_date', { ascending: false });

    if (error) throw error;
    return (data || []) as SupplierPaymentRequestEntity[];
  }

  /**
   * Update payment request status
   */
  async updateStatus(
    id: string,
    status: 'pending' | 'approved' | 'rejected' | 'paid',
    additionalData?: Partial<SupplierPaymentRequestEntity>
  ): Promise<SupplierPaymentRequestEntity> {
    const updateData: any = { status, ...additionalData };

    if (status === 'approved') {
      updateData.approved_date = new Date().toISOString();
    } else if (status === 'paid') {
      updateData.paid_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('supplier_payment_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SupplierPaymentRequestEntity;
  }

  /**
   * Get contractor supplier ID for a project
   */
  async getContractorSupplierIdForProject(projectId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('project_stakeholders')
      .select('supplier_id')
      .eq('project_id', projectId)
      .eq('role', 'contractor')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.supplier_id || null;
  }
}
