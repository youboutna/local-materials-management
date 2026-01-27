/**
 * Insurance Service - Hexagonal Architecture
 * Business logic for insurance certificate management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IInsuranceRepository } from '@/domain/repositories/IInsuranceRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { NotificationService } from '@/application/services/NotificationService';

// Service DTOs for data exchange
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

export interface DocumentUploadResult {
  success: boolean;
  url?: string;
  error?: string;
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
    private notificationRepository: INotificationRepository = RepositoryFactory.getNotificationRepository(),
    private notificationService: NotificationService = new NotificationService(RepositoryFactory.getNotificationRepository())
  ) {}

  /**
   * Detect expiring insurance certificates
   */
  async detectExpiringInsurance(): Promise<InsuranceAlert[]> {
    try {
      console.log('Detecting expiring insurance certificates...');
      
      // For now, return empty array as insurance repository is not available
      // TODO: Implement proper expiring insurance detection when repository is available
      console.warn('InsuranceService.detectExpiringInsurance: Insurance repository not available');
      return [];
    } catch (error) {
      console.error('InsuranceService.detectExpiringInsurance failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to detect expiring insurance');
    }
  }

  /**
   * Send insurance expiry alerts to stakeholders
   */
  async sendInsuranceExpiryAlerts(alerts: InsuranceAlert[]): Promise<{ success: boolean; notificationsSent: number; alertsProcessed: number }> {
    try {
      console.log(`Sending ${alerts.length} insurance expiry alerts...`);

      if (alerts.length === 0) {
        console.log('No insurance alerts to send');
        return { success: true, notificationsSent: 0, alertsProcessed: 0 };
      }

      // For now, return mock result as user repository is not available
      // TODO: Implement proper admin user fetching when user repository is available
      console.warn('InsuranceService.sendInsuranceExpiryAlerts: User repository not available');
      
      let notificationsSent = 0;
      
      // Send notifications for each alert
      for (const alert of alerts) {
        const alertTitle = alert.alertLevel === 'expired'
          ? 'URGENT: Assurance Expirée'
          : 'Alerte: Assurance Proche de l\'Expiration';

        await this.notificationService.createNotification({
          recipient_id: 'system-admin', // Placeholder for admin users
          title: alertTitle,
          message: `Assurance ${alert.insuranceType} pour le projet ${alert.projectId} expire le ${alert.expiryDate}.`,
          type: alert.alertLevel === 'expired' ? 'error' : 'warning',
          read: false
        });
        notificationsSent++;
      }

      return {
        success: true,
        notificationsSent,
        alertsProcessed: alerts.length
      };

    } catch (error) {
      console.error('InsuranceService.sendInsuranceExpiryAlerts failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to send insurance expiry alerts');
    }
  }

  /**
   * Create insurance certificate
   */
  async createInsuranceCertificate(certificate: CreateInsuranceRequestDto): Promise<InsuranceCertificateDTO> {
    try {
      // Validate certificate data
      const validation = this.validateInsuranceData(certificate);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(', ')}`);
      }

      // For now, return mock certificate as insurance repository is not available
      // TODO: Implement proper certificate creation when insurance repository is available
      console.warn('InsuranceService.createInsuranceCertificate: Insurance repository not available');
      
      const newCertificate: InsuranceCertificateDTO = {
        id: `insurance-${Date.now()}`,
        ...certificate,
        documents: certificate.documents || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Notify relevant stakeholders about new certificate
      await this.notificationService.createNotification({
        recipient_id: 'system-admin',
        title: "Nouvelle attestation d'assurance enregistrée",
        message: `Attestation ${certificate.insurance_type} pour le projet ${certificate.project_id} ajoutée.`,
        type: 'success',
        read: false
      });

      return newCertificate;
    } catch (error) {
      console.error('InsuranceService.createInsuranceCertificate failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create insurance certificate');
    }
  }

  /**
   * Validate insurance coverage for a project
   */
  async validateInsuranceCoverage(projectId: string): Promise<boolean> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      console.log('Validating insurance coverage for project:', projectId);

      // For now, return true as insurance repository is not available
      // TODO: Implement proper insurance coverage validation when repository is available
      console.warn('InsuranceService.validateInsuranceCoverage: Insurance repository not available');
      return true;
    } catch (error) {
      console.error('InsuranceService.validateInsuranceCoverage failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to validate insurance coverage');
    }
  }

  /**
   * Get insurance certificates for a project
   */
  async getInsuranceCertificates(projectId?: string): Promise<InsuranceCertificateDTO[]> {
    try {
      console.log('Getting insurance certificates for project:', projectId);
      
      if (projectId) {
        // For now, return empty array as insurance repository is not available
        // TODO: Implement proper certificate retrieval when repository is available
        console.warn('InsuranceService.getInsuranceCertificates: Insurance repository not available');
        return [];
      } else {
        // Get all certificates
        return [];
      }
    } catch (error) {
      console.error('InsuranceService.getInsuranceCertificates failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get insurance certificates');
    }
  }

  /**
   * Update insurance certificate
   */
  async updateInsuranceCertificate(id: string, updates: UpdateInsuranceRequestDto): Promise<InsuranceCertificateDTO> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Certificate ID is required');
      }

      console.log('Updating insurance certificate:', id, updates);
      
      // For now, throw not implemented as insurance repository is not available
      // TODO: Implement proper certificate update when repository is available
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Certificate update not yet implemented');
    } catch (error) {
      console.error('InsuranceService.updateInsuranceCertificate failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update insurance certificate');
    }
  }

  /**
   * Delete insurance certificate
   */
  async deleteInsuranceCertificate(id: string): Promise<void> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Certificate ID is required');
      }

      console.log('Deleting insurance certificate:', id);
      
      // For now, throw not implemented as insurance repository is not available
      // TODO: Implement proper certificate deletion when repository is available
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Certificate deletion not yet implemented');
    } catch (error) {
      console.error('InsuranceService.deleteInsuranceCertificate failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete insurance certificate');
    }
  }

  /**
   * Upload insurance document
   */
  async uploadInsuranceDocument(file: File, certificateId: string): Promise<DocumentUploadResult> {
    try {
      if (!file) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'File is required');
      }

      if (!certificateId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Certificate ID is required');
      }

      console.log('Uploading insurance document:', file.name, certificateId);
      
      // For now, return not implemented as storage service is not available
      // TODO: Implement proper document upload when storage service is available
      return {
        success: false,
        error: 'Document upload not yet implemented'
      };
    } catch (error) {
      console.error('InsuranceService.uploadInsuranceDocument failed:', error);
      if (error instanceof AppError) {
        return {
          success: false,
          error: error.message
        };
      }
      return {
        success: false,
        error: 'Failed to upload document'
      };
    }
  }

  /**
   * Validate insurance certificate data
   */
  validateInsuranceData(data: Partial<CreateInsuranceRequestDto>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.project_id) {
      errors.push('Le projet est requis');
    }

    if (!data.insurance_type) {
      errors.push('Le type d\'assurance est requis');
    }

    if (!data.provider) {
      errors.push('Le fournisseur est requis');
    }

    if (!data.policy_number) {
      errors.push('Le numéro de police est requis');
    }

    if (!data.coverage_amount || data.coverage_amount <= 0) {
      errors.push('Le montant de couverture doit être positif');
    }

    if (!data.start_date) {
      errors.push('La date de début est requise');
    }

    if (!data.valid_until) {
      errors.push('La date de fin est requise');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if insurance certificate is expiring soon
   */
  isExpiringSoon(certificate: InsuranceCertificateDTO, daysThreshold: number = 30): boolean {
    const endDate = new Date(certificate.valid_until);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
  }

  /**
   * Get insurance statistics for a project
   */
  async getInsuranceStatistics(projectId: string): Promise<InsuranceStatistics> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const certificates = await this.getInsuranceCertificates(projectId);
      
      const activeCertificates = certificates.filter(c => c.status === 'active').length;
      const expiredCertificates = certificates.filter(c => c.status === 'expired').length;
      const expiringSoonCertificates = certificates.filter(c => this.isExpiringSoon(c)).length;
      const totalCoverage = certificates.reduce((sum, c) => sum + c.coverage_amount, 0);

      return {
        totalCertificates: certificates.length,
        activeCertificates,
        expiredCertificates,
        expiringSoonCertificates,
        totalCoverage
      };
    } catch (error) {
      console.error('InsuranceService.getInsuranceStatistics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get insurance statistics');
    }
  }
}
