/**
 * Insurance Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO } from '../shared';

// Enum types for insurance
export type InsuranceType = 'responsabilite_civile' | 'decennale' | 'vehicules' | 'materiel' | 'tous_risques';
export type InsuranceStatus = 'active' | 'expired' | 'expiring_soon' | 'missing' | 'pending';

export interface InsuranceCertificateDTO extends BaseEntityDTO {
  id: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceType: InsuranceType | string;
  insuranceCompany?: string;
  provider?: string;
  policyNumber: string;
  coverageAmount: number;
  coverageType?: string;
  validFrom: string;
  validUntil: string;
  startDate?: string;
  endDate?: string;
  documents?: string[];
  status?: InsuranceStatus | string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Legacy snake_case aliases for compatibility
  project_id?: string;
  contractor_id?: string;
  contractor_name?: string;
  insurance_company?: string;
  policy_number?: string;
  coverage_amount?: number;
  coverage_type?: string;
  valid_from?: string;
  valid_until?: string;
  created_at?: string;
  updated_at?: string;
}

export type CreateInsuranceCertificateDTO = Omit<InsuranceCertificateDTO, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInsuranceCertificateDTO = Partial<CreateInsuranceCertificateDTO>;

// Legacy exports for backward compatibility
export type InsuranceCertificate = InsuranceCertificateDTO;
export type CreateInsuranceData = CreateInsuranceCertificateDTO;
export type UpdateInsuranceData = UpdateInsuranceCertificateDTO;

// Request DTOs for service layer
export interface CreateInsuranceRequestDTO {
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceType: InsuranceType | string;
  insuranceCompany?: string;
  policyNumber: string;
  coverageAmount: number;
  coverageType?: string;
  validFrom: string;
  validUntil: string;
  notes?: string;
}

export interface UpdateInsuranceRequestDTO {
  insuranceType?: InsuranceType | string;
  insuranceCompany?: string;
  policyNumber?: string;
  coverageAmount?: number;
  coverageType?: string;
  validFrom?: string;
  validUntil?: string;
  status?: InsuranceStatus | string;
  notes?: string;
}

export interface InsuranceStatisticsDTO {
  totalCertificates: number;
  activeCertificates: number;
  expiredCertificates: number;
  expiringSoonCertificates: number;
  totalCoverageAmount: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface InsuranceAlertDTO {
  id: string;
  certificateId: string;
  type: 'expiring' | 'expired' | 'missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  daysUntilExpiry?: number;
  projectId?: string;
  contractorId?: string;
  createdAt: string;
}

export interface InsuranceFilterDTO {
  projectId?: string;
  status?: InsuranceStatus | string;
  type?: InsuranceType | string;
  expiringWithin?: number; // days
  contractorId?: string;
}
