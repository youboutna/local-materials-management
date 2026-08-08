/**
 * Insurance Certificate DTO
 * Data Transfer Object for insurance certificate operations
 * Used by UI components and hooks - NO domain dependencies
 * Following PROMPTS.md naming conventions
 */

import { BaseEntityDTO } from '../shared';

export interface InsuranceCertificateDTO extends BaseEntityDTO {
  id: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceType: 'responsabilite_civile' | 'decennale' | 'vehicules' | 'materiel' | 'tous_risques';
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  coverageType?: string;
  validFrom: string;
  validUntil: string;
  status: 'active' | 'expired' | 'expiring_soon' | 'missing';
  notes?: string;
  certificateUrl?: string;
  createdAt: string;
  updatedAt: string;
  
  // Legacy snake_case aliases for backward compatibility (PROMPTS.md Pattern 2)
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

export interface InsuranceCertificateFormData {
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  coverageType: 'responsabilite_civile' | 'decennale' | 'vehicules' | 'materiel' | 'tous_risques';
  validFrom: string;
  validUntil: string;
  status: 'active' | 'expired' | 'expiring_soon' | 'missing';
  notes?: string;
  
  // Legacy snake_case aliases for backward compatibility
  project_id?: string;
  contractor_id?: string;
  contractor_name?: string;
  insurance_company?: string;
  policy_number?: string;
  coverage_amount?: number;
  coverage_type?: string;
  valid_from?: string;
  valid_until?: string;
}

export interface InsuranceCertificateCreateData extends InsuranceCertificateFormData {
  uploadedBy?: string;
  
  // Legacy snake_case aliases for backward compatibility
  uploaded_by?: string;
}

export interface InsuranceCertificateUpdateData {
  contractorName?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  coverageAmount?: number;
  coverageType?: 'responsabilite_civile' | 'decennale' | 'vehicules' | 'materiel' | 'tous_risques';
  validFrom?: string;
  validUntil?: string;
  status?: 'active' | 'expired' | 'expiring_soon' | 'missing';
  notes?: string;
  certificateUrl?: string;
  updatedBy?: string;
  
  // Legacy snake_case aliases for backward compatibility
  contractor_name?: string;
  insurance_company?: string;
  policy_number?: string;
  coverage_amount?: number;
  coverage_type?: string;
  valid_from?: string;
  valid_until?: string;
  certificate_url?: string;
  updated_by?: string;
}

export interface InsuranceCertificateFilterData {
  projectId?: string;
  contractorId?: string;
  status?: 'active' | 'expired' | 'expiring_soon' | 'missing';
  coverageType?: 'responsabilite_civile' | 'decennale' | 'vehicules' | 'materiel' | 'tous_risques';
  searchTerm?: string;
  expiringSoonDays?: number;
  
  // Legacy snake_case aliases for backward compatibility
  project_id?: string;
  contractor_id?: string;
  coverage_type?: string;
  search_term?: string;
  expiring_soon_days?: number;
}
