// ============================================================
// src/dtos/transforms/insuranceTransform.ts
// ============================================================
/**
 * Insurance Certificate Transformer
 * Centralized mapping between Domain Entity and DTO
 * NO UI dependencies - pure transformation logic
 * 
 * Hexagonal Flow:
 * UI Component → DTO → Transformer → Entity → Service → Repository → DB
 * 
 * Nom: insuranceTransform (pour compatibilité avec le reste du code)
 */

import { InsuranceCertificateEntity } from '@/domain/entities/InsuranceCertificate.entity';
import { 
  InsuranceCertificateDTO,
  InsuranceCertificateStatus,
  InsuranceType,
  CreateInsuranceCertificateDTO,
  UpdateInsuranceCertificateDTO,
  InsuranceCertificateFormData,
  getInsuranceStatusLabel,
  getInsuranceTypeLabel,
  getInsuranceStatusColor
} from '@/dtos/entities/InsuranceDTO';

// ============================================================
// Transformer
// ============================================================

export const insuranceTransform = {
  /**
   * Entity → DTO (for UI/Hooks)
   */
  toDTO: (entity: InsuranceCertificateEntity): InsuranceCertificateDTO => {
    // Déterminer le statut à partir des dates si nécessaire
    let status = entity.status;
    if (!status || status === 'active') {
      const now = new Date();
      const validUntil = new Date(entity.valid_until || '');
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      if (validUntil < now) {
        status = 'expired' as InsuranceCertificateStatus;
      } else if (validUntil <= thirtyDaysFromNow) {
        status = 'expiring_soon' as InsuranceCertificateStatus;
      } else {
        status = 'active' as InsuranceCertificateStatus;
      }
    }

    return {
      id: entity.id,
      projectId: entity.project_id || '',
      contractorId: entity.contractor_id || '',
      contractorName: entity.contractor_name || '',
      insuranceType: (entity.coverage_type || entity.insurance_type || 'responsabilite_civile') as InsuranceType,
      insuranceCompany: entity.insurance_company || '',
      policyNumber: entity.policy_number || '',
      coverageAmount: entity.coverage_amount || 0,
      coverageType: entity.coverage_type || entity.insurance_type,
      validFrom: entity.valid_from || '',
      validUntil: entity.valid_until || '',
      status: status,
      notes: entity.notes,
      certificateUrl: entity.certificate_url,
      createdAt: entity.created_at || new Date().toISOString(),
      updatedAt: entity.updated_at || new Date().toISOString(),
      createdBy: entity.created_by,
      updatedBy: entity.updated_by,
      lastVerified: entity.last_verified,
      verifiedBy: entity.verified_by,
      // Legacy snake_case aliases
      project_id: entity.project_id,
      contractor_id: entity.contractor_id,
      contractor_name: entity.contractor_name,
      insurance_company: entity.insurance_company,
      policy_number: entity.policy_number,
      coverage_amount: entity.coverage_amount,
      coverage_type: entity.coverage_type,
      valid_from: entity.valid_from,
      valid_until: entity.valid_until,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      created_by: entity.created_by,
      updated_by: entity.updated_by,
      certificate_url: entity.certificate_url,
    };
  },

  /**
   * DTO → Entity (for Services)
   */
  toEntity: (dto: InsuranceCertificateDTO): InsuranceCertificateEntity => {
    // Déterminer le statut à partir des dates si nécessaire
    let status = dto.status;
    if (!status || status === 'active') {
      const now = new Date();
      const validUntil = new Date(dto.validUntil || dto.valid_until || '');
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      if (validUntil < now) {
        status = 'expired' as InsuranceCertificateStatus;
      } else if (validUntil <= thirtyDaysFromNow) {
        status = 'expiring_soon' as InsuranceCertificateStatus;
      } else {
        status = 'active' as InsuranceCertificateStatus;
      }
    }

    return {
      id: dto.id,
      project_id: dto.project_id || dto.projectId || '',
      contractor_id: dto.contractor_id || dto.contractorId || '',
      contractor_name: dto.contractor_name || dto.contractorName || '',
      insurance_company: dto.insurance_company || dto.insuranceCompany || '',
      policy_number: dto.policy_number || dto.policyNumber || '',
      coverage_amount: dto.coverage_amount ?? dto.coverageAmount ?? 0,
      coverage_type: (dto.coverage_type || dto.coverageType || dto.insuranceType) as any,
      insurance_type: (dto.insuranceType) as any,
      valid_from: dto.valid_from || dto.validFrom || '',
      valid_until: dto.valid_until || dto.validUntil || '',
      status: status,
      notes: dto.notes,
      certificate_url: dto.certificateUrl,
      created_at: dto.created_at || dto.createdAt || new Date().toISOString(),
      updated_at: dto.updated_at || dto.updatedAt || new Date().toISOString(),
      created_by: dto.createdBy,
      updated_by: dto.updatedBy,
      last_verified: dto.lastVerified,
      verified_by: dto.verifiedBy,
    };
  },

  /**
   * Create Data → Entity (for Service creation)
   */
  createDataToEntity: (
    createData: CreateInsuranceCertificateDTO, 
    uploadedBy?: string
  ): Omit<InsuranceCertificateEntity, 'id' | 'created_at' | 'updated_at'> => {
    const now = new Date().toISOString();
    const validUntil = new Date(createData.validUntil || createData.valid_until || '');
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    let status: InsuranceCertificateStatus = 'active';
    if (validUntil < new Date()) {
      status = 'expired';
    } else if (validUntil <= thirtyDaysFromNow) {
      status = 'expiring_soon';
    }

    return {
      project_id: createData.project_id || createData.projectId || '',
      contractor_id: createData.contractor_id || createData.contractorId || '',
      contractor_name: createData.contractor_name || createData.contractorName || '',
      insurance_company: createData.insurance_company || createData.insuranceCompany || '',
      policy_number: createData.policy_number || createData.policyNumber || '',
      coverage_amount: createData.coverage_amount ?? createData.coverageAmount ?? 0,
      coverage_type: (createData.coverage_type || createData.coverageType || createData.insuranceType) as any,
      insurance_type: (createData.insuranceType) as any,
      valid_from: createData.valid_from || createData.validFrom || now,
      valid_until: createData.valid_until || createData.validUntil || '',
      status: createData.status || status,
      notes: createData.notes,
      certificate_url: createData.certificate_url || createData.certificateUrl,
      created_by: uploadedBy,
      updated_by: uploadedBy,
      last_verified: now,
      verified_by: uploadedBy,
    };
  },

  /**
   * Update Data → Partial Entity (for Service updates)
   */
  updateDataToEntity: (
    updateData: UpdateInsuranceCertificateDTO
  ): Partial<InsuranceCertificateEntity> => {
    const now = new Date().toISOString();
    
    return {
      contractor_name: updateData.contractor_name || updateData.contractorName,
      insurance_company: updateData.insurance_company || updateData.insuranceCompany,
      policy_number: updateData.policy_number || updateData.policyNumber,
      coverage_amount: updateData.coverage_amount ?? updateData.coverageAmount,
      coverage_type: (updateData.coverage_type || updateData.coverageType) as any,
      insurance_type: (updateData.insuranceType) as any,
      valid_from: updateData.valid_from || updateData.validFrom,
      valid_until: updateData.valid_until || updateData.validUntil,
      status: updateData.status,
      notes: updateData.notes,
      certificate_url: updateData.certificate_url || updateData.certificateUrl,
      updated_by: updateData.updatedBy,
      updated_at: now,
    };
  },

  /**
   * Form Data → Entity (persistance directe via repository)
   */
  formDataToEntity: (
    formData: InsuranceCertificateFormData,
    userId = 'system'
  ): InsuranceCertificateEntity => {
    const now = new Date().toISOString();
    return {
      id: '',
      project_id: formData.projectId,
      contractor_id: formData.contractorId,
      contractor_name: formData.contractorName,
      insurance_company: formData.insuranceCompany,
      policy_number: formData.policyNumber,
      coverage_amount: formData.coverageAmount,
      coverage_type: formData.coverageType,
      insurance_type: formData.coverageType,
      valid_from: formData.validFrom,
      valid_until: formData.validUntil,
      status: formData.status,
      notes: formData.notes,
      created_at: now,
      updated_at: now,
      created_by: userId,
      updated_by: userId,
    };
  },

  /**
   * Form Data → Create Data
   */
  formDataToCreateData: (
    formData: InsuranceCertificateFormData
  ): CreateInsuranceCertificateDTO => ({
    projectId: formData.projectId,
    contractorId: formData.contractorId,
    contractorName: formData.contractorName,
    insuranceType: formData.coverageType as InsuranceType,
    insuranceCompany: formData.insuranceCompany,
    policyNumber: formData.policyNumber,
    coverageAmount: formData.coverageAmount,
    coverageType: formData.coverageType,
    validFrom: formData.validFrom,
    validUntil: formData.validUntil,
    status: formData.status,
    notes: formData.notes,
    // Legacy
    project_id: formData.projectId,
    contractor_id: formData.contractorId,
    contractor_name: formData.contractorName,
    insurance_company: formData.insuranceCompany,
    policy_number: formData.policyNumber,
    coverage_amount: formData.coverageAmount,
    coverage_type: formData.coverageType,
    valid_from: formData.validFrom,
    valid_until: formData.validUntil,
  }),

  /**
   * Entity Array → DTO Array
   */
  toDTOArray: (entities: InsuranceCertificateEntity[]): InsuranceCertificateDTO[] => 
    entities.map(entity => insuranceTransform.toDTO(entity)),

  /**
   * DTO Array → Entity Array
   */
  toEntityArray: (dtos: InsuranceCertificateDTO[]): InsuranceCertificateEntity[] => 
    dtos.map(dto => insuranceTransform.toEntity(dto)),

  /**
   * Get status label
   */
  getStatusLabel: (status: InsuranceCertificateStatus): string => 
    getInsuranceStatusLabel(status),

  /**
   * Get type label
   */
  getTypeLabel: (type: InsuranceType | string): string => 
    getInsuranceTypeLabel(type),

  /**
   * Get status color for UI
   */
  getStatusColor: (status: InsuranceCertificateStatus): string => 
    getInsuranceStatusColor(status),

  /**
   * Check if certificate is active
   */
  isActive: (dto: InsuranceCertificateDTO): boolean => {
    const status = dto.status;
    return status === 'active' || status === 'verified' || status === 'approved';
  },

  /**
   * Check if certificate is expiring soon
   */
  isExpiringSoon: (dto: InsuranceCertificateDTO, daysThreshold: number = 30): boolean => {
    const validUntil = dto.validUntil || dto.valid_until || '';
    if (!validUntil) return false;
    const expiryDate = new Date(validUntil);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= daysThreshold && diffDays >= 0;
  },

  /**
   * Check if certificate is expired
   */
  isExpired: (dto: InsuranceCertificateDTO): boolean => {
    const validUntil = dto.validUntil || dto.valid_until || '';
    if (!validUntil) return true;
    const expiryDate = new Date(validUntil);
    const now = new Date();
    return expiryDate < now;
  },

  /**
   * Get days until expiry
   */
  getDaysUntilExpiry: (dto: InsuranceCertificateDTO): number => {
    const validUntil = dto.validUntil || dto.valid_until || '';
    if (!validUntil) return -1;
    const expiryDate = new Date(validUntil);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Calculate certificate status from dates
   */
  calculateStatus: (validUntil: string, currentStatus?: InsuranceCertificateStatus): InsuranceCertificateStatus => {
    if (!validUntil) return 'missing';
    
    const expiryDate = new Date(validUntil);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    if (currentStatus && ['cancelled', 'archived', 'rejected'].includes(currentStatus)) {
      return currentStatus;
    }
    
    if (expiryDate < now) {
      return 'expired';
    } else if (expiryDate <= thirtyDaysFromNow) {
      return 'expiring_soon';
    } else {
      return 'active';
    }
  }
};

// ============================================================
// Export for backward compatibility
// ============================================================

export const InsuranceTransformer = insuranceTransform;
export default insuranceTransform;