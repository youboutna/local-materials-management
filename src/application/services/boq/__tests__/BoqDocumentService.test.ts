import { describe, expect, it, vi } from 'vitest';
import { BoqDocumentService } from '../BoqDocumentService';
import type { IBoqRepository } from '@/domain/repositories/IBoqRepository';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

describe('BOQ application persistence boundary', () => {
  it('passes canonical IDs and source unchanged through CRUD operations', async () => {
    const line: BoqLineDTO = { source: 'dqe', contextId: 'project', designation: 'Mur', unit: 'm²', quantity: 82 };
    const stored = { ...line, id: 'stored-id' };
    const repository: IBoqRepository = {
      list: vi.fn().mockResolvedValue([stored]), create: vi.fn().mockResolvedValue(stored),
      bulkCreate: vi.fn().mockResolvedValue([stored]), update: vi.fn().mockResolvedValue({ ...stored, quantity: 83 }),
      updateStatus: vi.fn().mockResolvedValue(undefined), delete: vi.fn().mockResolvedValue(undefined), deleteMany: vi.fn().mockResolvedValue(1),
    };
    const service = new BoqDocumentService(repository);
    expect((await service.create(line)).id).toBe('stored-id');
    expect((await service.update('stored-id', { source: 'dqe', quantity: 83 })).quantity).toBe(83);
    await service.delete('stored-id', 'dqe');
    expect(repository.delete).toHaveBeenCalledWith('stored-id', 'dqe');
    expect(await service.deleteMany(['stored-id'], 'dqe')).toBe(1);
  });
});