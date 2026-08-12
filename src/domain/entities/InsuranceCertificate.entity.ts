/**
 * Insurance Certificate Entity - Domain Layer
 * Pure business object representing an insurance certificate
 */

import type { InsuranceCertificateStatus, InsuranceType } from '@/dtos/entities/InsuranceDTO';

export interface InsuranceCertificateEntity {
  id: string;
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  insurance_company: string;
  policy_number: string;
  coverage_amount: number;
  coverage_type: InsuranceType | string;
  insurance_type?: InsuranceType | string;
  valid_from: string;
  valid_until: string;
  certificate_url?: string;
  status: InsuranceCertificateStatus | string;
  last_verified?: string;
  verified_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}
