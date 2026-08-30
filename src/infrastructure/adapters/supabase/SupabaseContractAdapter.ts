/**
 * Supabase adapter for btp.contracts + btp.contract_lines — seul propriétaire de
 * l'accès DB pour les contrats d'attribution et leurs lignes de prix figées.
 */

import { btpClient } from '@/integrations/supabase/schema-clients';
import type {
  IContractRepository,
  ContractQueryFilters,
} from '@/domain/repositories/IContractRepository';
import type {
  ContractRecordDTO,
  CreateContractRecordDTO,
  UpdateContractRecordDTO,
} from '@/dtos/entities/ContractRecordDTO';
import type {
  ContractLineDTO,
  CreateContractLineDTO,
  UpdateContractLineDTO,
} from '@/dtos/entities/ContractLineDTO';

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
  signedDocumentId: row.signed_document_id ?? null,
  signedDocumentUrl: row.signed_document_url ?? null,
  metadata: (row.metadata as Record<string, unknown>) ?? null,
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toLineDto = (row: any): ContractLineDTO => ({
  id: row.id,
  contractId: row.contract_id,
  sourceBoqLineId: row.source_boq_line_id ?? null,
  sourceEstimateItemId: row.source_estimate_item_id ?? null,
  phaseId: row.phase_id ?? null,
  lotId: row.lot_id ?? null,
  lineCode: row.line_code ?? null,
  designation: row.designation,
  unit: row.unit ?? null,
  quantity: Number(row.quantity ?? 0),
  unitPrice: Number(row.unit_price ?? 0),
  amountHt: Number(row.amount_ht ?? 0),
  vatRate: Number(row.vat_rate ?? 0),
  amountTtc: Number(row.amount_ttc ?? 0),
  currency: row.currency ?? 'MRU',
  category: row.category ?? null,
  displayOrder: Number(row.display_order ?? 0),
  metadata: (row.metadata as Record<string, unknown>) ?? null,
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
});

