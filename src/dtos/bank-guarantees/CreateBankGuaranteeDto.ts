import { BaseEntityDTO } from '../shared';

export interface CreateBankGuaranteeDTO extends BaseEntityDTO {
  /** Project ID this guarantee belongs to */
  projectId: string;
  
  /** Type of bank guarantee */
  guaranteeType: 'performance' | 'payment' | 'advance_payment' | 'warranty' | 'retention';
  
  /** Guaranteed amount */
  guaranteeAmount: number;
  
  /** Bank issuing the guarantee */
  issuingBank: string;
  
  /** Unique guarantee reference number */
  guaranteeNumber: string;
  
  /** Date when guarantee was issued */
  issueDate: string;
  
  /** Expiry date of the guarantee */
  expiryDate: string;
  
  /** Current status */
  status?: 'active' | 'expired' | 'cancelled' | 'claimed' | 'pending';
  
  /** Special conditions */
  conditions?: string[];
  
  /** Related document IDs */
  documents?: string[];
  
  // Legacy snake_case aliases for backward compatibility (PROMPTS.md Pattern 2)
  project_id?: string;
  guarantee_type?: string;
  guarantee_amount?: number;
  issuing_bank?: string;
  guarantee_number?: string;
  issue_date?: string;
  expiry_date?: string;
  
  /** Currency code (e.g. USD, EUR) */
  currency?: string;
  
  /** Exchange rate if applicable */
  exchange_rate?: number;
}
