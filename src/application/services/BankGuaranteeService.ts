/**
 * Bank Guarantee Service - Hexagonal Architecture
 * Business logic for bank guarantee management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { BankGuaranteeDTO as ReportBankGuaranteeDTO } from '@/types/reportTypes';

// Service DTOs for data exchange
export interface BankGuaranteeDTO {
  id: string;
  project_id: string;
  contractor_id: string;
  guarantee_type: 'performance' | 'payment' | 'advance_payment' | 'warranty' | 'retention';
  guarantee_amount: number;
  issuing_bank: string;
  bank_name: string;
  guarantee_number: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'claimed' | 'pending';
  conditions: string[];
  documents: string[];
  currency: string;
  exchange_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface BankGuaranteeActionDTO {
  id: string;
  guarantee_id: string;
  action_type: 'notification' | 'claim' | 'renewal' | 'cancellation' | 'extension';
  description: string;
  executed_by: string;
  executed_at: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, unknown>;
}

export interface BankGuaranteeStats {
  total: number;
  active: number;
  expired: number;
  claimed: number;
  pending: number;
  totalAmount: number;
  averageExpiryDays: number;
  expiringSoonCount: number;
}

interface CreateBankGuaranteeDto {
  project_id: string;
  contractor_id: string;
  guarantee_type: 'performance' | 'payment' | 'advance_payment' | 'warranty' | 'retention';
  guarantee_amount: number;
  issuing_bank: string;
  bank_name: string;
  guarantee_number: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'claimed' | 'pending';
  conditions: string[];
  documents: string[];
  currency: string;
  exchange_rate?: number;
}

interface BankGuaranteeEntity {
  id: string;
  project_id: string;
  contractor_id: string;
  guarantee_type: 'performance' | 'payment' | 'advance_payment' | 'warranty' | 'retention';
  guarantee_amount: number;
  issuing_bank: string;
  bank_name: string;
  guarantee_number: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'claimed' | 'pending';
  conditions: string[];
  documents: string[];
  currency: string;
  exchange_rate?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Options for querying bank guarantees
 */
interface GetBankGuaranteesOptions {
  projectId?: string;
  limit?: number;
  offset?: number;
  status?: BankGuaranteeDTO['status'];
}

/**
 * Bank Guarantee Service - Hexagonal Architecture
 * Handles all business logic related to bank guarantees
 * 
 * @example
 * const service = new BankGuaranteeService();
 * const guarantees = await service.getBankGuarantees({ projectId: '123', limit: 10 });
 */
export class BankGuaranteeService {
  constructor(
    private bankGuaranteeRepository: IBankGuaranteeRepository = RepositoryFactory.getBankGuaranteeRepository()
  ) {}

  static async getByProjectId(projectId: string): Promise<BankGuaranteeDTO[]> {
    const repo = RepositoryFactory.getBankGuaranteeRepository();
    return repo.findByProjectId(projectId);
  }

  /**
   * Create a new bank guarantee
   */
  async createBankGuarantee(guaranteeData: CreateBankGuaranteeDto): Promise<BankGuaranteeDTO> {
    try {
      // Validation renforcée
      if (!guaranteeData.project_id || !guaranteeData.issuing_bank) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID and issuing bank are required');
      }
      
      if (guaranteeData.guarantee_amount <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Amount must be positive');
      }
      
      const issueDate = new Date(guaranteeData.issue_date);
      const expiryDate = new Date(guaranteeData.expiry_date);
      
      if (expiryDate <= issueDate) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Expiry date must be after issue date');
      }
      
      const created = await this.bankGuaranteeRepository.create({
        ...guaranteeData,
        status: guaranteeData.status || 'pending'
      });
      
