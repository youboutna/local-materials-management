// @ts-nocheck
/**
 * Bank Guarantee Adapter - Supabase Implementation
 * Implements IBankGuaranteeRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';
import { BankGuaranteeDTO, CreateBankGuaranteeDTO, UpdateBankGuaranteeDTO } from '@/dtos/bank-guarantees';
import { BankGuaranteeQueryOptions } from '@/domain/repositories/IBankGuaranteeRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';

interface SupabaseBankGuarantee {
  id: string;
  project_id: string;
  contractor_id: string;
  guarantee_type: string;
  guarantee_amount: number;
  bank_name: string;
  guarantee_number: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  conditions?: string[];
  documents?: string[];
  currency?: string;
  exchange_rate?: number;
  created_at: string;
  updated_at: string;
}

export class BankGuaranteeAdapter implements IBankGuaranteeRepository {
  
  async create(guarantee: CreateBankGuaranteeDTO): Promise<BankGuaranteeDTO> {
    const supabaseData = {
      project_id: guarantee.project_id,
      guarantee_type: guarantee.guarantee_type,
      guarantee_amount: guarantee.guarantee_amount,
      bank_name: guarantee.issuing_bank,
      guarantee_number: guarantee.guarantee_number,
      issue_date: guarantee.issue_date,
      expiry_date: guarantee.expiry_date,
      status: guarantee.status || 'pending',
      conditions: guarantee.conditions || [],
      documents: guarantee.documents || [],
      contractor_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('bank_guarantees')
      .insert(supabaseData)
      .select()
      .single();

    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create bank guarantee', error);
    return this.toDto(data as SupabaseBankGuarantee);
  }

  async getByProject(options: BankGuaranteeQueryOptions): Promise<BankGuaranteeDTO[]> {
    let query = supabase
      .from('bank_guarantees')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.projectId) query = query.eq('project_id', options.projectId);
    if (options.status) query = query.eq('status', options.status);
    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 0) - 1);

    const { data, error } = await query;

    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch bank guarantees', error);
    return (data as SupabaseBankGuarantee[]).map(this.toDto);
  }

  async findByProjectId(projectId: string): Promise<BankGuaranteeDTO[]> {
    return this.getByProject({ projectId });
  }

  async findAll(): Promise<BankGuaranteeDTO[]> {
    return this.getByProject({});
  }

  async updateStatus(guaranteeId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantees')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', guaranteeId);

    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update bank guarantee status', error);
  }

  async releasePhaseGuarantees(phaseId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantees')
      .update({ status: 'released', released_at: new Date().toISOString() })
      .eq('phase_id', phaseId);

    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to release phase guarantees', error);
  }

  async releaseProjectGuarantees(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantees')
      .update({ status: 'released', released_at: new Date().toISOString() })
      .eq('project_id', projectId);

    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to release project guarantees', error);
  }

  async getById(guaranteeId: string): Promise<BankGuaranteeDTO> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .eq('id', guaranteeId)
      .single();

    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch bank guarantee', error);
    return this.toDto(data as SupabaseBankGuarantee);
  }

  async update(guaranteeId: string, updates: UpdateBankGuaranteeDTO): Promise<BankGuaranteeDTO> {
    const supabaseData = {
      guarantee_type: updates.guarantee_type,
      guarantee_amount: updates.guarantee_amount,
      bank_name: updates.issuing_bank,
      guarantee_number: updates.guarantee_number,
      issue_date: updates.issue_date,
      expiry_date: updates.expiry_date,
      status: updates.status,
      conditions: updates.conditions,
      documents: updates.documents,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('bank_guarantees')
      .update(supabaseData)
      .eq('id', guaranteeId)
      .select()
      .single();

    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update bank guarantee', error);
    return this.toDto(data as SupabaseBankGuarantee);
  }

  async delete(guaranteeId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantees')
      .delete()
      .eq('id', guaranteeId);

    if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete bank guarantee', error);
  }

  private toDto(data: SupabaseBankGuarantee): BankGuaranteeDTO {
    return {
      id: data.id,
      project_id: data.project_id,
      contractor_id: data.contractor_id,
      guarantee_type: data.guarantee_type as 'performance' | 'payment' | 'advance_payment' | 'warranty' | 'retention',
      guarantee_amount: data.guarantee_amount,
      issuing_bank: data.bank_name,
      bank_name: data.bank_name,
      guarantee_number: data.guarantee_number,
      issue_date: data.issue_date,
      expiry_date: data.expiry_date,
      status: data.status as 'active' | 'expired' | 'cancelled' | 'claimed' | 'pending',
      conditions: data.conditions || [],
      documents: data.documents || [],
      currency: data.currency,
      exchange_rate: data.exchange_rate,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}
