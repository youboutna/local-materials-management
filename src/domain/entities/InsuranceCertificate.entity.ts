/**
 * Insurance Certificate Entity - Domain Layer
 * Pure business object representing an insurance certificate
 */

export interface InsuranceCertificateEntity {
  id: string;
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  insurance_company: string;
  policy_number: string;
  coverage_amount: number;
  coverage_type: 'responsabilite_civile' | 'decennale' | 'vehicules' | 'materiel' | 'tous_risques';
  valid_from: string;
  valid_until: string;
  certificate_url?: string;
  status: 'active' | 'expired' | 'expiring_soon' | 'missing';
  last_verified?: string;
  verified_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
