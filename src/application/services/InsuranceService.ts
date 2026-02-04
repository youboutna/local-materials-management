/**
 * Insurance Service - Hexagonal Architecture
 * Business logic for insurance certificate management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IInsuranceRepository } from '@/domain/repositories/IInsuranceRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { NotificationService } from '@/application/services/NotificationService';
import { InsuranceCertificateEntity } from '@/domain/entities/InsuranceCertificate.entity';
import { InsuranceCertificateDTO } from '@/dtos/entities/InsuranceCertificateDTO';
import {
  InsuranceType,
  InsuranceStatus,
  CreateInsuranceRequestDto,
  UpdateInsuranceRequestDto,
  InsuranceStatistics,
  InsuranceAlert
} from '@/dtos/entities/InsuranceDTO';

export class InsuranceService {
  constructor(
    private insuranceRepository: IInsuranceRepository,
    private notificationService: NotificationService
  ) {}

  private mapEntityToDTO(entity: InsuranceCertificateEntity): InsuranceCertificateDTO {
    return {
      id: entity.id,
      project_id: entity.project_id,
      contractor_id: entity.contractor_id,
      contractor_name: entity.contractor_name,
      insurance_company: entity.insurance_company,
      policy_number: entity.policy_number,
      coverage_amount: entity.coverage_amount,
      coverage_type: entity.coverage_type,
      valid_from: entity.valid_from,
      valid_until: entity.valid_until,
      status: entity.status,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    };
  }

  async detectExpiringInsurance(daysThreshold: number = 30): Promise<InsuranceAlert[]> {
    try {
      const expiringCerts = await this.insuranceRepository.getExpiringSoon(daysThreshold);
      return expiringCerts.map(cert => {
        const endDate = new Date(cert.valid_until);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        let alertLevel: InsuranceAlert['alertLevel'] = 'info';
        if (daysUntilExpiry <= 0) alertLevel = 'expired';
        else if (daysUntilExpiry <= 7) alertLevel = 'critical';
        else if (daysUntilExpiry <= 14) alertLevel = 'warning';
        return {
          certificateId: cert.id,
          projectId: cert.project_id,
          contractorId: cert.contractor_id,
          insuranceType: cert.coverage_type,
          provider: cert.insurance_company,
          expiryDate: cert.valid_until,
          alertLevel,
          daysUntilExpiry
        };
      });
    } catch (error) {
      console.error('InsuranceService.detectExpiringInsurance failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to detect expiring insurance');
    }
  }

  async getInsuranceCertificates(projectId?: string): Promise<InsuranceCertificateDTO[]> {
    try {
      const certificates = projectId
        ? await this.insuranceRepository.getByProjectId(projectId)
        : await this.insuranceRepository.getActiveCertificates();
      return certificates.map(cert => this.mapEntityToDTO(cert));
    } catch (error) {
      console.error('InsuranceService.getInsuranceCertificates failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get insurance certificates');
    }
  }

  async getInsuranceStatistics(projectId: string): Promise<InsuranceStatistics> {
    try {
      const certificates = await this.getInsuranceCertificates(projectId);
      return {
        totalCertificates: certificates.length,
        activeCertificates: certificates.filter(c => c.status === InsuranceStatus.ACTIVE).length,
        expiredCertificates: certificates.filter(c => c.status === InsuranceStatus.EXPIRED).length,
        expiringSoonCertificates: certificates.filter(c => this.isExpiringSoon(c)).length,
        totalCoverage: certificates.reduce((sum, c) => sum + c.coverage_amount, 0)
      };
    } catch (error) {
      console.error('InsuranceService.getInsuranceStatistics failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get insurance statistics');
    }
  }

  isExpiringSoon(certificate: InsuranceCertificateDTO, daysThreshold: number = 30): boolean {
    const endDate = new Date(certificate.valid_until);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
  }

  validateInsuranceData(data: Partial<CreateInsuranceRequestDto>): { isValid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};
    
    if (!data.project_id) errors.project_id = ['Project ID required'];
    if (!data.contractor_id) errors.contractor_id = ['Contractor ID required'];
    
    if (!data.insurance_type || !Object.values(InsuranceType).includes(data.insurance_type)) {
      errors.insurance_type = ['Valid insurance type required'];
    }
    
    if (!data.provider || data.provider.trim().length === 0) errors.provider = ['Provider required'];
    if (!data.policy_number || data.policy_number.trim().length === 0) errors.policy_number = ['Policy number required'];
    
    if (!data.coverage_amount || data.coverage_amount <= 0) {
      errors.coverage_amount = ['Coverage amount must be positive'];
    }
    
    if (!data.start_date || !this.isValidDate(data.start_date)) errors.start_date = ['Valid start date required'];
    if (!data.valid_until || !this.isValidDate(data.valid_until)) errors.valid_until = ['Valid expiry date required'];
    
    if (data.status && !Object.values(InsuranceStatus).includes(data.status)) {
      errors.status = ['Invalid status value'];
    }
    
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  private isValidDate(dateString: string): boolean {
    return !isNaN(Date.parse(dateString));
  }

  private isValidStatusTransition(current: InsuranceStatus, next: InsuranceStatus): boolean {
    const validTransitions: Record<InsuranceStatus, InsuranceStatus[]> = {
      [InsuranceStatus.PENDING]: [InsuranceStatus.ACTIVE, InsuranceStatus.EXPIRED],
      [InsuranceStatus.ACTIVE]: [InsuranceStatus.EXPIRED],
      [InsuranceStatus.EXPIRED]: []
    };
    
    if (!current || !next) return false;
    
    return validTransitions[current].includes(next);
  }
}
