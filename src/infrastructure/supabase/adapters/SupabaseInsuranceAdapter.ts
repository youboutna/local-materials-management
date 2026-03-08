// @ts-nocheck
/**
 * Supabase Adapter for Insurance Certificate Repository
 * Implements IInsuranceRepository interface using Supabase client
 */

import { supabase } from '@/integrations/supabase/client';
import { InsuranceCertificateEntity } from '@/domain/entities/InsuranceCertificate.entity';
import { IInsuranceRepository } from '@/domain/repositories/IInsuranceRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { InsuranceCertificateDB } from '@/dtos/transforms/insuranceTransform';

export class SupabaseInsuranceAdapter implements IInsuranceRepository {
  private mapToEntity(data: InsuranceCertificateDB): InsuranceCertificateEntity {
    return {
      id: data.id,
      project_id: data.project_id,
      contractor_id: data.contractor_id,
      contractor_name: data.contractor_name,
      insurance_company: data.insurance_company,
      policy_number: data.policy_number,
      coverage_amount: data.coverage_amount,
      coverage_type: data.coverage_type,
      valid_from: data.valid_from,
      valid_until: data.valid_until,
      certificate_url: data.certificate_url,
      status: data.status as 'active' | 'expired' | 'expiring_soon' | 'missing',
      last_verified: data.last_verified,
      verified_by: data.verified_by,
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  async getActiveCertificates(): Promise<InsuranceCertificateEntity[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('status', 'active');

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
        .eq('project_id', projectId);

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

  async create(certificate: Omit<InsuranceCertificateEntity, 'id' | 'created_at' | 'updated_at'>): Promise<InsuranceCertificateEntity> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .insert(certificate)
        .select()
        .single();

      if (error) throw error;
      return this.mapToEntity(data);
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.create failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create certificate');
    }
  }

  async update(id: string, updates: Partial<InsuranceCertificateEntity>): Promise<InsuranceCertificateEntity> {
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .update(updates)
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
        .eq('status', 'active')
        .lte('valid_until', cutoffDate.toISOString());

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
        .eq('contractor_id', contractorId);

      if (error) throw error;
      return data?.map(cert => this.mapToEntity(cert)) || [];
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.getByContractorId failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to get certificates by contractor');
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
        query = query.or(`policy_number.ilike.%${filters.search}%,insurance_company.ilike.%${filters.search}%,contractor_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(cert => this.mapToEntity(cert)) || [];
    } catch (error) {
      console.error('SupabaseInsuranceAdapter.search failed:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to search certificates');
    }
  }
}
