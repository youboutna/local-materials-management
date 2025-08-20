// Simplified service for insurance certificate management
// This will be fully functional once Supabase types are regenerated

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

// Mock implementation until database types are available
export const detectExpiringInsurance = async (): Promise<InsuranceAlert[]> => {
  console.log('Detecting expiring insurance certificates...');
  
  // Mock data for demonstration
  const mockAlerts: InsuranceAlert[] = [
    {
      projectId: 'proj-axe-idini',
      contractorId: 'cont-sahel-btp',
      contractorName: 'Sahel BTP',
      insuranceType: 'responsabilite_civile',
      expiryDate: '2025-08-25',
      daysRemaining: 5,
      alertLevel: 'critical',
      policyNumber: 'RC-2024-001'
    },
    {
      projectId: 'proj-electrification',
      contractorId: 'cont-moderne-sarl',
      contractorName: 'Construction Moderne SARL',
      insuranceType: 'decennale',
      expiryDate: '2025-09-10',
      daysRemaining: 21,
      alertLevel: 'warning',
      policyNumber: 'DEC-2024-015'
    }
  ];
  
  return mockAlerts;
};

export const sendInsuranceExpiryAlerts = async (alerts: InsuranceAlert[]) => {
  try {
    console.log(`Sending ${alerts.length} insurance expiry alerts...`);
    
    // Send mock notifications
    for (const alert of alerts) {
      await sendNotification({
        recipient_id: 'system',
        title: `ALERTE ASSURANCE - ${alert.alertLevel.toUpperCase()}`,
        message: `Assurance ${alert.insuranceType} de ${alert.contractorName} expire dans ${alert.daysRemaining} jour(s).`,
        type: 'project_update',
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
          priority: alert.alertLevel === 'critical' ? 'urgent' : 'high'
        }
      });
    }

    return {
      success: true,
      notificationsSent: alerts.length,
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
    await sendNotification({
      recipient_id: 'system',
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