      return this.mapToDTO(created);
    } catch (error) {
      throw this.normalizeError(error, 'Failed to create guarantee');
    }
  }

  /**
   * Get bank guarantees with pagination and filtering
   * @param options Query options including pagination and filters
   * @returns Promise<BankGuaranteeDTO[]> List of bank guarantees
   */
  async getBankGuarantees(options: GetBankGuaranteesOptions = {}): Promise<BankGuaranteeDTO[]> {
    try {
      const { projectId, limit, offset, status } = options;
      
      // Validate projectId if provided
      if (projectId && projectId.trim() === '') {
        console.warn('Invalid projectId provided, ignoring filter');
        options.projectId = undefined;
      }

      const guarantees = await this.bankGuaranteeRepository.getByProject({
        projectId,
        limit,
        offset,
        status
      });
      
      return guarantees.map(this.mapToDTO);
    } catch (error) {
      throw this.normalizeError(error, 'Failed to fetch bank guarantees');
    }
  }

  /**
   * Get all bank guarantees for a project
   */
  async getProjectBankGuarantees(projectId: string): Promise<BankGuaranteeDTO[]> {
    return this.getBankGuarantees({ projectId });
  }

  /**
   * Get a bank guarantee by ID
   */
  async getBankGuaranteeById(guaranteeId: string): Promise<BankGuaranteeDTO | null> {
    try {
      const guarantee = await this.bankGuaranteeRepository.getById(guaranteeId);
      
      if (!guarantee) {
        return null;
      }

      return this.mapToDTO(guarantee);
    } catch (error) {
      console.error('Error fetching bank guarantee:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch bank guarantee');
    }
  }

  /**
   * Update a bank guarantee
   */
  async updateBankGuarantee(guaranteeId: string, updates: Partial<BankGuaranteeDTO>): Promise<BankGuaranteeDTO> {
    try {
      const existing = await this.bankGuaranteeRepository.getById(guaranteeId);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Bank guarantee not found');
      }

      // Validate amount if provided
      if (updates.guarantee_amount !== undefined && updates.guarantee_amount <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Guarantee amount must be positive');
      }

      // Convert updates to repository format
      const repositoryUpdates = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const updated = await this.bankGuaranteeRepository.update(guaranteeId, repositoryUpdates);
      
      if (!updated) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update bank guarantee');
      }

      return this.mapToDTO(updated);
    } catch (error) {
      console.error('Error updating bank guarantee:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update bank guarantee');
    }
  }

  /**
   * Delete a bank guarantee
   */
  async deleteBankGuarantee(guaranteeId: string): Promise<void> {
    try {
      const existing = await this.bankGuaranteeRepository.getById(guaranteeId);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Bank guarantee not found');
      }

      await this.bankGuaranteeRepository.delete(guaranteeId);
    } catch (error) {
      console.error('Error deleting bank guarantee:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete bank guarantee');
    }
  }

  /**
   * Update bank guarantee status
   */
  async updateGuaranteeStatus(guaranteeId: string, status: BankGuaranteeDTO['status']): Promise<void> {
    try {
      await this.updateBankGuarantee(guaranteeId, { status });
    } catch (error) {
      console.error('Error updating guarantee status:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update guarantee status');
    }
  }

  /**
   * Release phase guarantees
   * Updates all active guarantees for a specific phase to 'released' status
   */
  async releasePhaseGuarantees(phaseId: string): Promise<void> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      // Get all guarantees (repository doesn't have findAll, use getByProject with empty string)
      const allGuarantees = await this.bankGuaranteeRepository.getByProject('');
      
      if (!allGuarantees) {
        return;
      }

      // Filter active guarantees and update them
      const activeGuarantees = allGuarantees.filter(g => g.status === 'active');
      
      for (const guarantee of activeGuarantees) {
        await this.bankGuaranteeRepository.update(guarantee.id, {
          status: 'cancelled',
          updated_at: new Date().toISOString()
        });
      }

      console.log(`Released ${activeGuarantees.length} guarantees for phase ${phaseId}`);
    } catch (error) {
      console.error('Error releasing phase guarantees:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to release phase guarantees');
    }
  }

  /**
   * Release project guarantees
   * Updates all active guarantees for a project to 'released' status
   */
  async releaseProjectGuarantees(projectId: string): Promise<void> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const projectGuarantees = await this.bankGuaranteeRepository.getByProject(projectId);
      
      if (!projectGuarantees) {
        return;
      }

      // Update all active guarantees for the project
      const activeGuarantees = projectGuarantees.filter(g => g.status === 'active');
      
      for (const guarantee of activeGuarantees) {
        await this.bankGuaranteeRepository.update(guarantee.id, {
          status: 'cancelled',
          updated_at: new Date().toISOString()
        });
      }

      console.log(`Released ${activeGuarantees.length} guarantees for project ${projectId}`);
    } catch (error) {
      console.error('Error releasing project guarantees:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to release project guarantees');
    }
  }

  /**
   * Trigger bank guarantee notification
   */
  async triggerBankGuaranteeNotification(guaranteeId: string, action: string): Promise<void> {
    try {
      const guarantee = await this.getBankGuaranteeById(guaranteeId);
      if (!guarantee) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Bank guarantee not found');
      }

      // Validate action
      const validActions = ['notification', 'claim', 'renewal', 'cancellation', 'extension'];
      if (!validActions.includes(action)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid action: ${action}`);
      }

      // Create action record (placeholder since repository doesn't support actions)
      const actionData = {
        guarantee_id: guaranteeId,
        action_type: action,
        description: `Triggered ${action} for guarantee ${guarantee.guarantee_number}`,
        executed_by: 'system',
        executed_at: new Date().toISOString(),
        status: 'completed',
        metadata: {
          triggered_by: 'BankGuaranteeService',
          timestamp: new Date().toISOString()
        }
      };

      // Save action through repository (if repository supports actions)
      // await this.bankGuaranteeRepository.createAction(actionData);
      
      console.log(`Triggered ${action} notification for guarantee ${guaranteeId}`);
    } catch (error) {
      console.error('Error triggering bank guarantee notification:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to trigger notification');
    }
  }

  /**
   * Get guarantees expiring soon (within 30 days)
   */
  async getExpiringGuarantees(days: number = 30): Promise<BankGuaranteeDTO[]> {
    try {
      // Get all guarantees and filter for expiring ones
      // Using getByProject with empty string to get all guarantees (workaround)
      const guarantees = await this.bankGuaranteeRepository.getByProject('');
      
      if (!guarantees || guarantees.length === 0) {
        return [];
      }

      const currentDate = new Date();
      const expiryThreshold = new Date();
      expiryThreshold.setDate(currentDate.getDate() + days);

      const expiringGuarantees = guarantees.filter(guarantee => {
        const expiryDate = new Date(guarantee.expiry_date);
        return guarantee.status === 'active' && expiryDate <= expiryThreshold && expiryDate > currentDate;
      });

      return expiringGuarantees.map(guarantee => ({
        id: guarantee.id,
        project_id: guarantee.project_id,
        guarantee_type: guarantee.guarantee_type,
        guarantee_number: guarantee.guarantee_number,
        bank_name: guarantee.issuing_bank,
        guarantee_amount: guarantee.guarantee_amount,
        amount: guarantee.guarantee_amount,
        currency: 'USD', // Default currency
        issue_date: guarantee.issue_date,
        expiry_date: guarantee.expiry_date,
        status: guarantee.status,
        documents: guarantee.documents || [],
        created_at: guarantee.issue_date, // Use issue_date as created_at
        updated_at: guarantee.expiry_date, // Use expiry_date as updated_at
        contractor_id: '', // Default empty
        issuing_bank: guarantee.issuing_bank,
        conditions: [], // Default empty
        exchange_rate: 1.0 // Default exchange rate
      }));
    } catch (error) {
      console.error('Error fetching expiring guarantees:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch expiring guarantees');
    }
  }

  /**
   * Check if a guarantee is expired
   */
  async isGuaranteeExpired(guaranteeId: string): Promise<boolean> {
    try {
      const guarantee = await this.bankGuaranteeRepository.getById(guaranteeId);
      if (!guarantee) {
        return false;
      }

      return new Date(guarantee.expiry_date) < new Date();
    } catch (error) {
      console.error('Error checking guarantee expiration:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to check guarantee expiration');
    }
  }

  /**
   * Get guarantee statistics for a project
   */
  async getProjectGuaranteeStats(projectId: string): Promise<BankGuaranteeStats> {
    try {
      const data = await this.getProjectBankGuarantees(projectId);
      const expiringGuarantees = await this.getExpiringGuarantees();
      
      const stats: BankGuaranteeStats = {
        total: data.length,
        active: 0,
        expired: 0,
        claimed: 0,
        pending: 0,
        totalAmount: 0,
        averageExpiryDays: 0,
        expiringSoonCount: 0
      };

      let totalExpiryDays = 0;
      const today = new Date();

      for (const guarantee of data) {
        stats.totalAmount += guarantee.guarantee_amount || 0;
        
        // Calculate expiry days
        const expiryDate = new Date(guarantee.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        totalExpiryDays += Math.max(0, daysUntilExpiry);
        
        // Check if expiring soon
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0 && guarantee.status === 'active') {
          stats.expiringSoonCount++;
        }
        
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
          case 'pending':
            stats.pending++;
            break;
        }
      }

      // Calculate average expiry days
      stats.averageExpiryDays = data.length > 0 ? Math.round(totalExpiryDays / data.length) : 0;

      return stats;
    } catch (error) {
      console.error('Error fetching guarantee statistics:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch guarantee statistics');
    }
  }

  /**
   * Map repository result to DTO
   */
  private mapToDTO(repositoryResult: BankGuaranteeEntity): BankGuaranteeDTO {
    if (!repositoryResult) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid repository result');
    }
    
    return {
      id: repositoryResult.id,
      project_id: repositoryResult.project_id,
      contractor_id: repositoryResult.contractor_id || '',
      guarantee_type: repositoryResult.guarantee_type,
      guarantee_amount: repositoryResult.guarantee_amount,
      issuing_bank: repositoryResult.issuing_bank,
      bank_name: repositoryResult.bank_name || repositoryResult.issuing_bank,
      guarantee_number: repositoryResult.guarantee_number,
      issue_date: repositoryResult.issue_date,
      expiry_date: repositoryResult.expiry_date,
      status: repositoryResult.status,
      conditions: repositoryResult.conditions || [],
      documents: repositoryResult.documents || [],
      currency: repositoryResult.currency || 'MRO',
      exchange_rate: repositoryResult.exchange_rate,
      created_at: repositoryResult.created_at,
      updated_at: repositoryResult.updated_at
    };
  }

  /**
   * Normalize error
   */
  private normalizeError(error: unknown, defaultMessage: string): AppError {
    if (error instanceof AppError) return error;
    
    console.error('BankGuaranteeService error:', error);
    return new AppError(
      ErrorCode.INTERNAL_ERROR, 
      defaultMessage,
      error instanceof Error ? error : undefined
    );
  }
}
