/**
 * Insurance Service - Hexagonal Architecture
 * Business logic for insurance certificate management
 */

import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { NotificationService } from '@/application/services/NotificationService';

export interface InsuranceCertificate {
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

export interface CreateInsuranceData {
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

export interface UpdateInsuranceData {
  status?: string;
  notes?: string;
}

export interface DocumentUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class InsuranceService {
  private repository: any;

  constructor() {
    this.repository = RepositoryFactory.getInsuranceRepository();
  }

  // ============= Static Methods for Legacy Compatibility =============

  /**
   * Detect expiring insurance certificates
   */
  static async detectExpiringInsurance(): Promise<any[]> {
    try {
      console.log('Detecting expiring insurance certificates...');
      const service = new InsuranceService();
      return await service.repository.detectExpiringInsurance();
    } catch (error) {
      console.error('Error detecting expiring insurance:', error);
      return [];
    }
  }

  /**
   * Send insurance expiry alerts to stakeholders
   */
  static async sendInsuranceExpiryAlerts(alerts: any[]): Promise<{ success: boolean; notificationsSent: number; alertsProcessed: number }> {
    try {
      console.log(`Sending ${alerts.length} insurance expiry alerts...`);

      if (alerts.length === 0) {
        console.log('No insurance alerts to send');
        return { success: true, notificationsSent: 0, alertsProcessed: 0 };
      }

      const { supabase } = await import('@/integrations/supabase/client');
      
      // Get all admin users to notify
      const { data: adminUsers, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role_name', ['admin', 'director', 'manager']);

      if (adminError) {
        console.error('Error fetching admin users:', adminError);
        throw adminError;
      }

      const recipients = adminUsers?.map(u => u.user_id) || [];
      let notificationsSent = 0;

      // Send notifications to all admins for each alert
      for (const alert of alerts) {
        const alertTitle = alert.alertLevel === 'expired'
          ? 'URGENT: Assurance Expirée'
          : 'Alerte: Assurance Proche de l\'Expiration';

        for (const recipientId of recipients) {
          const notificationService = new NotificationService(RepositoryFactory.getNotificationRepository());
          await notificationService.createNotification({
            recipient_id: recipientId,
            title: alertTitle,
            message: `Assurance ${alert.coverage_type} pour ${alert.contractor_name} expire le ${alert.expiryDate}.`,
            type: alert.alertLevel === 'expired' ? 'error' : 'warning',
            read: false
          });
          notificationsSent++;
        }
      }

      return {
        success: true,
        notificationsSent,
        alertsProcessed: alerts.length
      };

    } catch (error) {
      console.error('Error sending insurance expiry alerts:', error);
      throw error;
    }
  }

  /**
   * Create insurance certificate
   */
  static async createInsuranceCertificate(certificate: any): Promise<string> {
    try {
      console.log('Creating insurance certificate:', certificate);

      const service = new InsuranceService();
      const createdCertificate = await service.repository.create(certificate);

      // Notify relevant stakeholders about new certificate
      const notificationService = new NotificationService(RepositoryFactory.getNotificationRepository());
      await notificationService.createNotification({
        recipient_id: '00000000-0000-0000-0000-000000000000',
        title: "Nouvelle attestation d'assurance enregistrée",
        message: `Attestation ${certificate.coverage_type} pour ${certificate.contractor_name} ajoutée au projet.`,
        type: 'success',
        read: false
      });

      return createdCertificate.id;
    } catch (error) {
      console.error('Error creating insurance certificate:', error);
      throw error;
    }
  }

  /**
   * Validate insurance coverage for a project
   */
  static async validateInsuranceCoverage(projectId: string): Promise<boolean> {
    try {
      console.log('Validating insurance coverage for project:', projectId);

      const service = new InsuranceService();
      const certificates = await service.repository.getByProjectId(projectId);

      // Check if project has all required insurance types
      const requiredTypes = ['responsabilite_civile', 'decennale'];
      const activeCertificates = certificates.filter((cert: any) => cert.status === 'active');
      const coverageTypes = activeCertificates.map((cert: any) => cert.coverage_type);

      return requiredTypes.every(type => coverageTypes.includes(type));
    } catch (error) {
      console.error('Error validating insurance coverage:', error);
      return false;
    }
  }

  /**
   * Get insurance certificates for a project
   */
  static async getByProjectId(projectId: string) {
    try {
      const service = new InsuranceService();
      return await service.repository.getByProjectId(projectId);
    } catch (error) {
      console.error('Error getting insurance certificates:', error);
      throw error;
    }
  }

  /**
   * Update insurance certificate
   */
  static async update(id: string, updates: any) {
    try {
      const service = new InsuranceService();
      return await service.repository.update(id, updates);
    } catch (error) {
      console.error('Error updating insurance certificate:', error);
      throw error;
    }
  }

  // ============= Instance Methods =============

  /**
   * Get insurance certificates for a project
   */
  async getInsuranceCertificates(projectId?: string): Promise<InsuranceCertificate[]> {
    try {
      console.log('Getting insurance certificates for project:', projectId);
      
      if (projectId) {
        // Get certificates for specific project
        return await this.repository.getByProjectId(projectId);
      } else {
        // Get all certificates
        return await this.repository.getAll();
      }
    } catch (error) {
      console.error('Error getting insurance certificates:', error);
      return [];
    }
  }

  /**
   * Create new insurance certificate
   */
  async createInsuranceCertificate(data: CreateInsuranceData): Promise<InsuranceCertificate> {
    try {
      console.log('Creating insurance certificate:', data);
      throw new Error('Not implemented yet');
    } catch (error) {
      console.error('Error creating insurance certificate:', error);
      throw error;
    }
  }

  /**
   * Update insurance certificate
   */
  async updateInsuranceCertificate(id: string, data: UpdateInsuranceData): Promise<InsuranceCertificate> {
    try {
      console.log('Updating insurance certificate:', id, data);
      throw new Error('Not implemented yet');
    } catch (error) {
      console.error('Error updating insurance certificate:', error);
      throw error;
    }
  }

  /**
   * Delete insurance certificate
   */
  async deleteInsuranceCertificate(id: string): Promise<boolean> {
    try {
      console.log('Deleting insurance certificate:', id);
      return true;
    } catch (error) {
      console.error('Error deleting insurance certificate:', error);
      return false;
    }
  }

  /**
   * Upload insurance document
   */
  async uploadInsuranceDocument(file: File, certificateId: string): Promise<DocumentUploadResult> {
    try {
      console.log('Uploading insurance document:', file.name, certificateId);
      return {
        success: false,
        error: 'Upload not implemented yet'
      };
    } catch (error: unknown) {
      console.error('Error uploading insurance document:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Validate insurance certificate data
   */
  validateInsuranceData(data: Partial<CreateInsuranceData>): {
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
  isExpiringSoon(certificate: InsuranceCertificate, daysThreshold: number = 30): boolean {
    const endDate = new Date(certificate.valid_until);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
  }

  /**
   * Get insurance statistics for a project
   */
  async getInsuranceStatistics(projectId: string): Promise<{
    totalCertificates: number;
    activeCertificates: number;
    expiredCertificates: number;
    expiringSoonCertificates: number;
    totalCoverage: number;
  }> {
    try {
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
      console.error('Error getting insurance statistics:', error);
      return {
        totalCertificates: 0,
        activeCertificates: 0,
        expiredCertificates: 0,
        expiringSoonCertificates: 0,
        totalCoverage: 0
      };
    }
  }

  /**
   * Static methods for backward compatibility
   */
  static async getCertificates(projectId?: string): Promise<InsuranceCertificate[]> {
    const service = new InsuranceService();
    return await service.getInsuranceCertificates(projectId);
  }

  static async createCertificate(data: CreateInsuranceData): Promise<InsuranceCertificate | null> {
    const service = new InsuranceService();
    return await service.createInsuranceCertificate(data);
  }

  static async updateCertificate(id: string, data: UpdateInsuranceData): Promise<InsuranceCertificate | null> {
    const service = new InsuranceService();
    return await service.updateInsuranceCertificate(id, data);
  }

  static async deleteCertificate(id: string): Promise<boolean> {
    const service = new InsuranceService();
    return await service.deleteInsuranceCertificate(id);
  }

  static async uploadDocument(file: File, certificateId: string): Promise<DocumentUploadResult> {
    const service = new InsuranceService();
    return await service.uploadInsuranceDocument(file, certificateId);
  }

  static validateData(data: Partial<CreateInsuranceData>): { isValid: boolean; errors: string[] } {
    const service = new InsuranceService();
    return service.validateInsuranceData(data);
  }

  static isExpiringSoon(certificate: InsuranceCertificate, daysThreshold: number = 30): boolean {
    const service = new InsuranceService();
    return service.isExpiringSoon(certificate, daysThreshold);
  }

  static async getStatistics(projectId: string): Promise<{
    totalCertificates: number;
    activeCertificates: number;
    expiredCertificates: number;
    expiringSoonCertificates: number;
    totalCoverage: number;
  }> {
    const service = new InsuranceService();
    return await service.getInsuranceStatistics(projectId);
  }
}

// Legacy exports for backward compatibility
export const detectExpiringInsurance = () => InsuranceService.detectExpiringInsurance();
export const sendInsuranceExpiryAlerts = (alerts: any[]) =>
  InsuranceService.sendInsuranceExpiryAlerts(alerts);
export const createInsuranceCertificate = (cert: any) =>
  InsuranceService.createInsuranceCertificate(cert);
export const validateInsuranceCoverage = (projectId: string) =>
  InsuranceService.validateInsuranceCoverage(projectId);

// Export types and constants
export const INSURANCE_ALERT_THRESHOLDS = {
  EXPIRED: 0,
  CRITICAL: 7,
  WARNING: 30,
  INFO: 60
};
