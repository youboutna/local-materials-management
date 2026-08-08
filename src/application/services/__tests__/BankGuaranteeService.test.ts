import type { CreateBankGuaranteeDTO } from '@/dtos/entities/BankGuaranteeDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError } from '@/utils/errorHandling';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BankGuaranteeService } from '../BankGuaranteeService';
import { getBankGuaranteeService } from '@/application/services/BankGuaranteeService';

describe('BankGuaranteeService', () => {
  let service: BankGuaranteeService;
  const mockRepo = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByProjectId: vi.fn(),
  };
  
  beforeEach(() => {
    vi.spyOn(RepositoryFactory, 'getBankGuaranteeRepository').mockReturnValue(mockRepo as any);
    service = getBankGuaranteeService();
  });

  describe('createBankGuarantee', () => {
    const validData: CreateBankGuaranteeDTO = {
      projectId: 'proj-123',
      type: 'performance',
      amount: 10000,
      issuingBank: 'Bank ABC',
      number: 'BG-2023-001',
      issueDate: '2023-01-01',
      expiryDate: '2023-12-31',
      currency: 'USD'
    };

    it('should create a valid bank guarantee', async () => {
      mockRepo.create.mockResolvedValue({
        ...validData,
        id: 'bg-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any);

      const result = await service.createBankGuarantee(validData);
      expect(result.id).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      await expect(service.createBankGuarantee({
        ...validData,
        projectId: ''
      })).rejects.toThrow(AppError);
    });

    it('should reject invalid amount', async () => {
      await expect(service.createBankGuarantee({
        ...validData,
        amount: -100
      })).rejects.toThrow(AppError);
    });

    it('should reject invalid dates', async () => {
      await expect(service.createBankGuarantee({
        ...validData,
        expiryDate: '2022-12-31' // Before issue date
      })).rejects.toThrow(AppError);
    });
  });
});
