import { describe, it, expect } from 'vitest';
import { UserService } from '../UserService';
describe('UserService.validateOwnProfile', () => {
  it('requires a full name', () => expect(UserService.validateOwnProfile({ fullName: ' ' })).toBe('fullName'));
  it('rejects an invalid phone', () => expect(UserService.validateOwnProfile({ fullName: 'Ali', phone: 'abc' })).toBe('phone'));
  it('accepts valid data', () => expect(UserService.validateOwnProfile({ fullName: 'Ali', phone: '+222 22 33 44 55' })).toBeNull());
});
