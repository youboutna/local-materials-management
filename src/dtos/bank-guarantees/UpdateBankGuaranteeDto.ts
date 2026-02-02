import { BankGuaranteeActionDTO } from './BankGuaranteeActionDTO';

export interface UpdateBankGuaranteeDto {
  /** Type of bank guarantee */
  guarantee_type?: 'performance' | 'payment' | 'advance_payment' | 'warranty' | 'retention';
  
  /** Guaranteed amount */
  guarantee_amount?: number;
  
  /** Bank issuing the guarantee */
  issuing_bank?: string;
  
  /** Unique guarantee reference number */
  guarantee_number?: string;
  
  /** Date when guarantee was issued */
  issue_date?: string;
  
  /** Expiry date of the guarantee */
  expiry_date?: string;
  
  /** Current status */
  status?: 'active' | 'expired' | 'cancelled' | 'claimed' | 'pending';
  
  /** Special conditions */
  conditions?: string[];
  
  /** Related document IDs */
  documents?: string[];
  
  /** Currency code (e.g. USD, EUR) */
  currency?: string;
  
  /** Exchange rate if applicable */
  exchange_rate?: number;
  
  /** Actions performed on this guarantee */
  actions?: BankGuaranteeActionDTO[];
}
