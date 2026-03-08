/**
 * Insurance Certificate Transformer
 * Centralized mapping between Domain Entity and DTO
 * NO UI dependencies - pure transformation logic
 */

import { InsuranceCertificateEntity } from '@/domain/entities/InsuranceCertificate.entity';
import { 
  InsuranceCertificateDTO, 
  InsuranceCertificateFormData,
  InsuranceCertificateCreateData,
  InsuranceCertificateUpdateData 
} from '@/dtos/entities/InsuranceCertificateDTO';


export const insuranceTransform = {
  /**
   * Entity → DTO (for UI/Hooks)
   */
  toDTO: (entity: InsuranceCertificateEntity): InsuranceCertificateDTO => ({
    id: entity.id,
    projectId: entity.project_id || '',
    contractorId: entity.contractor_id || '',
    contractorName: entity.contractor_name || '',
    insuranceType: (entity.coverage_type as any) || 'responsabilite_civile',
    insuranceCompany: entity.insurance_company || '',
    policyNumber: entity.policy_number || '',
    coverageAmount: entity.coverage_amount || 0,
    coverageType: entity.coverage_type,
    validFrom: entity.valid_from || '',
    validUntil: entity.valid_until || '',
    status: (entity.status as any) || 'active',
    notes: entity.notes,
    certificateUrl: entity.certificate_url,
    createdAt: entity.created_at || '',
    updatedAt: entity.updated_at || '',
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
    updated_at: entity.updated_at
  }),

  /**
   * DTO → Entity (for Services)
   */
  toEntity: (dto: InsuranceCertificateDTO): InsuranceCertificateEntity => ({
    id: dto.id,
    project_id: dto.project_id || dto.projectId,
    contractor_id: dto.contractor_id || dto.contractorId,
    contractor_name: dto.contractor_name || dto.contractorName,
    insurance_company: dto.insurance_company || dto.insuranceCompany,
    policy_number: dto.policy_number || dto.policyNumber,
    coverage_amount: dto.coverage_amount ?? dto.coverageAmount,
    coverage_type: (dto.coverage_type || dto.coverageType || dto.insuranceType) as any,
    valid_from: dto.valid_from || dto.validFrom,
    valid_until: dto.valid_until || dto.validUntil,
    status: dto.status,
    notes: dto.notes,
    certificate_url: dto.certificateUrl,
    created_at: dto.created_at || dto.createdAt,
    updated_at: dto.updated_at || dto.updatedAt
  }),

  /**
   * FormData → Entity (for Service creation)
   */
  formDataToEntity: (formData: InsuranceCertificateFormData, uploadedBy?: string): Omit<InsuranceCertificateEntity, 'id' | 'created_at' | 'updated_at'> => ({
    project_id: formData.project_id || formData.projectId,
    contractor_id: formData.contractor_id || formData.contractorId,
    contractor_name: formData.contractor_name || formData.contractorName,
    insurance_company: formData.insurance_company || formData.insuranceCompany,
    policy_number: formData.policy_number || formData.policyNumber,
    coverage_amount: formData.coverage_amount ?? formData.coverageAmount,
    coverage_type: (formData.coverage_type || formData.coverageType) as any,
    valid_from: formData.valid_from || formData.validFrom,
    valid_until: formData.valid_until || formData.validUntil,
    status: formData.status,
    notes: formData.notes,
    certificate_url: undefined,
    uploaded_by: uploadedBy
  }),

  /**
   * UpdateData → Partial Entity (for Service updates)
   */
  updateDataToEntity: (updateData: InsuranceCertificateUpdateData): Partial<InsuranceCertificateEntity> => ({
    contractor_name: updateData.contractor_name || updateData.contractorName,
    insurance_company: updateData.insurance_company || updateData.insuranceCompany,
    policy_number: updateData.policy_number || updateData.policyNumber,
    coverage_amount: updateData.coverage_amount ?? updateData.coverageAmount,
    coverage_type: updateData.coverage_type || updateData.coverageType,
    valid_from: updateData.valid_from || updateData.validFrom,
    valid_until: updateData.valid_until || updateData.validUntil,
    status: updateData.status,
    notes: updateData.notes,
    updated_by: updateData.updated_by || updateData.updatedBy,
    updated_at: new Date().toISOString()
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
    dtos.map(dto => insuranceTransform.toEntity(dto))
};
