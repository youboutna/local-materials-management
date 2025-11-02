import { InsuranceRepository, INSURANCE_ALERT_THRESHOLDS } from './InsuranceRepository';
import { sendNotification } from './notificationService';
import { InsuranceAlertEntity, InsuranceCertificateEntity } from '@/types/insurance.entity';
import { AppError, ErrorLogger } from '@/utils/errorHandling';

export class InsuranceService {
  /**
   * Detect expiring insurance certificates
   */
  static async detectExpiringInsurance(): Promise<InsuranceAlertEntity[]> {
    try {
      console.log('Detecting expiring insurance certificates...');
      return await InsuranceRepository.detectExpiringInsurance();
    } catch (error) {
      ErrorLogger.log(error as Error, 'InsuranceService.detectExpiringInsurance');
      return [];
    }
  }

  /**
   * Send insurance expiry alerts to stakeholders
   */
  static async sendInsuranceExpiryAlerts(alerts: InsuranceAlertEntity[]) {
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
          ? `ASSURANCE EXPIRÉE - ${alert.contractorName}`
          : `ALERTE ASSURANCE - ${alert.alertLevel.toUpperCase()}`;

        const alertMessage = alert.alertLevel === 'expired'
          ? `⚠️ Assurance ${alert.insuranceType} de ${alert.contractorName} a expiré le ${new Date(alert.expiryDate).toLocaleDateString('fr-FR')}.`
          : `⚠️ Assurance ${alert.insuranceType} de ${alert.contractorName} expire dans ${alert.daysRemaining} jour(s).`;

        for (const recipientId of recipients) {
          await sendNotification({
            recipient_id: recipientId,
            title: alertTitle,
            message: alertMessage,
            type: 'insurance_expiry',
            related_id: alert.projectId,
            metadata: {
              task_type: 'project',
              related_project_id: alert.projectId,
              contractor_id: alert.contractorId,
              contractor_name: alert.contractorName,
              insurance_type: alert.insuranceType,
              policy_number: alert.policyNumber,
              expiry_date: alert.expiryDate,
              days_remaining: alert.daysRemaining,
              alert_level: alert.alertLevel,
              priority: alert.alertLevel === 'expired' ? 'urgent' : alert.alertLevel === 'critical' ? 'urgent' : 'high'
            }
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
      ErrorLogger.log(error as Error, 'InsuranceService.sendInsuranceExpiryAlerts');
      throw error;
    }
  }

  /**
   * Create insurance certificate
   */
  static async createInsuranceCertificate(certificate: Omit<InsuranceCertificateEntity, 'id' | 'created_at' | 'updated_at'>) {
    try {
      console.log('Creating insurance certificate:', certificate);

      const createdCertificate = await InsuranceRepository.create(certificate);

      // Notify relevant stakeholders about new certificate
      await sendNotification({
        recipient_id: '00000000-0000-0000-0000-000000000000',
        title: "Nouvelle attestation d'assurance enregistrée",
        message: `Attestation ${certificate.coverage_type} pour ${certificate.contractor_name} ajoutée au projet.`,
        type: 'project_update',
        related_id: certificate.project_id,
        metadata: {
          related_project_id: certificate.project_id,
          contractor_name: certificate.contractor_name,
          insurance_type: certificate.coverage_type,
          policy_number: certificate.policy_number,
          priority: 'medium'
        }
      });

      return createdCertificate.id;
    } catch (error) {
      ErrorLogger.log(error as Error, 'InsuranceService.createInsuranceCertificate');
      throw error;
    }
  }

  /**
   * Validate insurance coverage for a project
   */
  static async validateInsuranceCoverage(projectId: string): Promise<boolean> {
    try {
      console.log('Validating insurance coverage for project:', projectId);

      const certificates = await InsuranceRepository.getByProjectId(projectId);

      // Check if project has all required insurance types
      const requiredTypes = ['responsabilite_civile', 'decennale'];
      const activeCertificates = certificates.filter(cert => cert.status === 'active');
      const coverageTypes = activeCertificates.map(cert => cert.coverage_type);

      return requiredTypes.every(type => coverageTypes.includes(type as any));
    } catch (error) {
      ErrorLogger.log(error as Error, 'InsuranceService.validateInsuranceCoverage');
      return false;
    }
  }

  /**
   * Get insurance certificates for a project
   */
  static async getByProjectId(projectId: string) {
    try {
      return await InsuranceRepository.getByProjectId(projectId);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InsuranceService.getByProjectId');
      throw error;
    }
  }

  /**
   * Update insurance certificate
   */
  static async update(id: string, updates: Partial<InsuranceCertificateEntity>) {
    try {
      return await InsuranceRepository.update(id, updates);
    } catch (error) {
      ErrorLogger.log(error as Error, 'InsuranceService.update');
      throw error;
    }
  }
}

// Legacy exports for backward compatibility
export const detectExpiringInsurance = () => InsuranceService.detectExpiringInsurance();
export const sendInsuranceExpiryAlerts = (alerts: InsuranceAlertEntity[]) =>
  InsuranceService.sendInsuranceExpiryAlerts(alerts);
export const createInsuranceCertificate = (cert: Omit<InsuranceCertificateEntity, 'id' | 'created_at' | 'updated_at'>) =>
  InsuranceService.createInsuranceCertificate(cert);
export const validateInsuranceCoverage = (projectId: string) =>
  InsuranceService.validateInsuranceCoverage(projectId);

// Export types and constants
export type { InsuranceCertificateEntity as InsuranceCertificate, InsuranceAlertEntity as InsuranceAlert };
export { INSURANCE_ALERT_THRESHOLDS };
