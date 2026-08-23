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
      const validUntil = new Date(entity.validUntil || '');
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
      projectId: entity.projectId || '',
      contractorId: entity.contractorId || '',
      contractorName: entity.contractorName || '',
      insuranceType: (entity.coverageType || entity.insuranceType || 'responsabilite_civile') as InsuranceType,
      insuranceCompany: entity.insuranceCompany || '',
      policyNumber: entity.policyNumber || '',
      coverageAmount: entity.coverageAmount || 0,
      coverageType: entity.coverageType || entity.insuranceType,
      validFrom: entity.validFrom || '',
      validUntil: entity.validUntil || '',
      status: status,
      notes: entity.notes,
      certificateUrl: entity.certificateUrl,
      createdAt: entity.createdAt || new Date().toISOString(),
      updatedAt: entity.updatedAt || new Date().toISOString(),
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      lastVerified: entity.lastVerified,
      verifiedBy: entity.verifiedBy,
      // Legacy snake_case aliases
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
      const validUntil = new Date(dto.validUntil || dto.validUntil || '');
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
      projectId: dto.projectId || dto.projectId || '',
      contractorId: dto.contractorId || dto.contractorId || '',
      contractorName: dto.contractorName || dto.contractorName || '',
      insuranceCompany: dto.insuranceCompany || dto.insuranceCompany || '',
      policyNumber: dto.policyNumber || dto.policyNumber || '',
      coverageAmount: dto.coverageAmount ?? dto.coverageAmount ?? 0,
      coverageType: (dto.coverageType || dto.coverageType || dto.insuranceType) as any,
      insuranceType: (dto.insuranceType) as any,
      validFrom: dto.validFrom || dto.validFrom || '',
      validUntil: dto.validUntil || dto.validUntil || '',
      status: status,
      notes: dto.notes,
      certificateUrl: dto.certificateUrl,
      createdAt: dto.createdAt || dto.createdAt || new Date().toISOString(),
      updatedAt: dto.updatedAt || dto.updatedAt || new Date().toISOString(),
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy,
      lastVerified: dto.lastVerified,
      verifiedBy: dto.verifiedBy,
    };
  },

  /**
   * Create Data → Entity (for Service creation)
   */
  createDataToEntity: (
    createData: CreateInsuranceCertificateDTO, 
    uploadedBy?: string
  ): Omit<InsuranceCertificateEntity, 'id' | 'createdAt' | 'updatedAt'> => {
    const now = new Date().toISOString();
    const validUntil = new Date(createData.validUntil || createData.validUntil || '');
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    let status: InsuranceCertificateStatus = 'active';
    if (validUntil < new Date()) {
      status = 'expired';
    } else if (validUntil <= thirtyDaysFromNow) {
      status = 'expiring_soon';
    }

    return {
      projectId: createData.projectId || createData.projectId || '',
      contractorId: createData.contractorId || createData.contractorId || '',
      contractorName: createData.contractorName || createData.contractorName || '',
      insuranceCompany: createData.insuranceCompany || createData.insuranceCompany || '',
      policyNumber: createData.policyNumber || createData.policyNumber || '',
      coverageAmount: createData.coverageAmount ?? createData.coverageAmount ?? 0,
      coverageType: (createData.coverageType || createData.coverageType || createData.insuranceType) as any,
      insuranceType: (createData.insuranceType) as any,
      validFrom: createData.validFrom || createData.validFrom || now,
      validUntil: createData.validUntil || createData.validUntil || '',
      status: createData.status || status,
      notes: createData.notes,
      certificateUrl: createData.certificateUrl || createData.certificateUrl,
      createdBy: uploadedBy,
      updatedBy: uploadedBy,
      lastVerified: now,
      verifiedBy: uploadedBy,
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
      contractorName: updateData.contractorName || updateData.contractorName,
      insuranceCompany: updateData.insuranceCompany || updateData.insuranceCompany,
      policyNumber: updateData.policyNumber || updateData.policyNumber,
      coverageAmount: updateData.coverageAmount ?? updateData.coverageAmount,
      coverageType: (updateData.coverageType || updateData.coverageType) as any,
      insuranceType: (updateData.insuranceType) as any,
      validFrom: updateData.validFrom || updateData.validFrom,
      validUntil: updateData.validUntil || updateData.validUntil,
      status: updateData.status,
      notes: updateData.notes,
      certificateUrl: updateData.certificateUrl || updateData.certificateUrl,
      updatedBy: updateData.updatedBy,
      updatedAt: now,
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
      projectId: formData.projectId,
      contractorId: formData.contractorId,
      contractorName: formData.contractorName,
      insuranceCompany: formData.insuranceCompany,
      policyNumber: formData.policyNumber,
      coverageAmount: formData.coverageAmount,
      coverageType: formData.coverageType,
      insuranceType: formData.coverageType,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      status: formData.status,
      notes: formData.notes,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
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
    const validUntil = dto.validUntil || dto.validUntil || '';
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
    const validUntil = dto.validUntil || dto.validUntil || '';
    if (!validUntil) return true;
    const expiryDate = new Date(validUntil);
    const now = new Date();
    return expiryDate < now;
  },

  /**
   * Get days until expiry
   */
  getDaysUntilExpiry: (dto: InsuranceCertificateDTO): number => {
    const validUntil = dto.validUntil || dto.validUntil || '';
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