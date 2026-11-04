import { describe, expect, it, vi } from 'vitest';
import { UserAdministrationService } from '../UserAdministrationService';
import type { IUserAdministrationGateway } from '@/domain/repositories/IUserAdministrationGateway';

const gateway = (): IUserAdministrationGateway => ({
  create: vi.fn(async () => ({ userId: 'u1', confirmation: { channel: 'email' as const, sent: true } })),
  update: vi.fn(async () => ({ userId: 'u1' })),
  setActive: vi.fn(async (userId: string) => ({ userId })),
  remove: vi.fn(async (userId: string) => ({ userId })),
  resendConfirmation: vi.fn(async () => ({ channel: 'email' as const, sent: true })),
});
const roles = ['admin', 'viewer', 'manager'];

describe('UserAdministrationService', () => {
  it('creates a user with a confirmation link and normalized data', async () => {
    const g = gateway();
    await new UserAdministrationService(g, roles).create(
      { email: ' A@B.MR ', fullName: ' Ali ', phone: '00222 22 33 44 55', roles: ['viewer', 'viewer'], channel: 'sms' },
      'https://app/reset-password',
    );
    expect(g.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'a@b.mr', fullName: 'Ali', phone: '+22222334455', roles: ['viewer'], channel: 'sms',
    }));
  });

  it('requires a phone number for SMS confirmation', async () => {
    await expect(new UserAdministrationService(gateway(), roles).create(
      { email: 'a@b.mr', fullName: 'Ali', roles: ['viewer'], channel: 'sms' }, 'x',
    )).rejects.toThrow('PHONE_REQUIRED_FOR_SMS');
  });

  it('rejects roles that are not in the referential', async () => {
    await expect(new UserAdministrationService(gateway(), roles).create(
      { email: 'a@b.mr', fullName: 'Ali', roles: ['hacker'], channel: 'email' }, 'x',
    )).rejects.toThrow('UNKNOWN_ROLE');
  });

  it('forbids an administrator from deleting or deactivating their own account', async () => {
    const service = new UserAdministrationService(gateway(), roles);
    expect(() => service.remove('me', 'me')).toThrow('CANNOT_DELETE_SELF');
    expect(() => service.setActive('me', false, 'me')).toThrow('CANNOT_DEACTIVATE_SELF');
  });

  it('rejects passwords shorter than 8 characters', async () => {
    await expect(new UserAdministrationService(gateway(), roles).update({ userId: 'u1', password: 'short' }))
      .rejects.toThrow('PASSWORD_TOO_SHORT');
  });
});
