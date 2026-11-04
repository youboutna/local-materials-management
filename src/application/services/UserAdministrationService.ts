/**
 * UserAdministrationService — règles métier de gestion des comptes.
 * Valide et normalise les commandes avant de les confier au port serveur.
 * Pur TypeScript : aucune dépendance React ni fournisseur.
 */
import type {
  ConfirmationChannel,
  ConfirmationResult,
  IUserAdministrationGateway,
  ManagedUserResult,
} from '@/domain/repositories/IUserAdministrationGateway';
import { ROLES_RESPONSIBILITIES } from '@/config/referentials/auth/roles-responsibilities.referential';

export interface ManagedUserInput {
  email: string;
  fullName: string;
  phone?: string | null;
  nationalId?: string | null;
  roles: string[];
  channel: ConfirmationChannel;
}

export interface ManagedUserUpdateInput {
  userId: string;
  email?: string;
  fullName?: string;
  phone?: string | null;
  nationalId?: string | null;
  password?: string;
  roles?: string[];
}

export class UserAdministrationError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164 = /^\+[1-9]\d{7,14}$/;
export const MIN_PASSWORD_LENGTH = 8;

/** Normalise un numéro saisi (espaces, tirets, 00) vers E.164. */
export function normalizePhone(value: string | null | undefined): string | null {
  const raw = (value ?? '').replace(/[\s\-().]/g, '');
  if (!raw) return null;
  const withPlus = raw.startsWith('00') ? `+${raw.slice(2)}` : raw;
  return withPlus;
}

export function knownRoleCodes(): string[] {
  return ROLES_RESPONSIBILITIES.map((role) => role.code);
}

export class UserAdministrationService {
  constructor(
    private readonly gateway: IUserAdministrationGateway,
    private readonly roleCodes: readonly string[] = knownRoleCodes(),
  ) {}

  private normalizeRoles(roles: readonly string[]): string[] {
    const unique = [...new Set(roles.map((r) => r.trim()).filter(Boolean))];
    const unknown = unique.filter((r) => !this.roleCodes.includes(r));
    if (unknown.length) throw new UserAdministrationError('UNKNOWN_ROLE');
    return unique;
  }

  private normalizePhoneOrThrow(phone: string | null | undefined): string | null {
    const normalized = normalizePhone(phone);
    if (normalized && !E164.test(normalized)) throw new UserAdministrationError('INVALID_PHONE');
    return normalized;
  }

  async create(input: ManagedUserInput, redirectTo: string): Promise<ManagedUserResult> {
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    if (!EMAIL.test(email)) throw new UserAdministrationError('INVALID_EMAIL');
    if (!fullName) throw new UserAdministrationError('FULL_NAME_REQUIRED');
    const phone = this.normalizePhoneOrThrow(input.phone);
    if (input.channel === 'sms' && !phone) throw new UserAdministrationError('PHONE_REQUIRED_FOR_SMS');
    const roles = this.normalizeRoles(input.roles);
    if (!roles.length) throw new UserAdministrationError('ROLE_REQUIRED');
    return this.gateway.create({
      email,
      fullName,
      phone,
      nationalId: input.nationalId?.trim() || null,
      roles,
      channel: input.channel,
      redirectTo,
    });
  }

  async update(input: ManagedUserUpdateInput): Promise<ManagedUserResult> {
    if (!input.userId) throw new UserAdministrationError('USER_ID_REQUIRED');
    const email = input.email?.trim().toLowerCase();
    if (email !== undefined && !EMAIL.test(email)) throw new UserAdministrationError('INVALID_EMAIL');
    if (input.password && input.password.length < MIN_PASSWORD_LENGTH) {
      throw new UserAdministrationError('PASSWORD_TOO_SHORT');
    }
    const roles = input.roles === undefined ? undefined : this.normalizeRoles(input.roles);
    if (roles && !roles.length) throw new UserAdministrationError('ROLE_REQUIRED');
    return this.gateway.update({
      userId: input.userId,
      email,
      fullName: input.fullName?.trim(),
      phone: input.phone === undefined ? undefined : this.normalizePhoneOrThrow(input.phone),
      nationalId: input.nationalId === undefined ? undefined : input.nationalId?.trim() || null,
      password: input.password || undefined,
      roles,
    });
  }

  setActive(userId: string, isActive: boolean, currentUserId?: string): Promise<ManagedUserResult> {
    if (!isActive && userId === currentUserId) throw new UserAdministrationError('CANNOT_DEACTIVATE_SELF');
    return this.gateway.setActive(userId, isActive);
  }

  remove(userId: string, currentUserId?: string): Promise<ManagedUserResult> {
    if (userId === currentUserId) throw new UserAdministrationError('CANNOT_DELETE_SELF');
    return this.gateway.remove(userId);
  }

  resendConfirmation(userId: string, channel: ConfirmationChannel, redirectTo: string): Promise<ConfirmationResult> {
    return this.gateway.resendConfirmation(userId, channel, redirectTo);
  }
}

let instance: UserAdministrationService | null = null;

export function configureUserAdministrationService(gateway: IUserAdministrationGateway): UserAdministrationService {
  instance = new UserAdministrationService(gateway);
  return instance;
}

export async function getUserAdministrationService(): Promise<UserAdministrationService> {
  if (!instance) {
    const { RepositoryFactory } = await import('@/infrastructure/RepositoryFactory');
    instance = new UserAdministrationService(await RepositoryFactory.getUserAdministrationGateway());
  }
  return instance;
}
