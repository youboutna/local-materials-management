/**
 * Insurance Certificate Entity - Domain Layer
 * Pure business object representing an insurance certificate
 */

import type { InsuranceCertificateStatus, InsuranceType } from '@/dtos/entities/InsuranceDTO';

export interface InsuranceCertificateEntity {
  id: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  coverageType: InsuranceType | string;
  insuranceType?: InsuranceType | string;
  validFrom: string;
  validUntil: string;
  certificateUrl?: string;
  status: InsuranceCertificateStatus | string;
  lastVerified?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}
