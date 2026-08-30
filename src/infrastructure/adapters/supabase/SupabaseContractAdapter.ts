/**
 * Supabase adapter for btp.contracts — seul propriétaire de l'accès DB pour
 * les contrats d'attribution.
 */

import { btpClient } from '@/integrations/supabase/schema-clients';
import type {
  IContractRepository,
  ContractQueryFilters,
} from '@/domain/repositories/IContractRepository';
import type {
  ContractRecordDTO,
  CreateContractRecordDTO,
} from '@/dtos/entities/ContractRecordDTO';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toDto = (row: any): ContractRecordDTO => ({
  id: row.id,
  contractNumber: row.contract_number,
  title: row.title,
  projectId: row.project_id ?? null,
  tenderId: row.tender_id ?? null,
  supplierId: row.supplier_id ?? null,
  sourceEstimateId: row.source_estimate_id ?? null,
  contractType: row.contract_type ?? 'works',
  status: row.status ?? 'signed',
  startDate: row.start_date ?? null,
  endDate: row.end_date ?? null,
  totalAmount: Number(row.total_amount ?? 0),
  currency: row.currency ?? 'MRU',
  signedAt: row.signed_at ?? null,
  signedBy: row.signed_by ?? null,
  metadata: (row.metadata as Record<string, unknown>) ?? null,
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
});

export class SupabaseContractAdapter implements IContractRepository {
  async findById(id: string): Promise<ContractRecordDTO | null> {
    const { data, error } = await (btpClient as any)
      .from('contracts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toDto(data) : null;
  }

  async findAll(filters: ContractQueryFilters = {}): Promise<ContractRecordDTO[]> {
    let query = (btpClient as any)
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.contractType) query = query.eq('contract_type', filters.contractType);
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,contract_number.ilike.%${filters.search}%`,
      );
    }
    query = query.limit(filters.limit ?? 200);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(toDto);
  }

  async findByProjectId(projectId: string): Promise<ContractRecordDTO[]> {
    const { data, error } = await (btpClient as any)
      .from('contracts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toDto);
  }

  async findByTenderId(tenderId: string): Promise<ContractRecordDTO[]> {
    const { data, error } = await (btpClient as any)
      .from('contracts')
      .select('*')
      .eq('tender_id', tenderId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toDto);
  }

  async findBySupplierId(supplierId: string): Promise<ContractRecordDTO[]> {
    const { data, error } = await (btpClient as any)
      .from('contracts')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toDto);
  }

  async create(dto: CreateContractRecordDTO): Promise<ContractRecordDTO> {
    const { data, error } = await (btpClient as any)
      .from('contracts')
      .insert({
        contract_number: dto.contractNumber,
        title: dto.title,
        project_id: dto.projectId ?? null,
        tender_id: dto.tenderId ?? null,
        supplier_id: dto.supplierId ?? null,
        source_estimate_id: dto.sourceEstimateId ?? null,
        contract_type: dto.contractType ?? 'works',
        status: dto.status ?? 'signed',
        start_date: dto.startDate ?? null,
        end_date: dto.endDate ?? null,
        total_amount: dto.totalAmount,
        currency: dto.currency ?? 'MRU',
        signed_at: dto.signedAt ?? new Date().toISOString(),
        metadata: dto.metadata ?? {},
      })
      .select()
      .single();
    if (error) throw error;
    return toDto(data);
  }

  async updateStatus(id: string, status: string): Promise<ContractRecordDTO> {
    const { data, error } = await (btpClient as any)
      .from('contracts')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toDto(data);
  }
}
