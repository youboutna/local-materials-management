/**
 * TenderLotService - Persistence for tender lots.
 * Hexagonal service (pure TS, no React).
 */
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

export interface TenderLotRecord {
  id: string;
  tenderId: string;
  projectId?: string | null;
  number: number;
  title: string;
  description?: string | null;
  estimatedAmount?: number | null;
  linkedPhaseIds: string[];
  linkedStepIds: string[];
  requirements: string[];
  deliverables: string[];
}

const isUuid = (v: string | undefined | null): v is string =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

function fromRow(row: any): TenderLotRecord {
  return {
    id: row.id,
    tenderId: row.tender_id,
    projectId: row.project_id ?? null,
    number: row.number ?? 1,
    title: row.title ?? '',
    description: row.description ?? null,
    estimatedAmount: row.estimated_amount ?? null,
    linkedPhaseIds: row.linked_phase_ids ?? [],
    linkedStepIds: row.linked_step_ids ?? [],
    requirements: row.requirements ?? [],
    deliverables: row.deliverables ?? [],
  };
}

function toRow(lot: Partial<TenderLotRecord> & { tenderId: string }) {
  return {
    tender_id: lot.tenderId,
    project_id: isUuid(lot.projectId ?? undefined) ? lot.projectId : null,
    number: lot.number ?? 1,
    title: lot.title ?? '',
    description: lot.description ?? null,
    estimated_amount: lot.estimatedAmount ?? null,
    linked_phase_ids: (lot.linkedPhaseIds ?? []).filter(isUuid),
    linked_step_ids: (lot.linkedStepIds ?? []).filter(isUuid),
    requirements: lot.requirements ?? [],
    deliverables: lot.deliverables ?? [],
  };
}

export class TenderLotService {
  async listByTender(tenderId: string): Promise<TenderLotRecord[]> {
    if (!tenderId) return [];
    const { data, error } = await supabase
      .from('tender_lots' as any)
      .select('*')
      .eq('tender_id', tenderId)
      .order('number', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }

  async create(lot: Omit<TenderLotRecord, 'id'>): Promise<TenderLotRecord> {
    const { data, error } = await supabase
      .from('tender_lots' as any)
      .insert(toRow(lot))
      .select()
      .single();
    if (error) throw error;
    return fromRow(data);
  }

  async update(id: string, lot: Partial<TenderLotRecord> & { tenderId: string }): Promise<TenderLotRecord> {
    const { data, error } = await supabase
      .from('tender_lots' as any)
      .update(toRow(lot))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return fromRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tender_lots' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}

let instance: TenderLotService | null = null;
export function getTenderLotService(): TenderLotService {
  if (!instance) instance = new TenderLotService();
  return instance;
}
