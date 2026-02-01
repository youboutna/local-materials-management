/**
 * Insurance Service - Hexagonal Architecture
 * Business logic for insurance certificate management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IInsuranceRepository } from '@/domain/repositories/IInsuranceRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { NotificationService } from '@/application/services/NotificationService';

export interface InsuranceCertificateDTO {
  id: string;
  project_id: string;
  contractor_id: string;
  insurance_type: string;
  provider: string;
  policy_number: string;
  coverage_amount: number;
  start_date: string;
  valid_until: string;
  status: 'active' | 'expired' | 'pending';
  documents: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateInsuranceRequestDto {
  project_id: string;
  contractor_id: string;
  insurance_type: string;
  provider: string;
  policy_number: string;
  coverage_amount: number;
  start_date: string;
  valid_until: string;
  status: 'active' | 'expired' | 'pending';
  documents?: string[];
  notes?: string;
}

export interface UpdateInsuranceRequestDto {
  status?: 'active' | 'expired' | 'pending';
  notes?: string;
  documents?: string[];
}

export interface InsuranceStatistics {
  totalCertificates: number;
  activeCertificates: number;
  expiredCertificates: number;
  expiringSoonCertificates: number;
  totalCoverage: number;
}

export interface InsuranceAlert {
  certificateId: string;
  projectId: string;
  contractorId: string;
  insuranceType: string;
  provider: string;
  expiryDate: string;
  alertLevel: 'expired' | 'critical' | 'warning' | 'info';
  daysUntilExpiry: number;
}

export class InsuranceService {
  constructor(
    private insuranceRepository: IInsuranceRepository = RepositoryFactory.getInsuranceRepository(),
    private notificationService: NotificationService = new NotificationService(RepositoryFactory.getNotificationRepository())
  ) {}

  private mapEntityToDTO(entity: any): InsuranceCertificateDTO {
    return {
      id: entity.id,
      project_id: entity.project_id,
      contractor_id: entity.contractor_id,
      insurance_type: entity.insurance_type,
      provider: entity.provider,
      policy_number: entity.policy_number,
      coverage_amount: entity.coverage_amount,
      start_date: entity.start_date,
      valid_until: entity.valid_until,
      status: entity.status,
      documents: entity.documents || [],
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
          insuranceType: (cert as any).insurance_type || 'general',
          provider: (cert as any).provider || 'Unknown',
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
        activeCertificates: certificates.filter(c => c.status === 'active').length,
        expiredCertificates: certificates.filter(c => c.status === 'expired').length,
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

  validateInsuranceData(data: Partial<CreateInsuranceRequestDto>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data.project_id) errors.push('Project ID required');
    if (!data.insurance_type) errors.push('Insurance type required');
    if (!data.provider) errors.push('Provider required');
    if (!data.policy_number) errors.push('Policy number required');
    if (!data.coverage_amount || data.coverage_amount <= 0) errors.push('Coverage amount must be positive');
    return { isValid: errors.length === 0, errors };
  }
}
