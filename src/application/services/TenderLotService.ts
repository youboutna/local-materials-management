/**
 * TenderLotService - Persistence for tender lots.
 * Hexagonal service (pure TS, no React).
 */
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { TenderLotTransformer, type TenderLotRecord } from '@/dtos/transforms/TenderLotTransformer';

export type { TenderLotRecord };

export class TenderLotService {
  async listByTender(tenderId: string): Promise<TenderLotRecord[]> {
    if (!tenderId) return [];
    const { data, error } = await supabase
      .from('tender_lots' as any)
      .select('*')
      .eq('tender_id', tenderId)
      .order('number', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => TenderLotTransformer.fromRow(row));
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

  /** Transition de statut du lot (brouillon → publié → en évaluation → attribué / annulé). */
  async setStatus(id: string, status: TenderLotRecord['status']): Promise<TenderLotRecord> {
    const { data, error } = await supabase
      .from('tender_lots' as any)
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return TenderLotTransformer.fromRow(data);
  }

  /** Attribue un lot à un prestataire à partir d'une soumission retenue. */
  async award(
    id: string,
    params: { awardedTo: string; awardedSubmissionId?: string | null; awardedAmount?: number | null },
  ): Promise<TenderLotRecord> {
    const { data, error } = await supabase
      .from('tender_lots' as any)
      .update({
        status: 'awarded',
        awarded_to: params.awardedTo,
        awarded_submission_id: params.awardedSubmissionId ?? null,
        awarded_amount: params.awardedAmount ?? null,
        awarded_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return TenderLotTransformer.fromRow(data);
  }

  /** Soumissions rattachées à un lot. */
  async listSubmissionsByLot(lotId: string): Promise<any[]> {
    if (!lotId) return [];
    const { data, error } = await supabase
      .from('tender_submissions' as any)
      .select('*')
      .eq('lot_id', lotId)
      .order('submission_date', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

}

let instance: TenderLotService | null = null;
export function getTenderLotService(): TenderLotService {
  if (!instance) instance = new TenderLotService();
  return instance;
}
