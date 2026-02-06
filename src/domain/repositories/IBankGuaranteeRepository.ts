/**
 * Bank Guarantee Repository Interface
 * Defines contract for bank guarantee data operations
 */

import { BankGuaranteeDTO } from '@/dtos/entities/BankGuaranteeDTO';
import { CreateBankGuaranteeDto } from '@/dtos/bank-guarantees/CreateBankGuaranteeDto';
import { UpdateBankGuaranteeDto } from '@/dtos/bank-guarantees/UpdateBankGuaranteeDto';

/**
 * Options for querying bank guarantees
 */
interface BankGuaranteeQueryOptions {
  projectId?: string;
  limit?: number;
  offset?: number;
  status?: string;
}

export interface IBankGuaranteeRepository {
  /**
   * Create bank guarantee
   */
  create(guarantee: CreateBankGuaranteeDto): Promise<BankGuaranteeDto>;

  /**
   * Get guarantees with query options
   * @param options Query options including pagination and filters
   */
  getByProject(options: BankGuaranteeQueryOptions): Promise<BankGuaranteeDto[]>;

  /**
   * @deprecated Use getByProject with options instead
   */
  findByProjectId(projectId: string): Promise<BankGuaranteeDto[]>;

  /**
   * Update guarantee status
   */
  updateStatus(guaranteeId: string, status: string): Promise<void>;

  /**
   * Release phase guarantees
   */
  releasePhaseGuarantees(phaseId: string): Promise<void>;

  /**
   * Release project guarantees
   */
  releaseProjectGuarantees(projectId: string): Promise<void>;

  /**
   * Get guarantee by ID
   */
  getById(guaranteeId: string): Promise<BankGuaranteeDto>;

  /**
   * Update guarantee
   */
  update(guaranteeId: string, updates: UpdateBankGuaranteeDto): Promise<BankGuaranteeDto>;

  /**
   * Delete guarantee
   */
  delete(guaranteeId: string): Promise<void>;
}
