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
  CreateInsuranceRequestDTO,
  UpdateInsuranceRequestDTO,
  InsuranceStatisticsDTO,
  InsuranceAlertDTO
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

  async detectExpiringInsurance(daysThreshold: number = 30): Promise<InsuranceAlertDTO[]> {
    try {
      const expiringCerts = await this.insuranceRepository.getExpiringSoon(daysThreshold);
      return expiringCerts.map(cert => {
        const endDate = new Date(cert.valid_until);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        let alertLevel: InsuranceAlertDTO['alertLevel'] = 'info';
        if (daysUntilExpiry <= 0) alertLevel = 'expired';
        else if (daysUntilExpiry <= 7) alertLevel = 'critical';
        else if (daysUntilExpiry <= 14) alertLevel = 'warning';
        return {
          policyId: cert.id,
          certificateId: cert.id,
          projectId: cert.project_id,
          contractorId: cert.contractor_id,
          insuranceType: cert.coverage_type as InsuranceType,
          insurerName: cert.insurance_company,
          expiryDate: cert.valid_until,
          alertLevel,
          daysUntilExpiry,
          message: `Insurance expires in ${daysUntilExpiry} days`,
          acknowledged: false
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

  async getInsuranceStatistics(projectId: string): Promise<InsuranceStatisticsDTO> {
    try {
      const certificates = await this.getInsuranceCertificates(projectId);
      return {
        totalPolicies: certificates.length,
        activePolicies: certificates.filter(c => c.status === InsuranceStatus.ACTIVE).length,
        expiredPolicies: certificates.filter(c => c.status === InsuranceStatus.EXPIRED).length,
        expiringSoonPolicies: certificates.filter(c => this.isExpiringSoon(c)).length,
        totalCoverage: certificates.reduce((sum, c) => sum + c.coverage_amount, 0),
        totalClaims: 0,
        claimsPaid: 0,
        claimsPending: 0,
        liabilityCount: 0,
        propertyCount: 0,
        constructionAllRiskCount: 0,
        professionalIndemnityCount: 0,
        totalPremium: 0,
        totalClaimsAmount: 0,
        averageClaimAmount: 0,
        claimsRatio: 0
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

  validateInsuranceData(data: Partial<CreateInsuranceRequestDTO>): { isValid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};
    
    if (!data.projectId) errors.projectId = ['Project ID required'];
    
    if (!data.insuranceType || !Object.values(InsuranceType).includes(data.insuranceType)) {
      errors.insuranceType = ['Valid insurance type required'];
    }
    
    if (!data.insurerName || data.insurerName.trim().length === 0) errors.insurerName = ['Insurer name required'];
    
    if (!data.insuredAmount || data.insuredAmount <= 0) {
      errors.insuredAmount = ['Insured amount must be positive'];
    }
    
    if (!data.startDate || !this.isValidDate(data.startDate)) errors.startDate = ['Valid start date required'];
    if (!data.endDate || !this.isValidDate(data.endDate)) errors.endDate = ['Valid end date required'];
    
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  private isValidDate(dateString: string): boolean {
    return !isNaN(Date.parse(dateString));
  }

  private isValidStatusTransition(current: InsuranceStatus, next: InsuranceStatus): boolean {
    const validTransitions: Record<InsuranceStatus, InsuranceStatus[]> = {
      [InsuranceStatus.PENDING]: [InsuranceStatus.ACTIVE, InsuranceStatus.EXPIRED, InsuranceStatus.CANCELLED],
      [InsuranceStatus.ACTIVE]: [InsuranceStatus.EXPIRED, InsuranceStatus.EXPIRING_SOON, InsuranceStatus.CANCELLED],
      [InsuranceStatus.EXPIRING_SOON]: [InsuranceStatus.EXPIRED, InsuranceStatus.ACTIVE, InsuranceStatus.CANCELLED],
      [InsuranceStatus.EXPIRED]: [],
      [InsuranceStatus.CANCELLED]: [],
      [InsuranceStatus.UNDER_REVIEW]: [InsuranceStatus.ACTIVE, InsuranceStatus.CANCELLED]
    };
    
    if (!current || !next) return false;
    
    return validTransitions[current]?.includes(next) ?? false;
  }
}
