
/**
 * Bank Guarantee Adapter - Supabase Implementation
 * Implements IBankGuaranteeRepository using Supabase
 */

import { BankGuaranteeQueryOptions, IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';
import { BankGuaranteeDTO, CreateBankGuaranteeDTO, UpdateBankGuaranteeDTO } from '@/dtos/bank-guarantees';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { BtpTables } from '@/integrations/supabase/btp-types';
import { AppError, ErrorCode } from '@/utils/errorHandling';

type SupabaseBankGuarantee = BtpTables<'bank_guarantees'>;

export class BankGuaranteeAdapter implements IBankGuaranteeRepository {

  async create(guarantee: CreateBankGuaranteeDTO): Promise<BankGuaranteeDTO> {
    const supabaseData = {
      project_id: guarantee.project_id ?? guarantee.projectId,
      guarantee_type: guarantee.guarantee_type ?? guarantee.guaranteeType,
      guarantee_amount: guarantee.guarantee_amount ?? guarantee.guaranteeAmount,
      bank_name: guarantee.issuing_bank ?? guarantee.issuingBank,
      issue_date: guarantee.issue_date ?? guarantee.issueDate,
      expiry_date: guarantee.expiry_date ?? guarantee.expiryDate,
      status: guarantee.status || 'pending',
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
    return (data as SupabaseBankGuarantee[]).map((row) => this.toDto(row));
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

  async releasePhaseGuarantees(_phaseId: string): Promise<void> {
    // La table bank_guarantees ne référence pas de phase_id : aucune libération
    // par phase n'est possible avec le schéma réel. Opération sans effet.
    return;
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
      issue_date: updates.issue_date,
      expiry_date: updates.expiry_date,
      status: updates.status,
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
    const type = data.guarantee_type as BankGuaranteeDTO['type'];
    const status = data.status as BankGuaranteeDTO['status'];
    return {
      id: data.id,
      projectId: data.project_id,
      project_id: data.project_id,
      contractorId: data.contractor_id,
      contractor_id: data.contractor_id,
      type,
      guaranteeType: type,
      guarantee_type: data.guarantee_type,
      number: data.id,
      guaranteeNumber: data.id,
      guarantee_number: data.id,
      issuingBank: data.bank_name,
      issuing_bank: data.bank_name,
      bank_name: data.bank_name,
      issueDate: data.issue_date,
      issue_date: data.issue_date,
      expiryDate: data.expiry_date,
      expiry_date: data.expiry_date,
      amount: data.guarantee_amount,
      guaranteeAmount: data.guarantee_amount,
      guarantee_amount: data.guarantee_amount,
      currency: 'MRU',
      status,
      conditions: [],
      documents: [],
      createdAt: data.created_at,
      created_at: data.created_at,
      updatedAt: data.updated_at,
      updated_at: data.updated_at,
    };
  }
}
