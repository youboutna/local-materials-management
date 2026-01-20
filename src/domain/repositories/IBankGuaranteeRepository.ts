/**
 * Bank Guarantee Repository Interface
 * Defines contract for bank guarantee data operations
 */

export interface IBankGuaranteeRepository {
  /**
   * Create bank guarantee
   */
  create(guarantee: {
    project_id: string;
    guarantee_type: string;
    guarantee_amount: number;
    issuing_bank: string;
    guarantee_number: string;
    issue_date: string;
    expiry_date: string;
    status: string;
    conditions: string[];
    documents: string[];
  }): Promise<any>;

  /**
   * Get guarantees by project
   */
  getByProject(projectId: string): Promise<any[]>;

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
  getById(guaranteeId: string): Promise<any>;

  /**
   * Update guarantee
   */
  update(guaranteeId: string, updates: any): Promise<any>;

  /**
   * Delete guarantee
   */
  delete(guaranteeId: string): Promise<void>;
}
