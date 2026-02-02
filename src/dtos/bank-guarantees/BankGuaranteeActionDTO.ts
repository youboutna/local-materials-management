export interface BankGuaranteeActionDTO {
  id: string;
  guarantee_id: string;
  action_type: 'notification' | 'claim' | 'renewal' | 'cancellation' | 'extension' | 'modification';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  due_date?: string;
  completed_at?: string;
  documents: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}
