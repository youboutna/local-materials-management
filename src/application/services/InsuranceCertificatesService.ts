/**
 * Insurance Certificates Service
 * Business logic for insurance certificate operations
 * Uses centralized DTOs and transformers to avoid circular dependencies
 */

import { IInsuranceRepository } from '@/domain/repositories/IInsuranceRepository';
import { IStorageRepository } from '@/domain/repositories/IStorageRepository';
import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { insuranceTransform } from '@/dtos/transforms/insuranceTransform';
import { 
  InsuranceCertificateDTO, 
  InsuranceCertificateFormData,
  InsuranceCertificateCreateData,
  InsuranceCertificateUpdateData 
} from '@/dtos/entities/InsuranceCertificateDTO';

export class InsuranceCertificatesService {
  constructor(
    private insuranceRepository = RepositoryFactory.getInsuranceRepository(),
    private storageRepository = RepositoryFactory.getStorageRepository(),
    private authRepository = RepositoryFactory.getAuthRepository()
  ) {}

  async getCertificates(projectId?: string): Promise<InsuranceCertificateDTO[]> {
    try {
      // Use insurance repository to fetch certificates
      const certificates = projectId 
        ? await this.insuranceRepository.getByProjectId(projectId)
        : await this.insuranceRepository.getActiveCertificates();
      
      // Use centralized transformer to convert entities to DTOs
      return insuranceTransform.toDTOArray(certificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
  }

  async createCertificate(data: InsuranceCertificateFormData): Promise<InsuranceCertificateDTO> {
    try {
      const authResult = await this.authRepository.getCurrentUser();
      const userId = authResult?.user?.id || 'system';
      
      // Use transformer to convert form data to entity
      const entityData = insuranceTransform.formDataToEntity(data, userId);
      
      // Create certificate using repository's create method
      const certificate = await this.insuranceRepository.create(entityData);

      // Convert entity back to DTO using transformer
      return insuranceTransform.toDTO(certificate);
    } catch (error) {
      console.error('Error creating certificate:', error);
      throw error;
    }
  }

  async updateCertificate(id: string, data: InsuranceCertificateUpdateData): Promise<void> {
    try {
      const authResult = await this.authRepository.getCurrentUser();
      const userId = authResult?.user?.id || 'system';
      
      // Use transformer to convert update data to entity
      const updateData = insuranceTransform.updateDataToEntity({
        ...data,
        updated_by: userId
      });
      
      await this.insuranceRepository.update(id, updateData);
    } catch (error) {
      console.error('Error updating certificate:', error);
      throw error;
    }
  }

  async deleteCertificate(id: string): Promise<void> {
    try {
      await this.insuranceRepository.delete(id);
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw error;
    }
  }

  async uploadCertificateFile(certificateId: string, file: File): Promise<string> {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `insurance/${certificateId}/${fileName}`;

      // Upload file using storage repository with bucket
      const { result, error } = await this.storageRepository.uploadFile('documents', filePath, file);
      
      if (error || !result) {
        throw error || new Error('Upload failed');
      }
      
      return result.publicUrl;
    } catch (error) {
      console.error('Error uploading certificate file:', error);
      throw error;
    }
  }

  async getCertificateUrl(certificateId: string, fileName: string): Promise<string> {
    try {
      const filePath = `insurance/${certificateId}/${fileName}`;
      return this.storageRepository.getPublicUrl('documents', filePath);
    } catch (error) {
      console.error('Error getting certificate URL:', error);
      throw error;
    }
  }

  async validateCertificate(certificateId: string): Promise<void> {
    try {
      await this.insuranceRepository.update(certificateId, {
        status: 'active',
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error validating certificate:', error);
      throw error;
    }
  }

  async expireCertificate(certificateId: string): Promise<void> {
    try {
      await this.insuranceRepository.update(certificateId, {
        status: 'expired',
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error expiring certificate:', error);
      throw error;
    }
  }

  static create(): InsuranceCertificatesService {
    return new InsuranceCertificatesService();
  }
}
