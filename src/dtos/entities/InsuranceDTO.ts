/**
 * Insurance Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

export enum InsuranceType {
  LIABILITY = 'liability',
  PROPERTY = 'property',
  PROFESSIONAL_INDEMNITY = 'professional_indemnity',
  WORKERS_COMPENSATION = 'workers_compensation'
}

export enum InsuranceStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

export interface CreateInsuranceRequestDto {
  project_id: string;
  contractor_id: string;
  insurance_type: InsuranceType;
  provider: string;
  policy_number: string;
  coverage_amount: number;
  start_date: string;
  valid_until: string;
  status: InsuranceStatus;
  documents?: string[];
  notes?: string;
}

export interface UpdateInsuranceRequestDto {
  status?: InsuranceStatus;
  notes?: string;
  documents?: string[];
}

export interface InsuranceStatistics {
  totalCertificates: number;
  activeCertificates: number;
  expiredCertificates: number;
  expiringSoonCertificates: number;
  totalCoverage: number;
}

export interface InsuranceAlert {
  certificateId: string;
  projectId: string;
  contractorId: string;
  insuranceType: string;
  provider: string;
  expiryDate: string;
  alertLevel: 'expired' | 'critical' | 'warning' | 'info';
  daysUntilExpiry: number;
}
