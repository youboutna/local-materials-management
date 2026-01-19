import { supabase } from '@/integrations/supabase/client';
import { InsuranceCertificateEntity, InsuranceAlertEntity } from '@/types/insurance.entity';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export const INSURANCE_ALERT_THRESHOLDS = {
  WARNING: 30,
  CRITICAL: 15,
  URGENT: 5
};

export class InsuranceRepository {
  static async getActiveCertificates(): Promise<InsuranceCertificateEntity[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('status', 'active');

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch insurance certificates', error);
      return (data || []) as InsuranceCertificateEntity[];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch insurance certificates', error);
    }
  }

  static async detectExpiringInsurance(): Promise<InsuranceAlertEntity[]> {
    try {
      const certificates = await this.getActiveCertificates();
      const alerts: InsuranceAlertEntity[] = [];
      const today = new Date();

      certificates.forEach(cert => {
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
          return;
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
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to detect expiring insurance', error);
    }
  }

  static async getByProjectId(projectId: string): Promise<InsuranceCertificateEntity[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch insurance certificates', error);
      return (data || []) as InsuranceCertificateEntity[];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch insurance certificates', error);
    }
  }

  static async create(certificate: Omit<InsuranceCertificateEntity, 'id' | 'created_at' | 'updated_at'>): Promise<InsuranceCertificateEntity> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .insert(certificate)
        .select()
        .single();

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create insurance certificate', error);
      if (!data) throw new AppError(ErrorCode.NOT_FOUND, 'Insurance certificate not created');
      
      return data as InsuranceCertificateEntity;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create insurance certificate', error);
    }
  }

  static async update(id: string, updates: Partial<InsuranceCertificateEntity>): Promise<InsuranceCertificateEntity> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update insurance certificate', error);
      if (!data) throw new AppError(ErrorCode.NOT_FOUND, 'Insurance certificate not found');
      
      return data as InsuranceCertificateEntity;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update insurance certificate', error);
    }
  }
}
