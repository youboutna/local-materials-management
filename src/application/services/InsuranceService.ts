/**
 * Insurance Service - Hexagonal Architecture
 * Business logic for insurance certificate management
 */

import { NotificationService, getNotificationService} from '@/application/services/NotificationService';
import { InsuranceCertificateEntity } from '@/domain/entities/InsuranceCertificate.entity';
import { IInsuranceRepository } from '@/domain/repositories/IInsuranceRepository';
import { CreateInsuranceCertificateDTO, CreateInsuranceRequestDTO, InsuranceAlertDTO, InsuranceCertificateDTO, InsuranceStatisticsDTO, InsuranceStatus, InsuranceType, UpdateInsuranceCertificateDTO } from '@/dtos/entities/InsuranceDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { insuranceTransform } from '@/dtos/transforms/insuranceTransform';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Status and type constants for validation
const INSURANCE_STATUSES = ['active', 'expired', 'expiring_soon', 'missing', 'pending'] as const;
const INSURANCE_TYPES = ['responsabilite_civile', 'decennale', 'vehicules', 'materiel', 'tous_risques'] as const;

export class InsuranceService {
  private insuranceRepository: IInsuranceRepository;
  private notificationService: NotificationService;
  
  constructor(
    insuranceRepository?: IInsuranceRepository,
    notificationService?: NotificationService
  ) {
    this.insuranceRepository = insuranceRepository || RepositoryFactory.getInsuranceRepository();
    this.notificationService = notificationService || getNotificationService();
  }

  private mapEntityToDTO(entity: InsuranceCertificateEntity): InsuranceCertificateDTO {
    return {
      id: entity.id,
      projectId: entity.project_id,
      contractorId: entity.contractor_id,
      contractorName: entity.contractor_name,
      insuranceCompany: entity.insurance_company,
      insuranceType: entity.coverage_type as any,
      policyNumber: entity.policy_number,
      coverageAmount: entity.coverage_amount,
      coverageType: entity.coverage_type,
      validFrom: entity.valid_from,
      validUntil: entity.valid_until,
      status: entity.status as any,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at
    } as InsuranceCertificateDTO;
  }

