// @ts-nocheck
// Service for insurance certificate management and alerts

import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from './NotificationService';

export interface InsuranceCertificate {
  id?: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  coverageType: 'responsabilite_civile' | 'decennale' | 'vehicules' | 'materiel' | 'tous_risques';
  validFrom: string;
  validUntil: string;
  certificateUrl?: string;
  status: 'active' | 'expired' | 'expiring_soon' | 'missing';
  lastVerified?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface InsuranceAlert {
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceType: string;
  expiryDate: string;
  daysRemaining: number;
  alertLevel: 'warning' | 'critical' | 'expired';
  policyNumber: string;
}

// Alert thresholds for insurance expiry
export const INSURANCE_ALERT_THRESHOLDS = {
  WARNING: 30, // 30 days before expiry
  CRITICAL: 15, // 15 days before expiry
  URGENT: 5    // 5 days before expiry
};

// Mock implementation until database types are available
export const detectExpiringInsurance = async (): Promise<InsuranceAlert[]> => {
  try {
    console.log('Detecting expiring insurance certificates...');
    
    // Get actual data from Supabase
    const { data: certificates, error } = await supabase
      .from('insurance_certificates')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching insurance certificates:', error);
      return [];
    }

    const alerts: InsuranceAlert[] = [];
    const today = new Date();

    certificates?.forEach(cert => {
      const expiryDate = new Date(cert.valid_until);
      const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let alertLevel: 'warning' | 'critical' | 'expired' = 'warning';
      
      if (daysRemaining <= 0) {
        alertLevel = 'expired';
      } else if (daysRemaining <= INSURANCE_ALERT_THRESHOLDS.URGENT) {
        alertLevel = 'critical';
      } else if (daysRemaining <= INSURANCE_ALERT_THRESHOLDS.WARNING) {
        alertLevel = 'warning';
      } else {
        return; // No alert needed
      }

      alerts.push({
        projectId: cert.project_id,
        contractorId: cert.contractor_id,
        contractorName: cert.contractor_name,
        insuranceType: cert.coverage_type,
        expiryDate: cert.valid_until,
        daysRemaining,
        alertLevel,
        policyNumber: cert.policy_number
      });
    });

    return alerts;
  } catch (error) {
    console.error('Error in detectExpiringInsurance:', error);
    return [];
  }
};

export const sendInsuranceExpiryAlerts = async (alerts: InsuranceAlert[]) => {
  try {
    console.log(`Sending ${alerts.length} insurance expiry alerts...`);
    
    if (alerts.length === 0) {
      console.log('No insurance alerts to send');
      return { success: true, notificationsSent: 0, alertsProcessed: 0 };
    }

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
        await NotificationService.createNotification({
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
    console.error('Error sending insurance expiry alerts:', error);
    throw error;
  }
};

export const createInsuranceCertificate = async (certificate: Omit<InsuranceCertificate, 'id'>) => {
  try {
    console.log('Creating insurance certificate:', certificate);
    
    // Mock implementation - will be replaced with actual database calls
    const mockId = `cert-${Date.now()}`;
    
    // Notify relevant stakeholders about new certificate
    await NotificationService.createNotification({
      recipient_id: '00000000-0000-0000-0000-000000000000', // System notification
      title: 'Nouvelle attestation d\'assurance enregistrée',
      message: `Attestation ${certificate.coverageType} pour ${certificate.contractorName} ajoutée au projet.`,
      type: 'project_update',
      related_id: certificate.projectId,
      metadata: {
        related_project_id: certificate.projectId,
        contractor_name: certificate.contractorName,
        insurance_type: certificate.coverageType,
        policy_number: certificate.policyNumber,
        priority: 'medium'
      }
    });

    return mockId;
  } catch (error) {
    console.error('Error creating insurance certificate:', error);
    throw error;
  }
};

export const validateInsuranceCoverage = async (projectId: string): Promise<boolean> => {
  try {
    console.log('Validating insurance coverage for project:', projectId);
    
    // Mock validation - returns true for demo purposes
    // In real implementation, this would check against the database
    return true;
  } catch (error) {
    console.error('Error validating insurance coverage:', error);
    return false;
  }
};