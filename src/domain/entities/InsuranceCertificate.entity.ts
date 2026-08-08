/**
 * Insurance Certificate Entity - Domain Layer
 * Pure business object representing an insurance certificate
 */

export interface InsuranceCertificateEntity {
  id: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  coverageType: 'responsabilite_civile' | 'decennale' | 'vehicules' | 'materiel' | 'tous_risques';
  validFrom: string;
  validUntil: string;
  certificateUrl?: string;
  status: 'active' | 'expired' | 'expiring_soon' | 'missing';
  lastVerified?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
