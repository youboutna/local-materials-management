import { BankGuaranteeActionDTO } from './BankGuaranteeActionDTO';

export interface UpdateBankGuaranteeDTO {
  /** Type of bank guarantee */
  guaranteeType?: 'performance' | 'payment' | 'advance_payment' | 'warranty' | 'retention';
  
  /** Guaranteed amount */
  guaranteeAmount?: number;
  
  /** Bank issuing the guarantee */
  issuingBank?: string;
  
  /** Unique guarantee reference number */
  guaranteeNumber?: string;
  
  /** Date when guarantee was issued */
  issueDate?: string;
  
  /** Expiry date of the guarantee */
  expiryDate?: string;
  
  /** Current status */
  status?: 'active' | 'expired' | 'cancelled' | 'claimed' | 'pending';
  
  /** Special conditions */
  conditions?: string[];
  
  /** Related document IDs */
  documents?: string[];
  
  /** Currency code (e.g. USD, EUR) */
  currency?: string;
  
  /** Exchange rate if applicable */
  exchangeRate?: number;
  
  /** Actions performed on this guarantee */
  actions?: BankGuaranteeActionDTO[];
}