const toLineRow = (dto: CreateContractLineDTO) => {
  const quantity = Number(dto.quantity || 0);
  const unitPrice = Number(dto.unitPrice || 0);
  const vatRate = Number(dto.vatRate ?? 0);
  const amountHt = quantity * unitPrice;
  return {
    contract_id: dto.contractId,
    source_boq_line_id: dto.sourceBoqLineId ?? null,
    source_estimate_item_id: dto.sourceEstimateItemId ?? null,
    phase_id: dto.phaseId ?? null,
    lot_id: dto.lotId ?? null,
    line_code: dto.lineCode ?? null,
    designation: dto.designation,
    unit: dto.unit ?? null,
    quantity,
    unit_price: unitPrice,
    amount_ht: amountHt,
    vat_rate: vatRate,
    amount_ttc: amountHt * (1 + vatRate / 100),
    currency: dto.currency ?? 'MRU',
    category: dto.category ?? null,
    display_order: dto.displayOrder ?? 0,
    metadata: dto.metadata ?? {},
  };
};

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
        signed_document_id: dto.signedDocumentId ?? null,
        signed_document_url: dto.signedDocumentUrl ?? null,
        metadata: dto.metadata ?? {},
      })
      .select()
      .single();
    if (error) throw error;
    return toDto(data);
  }

  async update(id: string, dto: UpdateContractRecordDTO): Promise<ContractRecordDTO> {
    const patch: Record<string, unknown> = {};
    if (dto.contractNumber !== undefined) patch.contract_number = dto.contractNumber;
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.projectId !== undefined) patch.project_id = dto.projectId;
    if (dto.tenderId !== undefined) patch.tender_id = dto.tenderId;
    if (dto.supplierId !== undefined) patch.supplier_id = dto.supplierId;
    if (dto.sourceEstimateId !== undefined) patch.source_estimate_id = dto.sourceEstimateId;
    if (dto.contractType !== undefined) patch.contract_type = dto.contractType;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.startDate !== undefined) patch.start_date = dto.startDate;
    if (dto.endDate !== undefined) patch.end_date = dto.endDate;
    if (dto.totalAmount !== undefined) patch.total_amount = dto.totalAmount;
    if (dto.currency !== undefined) patch.currency = dto.currency;
    if (dto.signedAt !== undefined) patch.signed_at = dto.signedAt;
    if (dto.signedDocumentId !== undefined) patch.signed_document_id = dto.signedDocumentId;
    if (dto.signedDocumentUrl !== undefined) patch.signed_document_url = dto.signedDocumentUrl;
    if (dto.metadata !== undefined) patch.metadata = dto.metadata;

    const { data, error } = await (btpClient as any)
      .from('contracts')
      .update(patch)
      .eq('id', id)
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

  async delete(id: string): Promise<void> {
    const { error } = await (btpClient as any).from('contracts').delete().eq('id', id);
    if (error) throw error;
  }

  // --- Lignes contractuelles ---

  async findLines(contractId: string): Promise<ContractLineDTO[]> {
    const { data, error } = await (btpClient as any)
      .from('contract_lines')
      .select('*')
      .eq('contract_id', contractId)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toLineDto);
  }

  async createLines(lines: CreateContractLineDTO[]): Promise<ContractLineDTO[]> {
    if (lines.length === 0) return [];
    const { data, error } = await (btpClient as any)
      .from('contract_lines')
      .insert(lines.map(toLineRow))
      .select();
    if (error) throw error;
    return (data ?? []).map(toLineDto);
  }

  async updateLine(id: string, patch: UpdateContractLineDTO): Promise<ContractLineDTO> {
    const current = await (btpClient as any)
      .from('contract_lines')
      .select('*')
      .eq('id', id)
      .single();
    if (current.error) throw current.error;

    const merged = { ...current.data };
    if (patch.designation !== undefined) merged.designation = patch.designation;
    if (patch.lineCode !== undefined) merged.line_code = patch.lineCode;
    if (patch.unit !== undefined) merged.unit = patch.unit;
    if (patch.quantity !== undefined) merged.quantity = Number(patch.quantity || 0);
    if (patch.unitPrice !== undefined) merged.unit_price = Number(patch.unitPrice || 0);
    if (patch.vatRate !== undefined) merged.vat_rate = Number(patch.vatRate || 0);
    if (patch.category !== undefined) merged.category = patch.category;
    if (patch.phaseId !== undefined) merged.phase_id = patch.phaseId;
    if (patch.lotId !== undefined) merged.lot_id = patch.lotId;
    if (patch.displayOrder !== undefined) merged.display_order = patch.displayOrder;
    if (patch.currency !== undefined) merged.currency = patch.currency;
    if (patch.metadata !== undefined) merged.metadata = patch.metadata;

    const amountHt = Number(merged.quantity || 0) * Number(merged.unit_price || 0);

    const { data, error } = await (btpClient as any)
      .from('contract_lines')
      .update({
        designation: merged.designation,
        line_code: merged.line_code,
        unit: merged.unit,
        quantity: merged.quantity,
        unit_price: merged.unit_price,
        vat_rate: merged.vat_rate,
        amount_ht: amountHt,
        amount_ttc: amountHt * (1 + Number(merged.vat_rate || 0) / 100),
        category: merged.category,
        phase_id: merged.phase_id,
        lot_id: merged.lot_id,
        display_order: merged.display_order,
        currency: merged.currency,
        metadata: merged.metadata,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toLineDto(data);
  }

  async deleteLine(id: string): Promise<void> {
    const { error } = await (btpClient as any).from('contract_lines').delete().eq('id', id);
    if (error) throw error;
  }

  async deleteLinesByContract(contractId: string): Promise<void> {
    const { error } = await (btpClient as any)
      .from('contract_lines')
      .delete()
      .eq('contract_id', contractId);
    if (error) throw error;
  }
}