  async detectExpiringInsurance(daysThreshold: number = 30): Promise<InsuranceAlertDTO[]> {
    try {
      const expiringCerts = await this.insuranceRepository.getExpiringSoon(daysThreshold);
      return expiringCerts.map(cert => {
        const endDate = new Date(cert.valid_until);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let alertType: InsuranceAlertDTO['type'] = 'expiring';
        let severity: InsuranceAlertDTO['severity'] = 'medium';
        
        if (daysUntilExpiry <= 0) {
          alertType = 'expired';
          severity = 'critical';
        } else if (daysUntilExpiry <= 7) {
          severity = 'high';
        } else if (daysUntilExpiry <= 14) {
          severity = 'medium';
        } else {
          severity = 'low';
        }
        
        return {
          id: `alert-${cert.id}`,
          certificateId: cert.id,
          type: alertType,
          severity,
          message: daysUntilExpiry <= 0 
            ? `Insurance has expired` 
            : `Insurance expires in ${daysUntilExpiry} days`,
          daysUntilExpiry,
          projectId: cert.project_id,
          contractorId: cert.contractor_id,
          createdAt: new Date().toISOString()
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
      
      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      
      let totalCoverageAmount = 0;
      let activeCertificates = 0;
      let expiredCertificates = 0;
      let expiringSoonCertificates = 0;
      
      for (const cert of certificates) {
        totalCoverageAmount += cert.coverageAmount || 0;
        
        // Count by type
        const type = cert.coverageType || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
        
        // Count by status
        const status = cert.status || 'unknown';
        byStatus[status] = (byStatus[status] || 0) + 1;
        
        if (status === 'active') activeCertificates++;
        else if (status === 'expired') expiredCertificates++;
        
        if (this.isExpiringSoon(cert)) expiringSoonCertificates++;
      }
      
      return {
        totalCertificates: certificates.length,
        activeCertificates,
        expiredCertificates,
        expiringSoonCertificates,
        missingCertificates: 0,
        totalCoverageAmount,
        byType,
        byStatus,
        byProject: {}
      };
    } catch (error) {
      console.error('InsuranceService.getInsuranceStatistics failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get insurance statistics');
    }
  }

  isExpiringSoon(certificate: InsuranceCertificateDTO, daysThreshold: number = 30): boolean {
    const validUntil = certificate.validUntil;
    if (!validUntil) return false;
    
    const endDate = new Date(validUntil);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
  }

  validateInsuranceData(data: Partial<CreateInsuranceCertificateDTO>): { isValid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};
    
    if (!data.projectId) errors.projectId = ['Project ID required'];
    
    if (!data.insuranceType || !INSURANCE_TYPES.includes(data.insuranceType as InsuranceType)) {
      errors.insuranceType = ['Valid insurance type required'];
    }
    
    if (!data.insuranceCompany || data.insuranceCompany.trim().length === 0) {
      errors.insuranceCompany = ['Insurance company required'];
    }
    
    if (!data.coverageAmount || data.coverageAmount <= 0) {
      errors.coverageAmount = ['Coverage amount must be positive'];
    }
    
    if (!data.validFrom || !this.isValidDate(data.validFrom)) errors.validFrom = ['Valid start date required'];
    if (!data.validUntil || !this.isValidDate(data.validUntil)) errors.validUntil = ['Valid end date required'];
    
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  private isValidDate(dateString: string): boolean {
    return !isNaN(Date.parse(dateString));
  }

  private isValidStatusTransition(current: InsuranceStatus, next: InsuranceStatus): boolean {
    const validTransitions: Record<string, string[]> = {
      pending: ['active', 'expired'],
      active: ['expired', 'expiring_soon'],
      expiring_soon: ['expired', 'active'],
      expired: [],
      missing: ['active', 'pending']
    };
    
    if (!current || !next) return false;
    
    return validTransitions[current]?.includes(next) ?? false;
  }
  
  // Static method wrappers for backward compatibility
  static async detectExpiringInsurance(daysThreshold: number = 30): Promise<InsuranceAlertDTO[]> {
    const service = new InsuranceService();
    return service.detectExpiringInsurance(daysThreshold);
  }
  
  static async getInsuranceCertificates(projectId?: string): Promise<InsuranceCertificateDTO[]> {
    const service = new InsuranceService();
    return service.getInsuranceCertificates(projectId);
  }
  
  static async getInsuranceStatistics(projectId: string): Promise<InsuranceStatisticsDTO> {
    const service = new InsuranceService();
    return service.getInsuranceStatistics(projectId);
  }

  /**
   * Persistance réelle du certificat (plus de mock).
   * `projectId` est obligatoire : sans lui la ligne serait orpheline et
   * disparaîtrait au rechargement (régression signalée en recette).
   */
  async createInsuranceCertificate(data: CreateInsuranceCertificateDTO): Promise<InsuranceCertificateDTO> {
    const projectId = (data as any).projectId || (data as any).project_id;
    if (!projectId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Le projet (projectId) est obligatoire pour un certificat d'assurance");
    }
    if (!data.policyNumber && !(data as any).policy_number) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Le numéro de police est obligatoire');
    }

    try {
      const entity = insuranceTransform.createDataToEntity({ ...data, projectId } as CreateInsuranceCertificateDTO);
      const created = await this.insuranceRepository.create(entity);
      return this.mapEntityToDTO(created);
    } catch (error) {
      console.error('InsuranceService.createInsuranceCertificate failed:', error);
      throw error instanceof AppError
        ? error
        : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create insurance certificate');
    }
  }

  async updateInsuranceCertificate(id: string, data: UpdateInsuranceCertificateDTO): Promise<InsuranceCertificateDTO | null> {
    try {
      const patch = insuranceTransform.updateDataToEntity(data);
      const cleaned = Object.fromEntries(
        Object.entries(patch).filter(([, v]) => v !== undefined),
      ) as Partial<InsuranceCertificateEntity>;
      const updated = await this.insuranceRepository.update(id, cleaned);
      return updated ? this.mapEntityToDTO(updated) : null;
    } catch (error) {
      console.error('InsuranceService.updateInsuranceCertificate failed:', error);
      throw error instanceof AppError
        ? error
        : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update insurance certificate');
    }
  }

  async deleteInsuranceCertificate(id: string): Promise<boolean> {
    try {
      await this.insuranceRepository.delete(id);
      return true;
    } catch (error) {
      console.error('InsuranceService.deleteInsuranceCertificate failed:', error);
      throw error instanceof AppError
        ? error
        : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete insurance certificate');
    }
  }

  static async createInsuranceCertificate(data: CreateInsuranceRequestDTO): Promise<InsuranceCertificateDTO> {
    const service = new InsuranceService();
    return service.createInsuranceCertificate(data);
  }

  static async updateInsuranceCertificate(id: string, data: Partial<CreateInsuranceRequestDTO>): Promise<InsuranceCertificateDTO | null> {
    const service = new InsuranceService();
    return service.updateInsuranceCertificate(id, data);
  }

  static async deleteInsuranceCertificate(id: string): Promise<boolean> {
    const service = new InsuranceService();
    return service.deleteInsuranceCertificate(id);
  }

  // Factory function for getting service instance
  static getInsuranceService(): InsuranceService {
    return new InsuranceService();
  }
}

let insuranceServiceInstance: InsuranceService | null = null;
export function getInsuranceService(): InsuranceService {
  if (!insuranceServiceInstance) {
    insuranceServiceInstance = new InsuranceService();
  }
  return insuranceServiceInstance;
}
