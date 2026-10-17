import { describe, expect, it, vi } from 'vitest';
import { PaymentInitiationService } from '../PaymentInitiationService';
import { PAYMENT_INITIATION_POLICY } from '@/config/referentials/payment-initiation.referential';
import type { IPaymentInitiationRepository } from '@/domain/repositories/IPaymentInitiationRepository';

describe('Payment initiation referential', () => {
  it('uses a supplied payment limit instead of a fixed role cap', async () => {
    const repository = { getSupplier: vi.fn().mockResolvedValue(null), save: vi.fn().mockResolvedValue({ id: 'initiation' }) } as unknown as IPaymentInitiationRepository;
    const policy = { ...PAYMENT_INITIATION_POLICY, limits: { ...PAYMENT_INITIATION_POLICY.limits, director: 120 } };
    const service = new PaymentInitiationService(repository, policy);
    const request = { projectId: 'project', supplierId: 'supplier', initiatorRole: 'director' as const, estimatedAmount: 121, justification: 'Payment' };
    await expect(service.createInitiation(request, 'user')).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
    await service.createInitiation({ ...request, estimatedAmount: 120 }, 'user');
    expect(repository.save).toHaveBeenCalledTimes(1);
  });
  it('uses supplied approval chains and their deadlines', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-17T12:00:00Z'));
    try {
      const repository = { getSupplier: vi.fn().mockResolvedValue(null), save: vi.fn().mockResolvedValue({ id: 'initiation' }) } as unknown as IPaymentInitiationRepository;
      const policy = { ...PAYMENT_INITIATION_POLICY, approvalChain: { ...PAYMENT_INITIATION_POLICY.approvalChain, director: ['supervisor' as const] }, approvalStepDays: 2 };
      await new PaymentInitiationService(repository, policy).createInitiation({ projectId: 'project', supplierId: 'supplier', initiatorRole: 'director', estimatedAmount: 100, justification: 'Payment' }, 'user');
      expect(repository.save).toHaveBeenCalledWith(expect.anything(), 'user', [{ level: 1, role: 'supervisor', status: 'pending', deadline: '2026-10-19T12:00:00.000Z' }], 'pending_approval', undefined, undefined);
    } finally { vi.useRealTimers(); }
  });
  it('rejects nonfinite and negative amounts before persistence', async () => {
    const repository = { save: vi.fn() } as unknown as IPaymentInitiationRepository;
    for (const estimatedAmount of [NaN, Infinity, -1, 0]) {
      await expect(new PaymentInitiationService(repository).createInitiation({ projectId: 'project', supplierId: 'supplier', initiatorRole: 'director', estimatedAmount, justification: 'Payment' }, 'user')).rejects.toThrow();
    }
    expect(repository.save).not.toHaveBeenCalled();
  });
});