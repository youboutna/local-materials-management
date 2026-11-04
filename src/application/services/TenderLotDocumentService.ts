/**
 * TenderLotDocumentService - CRUD for documents attached to a tender lot
 * (or to all lots when lot_id is null).
 * Hexagonal service (pure TS, no React).
 */
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import type { ITenderLotDocumentRepository } from '@/domain/repositories/ITenderLotDocumentRepository';
import type { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import type { IStorageRepository } from '@/domain/repositories/IStorageRepository';

export interface TenderLotDocumentRecord {
  id: string;
  tenderId: string;
  lotId: string | null;
  lotIds: string[];
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
  const lotIds: string[] = Array.isArray(row.lot_ids) ? row.lot_ids.filter(Boolean) : [];
  return {
    id: row.id,
    tenderId: row.tender_id,
    lotId: row.lot_id ?? (lotIds[0] ?? null),
    lotIds,
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
  lotId?: string | null;
  lotIds?: string[];
  title: string;
  description?: string | null;
  category?: string | null;
  fileUrl: string;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
}

export class TenderLotDocumentService {
  constructor(
    private readonly repo: ITenderLotDocumentRepository = RepositoryFactory.getTenderLotDocumentRepository(),
    private readonly auth: IAuthRepository = RepositoryFactory.getAuthRepository(),
    private readonly storage: IStorageRepository = RepositoryFactory.getStorageRepository(),
  ) {}

  async listByTender(tenderId: string): Promise<TenderLotDocumentRecord[]> {
    if (!tenderId) return [];
    return (await this.repo.findByTender(tenderId)).map(fromRow);
  }


  async create(input: CreateTenderLotDocumentInput): Promise<TenderLotDocumentRecord> {
    const { user } = await this.auth.getCurrentUser();
    const lotIds = (input.lotIds ?? (input.lotId ? [input.lotId] : [])).filter(Boolean);
    return fromRow(await this.repo.insert({
        tender_id: input.tenderId,
        lot_id: lotIds[0] ?? null,
        lot_ids: lotIds,
        title: input.title,
        description: input.description ?? null,
        category: input.category ?? null,
        file_url: input.fileUrl,
        file_name: input.fileName ?? null,
        file_size: input.fileSize ?? null,
        mime_type: input.mimeType ?? null,
        uploaded_by: user?.id ?? null,
      }));
  }

  async update(id: string, updates: Partial<Omit<TenderLotDocumentRecord, 'id' | 'tenderId' | 'createdAt' | 'updatedAt'>>): Promise<TenderLotDocumentRecord> {
    const row: any = {};
    if (updates.lotIds !== undefined) {
      const ids = (updates.lotIds ?? []).filter(Boolean);
      row.lot_ids = ids;
      row.lot_id = ids[0] ?? null;
    } else if (updates.lotId !== undefined) {
      row.lot_id = updates.lotId;
      row.lot_ids = updates.lotId ? [updates.lotId] : [];
    }
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.category !== undefined) row.category = updates.category;
    if (updates.fileUrl !== undefined) row.file_url = updates.fileUrl;
    if (updates.fileName !== undefined) row.file_name = updates.fileName;
    if (updates.fileSize !== undefined) row.file_size = updates.fileSize;
    if (updates.mimeType !== undefined) row.mime_type = updates.mimeType;
    return fromRow(await this.repo.update(id, row));
  }


  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async uploadFile(tenderId: string, file: File): Promise<{ path: string; publicUrl: string }> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `tender-lots/${tenderId}/${Date.now()}-${safeName}`;
    const { result, error } = await this.storage.uploadFile('documents', path, file);
    if (error || !result) throw error ?? new Error('Upload failed');
    return { path: result.path || path, publicUrl: result.publicUrl };
  }
}

let instance: TenderLotDocumentService | null = null;
export function getTenderLotDocumentService(): TenderLotDocumentService {
  if (!instance) instance = new TenderLotDocumentService();
  return instance;
}
