/**
 * SupabaseBoqRepository — single adapter over btp.boq_lines.
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import type { IBoqRepository } from '@/domain/repositories/IBoqRepository';
import type { BoqLineDTO, BoqLineFilter } from '@/dtos/boq/BoqLineDTO';
import { BOQ_LINE_TYPE_BY_SOURCE, BoqLineMapper, type BoqDbRow } from '@/dtos/boq/BoqLineMapper';
import type { BoqSource } from '@/domain/boq/BoqLine';

const TABLE = 'boq_lines';

export class SupabaseBoqRepository implements IBoqRepository {
  async list(filter: BoqLineFilter): Promise<BoqLineDTO[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = (supabase as any).from(TABLE).select('*').eq('line_type', BOQ_LINE_TYPE_BY_SOURCE[filter.source]);
    if (filter.source === 'dqe') q = q.eq('source_type', 'dqe');
    if (filter.source === 'quantity_takeoff' && (filter.projectId || filter.contextId)) q = q.eq('project_id', filter.projectId ?? filter.contextId);
    else if (filter.source === 'dqe' && (filter.projectId || filter.contextId)) q = q.eq('project_id', filter.projectId ?? filter.contextId);
    else if (filter.source === 'tender_estimate' && (filter.tenderId || filter.contextId)) q = q.eq('tender_id', filter.tenderId ?? filter.contextId);
    else if ((filter.source === 'supplier_bid' || filter.source === 'invoice') && (filter.contextId || filter.estimateId)) q = q.eq('submission_id', filter.contextId ?? filter.estimateId);
    if (filter.phaseId) q = q.eq('phase_id', filter.phaseId);
    if (filter.resourceType) q = q.eq('resource_kind', filter.resourceType);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data as BoqDbRow[]).map((r) => BoqLineMapper.fromDb(r, filter.source));
  }

  async create(dto: BoqLineDTO): Promise<BoqLineDTO> {
    const payload = BoqLineMapper.toDb(dto);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from(TABLE).insert(payload).select().single();
    if (error) throw new Error(error.message);
    return BoqLineMapper.fromDb(data as BoqDbRow, dto.source);
  }

  async bulkCreate(dtos: BoqLineDTO[]): Promise<BoqLineDTO[]> {
    if (!dtos.length) return [];
    const source = dtos[0].source;
    const payload = dtos.map((d) => BoqLineMapper.toDb(d));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from(TABLE).insert(payload).select();
    if (error) throw new Error(error.message);
    return (data as BoqDbRow[]).map((r) => BoqLineMapper.fromDb(r, source));
  }

  async update(id: string, dto: Partial<BoqLineDTO>): Promise<BoqLineDTO> {
    if (!dto.source) throw new Error('BoqLineDTO.source required for update');
    const payload = BoqLineMapper.toDb({ ...dto, id } as BoqLineDTO);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from(TABLE).update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return BoqLineMapper.fromDb(data as BoqDbRow, dto.source);
  }

  async updateStatus(ids: string[], status: NonNullable<BoqLineDTO['status']>, source: BoqSource): Promise<void> {
    if (!ids.length) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from(TABLE).update({ status }).in('id', ids).eq('line_type', BOQ_LINE_TYPE_BY_SOURCE[source]);
    if (error) throw new Error(error.message);
  }

  async delete(id: string, source: BoqSource): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from(TABLE).delete().eq('id', id).eq('line_type', BOQ_LINE_TYPE_BY_SOURCE[source]);
    if (error) throw new Error(error.message);
  }
}

export const boqRepository: IBoqRepository = new SupabaseBoqRepository();
