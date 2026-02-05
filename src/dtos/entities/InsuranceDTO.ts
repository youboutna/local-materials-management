/**
 * Insurance Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

export enum InsuranceType {
  LIABILITY = 'liability',
  PROPERTY = 'property',
  PROFESSIONAL_INDEMNITY = 'professionalIndemnity',
  WORKERS_COMPENSATION = 'workersCompensation',
  CONSTRUCTION_ALL_RISK = 'constructionAllRisk',
  MARINE_CARGO = 'marineCargo',
  EQUIPMENT = 'equipment'
}

export enum InsuranceStatus {
  ACTIVE = 'active',
  EXPIRING_SOON = 'expiringSoon',
  EXPIRED = 'expired',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  UNDER_REVIEW = 'underReview'
}

/**
 * Insurance Policy DTO
 */
export interface InsurancePolicyDTO extends BaseEntityDTO {
  id: string;
  policyNumber: string;
  policyType: InsuranceType;
  projectId: string;
  contractorId?: string;
  supplierId?: string;
  insurerName: string;
  insuredAmount: number;
  premiumAmount: number;
  startDate: string;
  endDate: string;
  coverageDetails: string;
  status: InsuranceStatus;
  renewalDate?: string;
  documents: string[];
  notes?: string;
  
  // Additional details
  deductibleAmount?: number;
  claimLimit?: number;
  coverageType?: string;
  beneficiary?: string;
  
  // Verification
  lastVerifiedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string;
}

/**
 * Insurance Certificate DTO
 */
export interface InsuranceCertificateDTO extends BaseEntityDTO {
  id: string;
  certificateNumber: string;
  insurancePolicyId: string;
  projectId: string;
  certificateType: 'proofOfInsurance' | 'bondCertificate' | 'coverageCertificate';
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  documentUrl: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  
  // Certificate details
  coverageAmount: number;
  insuredParty: string;
  insurerName: string;
  policyReference?: string;
}

/**
 * Insurance Claim DTO
 */
export interface InsuranceClaimDTO extends BaseEntityDTO {
  id: string;
  claimNumber: string;
  insurancePolicyId: string;
  projectId: string;
  claimDate: string;
  incidentDate: string;
  incidentDescription: string;
  claimedAmount: number;
  approvedAmount?: number;
  status: 'submitted' | 'underReview' | 'approved' | 'rejected' | 'paid';
  settlementDate?: string;
  adjusterId?: string;
  documents: string[];
  notes?: string;
  
  // Claim processing
  processorId?: string;
  processedAt?: string;
  paymentReference?: string;
  paymentDate?: string;
}

/**
 * Create Insurance Request DTO
 */
export interface CreateInsuranceRequestDTO {
  projectId: string;
  contractorId?: string;
  supplierId?: string;
  insuranceType: InsuranceType;
  insurerName: string;
  insuredAmount: number;
  premiumAmount?: number;
  startDate: string;
  endDate: string;
  coverageDetails: string;
  documents?: string[];
  notes?: string;
  
  // Optional details
  deductibleAmount?: number;
  claimLimit?: number;
  coverageType?: string;
  beneficiary?: string;
}

/**
 * Update Insurance Request DTO
 */
export interface UpdateInsuranceRequestDTO {
  status?: InsuranceStatus;
  notes?: string;
  documents?: string[];
  coverageDetails?: string;
  premiumAmount?: number;
  renewalDate?: string;
  insuredAmount?: number;
  endDate?: string;
}

/**
 * Insurance Statistics DTO
 */
export interface InsuranceStatisticsDTO {
  totalPolicies: number;
  activePolicies: number;
  expiredPolicies: number;
  expiringSoonPolicies: number;
  totalCoverage: number;
  totalClaims: number;
  claimsPaid: number;
  claimsPending: number;
  
  // Breakdown by type
  liabilityCount: number;
  propertyCount: number;
  constructionAllRiskCount: number;
  professionalIndemnityCount: number;
  
  // Financial metrics
  totalPremium: number;
  totalClaimsAmount: number;
  averageClaimAmount: number;
  claimsRatio: number;
}

/**
 * Insurance Alert DTO
 */
export interface InsuranceAlertDTO {
  policyId: string;
  certificateId?: string;
  projectId: string;
  contractorId?: string;
  insuranceType: InsuranceType;
  insurerName: string;
  expiryDate: string;
  alertLevel: 'expired' | 'critical' | 'warning' | 'info';
  daysUntilExpiry: number;
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

/**
 * Insurance Requirement DTO
 */
export interface InsuranceRequirementDTO {
  id: string;
  projectId: string;
  requirementType: 'mandatory' | 'recommended' | 'contractual';
  insuranceType: InsuranceType;
  minimumCoverage: number;
  validityPeriodMonths: number;
  requiredByDate: string;
  status: 'pending' | 'fulfilled' | 'overdue';
  fulfilledByPolicyId?: string;
  fulfilledByCertificateId?: string;
  notes?: string;
}