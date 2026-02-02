export interface BankGuaranteeDTO {
  id: string;
  project_id: string;
  contractor_id?: string;
  guarantee_type: 'performance' | 'payment' | 'advance_payment' | 'warranty' | 'retention';
  guarantee_amount: number;
  issuing_bank: string;
  bank_name?: string;
  guarantee_number: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'claimed' | 'pending';
  conditions: string[];
  documents: string[];
  currency?: string;
  exchange_rate?: number;
  created_at: string;
  updated_at: string;
}
