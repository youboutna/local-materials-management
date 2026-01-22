/**
 * Insurance Certificate DTO
 * Data Transfer Object for insurance certificate operations
 * Used by UI components and hooks - NO domain dependencies
 */

export interface InsuranceCertificateDTO {
  id: string;
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  insurance_company: string;
  policy_number: string;
  coverage_amount: number;
  coverage_type: string;
  valid_from: string;
  valid_until: string;
  status: 'active' | 'expired' | 'expiring_soon' | 'missing';
  notes?: string;
  certificate_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InsuranceCertificateFormData {
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  insurance_company: string;
  policy_number: string;
  coverage_amount: number;
  coverage_type: string;
  valid_from: string;
  valid_until: string;
  status: 'active' | 'expired' | 'expiring_soon' | 'missing';
  notes?: string;
}

export interface InsuranceCertificateCreateData extends InsuranceCertificateFormData {
  uploaded_by?: string;
}

export interface InsuranceCertificateUpdateData {
  contractor_name?: string;
  insurance_company?: string;
  policy_number?: string;
  coverage_amount?: number;
  coverage_type?: string;
  valid_from?: string;
  valid_until?: string;
  status?: 'active' | 'expired' | 'expiring_soon' | 'missing';
  notes?: string;
  certificate_url?: string;
  updated_by?: string;
}

export interface InsuranceCertificateFilterData {
  project_id?: string;
  contractor_id?: string;
  status?: 'active' | 'expired' | 'expiring_soon' | 'missing';
  coverage_type?: string;
  search_term?: string;
  expiring_soon_days?: number;
}
