/**
 * TenderLotService - Persistence for tender lots.
 * Hexagonal service (pure TS, no React).
 */
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { TenderLotTransformer, TenderLotRecord } from '@/dtos/transforms/TenderLotTransformer';

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
      .insert(TenderLotTransformer.toRow(lot))
      .select()
      .single();
    if (error) throw error;
    return TenderLotTransformer.fromRow(data);
  }

  async update(id: string, lot: Partial<TenderLotRecord> & { tenderId: string }): Promise<TenderLotRecord> {
    const { data, error } = await supabase
      .from('tender_lots' as any)
      .update(TenderLotTransformer.toRow(lot))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return TenderLotTransformer.fromRow(data);
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
