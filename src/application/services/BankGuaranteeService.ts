/**
 * Bank Guarantee Service - Hexagonal Architecture
 * Business logic for bank guarantee management
 */

export interface BankGuarantee {
  id: string;
  project_id: string;
  contractor_id: string;
  guarantee_type: string;
  guarantee_amount: number;
  issuing_bank: string;
  bank_name: string;
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

// In-memory storage for guarantees (placeholder)
const guaranteesStore: Map<string, BankGuarantee> = new Map();

export class BankGuaranteeService {
  /**
   * Static method to get guarantees by project ID
   */
  static async getByProjectId(projectId: string): Promise<BankGuarantee[]> {
    const allGuarantees = Array.from(guaranteesStore.values());
    return allGuarantees.filter(g => g.project_id === projectId);
  }
  /**
   * Create a new bank guarantee
   */
  async createBankGuarantee(guaranteeData: Omit<BankGuarantee, 'id' | 'created_at' | 'updated_at'>): Promise<BankGuarantee> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const guarantee: BankGuarantee = {
        ...guaranteeData,
        id,
        created_at: now,
        updated_at: now
      };
      
      guaranteesStore.set(id, guarantee);
      return guarantee;
    } catch (error) {
      console.error('Error creating bank guarantee:', error);
      throw new Error(`Failed to create bank guarantee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all bank guarantees (with optional project filter)
   */
  async getBankGuarantees(projectId?: string): Promise<BankGuarantee[]> {
    try {
      const allGuarantees = Array.from(guaranteesStore.values());
      if (projectId) {
        return allGuarantees.filter(g => g.project_id === projectId);
      }
      return allGuarantees;
    } catch (error) {
      console.error('Error fetching bank guarantees:', error);
      throw new Error(`Failed to fetch bank guarantees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all bank guarantees for a project
   */
  async getProjectBankGuarantees(projectId: string): Promise<BankGuarantee[]> {
    return this.getBankGuarantees(projectId);
  }

  /**
   * Get a bank guarantee by ID
   */
  async getBankGuaranteeById(guaranteeId: string): Promise<BankGuarantee | null> {
    try {
      return guaranteesStore.get(guaranteeId) || null;
    } catch (error) {
      console.error('Error fetching bank guarantee:', error);
      throw new Error(`Failed to fetch bank guarantee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a bank guarantee
   */
  async updateBankGuarantee(guaranteeId: string, updates: Partial<BankGuarantee>): Promise<BankGuarantee> {
    try {
      const existing = guaranteesStore.get(guaranteeId);
      if (!existing) {
        throw new Error('Bank guarantee not found');
      }
      
      const updated: BankGuarantee = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      guaranteesStore.set(guaranteeId, updated);
      return updated;
    } catch (error) {
      console.error('Error updating bank guarantee:', error);
      throw new Error(`Failed to update bank guarantee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a bank guarantee
   */
  async deleteBankGuarantee(guaranteeId: string): Promise<void> {
    try {
      guaranteesStore.delete(guaranteeId);
    } catch (error) {
      console.error('Error deleting bank guarantee:', error);
      throw new Error(`Failed to delete bank guarantee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update bank guarantee status
   */
  async updateGuaranteeStatus(guaranteeId: string, status: BankGuarantee['status']): Promise<void> {
    try {
      await this.updateBankGuarantee(guaranteeId, { status });
    } catch (error) {
      console.error('Error updating guarantee status:', error);
      throw new Error(`Failed to update guarantee status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Release phase guarantees
   */
  async releasePhaseGuarantees(phaseId: string): Promise<void> {
    try {
      console.log('Releasing phase guarantees for phase:', phaseId);
      // Implementation would go here
    } catch (error) {
      console.error('Error releasing phase guarantees:', error);
      throw new Error(`Failed to release phase guarantees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Release project guarantees
   */
  async releaseProjectGuarantees(projectId: string): Promise<void> {
    try {
      console.log('Releasing project guarantees for project:', projectId);
      // Implementation would go here
    } catch (error) {
      console.error('Error releasing project guarantees:', error);
      throw new Error(`Failed to release project guarantees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Trigger bank guarantee notification
   */
  async triggerBankGuaranteeNotification(guaranteeId: string, action: string): Promise<void> {
    try {
      const guarantee = await this.getBankGuaranteeById(guaranteeId);
      if (!guarantee) {
        throw new Error('Bank guarantee not found');
      }

      console.log(`Triggering ${action} notification for guarantee ${guaranteeId}`);
    } catch (error) {
      console.error('Error triggering bank guarantee notification:', error);
      throw new Error(`Failed to trigger notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get guarantees expiring soon (within 30 days)
   */
  async getExpiringGuarantees(): Promise<BankGuarantee[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    try {
      const allGuarantees = Array.from(guaranteesStore.values());
      return allGuarantees.filter(guarantee => 
        new Date(guarantee.expiry_date) <= thirtyDaysFromNow && 
        guarantee.status === 'active'
      );
    } catch (error) {
      console.error('Error fetching expiring guarantees:', error);
      throw new Error(`Failed to fetch expiring guarantees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a guarantee is expired
   */
  async isGuaranteeExpired(guaranteeId: string): Promise<boolean> {
    try {
      const guarantee = await this.getBankGuaranteeById(guaranteeId);
      if (!guarantee) return false;

      return new Date(guarantee.expiry_date) < new Date();
    } catch (error) {
      console.error('Error checking guarantee expiration:', error);
      throw new Error(`Failed to check guarantee expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get guarantee statistics for a project
   */
  async getProjectGuaranteeStats(projectId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    claimed: number;
    totalAmount: number;
  }> {
    try {
      const data = await this.getProjectBankGuarantees(projectId);

      const stats = {
        total: data.length,
        active: 0,
        expired: 0,
        claimed: 0,
        totalAmount: 0
      };

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

      return stats;
    } catch (error) {
      console.error('Error fetching guarantee statistics:', error);
      throw new Error(`Failed to fetch guarantee statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
