/**
 * TenderLotDocumentService - CRUD for documents attached to a tender lot
 * (or to all lots when lot_id is null).
 * Hexagonal service (pure TS, no React).
 */
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { supabase as rootSupabase } from '@/integrations/supabase/client';

export interface TenderLotDocumentRecord {
  id: string;
  tenderId: string;
  lotId: string | null;
  title: string;
  description: string | null;
  category: string | null;
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

function fromRow(row: any): TenderLotDocumentRecord {
  return {
    id: row.id,
    tenderId: row.tender_id,
    lotId: row.lot_id ?? null,
    title: row.title ?? '',
    description: row.description ?? null,
    category: row.category ?? null,
    fileUrl: row.file_url ?? '',
    fileName: row.file_name ?? null,
    fileSize: row.file_size ?? null,
    mimeType: row.mime_type ?? null,
    uploadedBy: row.uploaded_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateTenderLotDocumentInput {
  tenderId: string;
  lotId: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  fileUrl: string;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
}

export class TenderLotDocumentService {
  async listByTender(tenderId: string): Promise<TenderLotDocumentRecord[]> {
    if (!tenderId) return [];
    const { data, error } = await supabase
      .from('tender_lot_documents' as any)
      .select('*')
      .eq('tender_id', tenderId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }

  async create(input: CreateTenderLotDocumentInput): Promise<TenderLotDocumentRecord> {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('tender_lot_documents' as any)
      .insert({
        tender_id: input.tenderId,
        lot_id: input.lotId,
        title: input.title,
        description: input.description ?? null,
        category: input.category ?? null,
        file_url: input.fileUrl,
        file_name: input.fileName ?? null,
        file_size: input.fileSize ?? null,
        mime_type: input.mimeType ?? null,
        uploaded_by: userData.user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return fromRow(data);
  }

  async update(id: string, updates: Partial<Omit<TenderLotDocumentRecord, 'id' | 'tenderId' | 'createdAt' | 'updatedAt'>>): Promise<TenderLotDocumentRecord> {
    const row: any = {};
    if (updates.lotId !== undefined) row.lot_id = updates.lotId;
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.category !== undefined) row.category = updates.category;
    if (updates.fileUrl !== undefined) row.file_url = updates.fileUrl;
    if (updates.fileName !== undefined) row.file_name = updates.fileName;
    if (updates.fileSize !== undefined) row.file_size = updates.fileSize;
    if (updates.mimeType !== undefined) row.mime_type = updates.mimeType;
    const { data, error } = await supabase
      .from('tender_lot_documents' as any)
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return fromRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tender_lot_documents' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async uploadFile(tenderId: string, file: File): Promise<{ path: string; publicUrl: string }> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `tender-lots/${tenderId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('documents').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  }
}

let instance: TenderLotDocumentService | null = null;
export function getTenderLotDocumentService(): TenderLotDocumentService {
  if (!instance) instance = new TenderLotDocumentService();
  return instance;
}
