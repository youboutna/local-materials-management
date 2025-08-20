import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from './notificationService';

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

export const detectExpiringInsurance = async (): Promise<InsuranceAlert[]> => {
  try {
    const { data: certificates, error } = await supabase
      .from('insurance_certificates')
      .select(`
        *,
        projects!inner(title)
      `)
      .eq('status', 'active')
      .gte('valid_until', new Date().toISOString().split('T')[0]); // Only active and future certificates

    if (error) throw error;

    const alerts: InsuranceAlert[] = [];
    const currentDate = new Date();

    for (const cert of certificates || []) {
      const expiryDate = new Date(cert.valid_until);
      const timeDiff = expiryDate.getTime() - currentDate.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      let alertLevel: 'warning' | 'critical' | 'expired' = 'warning';
      
      if (daysRemaining < 0) {
        alertLevel = 'expired';
      } else if (daysRemaining <= INSURANCE_ALERT_THRESHOLDS.URGENT) {
        alertLevel = 'critical';
      } else if (daysRemaining <= INSURANCE_ALERT_THRESHOLDS.CRITICAL) {
        alertLevel = 'critical';
      } else if (daysRemaining <= INSURANCE_ALERT_THRESHOLDS.WARNING) {
        alertLevel = 'warning';
      }

      if (alertLevel === 'expired' || daysRemaining <= INSURANCE_ALERT_THRESHOLDS.WARNING) {
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
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error detecting expiring insurance:', error);
    return [];
  }
};

export const sendInsuranceExpiryAlerts = async (alerts: InsuranceAlert[]) => {
  try {
    // Get stakeholders for notifications
    const { data: stakeholders } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role_name,
        profiles!inner(full_name, email)
      `)
      .in('role_name', ['project_manager', 'director_programming', 'director', 'legal']);

    const notifications: any[] = [];

    for (const alert of alerts) {
      for (const stakeholder of stakeholders || []) {
        let title = '';
        let message = '';
        let notificationType: any = 'insurance_expiry';
        let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

        if (alert.alertLevel === 'expired') {
          title = 'URGENT: Assurance expirée';
          message = `L'assurance ${alert.insuranceType} de ${alert.contractorName} a expiré le ${alert.expiryDate}. Blocage des paiements activé.`;
          priority = 'urgent';
        } else if (alert.alertLevel === 'critical') {
          title = 'CRITIQUE: Assurance expire bientôt';
          message = `L'assurance ${alert.insuranceType} de ${alert.contractorName} expire dans ${alert.daysRemaining} jour(s).`;
          priority = 'urgent';
        } else {
          title = 'Attention: Renouvellement assurance requis';
          message = `L'assurance ${alert.insuranceType} de ${alert.contractorName} expire dans ${alert.daysRemaining} jours.`;
          priority = 'high';
        }

        notifications.push({
          recipient_id: stakeholder.user_id,
          title,
          message,
          type: notificationType,
          related_id: alert.projectId,
          metadata: {
            related_project_id: alert.projectId,
            contractor_id: alert.contractorId,
            contractor_name: alert.contractorName,
            insurance_type: alert.insuranceType,
            policy_number: alert.policyNumber,
            expiry_date: alert.expiryDate,
            days_remaining: alert.daysRemaining,
            alert_level: alert.alertLevel,
            priority
          }
        });
      }
    }

    // Send all notifications
    const results = await Promise.allSettled(
      notifications.map(notification => sendNotification(notification))
    );

    console.log(`Insurance expiry notifications sent: ${results.filter(r => r.status === 'fulfilled').length} successful`);

    return {
      success: true,
      notificationsSent: results.filter(r => r.status === 'fulfilled').length,
      alertsProcessed: alerts.length
    };

  } catch (error) {
    console.error('Error sending insurance expiry alerts:', error);
    throw error;
  }
};

export const createInsuranceCertificate = async (certificate: Omit<InsuranceCertificate, 'id'>) => {
  try {
    const { data, error } = await supabase
      .from('insurance_certificates')
      .insert({
        project_id: certificate.projectId,
        contractor_id: certificate.contractorId,
        contractor_name: certificate.contractorName,
        insurance_company: certificate.insuranceCompany,
        policy_number: certificate.policyNumber,
        coverage_amount: certificate.coverageAmount,
        coverage_type: certificate.coverageType,
        valid_from: certificate.validFrom,
        valid_until: certificate.validUntil,
        certificate_url: certificate.certificateUrl,
        status: certificate.status,
        notes: certificate.notes
      })
      .select()
      .single();

    if (error) throw error;

    // Notify relevant stakeholders about new certificate
    await sendNotification({
      recipient_id: 'system', // Will be filtered to appropriate roles
      title: 'Nouvelle attestation d\'assurance enregistrée',
      message: `Attestation ${certificate.coverageType} pour ${certificate.contractorName} ajoutée au projet.`,
      type: 'insurance_update',
      related_id: certificate.projectId,
      metadata: {
        related_project_id: certificate.projectId,
        contractor_name: certificate.contractorName,
        insurance_type: certificate.coverageType,
        policy_number: certificate.policyNumber,
        priority: 'medium'
      }
    });

    return data.id;
  } catch (error) {
    console.error('Error creating insurance certificate:', error);
    throw error;
  }
};

export const validateInsuranceCoverage = async (projectId: string): Promise<boolean> => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const { data: activeCertificates, error } = await supabase
      .from('insurance_certificates')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .gte('valid_until', currentDate);

    if (error) throw error;

    // Check minimum required coverage types
    const requiredCoverageTypes = ['responsabilite_civile', 'decennale'];
    const activeCoverageTypes = (activeCertificates || []).map(cert => cert.coverage_type);
    
    const hasAllRequiredCoverage = requiredCoverageTypes.every(type => 
      activeCoverageTypes.includes(type)
    );

    return hasAllRequiredCoverage;
  } catch (error) {
    console.error('Error validating insurance coverage:', error);
    return false;
  }
};