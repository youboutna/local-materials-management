import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../NotificationService', () => ({ NotificationService: { createNotification: vi.fn().mockResolvedValue({ id: 'n' }) } }));
vi.mock('../UserService', () => ({ getUserService: () => ({ getUserById: vi.fn() }) }));
import { CommunicationService } from '../CommunicationService';

afterEach(() => CommunicationService.resetProviders());

describe('CommunicationService with injected mock adapters', () => {
  it('sends email through the injected email port', async () => {
    const send = vi.fn().mockResolvedValue({ success: true, reference: 'mock-1' });
    CommunicationService.configure({ email: { send } });
    expect(await CommunicationService.sendEmail({ to: 'a@b.mr', subject: 'S', message: 'M' })).toMatchObject({ success: true, reference: 'mock-1' });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.mr', subject: 'S' }));
  });
  it('reports provider failure for SMS instead of claiming delivery', async () => {
    CommunicationService.configure({ sms: { send: vi.fn().mockResolvedValue({ success: false }) } });
    expect((await CommunicationService.sendSMS({ to: '+22212345678', message: 'x' })).success).toBe(false);
  });
  it('schedules calls through the injected call port', async () => {
    const schedule = vi.fn().mockResolvedValue({ success: true, reference: 'call-9' });
    CommunicationService.configure({ call: { schedule } });
    expect(await CommunicationService.scheduleCall({ recipientId: 'r', recipientPhone: '+22212345678', subject: 's', message: 'm', scheduledFor: '2026-11-03T10:00:00Z' }))
      .toMatchObject({ status: 'scheduled', reference: 'call-9' });
  });
});
