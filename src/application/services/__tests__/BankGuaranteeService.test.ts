import 'jest';
import { BankGuaranteeService } from '../BankGuaranteeService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { mockDeep } from 'jest-mock-extended';
import type { CreateBankGuaranteeDto } from '@/dtos/bank-guarantees/CreateBankGuaranteeDto';

describe('BankGuaranteeService', () => {
  let service: BankGuaranteeService;
  const mockRepo = mockDeep<ReturnType<typeof RepositoryFactory.getBankGuaranteeRepository>>();
  
  beforeEach(() => {
    jest.spyOn(RepositoryFactory, 'getBankGuaranteeRepository').mockReturnValue(mockRepo as any);
    service = new BankGuaranteeService();
  });

  describe('createBankGuarantee', () => {
    const validData: CreateBankGuaranteeDto = {
      project_id: 'proj-123',
      guarantee_type: 'performance',
      guarantee_amount: 10000,
      issuing_bank: 'Bank ABC',
      guarantee_number: 'BG-2023-001',
      issue_date: '2023-01-01',
      expiry_date: '2023-12-31',
      status: 'active',
      conditions: [],
      documents: [],
      currency: 'USD'
    };

    it('should create a valid bank guarantee', async () => {
      mockRepo.create.mockResolvedValue({
        ...validData,
        id: 'bg-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const result = await service.createBankGuarantee(validData);
      expect(result.id).toBeDefined();
      expect(mockRepo.create).toHaveBeenCalledWith(validData);
    });

    it('should reject missing required fields', async () => {
      await expect(service.createBankGuarantee({
        ...validData,
        project_id: ''
      })).rejects.toThrow(AppError);
    });

    it('should reject invalid amount', async () => {
      await expect(service.createBankGuarantee({
        ...validData,
        guarantee_amount: -100
      })).rejects.toThrow(AppError);
    });

    it('should reject invalid dates', async () => {
      await expect(service.createBankGuarantee({
        ...validData,
        expiry_date: '2022-12-31' // Before issue date
      })).rejects.toThrow(AppError);
    });
  });

  // Additional test suites
});
