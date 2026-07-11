/**
 * SupabaseBoqRepository — single adapter serving 4 BOQ sources:
 *   - quantity_takeoff   → btp.quantity_takeoffs (via public view)
 *   - tender_estimate    → public.tender_estimate_items
 *   - supplier_bid       → public.tender_estimate_items (source='supplier_bid')
 *   - dqe                → public.tender_estimate_items (source='dqe')
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import type { IBoqRepository } from '@/domain/repositories/IBoqRepository';
import type { BoqLineDTO, BoqLineFilter } from '@/dtos/boq/BoqLineDTO';
import { BoqLineMapper, type BoqDbRow } from '@/dtos/boq/BoqLineMapper';
import type { BoqSource } from '@/domain/boq/BoqLine';

const TABLE_BY_SOURCE: Record<BoqSource, 'quantity_takeoffs' | 'tender_estimate_items'> = {
  quantity_takeoff: 'quantity_takeoffs',
  tender_estimate: 'tender_estimate_items',
  supplier_bid: 'tender_estimate_items',
  dqe: 'tender_estimate_items',
};

export class SupabaseBoqRepository implements IBoqRepository {
  private tableOf(source: BoqSource) {
    return TABLE_BY_SOURCE[source];
  }

  async list(filter: BoqLineFilter): Promise<BoqLineDTO[]> {
    const table = this.tableOf(filter.source);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = (supabase as any).from(table).select('*');
    if (filter.source === 'quantity_takeoff' && (filter.projectId || filter.contextId)) {
      q = q.eq('project_id', filter.projectId ?? filter.contextId);
    } else if (filter.estimateId || filter.contextId) {
      q = q.eq('estimate_id', filter.estimateId ?? filter.contextId);
    }
    if (filter.source === 'supplier_bid') q = q.eq('source', 'supplier_bid');
    if (filter.source === 'tender_estimate') q = q.or('source.is.null,source.eq.tender_estimate');
    if (filter.source === 'dqe') q = q.eq('source', 'dqe');
    if (filter.phaseId) q = q.eq('phase_id', filter.phaseId);
    if (filter.resourceType) q = q.eq('resource_type', filter.resourceType);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data as BoqDbRow[]).map((r) => BoqLineMapper.fromDb(r, filter.source));
  }

  async create(dto: BoqLineDTO): Promise<BoqLineDTO> {
    const table = this.tableOf(dto.source);
    const payload = BoqLineMapper.toDb(dto);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from(table).insert(payload).select().single();
    if (error) throw new Error(error.message);
    return BoqLineMapper.fromDb(data as BoqDbRow, dto.source);
  }

  async bulkCreate(dtos: BoqLineDTO[]): Promise<BoqLineDTO[]> {
    if (!dtos.length) return [];
    const source = dtos[0].source;
    const table = this.tableOf(source);
    const payload = dtos.map((d) => BoqLineMapper.toDb(d));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from(table).insert(payload).select();
    if (error) throw new Error(error.message);
    return (data as BoqDbRow[]).map((r) => BoqLineMapper.fromDb(r, source));
  }

  async update(id: string, dto: Partial<BoqLineDTO>): Promise<BoqLineDTO> {
    if (!dto.source) throw new Error('BoqLineDTO.source required for update');
    const table = this.tableOf(dto.source);
    const payload = BoqLineMapper.toDb({ ...dto, id } as BoqLineDTO);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from(table).update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return BoqLineMapper.fromDb(data as BoqDbRow, dto.source);
  }

  async delete(id: string, source: BoqSource): Promise<void> {
    const table = this.tableOf(source);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export const boqRepository: IBoqRepository = new SupabaseBoqRepository();
