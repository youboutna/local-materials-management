/**
 * SupabaseBoqRepository — single adapter over btp.boq_lines.
 */

import type { BoqSource } from '@/domain/entities/boq/BoqLine';
import type { IBoqRepository } from '@/domain/repositories/IBoqRepository';
import type { BoqLineDTO, BoqLineFilter } from '@/dtos/boq/BoqLineDTO';
import { BOQ_LINE_TYPE_BY_SOURCE, BoqLineMapper, type BoqDbRow } from '@/dtos/boq/BoqLineMapper';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

const TABLE = 'boq_lines';

export class SupabaseBoqRepository implements IBoqRepository {
  async list(filter: BoqLineFilter): Promise<BoqLineDTO[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = (supabase as any).from(TABLE).select('*').eq('line_type', BOQ_LINE_TYPE_BY_SOURCE[filter.source]);
    if (filter.source === 'dqe') q = q.eq('source_type', 'dqe');
    // Sélection d'un document précis. La Vue Liste regroupe les lignes héritées
    // (document_id NULL) sous l'identifiant de contexte : le détail doit donc
    // accepter ce même repli, sinon le document apparaît vide (0 ligne / 0 MRU).
    if (filter.documentId) {
      const legacyBucket = filter.documentId === (filter.contextId ?? filter.projectId ?? filter.tenderId ?? filter.estimateId);
      q = legacyBucket
        ? q.or(`document_id.is.null,document_id.eq.${filter.documentId}`)
        : q.eq('document_id', filter.documentId);
    }

    if (filter.source === 'quantity_takeoff' && (filter.projectId || filter.contextId)) q = q.eq('project_id', filter.projectId ?? filter.contextId);
    else if (filter.source === 'dqe' && (filter.projectId || filter.contextId)) q = q.eq('project_id', filter.projectId ?? filter.contextId);
    else if (filter.source === 'tender_estimate' && (filter.tenderId || filter.contextId)) q = q.eq('tender_id', filter.tenderId ?? filter.contextId);
    else if ((filter.source === 'supplier_bid' || filter.source === 'invoice') && (filter.contextId || filter.estimateId)) q = q.eq('submission_id', filter.contextId ?? filter.estimateId);
    // Lecture côté projet / consultant : les décomptes et devis d'un projet (pas d'une soumission précise).
    else if ((filter.source === 'supplier_bid' || filter.source === 'invoice') && filter.projectId) q = q.eq('project_id', filter.projectId);
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
    // Mise à jour partielle : on fusionne avec la ligne existante avant d'écrire,
    // sinon les valeurs par défaut du mapper (project_id, statut, fiscalité,
    // montants) écrasent des données valides.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: current, error: readError } = await (supabase as any)
      .from(TABLE).select('*').eq('id', id).maybeSingle();
    if (readError) throw new Error(readError.message);
    const existing = current ? BoqLineMapper.fromDb(current as BoqDbRow, dto.source) : null;
    const merged = { ...(existing ?? {}), ...dto, id } as BoqLineDTO;
    // Le total est recalculé sauf s'il est explicitement fourni dans le patch.
    if (dto.totalHt === undefined && (dto.quantity !== undefined || dto.unitPrice !== undefined || dto.fees !== undefined)) {
      merged.totalHt = null;
    }
    const payload = BoqLineMapper.toDb(merged);
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

  async deleteMany(ids: string[], source: BoqSource): Promise<number> {
    if (!ids.length) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .delete()
      .in('id', ids)
      .eq('line_type', BOQ_LINE_TYPE_BY_SOURCE[source])
      .select('id');
    if (error) throw new Error(error.message);
    return (data as { id: string }[] | null)?.length ?? 0;
  }
}

export const boqRepository: IBoqRepository = new SupabaseBoqRepository();
