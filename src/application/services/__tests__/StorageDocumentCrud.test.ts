import { describe, expect, it, vi } from 'vitest';
import type { IStorageProvider } from '@/domain/interfaces/IStorageProvider';
import type { IStorageRepository } from '@/domain/repositories/IStorageRepository';
import type { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Document, DocumentType } from '@/domain/entities/Document';
import { StorageReferenceTransformer } from '@/dtos/transforms/StorageReferenceTransformer';
import { StorageProviderToRepositoryAdapter } from '@/infrastructure/adapters/storage/StorageProviderToRepositoryAdapter';
import { StorageService } from '../StorageService';
import { DocumentService } from '../DocumentService';

describe('Storage references and document persistence', () => {
  it.each(['public', 'sign', 'authenticated'])('extracts encoded object paths from %s URLs', (mode) => {
    expect(StorageReferenceTransformer.toStorageRequest(`https://storage.example.com/storage/v1/object/${mode}/plans/phase%201/toit.png?token=temporary`))
      .toEqual({ bucket: 'plans', path: 'phase 1/toit.png' });
  });

  it('keeps nested paths and excludes browser blobs from repository requests', () => {
    expect(StorageReferenceTransformer.toStorageRequest('/phase/toit.pdf')).toEqual({ bucket: 'documents', path: 'phase/toit.pdf' });
    expect(StorageReferenceTransformer.toStorageRequest('blob:http://localhost/id')).toBeNull();
  });

  it('passes the original key and bucket to download and delete without generating URLs', async () => {
    const provider = {
      downloadFile: vi.fn().mockResolvedValue({ success: true, data: new Blob(['plan']) }),
      deleteFile: vi.fn().mockResolvedValue({ success: true }),
      getPublicUrl: vi.fn(),
    } as unknown as IStorageProvider;
    const adapter = new StorageProviderToRepositoryAdapter(provider);
    await adapter.downloadFile('plans', 'phase/toit.pdf');
    await adapter.deleteFile('plans', 'phase/toit.pdf');
    expect(provider.downloadFile).toHaveBeenCalledWith('phase/toit.pdf', 'plans');
    expect(provider.deleteFile).toHaveBeenCalledWith('phase/toit.pdf', 'plans');
    expect(provider.getPublicUrl).not.toHaveBeenCalled();
  });

  it('reads signed URLs through the authenticated repository', async () => {
    const blob = new Blob(['document']);
    const repository = { downloadFile: vi.fn().mockResolvedValue({ data: blob, error: null }) } as unknown as IStorageRepository;
    const service = new StorageService(repository);
    expect(await service.downloadReference('https://storage.example.com/storage/v1/object/sign/plans/a.pdf?token=expired')).toBe(blob);
    expect(repository.downloadFile).toHaveBeenCalledWith('plans', 'a.pdf');
  });

  it('rolls back an upload if document persistence fails and preserves the original error', async () => {
    const failure = new Error('Insert rejected');
    const repository = { save: vi.fn().mockRejectedValue(failure) } as unknown as IDocumentRepository;
    const storage = {
      uploadFile: vi.fn().mockResolvedValue({ path: 'new.pdf', publicUrl: 'https://storage.example.com/storage/v1/object/public/documents/new.pdf' }),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    } as unknown as StorageService;
    await expect(new DocumentService(repository, storage).createDocument({ title: 'Plan', documentType: DocumentType.PLAN, file: new File(['pdf'], 'plan.pdf') })).rejects.toBe(failure);
    expect(storage.deleteFile).toHaveBeenCalledWith({ bucket: 'documents', path: 'new.pdf' });
  });

  it('deletes the stored object before the document row', async () => {
    const entity = Document.create({ id: 'doc', title: 'Plan', documentType: DocumentType.PLAN, fileUrl: 'https://storage.example.com/storage/v1/object/public/plans/a.pdf' });
    const calls: string[] = [];
    const repository = { findById: vi.fn().mockResolvedValue(entity), delete: vi.fn(async () => { calls.push('row'); }) } as unknown as IDocumentRepository;
    const storage = { deleteFile: vi.fn(async () => { calls.push('file'); }) } as unknown as StorageService;
    await new DocumentService(repository, storage).deleteDocument('doc');
    expect(storage.deleteFile).toHaveBeenCalledWith({ bucket: 'plans', path: 'a.pdf' });
    expect(calls).toEqual(['file', 'row']);
  });

  it('does not remove the row when storage deletion fails', async () => {
    const entity = Document.create({ id: 'doc', title: 'Plan', documentType: DocumentType.PLAN, fileUrl: 'phase/a.pdf' });
    const repository = { findById: vi.fn().mockResolvedValue(entity), delete: vi.fn() } as unknown as IDocumentRepository;
    const storage = { deleteFile: vi.fn().mockRejectedValue(new Error('Storage unavailable')) } as unknown as StorageService;
    await expect(new DocumentService(repository, storage).deleteDocument('doc')).rejects.toThrow();
    expect(repository.delete).not.toHaveBeenCalled();
  });
});