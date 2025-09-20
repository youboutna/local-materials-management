// Insurance Certificate DTO transformers
export interface InsuranceCertificateDTO {
  id: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  coverageType: string;
  validFrom: string;
  validUntil: string;
  status: string;
  certificateUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastVerified?: string;
  verifiedBy?: string;
}

export interface InsuranceAlertDTO {
  id: string;
  projectId: string;
  projectName: string;
  contractorId: string;
  contractorName: string;
  insuranceType: string;
  policyNumber: string;
  expiryDate: string;
  daysRemaining: number;
  alertLevel: 'warning' | 'critical' | 'urgent';
  createdAt: string;
}

export interface InsuranceActionDTO {
  id: string;
  insuranceId: string;
  projectId: string;
  actionType: 'task_assignment' | 'hierarchy_notification' | 'sms' | 'call' | 'email' | 'mail';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  recipientIds: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

// Transform database records to DTOs
export const transformInsuranceCertificateToDTO = (dbRecord: any): InsuranceCertificateDTO => {
  return {
    id: dbRecord.id,
    projectId: dbRecord.project_id,
    contractorId: dbRecord.contractor_id,
    contractorName: dbRecord.contractor_name,
    insuranceCompany: dbRecord.insurance_company,
    policyNumber: dbRecord.policy_number,
    coverageAmount: dbRecord.coverage_amount,
    coverageType: dbRecord.coverage_type,
    validFrom: dbRecord.valid_from,
    validUntil: dbRecord.valid_until,
    status: dbRecord.status,
    certificateUrl: dbRecord.certificate_url,
    notes: dbRecord.notes,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
    lastVerified: dbRecord.last_verified,
    verifiedBy: dbRecord.verified_by
  };
};

// Transform DTOs to database records
export const transformInsuranceCertificateFromDTO = (dto: Partial<InsuranceCertificateDTO>): any => {
  return {
    project_id: dto.projectId,
    contractor_id: dto.contractorId,
    contractor_name: dto.contractorName,
    insurance_company: dto.insuranceCompany,
    policy_number: dto.policyNumber,
    coverage_amount: dto.coverageAmount,
    coverage_type: dto.coverageType,
    valid_from: dto.validFrom,
    valid_until: dto.validUntil,
    status: dto.status,
    certificate_url: dto.certificateUrl,
    notes: dto.notes,
    last_verified: dto.lastVerified,
    verified_by: dto.verifiedBy
  };
};

export const createInsuranceAlertDTO = (
  certificate: any,
  project: any,
  daysRemaining: number
): InsuranceAlertDTO => {
  let alertLevel: 'warning' | 'critical' | 'urgent' = 'warning';
  
  if (daysRemaining <= 0) {
    alertLevel = 'urgent';
  } else if (daysRemaining <= 7) {
    alertLevel = 'critical';
  } else if (daysRemaining <= 30) {
    alertLevel = 'warning';
  }

  return {
    id: `alert-${certificate.id}-${Date.now()}`,
    projectId: certificate.project_id,
    projectName: project?.title || 'Projet inconnu',
    contractorId: certificate.contractor_id,
    contractorName: certificate.contractor_name,
    insuranceType: certificate.coverage_type,
    policyNumber: certificate.policy_number,
    expiryDate: certificate.valid_until,
    daysRemaining,
    alertLevel,
    createdAt: new Date().toISOString()
  };
};

export const validateInsuranceCertificateDTO = (dto: Partial<InsuranceCertificateDTO>): string[] => {
  const errors: string[] = [];

  if (!dto.projectId) errors.push('Project ID is required');
  if (!dto.contractorId) errors.push('Contractor ID is required');
  if (!dto.contractorName) errors.push('Contractor name is required');
  if (!dto.insuranceCompany) errors.push('Insurance company is required');
  if (!dto.policyNumber) errors.push('Policy number is required');
  if (!dto.coverageAmount || dto.coverageAmount <= 0) errors.push('Coverage amount must be greater than 0');
  if (!dto.coverageType) errors.push('Coverage type is required');
  if (!dto.validFrom) errors.push('Valid from date is required');
  if (!dto.validUntil) errors.push('Valid until date is required');

  // Validate dates
  if (dto.validFrom && dto.validUntil) {
    const validFrom = new Date(dto.validFrom);
    const validUntil = new Date(dto.validUntil);
    
    if (validFrom >= validUntil) {
      errors.push('Valid until date must be after valid from date');
    }
  }

  // Validate coverage types
  const validCoverageTypes = ['responsabilite_civile', 'decennale', 'vehicules', 'materiel', 'tous_risques'];
  if (dto.coverageType && !validCoverageTypes.includes(dto.coverageType)) {
    errors.push('Invalid coverage type');
  }

  return errors;
};

// Bulk transformation utilities
export const transformInsuranceCertificateListToDTO = (dbRecords: any[]): InsuranceCertificateDTO[] => {
  return dbRecords.map(transformInsuranceCertificateToDTO);
};

export const sortInsuranceCertificatesByExpiry = (certificates: InsuranceCertificateDTO[]): InsuranceCertificateDTO[] => {
  return [...certificates].sort((a, b) => 
    new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime()
  );
};

export const filterExpiringCertificates = (
  certificates: InsuranceCertificateDTO[], 
  daysAhead: number = 30
): InsuranceCertificateDTO[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
  
  return certificates.filter(cert => 
    new Date(cert.validUntil) <= cutoffDate &&
    cert.status === 'active'
  );
};

export const groupCertificatesByContractor = (
  certificates: InsuranceCertificateDTO[]
): Record<string, InsuranceCertificateDTO[]> => {
  return certificates.reduce((groups, cert) => {
    const key = cert.contractorId;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(cert);
    return groups;
  }, {} as Record<string, InsuranceCertificateDTO[]>);
};