/**
 * Insurance Certificate Transformer
 * Centralized mapping between Domain Entity and DTO
 * NO UI dependencies - pure transformation logic
 */

import { InsuranceCertificateEntity } from '@/types/insurance.entity';
import { 
  InsuranceCertificateDTO, 
  InsuranceCertificateFormData,
  InsuranceCertificateCreateData,
  InsuranceCertificateUpdateData 
} from '@/dtos/entities/InsuranceCertificateDTO';

export const insuranceTransform = {
  /**
   * Entity → DTO (for UI/Hooks)
   * Maps domain entity to DTO without UI dependencies
   */
  toDTO: (entity: InsuranceCertificateEntity): InsuranceCertificateDTO => ({
    id: entity.id,
    project_id: entity.project_id || '',
    contractor_id: entity.contractor_id || '',
    contractor_name: entity.contractor_name || '',
    insurance_company: entity.insurance_company || '',
    policy_number: entity.policy_number || '',
    coverage_amount: entity.coverage_amount || 0,
    coverage_type: entity.coverage_type || '',
    valid_from: entity.valid_from || '',
    valid_until: entity.valid_until || '',
    status: entity.status || 'active',
    notes: entity.notes,
    certificate_url: entity.certificate_url,
    created_at: entity.created_at,
    updated_at: entity.updated_at
  }),

  /**
   * DTO → Entity (for Services)
   * Maps DTO to domain entity without UI dependencies
   */
  toEntity: (dto: InsuranceCertificateDTO): InsuranceCertificateEntity => ({
    id: dto.id,
    project_id: dto.project_id,
    contractor_id: dto.contractor_id,
    contractor_name: dto.contractor_name,
    insurance_company: dto.insurance_company,
    policy_number: dto.policy_number,
    coverage_amount: dto.coverage_amount,
    coverage_type: dto.coverage_type,
    valid_from: dto.valid_from,
    valid_until: dto.valid_until,
    status: dto.status,
    notes: dto.notes,
    certificate_url: dto.certificate_url,
    created_at: dto.created_at,
    updated_at: dto.updated_at
  }),

  /**
   * FormData → Entity (for Service creation)
   * Maps form data to domain entity
   */
  formDataToEntity: (formData: InsuranceCertificateFormData, uploadedBy?: string): Omit<InsuranceCertificateEntity, 'id' | 'created_at' | 'updated_at'> => ({
    project_id: formData.project_id,
    contractor_id: formData.contractor_id,
    contractor_name: formData.contractor_name,
    insurance_company: formData.insurance_company,
    policy_number: formData.policy_number,
    coverage_amount: formData.coverage_amount,
    coverage_type: formData.coverage_type,
    valid_from: formData.valid_from,
    valid_until: formData.valid_until,
    status: formData.status,
    notes: formData.notes,
    certificate_url: undefined,
    uploaded_by: uploadedBy
  }),

  /**
   * UpdateData → Partial Entity (for Service updates)
   * Maps update data to partial entity
   */
  updateDataToEntity: (updateData: InsuranceCertificateUpdateData): Partial<InsuranceCertificateEntity> => ({
    contractor_name: updateData.contractor_name,
    insurance_company: updateData.insurance_company,
    policy_number: updateData.policy_number,
    coverage_amount: updateData.coverage_amount,
    coverage_type: updateData.coverage_type,
    valid_from: updateData.valid_from,
    valid_until: updateData.valid_until,
    status: updateData.status,
    notes: updateData.notes,
    updated_by: updateData.updated_by,
    updated_at: new Date().toISOString()
  }),

  /**
   * Entity Array → DTO Array (for batch operations)
   */
  toDTOArray: (entities: InsuranceCertificateEntity[]): InsuranceCertificateDTO[] => 
    entities.map(entity => insuranceTransform.toDTO(entity)),

  /**
   * DTO Array → Entity Array (for batch operations)
   */
  toEntityArray: (dtos: InsuranceCertificateDTO[]): InsuranceCertificateEntity[] => 
    dtos.map(dto => insuranceTransform.toEntity(dto))
};
