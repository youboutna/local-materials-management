import { supabase } from '@/integrations/supabase/client';

export interface BankGuarantee {
  id: string;
  project_id: string;
  guarantee_type: string;
  guarantee_amount: number;
  issuing_bank: string;
  guarantee_number: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'claimed';
  conditions: string[];
  documents: string[];
  created_at: string;
  updated_at: string;
}

export interface BankGuaranteeAction {
  id: string;
  guarantee_id: string;
  action_type: 'notification' | 'claim' | 'renewal' | 'cancellation';
  description: string;
  executed_by: string;
  executed_at: string;
  status: 'pending' | 'completed' | 'failed';
}

export class BankGuaranteeService {
  
  /**
   * Create a new bank guarantee
   * @param guaranteeData The guarantee data
   * @returns The created guarantee
   */
  static async createBankGuarantee(guaranteeData: Omit<BankGuarantee, 'id' | 'created_at' | 'updated_at'>): Promise<BankGuarantee> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .insert(guaranteeData)
      .select()
      .single();

    if (error) {
      console.error('Error creating bank guarantee:', error);
      throw new Error(`Failed to create bank guarantee: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all bank guarantees for a project
   * @param projectId The project ID
   * @returns Array of bank guarantees
   */
  static async getProjectBankGuarantees(projectId: string): Promise<BankGuarantee[]> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bank guarantees:', error);
      throw new Error(`Failed to fetch bank guarantees: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a bank guarantee by ID
   * @param guaranteeId The guarantee ID
   * @returns The bank guarantee or null
   */
  static async getBankGuaranteeById(guaranteeId: string): Promise<BankGuarantee | null> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .eq('id', guaranteeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching bank guarantee:', error);
      throw new Error(`Failed to fetch bank guarantee: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a bank guarantee
   * @param guaranteeId The guarantee ID
   * @param updates The updates to apply
   * @returns The updated guarantee
   */
  static async updateBankGuarantee(
    guaranteeId: string, 
    updates: Partial<BankGuarantee>
  ): Promise<BankGuarantee> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .update(updates)
      .eq('id', guaranteeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating bank guarantee:', error);
      throw new Error(`Failed to update bank guarantee: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a bank guarantee
   * @param guaranteeId The guarantee ID
   */
  static async deleteBankGuarantee(guaranteeId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantees')
      .delete()
      .eq('id', guaranteeId);

    if (error) {
      console.error('Error deleting bank guarantee:', error);
      throw new Error(`Failed to delete bank guarantee: ${error.message}`);
    }
  }

  /**
   * Get guarantees expiring soon (within 30 days)
   * @returns Array of expiring guarantees
   */
  static async getExpiringGuarantees(): Promise<BankGuarantee[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .eq('status', 'active')
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching expiring guarantees:', error);
      throw new Error(`Failed to fetch expiring guarantees: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check if a guarantee is expired
   * @param guaranteeId The guarantee ID
   * @returns True if expired, false otherwise
   */
  static async isGuaranteeExpired(guaranteeId: string): Promise<boolean> {
    const guarantee = await this.getBankGuaranteeById(guaranteeId);
    if (!guarantee) return false;

    return new Date(guarantee.expiry_date) < new Date();
  }

  /**
   * Get guarantee statistics for a project
   * @param projectId The project ID
   * @returns Statistics object
   */
  static async getProjectGuaranteeStats(projectId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    claimed: number;
    totalAmount: number;
  }> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('status, guarantee_amount')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching guarantee stats:', error);
      throw new Error(`Failed to fetch guarantee stats: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      active: 0,
      expired: 0,
      claimed: 0,
      totalAmount: 0
    };

    if (data) {
      for (const guarantee of data) {
        stats.totalAmount += guarantee.guarantee_amount || 0;
        
        switch (guarantee.status) {
          case 'active':
            stats.active++;
            break;
          case 'expired':
            stats.expired++;
            break;
          case 'claimed':
            stats.claimed++;
            break;
        }
      }
    }

    return stats;
  }

  /**
   * Trigger bank guarantee notification
   * @param guaranteeId The guarantee ID
   * @param notificationType The type of notification
   * @param message The notification message
   */
  static async triggerBankGuaranteeNotification(
    guaranteeId: string,
    notificationType: 'expiry_warning' | 'claim_required' | 'renewal_reminder',
    message: string
  ): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantee_notifications')
      .insert({
        guarantee_id: guaranteeId,
        notification_type: notificationType,
        message,
        sent_at: new Date().toISOString(),
        status: 'pending'
      });

    if (error) {
      console.error('Error triggering notification:', error);
      throw new Error(`Failed to trigger notification: ${error.message}`);
    }
  }
}
