// ============================================================
// src/infrastructure/adapters/supabase/SupabaseInsuranceAdapter.ts
// ============================================================
/**
 * Supabase Adapter for Insurance Certificate Repository
 * Implements IInsuranceRepository interface using Supabase client
 * 
 * Hexagonal: Infrastructure Layer → Adapter
 * Transforme les données DB → Entity via insuranceTransform
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { InsuranceCertificateEntity } from '@/domain/entities/InsuranceCertificate.entity';
import { IInsuranceRepository } from '@/domain/repositories/IInsuranceRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { insuranceTransform } from '@/dtos/transforms/insuranceTransform';
import { InsuranceCertificateDTO, InsuranceCertificateStatus } from '@/dtos/entities/InsuranceDTO';

// ============================================================
// Types
// ============================================================

interface InsuranceCertificateDB {
  id: string;
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  insurance_company: string;
  policy_number: string;
  coverage_amount: number;
  coverage_type: string;
  valid_from: string;
  valid_until: string;
  certificate_url?: string;
  status: string;
  last_verified?: string;
  verified_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// ============================================================
// Adapter
// ============================================================

export class SupabaseInsuranceAdapter implements IInsuranceRepository {
  
  /**
   * Map DB record to Entity
   * Utilise insuranceTransform pour la conversion
   */
  private mapToEntity(data: InsuranceCertificateDB): InsuranceCertificateEntity {
    // Créer un DTO à partir des données DB
    const dto: InsuranceCertificateDTO = {
      id: data.id,
      projectId: data.project_id,
      contractorId: data.contractor_id,
      contractorName: data.contractor_name,
      insuranceType: data.coverage_type as any,
      insuranceCompany: data.insurance_company,
      policyNumber: data.policy_number,
      coverageAmount: data.coverage_amount,
      coverageType: data.coverage_type,
      validFrom: data.valid_from,
      validUntil: data.valid_until,
      status: data.status as InsuranceCertificateStatus,
      notes: data.notes,
      certificateUrl: data.certificate_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      lastVerified: data.last_verified,
      verifiedBy: data.verified_by,
      // Legacy snake_case
      project_id: data.project_id,
      contractor_id: data.contractor_id,
      contractor_name: data.contractor_name,
      insurance_company: data.insurance_company,
      policy_number: data.policy_number,
      coverage_amount: data.coverage_amount,
      coverage_type: data.coverage_type,
      valid_from: data.valid_from,
      valid_until: data.valid_until,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    // Utiliser le transformer pour convertir DTO → Entity
    return insuranceTransform.toEntity(dto);
  }

  /**
   * Map Entity to DB record
   */
  private mapToDB(entity: InsuranceCertificateEntity): Omit<InsuranceCertificateDB, 'id' | 'created_at' | 'updated_at'> {
    return {
      project_id: entity.project_id,
      contractor_id: entity.contractor_id,
      contractor_name: entity.contractor_name,
      insurance_company: entity.insurance_company,
      policy_number: entity.policy_number,
      coverage_amount: entity.coverage_amount,
      coverage_type: entity.coverage_type || entity.insurance_type || 'responsabilite_civile',
      valid_from: entity.valid_from,
      valid_until: entity.valid_until,
      certificate_url: entity.certificate_url,
      status: entity.status,
      last_verified: entity.last_verified,
      verified_by: entity.verified_by,
      notes: entity.notes,
      created_by: entity.created_by,
      updated_by: entity.updated_by,
    };
  }

  // ============================================================
  // IInsuranceRepository Implementation
  // ============================================================

  async getActiveCertificates(): Promise<InsuranceCertificateEntity[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .in('status', ['active', 'verified', 'approved']);

      if (error) throw error;
      return data?.map(cert => this.mapToEntity(cert)) || [];
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.getActiveCertificates failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to get active certificates');
    }
  }

  async getByProjectId(projectId: string): Promise<InsuranceCertificateEntity[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(cert => this.mapToEntity(cert)) || [];
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.getByProjectId failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to get certificates by project');
    }
  }

  async getById(id: string): Promise<InsuranceCertificateEntity | null> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return this.mapToEntity(data);
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.getById failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to get certificate by id');
    }
  }

  async create(
    certificate: Omit<InsuranceCertificateEntity, 'id' | 'created_at' | 'updated_at'>
  ): Promise<InsuranceCertificateEntity> {
    try {
      const dbData = this.mapToDB(certificate as InsuranceCertificateEntity);
      
      const { data, error } = await supabase
        .from('insurance_certificates')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;
      return this.mapToEntity(data);
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.create failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create certificate');
    }
  }

  async update(
    id: string, 
    updates: Partial<InsuranceCertificateEntity>
  ): Promise<InsuranceCertificateEntity> {
    try {
      // Utiliser le transformer pour préparer les mises à jour
      const updateData = insuranceTransform.updateDataToEntity(updates as any);
      
      const { data, error } = await supabase
        .from('insurance_certificates')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapToEntity(data);
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.update failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update certificate');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('insurance_certificates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.delete failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete certificate');
    }
  }

  async getExpiringSoon(daysThreshold: number): Promise<InsuranceCertificateEntity[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysThreshold);

      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .in('status', ['active', 'verified', 'approved'])
        .lte('valid_until', cutoffDate.toISOString())
        .gt('valid_until', new Date().toISOString());

      if (error) throw error;
      return data?.map(cert => this.mapToEntity(cert)) || [];
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.getExpiringSoon failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to get expiring certificates');
    }
  }

  async getByContractorId(contractorId: string): Promise<InsuranceCertificateEntity[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('valid_until', { ascending: true });

      if (error) throw error;
      return data?.map(cert => this.mapToEntity(cert)) || [];
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.getByContractorId failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to get certificates by contractor');
    }
  }

  async getExpired(): Promise<InsuranceCertificateEntity[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .in('status', ['active', 'verified', 'approved', 'expiring_soon'])
        .lt('valid_until', now);

      if (error) throw error;
      return data?.map(cert => this.mapToEntity(cert)) || [];
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.getExpired failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to get expired certificates');
    }
  }

  async search(filters: {
    status?: string;
    contractor_id?: string;
    project_id?: string;
    coverage_type?: string;
    search?: string;
  }): Promise<InsuranceCertificateEntity[]> {
    try {
      let query = supabase
        .from('insurance_certificates')
        .select('*');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.contractor_id) {
        query = query.eq('contractor_id', filters.contractor_id);
      }

      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id);
      }

      if (filters.coverage_type) {
        query = query.eq('coverage_type', filters.coverage_type);
      }

      if (filters.search) {
        query = query.or(
          `policy_number.ilike.%${filters.search}%,` +
          `insurance_company.ilike.%${filters.search}%,` +
          `contractor_name.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(cert => this.mapToEntity(cert)) || [];
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.search failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to search certificates');
    }
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    expired: number;
    expiring_soon: number;
    missing: number;
    byType: Record<string, number>;
    byProject: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*');

      if (error) throw error;

      const certificates = data || [];
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const stats = {
        total: certificates.length,
        active: 0,
        expired: 0,
        expiring_soon: 0,
        missing: 0,
        byType: {} as Record<string, number>,
        byProject: {} as Record<string, number>,
      };

      for (const cert of certificates) {
        // Statut calculé
        const validUntil = new Date(cert.valid_until);
        const status = cert.status;
        
        if (status === 'active' || status === 'verified' || status === 'approved') {
          if (validUntil < now) {
            stats.expired++;
          } else if (validUntil <= thirtyDaysFromNow) {
            stats.expiring_soon++;
          } else {
            stats.active++;
          }
        } else if (status === 'expired') {
          stats.expired++;
        } else if (status === 'expiring_soon') {
          stats.expiring_soon++;
        } else {
          stats.missing++;
        }

        // Par type
        const type = cert.coverage_type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Par projet
        const projectId = cert.project_id || 'unknown';
        stats.byProject[projectId] = (stats.byProject[projectId] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.getStatistics failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to get statistics');
    }
  }
}

// ============================================================
// Factory
// ============================================================

export function createSupabaseInsuranceAdapter(): SupabaseInsuranceAdapter {
  return new SupabaseInsuranceAdapter();
}