/**
 * Bank Guarantee Service - Hexagonal Architecture
 * Business logic for bank guarantee management
 */

import { IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface BankGuarantee {
  id: string;
  project_id: string;
  contractor_id: string; // Added contractor_id
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
  
  private bankGuaranteeRepository: IBankGuaranteeRepository;

  constructor() {
    this.bankGuaranteeRepository = RepositoryFactory.getBankGuaranteeRepository();
  }
  
  /**
   * Create a new bank guarantee
   * @param guaranteeData The guarantee data
   * @returns The created guarantee
   */
  async createBankGuarantee(guaranteeData: Omit<BankGuarantee, 'id' | 'created_at' | 'updated_at'>): Promise<BankGuarantee> {
    try {
      return await this.bankGuaranteeRepository.create(guaranteeData);
    } catch (error) {
      console.error('Error creating bank guarantee:', error);
      throw new Error(`Failed to create bank guarantee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all bank guarantees (alias for getProjectBankGuarantees with optional filter)
   * @param projectId Optional project ID filter
   * @returns Array of bank guarantees
   */
  async getBankGuarantees(projectId?: string): Promise<BankGuarantee[]> {
    try {
      if (projectId) {
        return await this.bankGuaranteeRepository.getByProject(projectId);
      }
      // Implementation would go here for getting all guarantees
      return [];
    } catch (error) {
      console.error('Error fetching bank guarantees:', error);
      throw new Error(`Failed to fetch bank guarantees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all bank guarantees for a project
   * @param projectId The project ID
   * @returns Array of bank guarantees
   */
  async getProjectBankGuarantees(projectId: string): Promise<BankGuarantee[]> {
    try {
      return await this.bankGuaranteeRepository.getByProject(projectId);
    } catch (error) {
      console.error('Error fetching bank guarantees:', error);
      throw new Error(`Failed to fetch bank guarantees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a bank guarantee by ID
   * @param guaranteeId The guarantee ID
   * @returns The bank guarantee
   */
  async getBankGuaranteeById(guaranteeId: string): Promise<BankGuarantee | null> {
    try {
      return await this.bankGuaranteeRepository.getById(guaranteeId);
    } catch (error) {
      console.error('Error fetching bank guarantee:', error);
      throw new Error(`Failed to fetch bank guarantee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a bank guarantee
   * @param guaranteeId The guarantee ID
   * @param updates The updates to apply
   * @returns The updated guarantee
   */
  async updateBankGuarantee(guaranteeId: string, updates: Partial<BankGuarantee>): Promise<BankGuarantee> {
    try {
      return await this.bankGuaranteeRepository.update(guaranteeId, updates);
    } catch (error) {
      console.error('Error updating bank guarantee:', error);
      throw new Error(`Failed to update bank guarantee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a bank guarantee
   * @param guaranteeId The guarantee ID
   */
  async deleteBankGuarantee(guaranteeId: string): Promise<void> {
    try {
      await this.bankGuaranteeRepository.delete(guaranteeId);
    } catch (error) {
      console.error('Error deleting bank guarantee:', error);
      throw new Error(`Failed to delete bank guarantee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update bank guarantee status
   * @param guaranteeId The guarantee ID
   * @param status The new status
   */
  async updateGuaranteeStatus(guaranteeId: string, status: BankGuarantee['status']): Promise<void> {
    try {
      await this.bankGuaranteeRepository.updateStatus(guaranteeId, status);
    } catch (error) {
      console.error('Error updating guarantee status:', error);
      throw new Error(`Failed to update guarantee status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Release phase guarantees
   * @param phaseId The phase ID
   */
  async releasePhaseGuarantees(phaseId: string): Promise<void> {
    try {
      await this.bankGuaranteeRepository.releasePhaseGuarantees(phaseId);
    } catch (error) {
      console.error('Error releasing phase guarantees:', error);
      throw new Error(`Failed to release phase guarantees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Release project guarantees
   * @param projectId The project ID
   */
  async releaseProjectGuarantees(projectId: string): Promise<void> {
    try {
      await this.bankGuaranteeRepository.releaseProjectGuarantees(projectId);
    } catch (error) {
      console.error('Error releasing project guarantees:', error);
      throw new Error(`Failed to release project guarantees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Trigger bank guarantee notification
   * @param guaranteeId The guarantee ID
   * @param action The action to trigger
   */
  async triggerBankGuaranteeNotification(guaranteeId: string, action: string): Promise<void> {
    try {
      const guarantee = await this.bankGuaranteeRepository.getById(guaranteeId);
      if (!guarantee) {
        throw new Error('Bank guarantee not found');
      }

      // Business logic for notification triggering
      console.log(`Triggering ${action} notification for guarantee ${guaranteeId}`);
      
      // Integration with notification service would go here
    } catch (error) {
      console.error('Error triggering bank guarantee notification:', error);
      throw new Error(`Failed to trigger notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get guarantees expiring soon (within 30 days)
   * @returns Array of expiring guarantees
   */
  async getExpiringGuarantees(): Promise<BankGuarantee[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    try {
      // Get all guarantees and filter for expiring ones
      const allGuarantees = await this.bankGuaranteeRepository.getByProject(''); // This would need to be implemented in repository
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
   * @param guaranteeId The guarantee ID
   * @returns True if expired, false otherwise
   */
  async isGuaranteeExpired(guaranteeId: string): Promise<boolean> {
    try {
      const guarantee = await this.bankGuaranteeRepository.getById(guaranteeId);
      if (!guarantee) return false;

      return new Date(guarantee.expiry_date) < new Date();
    } catch (error) {
      console.error('Error checking guarantee expiration:', error);
      throw new Error(`Failed to check guarantee expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get guarantee statistics for a project
   * @param projectId The project ID
   * @returns Statistics object
   */
  async getProjectGuaranteeStats(projectId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    claimed: number;
    totalAmount: number;
  }> {
    try {
      const data = await this.bankGuaranteeRepository.getByProject(projectId);

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
    } catch (error) {
      console.error('Error fetching guarantee statistics:', error);
      throw new Error(`Failed to fetch guarantee statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
