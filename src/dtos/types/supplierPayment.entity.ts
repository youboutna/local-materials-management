// Supplier Payment Request Entity
export interface SupplierPaymentRequestEntity {
  id: string;
  supplier_id: string;
  project_id: string;
  amount: number;
  description: string;
  payment_reason: 'progress_payment' | 'inspection_fee' | 'final_payment' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requested_date: string;
  approved_date?: string | null;
  paid_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}
