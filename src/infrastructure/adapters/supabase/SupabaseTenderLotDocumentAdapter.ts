import type { ITenderLotDocumentRepository, TenderLotDocumentRow } from '@/domain/repositories/ITenderLotDocumentRepository';

const TABLE = 'tender_lot_documents';

async function btp(): Promise<any> {
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  return btpClient;
}

export class SupabaseTenderLotDocumentAdapter implements ITenderLotDocumentRepository {
  async findByTender(tenderId: string): Promise<TenderLotDocumentRow[]> {
    const { data, error } = await (await btp())
      .from(TABLE).select('*').eq('tender_id', tenderId).order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async insert(row: Record<string, unknown>): Promise<TenderLotDocumentRow> {
    const { data, error } = await (await btp()).from(TABLE).insert(row).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, row: Record<string, unknown>): Promise<TenderLotDocumentRow> {
    const { data, error } = await (await btp()).from(TABLE).update(row).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await (await btp()).from(TABLE).delete().eq('id', id);
    if (error) throw error;
  }
}
