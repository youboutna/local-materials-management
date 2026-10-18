import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ invoke: vi.fn(), user: vi.fn(), sms: vi.fn() }));
vi.mock('../UserService', () => ({ getUserService: () => ({ getUserById: mocks.user }) }));
vi.mock('../NotificationService', () => ({ NotificationService: { createNotification: vi.fn().mockResolvedValue({ id: 'notification' }) } }));
vi.mock('@/infrastructure/RepositoryFactory', () => ({ RepositoryFactory: { getNotificationRepository: () => ({ sendSMS: mocks.sms }) } }));
vi.mock('@/infrastructure/adapters/supabase/NotificationGatewayAdapter', () => ({ notificationGatewayAdapter: { invokeFunction: mocks.invoke } }));
import { CommunicationService } from '../CommunicationService';
beforeEach(() => vi.clearAllMocks());
describe('Unified communications', () => {
  it('resolves a user identifier before provider email dispatch', async () => {
    mocks.user.mockResolvedValue({ id: 'a0000000-0000-0000-0000-000000000001', email: 'person@example.com' });
    mocks.invoke.mockResolvedValue({ data: { success: true, messageId: 'provider-id' }, error: null });
    expect(await CommunicationService.sendEmail({ to: 'a0000000-0000-0000-0000-000000000001', subject: 'Inspection', message: 'Review' })).toMatchObject({ status: 'accepted', reference: 'provider-id' });
    expect(mocks.invoke).toHaveBeenCalledWith('send-email-notification', expect.objectContaining({ to: 'person@example.com' }));
  });
  it('preserves accepted SMS provider evidence', async () => {
    mocks.sms.mockResolvedValue({ error: null, reference: 'SM123', status: 'queued' });
    expect(await CommunicationService.sendSMS({ to: '+22212345678', message: 'Inspection' })).toMatchObject({ success: true, status: 'accepted', reference: 'SM123' });
  });
  it('prepares WhatsApp without claiming delivery', async () => {
    expect(await CommunicationService.prepareWhatsApp({ to: '+22212345678', message: 'Bonjour chantier' })).toMatchObject({ status: 'link_prepared', url: 'https://wa.me/22212345678?text=Bonjour%20chantier' });
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('accepts existing Google Meet links', () => {
    expect(CommunicationService.prepareMeetingLink('google_meet', 'https://meet.google.com/abc-defg-hij')).toMatchObject({ success: true, status: 'link_prepared' });
  });
  it('rejects a meeting link pointing at a different host', () => {
    expect(CommunicationService.prepareMeetingLink('microsoft_teams', 'https://teams.microsoft.com.evil.test/meeting').success).toBe(false);
  });
  it('does not report postal delivery when no provider exists', async () => {
    expect(await CommunicationService.sendMail({ to: 'Postal address', subject: 'Report', message: 'Report' })).toMatchObject({ success: false, status: 'not_configured' });
  });
  it('makes callers reject provider failure', () => {
    expect(() => CommunicationService.requireSuccess({ success: false, channel: 'email' })).toThrow();
  });
});