/**
 * Insurance Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO } from '../shared';

export interface InsuranceCertificateDTO extends BaseEntityDTO {
  id: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceType: string;
  provider?: string;
  policyNumber: string;
  coverageAmount: number;
  validFrom: string;
  validUntil: string;
  startDate?: string;
  endDate?: string;
  documents?: string[];
  status?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateInsuranceCertificateDTO = Omit<InsuranceCertificateDTO, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInsuranceCertificateDTO = Partial<CreateInsuranceCertificateDTO>;

// Legacy exports for backward compatibility
export type InsuranceCertificate = InsuranceCertificateDTO;
export type CreateInsuranceData = CreateInsuranceCertificateDTO;
export type UpdateInsuranceData = UpdateInsuranceCertificateDTO;

export interface InsuranceFilterDTO {
  projectId?: string;
  status?: string;
  expiringWithin?: number; // days
}
