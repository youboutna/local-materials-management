/**
 * Bank Guarantee Repository Interface
 * Defines contract for bank guarantee data operations
 */

import { BankGuaranteeDTO } from '@/dtos/entities/BankGuaranteeDTO';
import { CreateBankGuaranteeDTO } from '@/dtos/bank-guarantees/CreateBankGuaranteeDTO';
import { UpdateBankGuaranteeDTO } from '@/dtos/bank-guarantees/UpdateBankGuaranteeDTO';

/**
 * Options for querying bank guarantees
 */
export interface BankGuaranteeQueryOptions {
  projectId?: string;
  limit?: number;
  offset?: number;
  status?: string;
}

export interface IBankGuaranteeRepository {
  /**
   * Create bank guarantee
   */
  create(guarantee: CreateBankGuaranteeDTO): Promise<BankGuaranteeDTO>;

  /**
   * Get all guarantees
   */
  findAll(): Promise<BankGuaranteeDTO[]>;

  /**
   * Get guarantees with query options
   * @param options Query options including pagination and filters
   */
  getByProject(options: BankGuaranteeQueryOptions): Promise<BankGuaranteeDTO[]>;

  /**
   * @deprecated Use getByProject with options instead
   */
  findByProjectId(projectId: string): Promise<BankGuaranteeDTO[]>;

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
  getById(guaranteeId: string): Promise<BankGuaranteeDTO>;

  /**
   * Update guarantee
   */
  update(guaranteeId: string, updates: UpdateBankGuaranteeDTO): Promise<BankGuaranteeDTO>;

  /**
   * Delete guarantee
   */
  delete(guaranteeId: string): Promise<void>;
}
