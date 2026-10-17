import { describe, expect, it, vi } from 'vitest';
import { PaymentControlActionsService, type ActionFormData, type ActionMetadata } from '../PaymentControlActionsService';
import { CommunicationService } from '../CommunicationService';
import type { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import type { INotificationRepository } from '@/domain/repositories/INotificationRepository';

const values: ActionFormData = { actionType: 'hierarchy_notification', recipientIds: ['user-id'], title: 'Payment', message: 'Review', priority: 'high', dueDate: '2026-11-01T10:00:00Z' };
const metadata: ActionMetadata = { paymentId: 'payment', projectId: 'project', contractorId: 'supplier', amount: 100, actionType: 'hierarchy_notification', priority: 'high' };
function fixture() {
  const repository = { createNotification: vi.fn().mockResolvedValue({ notification: { id: 'notification' }, error: null }) } as unknown as INotificationRepository;
  const communication = { resolveRecipient: vi.fn().mockResolvedValue({ id: 'user-id', phone: '+22212345678', email: 'user@example.test' }), sendSMS: vi.fn().mockResolvedValue({ success: true }), sendEmail: vi.fn().mockResolvedValue({ success: true }), scheduleCall: vi.fn().mockResolvedValue({ success: true }), assignTask: vi.fn().mockResolvedValue({ success: true }) };
  const service = new PaymentControlActionsService({} as IAuthRepository, repository, communication as unknown as typeof CommunicationService);
  return { repository, communication, service };
}
describe('Payment control actions use real channels', () => {
  it('resolves email addresses and rejects provider failure', async () => {
    const { service, communication } = fixture();
    communication.sendEmail.mockResolvedValue({ success: false });
    await expect(service.sendEmailNotification(values, metadata)).rejects.toThrow('Email delivery failed');
    expect(communication.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'user@example.test' }));
  });
  it('schedules a real call with the phone, recipient and selected date', async () => {
    const { service, communication } = fixture();
    await service.scheduleCall(values, metadata);
    expect(communication.scheduleCall).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'user-id', recipientPhone: '+22212345678', scheduledFor: '2026-11-01T10:00:00Z' }));
  });
  it('dispatches selected escalation channels and persists project context', async () => {
    const { service, communication, repository } = fixture();
    await service.createHierarchyNotification({ ...values, notificationChannels: ['email', 'sms'] }, metadata);
    expect(repository.createNotification).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'project', metadata: expect.objectContaining({ paymentId: 'payment' }) }));
    expect(communication.sendEmail).toHaveBeenCalledTimes(1);
    expect(communication.sendSMS).toHaveBeenCalledTimes(1);
  });
  it('does not silently accept notification persistence failures', async () => {
    const { service, repository } = fixture();
    vi.mocked(repository.createNotification).mockResolvedValue({ notification: null, error: new Error('Insert failed') });
    await expect(service.createHierarchyNotification(values, metadata)).rejects.toThrow('Insert failed');
  });
  it('does not claim unconfigured postal delivery succeeded', async () => {
    const { service } = fixture();
    await expect(service.createMailAction(values, metadata)).rejects.toThrow('Postal delivery is not configured');
  });
});