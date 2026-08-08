/**
 * LocalUserManagementService — CRUD des utilisateurs de développement locaux.
 *
 * Fusionne les DEV_USERS par défaut (constants.ts) avec des surcharges
 * persistées dans localStorage sous la clé `dev_users_overrides`. Utilisé
 * par le panneau d'administration `LocalUserManagementPanel`.
 *
 * Architecture: pure TypeScript, aucun hook React, conforme aux règles
 * hexagonales (src/application/services).
 */

import {
  DevUserProfile,
  getDefaultDevUsers,
  getDevUsersSnapshot,
  persistDevUsers,
  setActiveDevRole,
} from '@/config/constants';

const isBrowser = typeof window !== 'undefined';
const OVERRIDES_KEY = 'dev_users_overrides';

function loadOverrides(): Record<string, DevUserProfile> {
  if (!isBrowser) return {};
  try {
    const raw = window.localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DevUserProfile>) : {};
  } catch {
    return {};
  }
}

export class LocalUserManagementService {
  getAllUsers(): Record<string, DevUserProfile> {
    return getDevUsersSnapshot();
  }

  getUser(key: string): DevUserProfile | undefined {
    return this.getAllUsers()[key];
  }

  addUser(key: string, user: DevUserProfile): void {
    const overrides = loadOverrides();
    overrides[key] = user;
    persistDevUsers(overrides);
  }

  updateUser(key: string, updates: Partial<DevUserProfile>): void {
    const current = this.getUser(key);
    if (!current) throw new Error(`Unknown user key: ${key}`);
    const overrides = loadOverrides();
    overrides[key] = {
      ...current,
      ...updates,
      user_metadata: { ...current.user_metadata, ...(updates.user_metadata ?? {}) },
    };
    persistDevUsers(overrides);
  }

  deleteUser(key: string): void {
    const defaults = getDefaultDevUsers();
    if (defaults[key]) {
      throw new Error(`Le profil par défaut "${key}" ne peut pas être supprimé.`);
    }
    const overrides = loadOverrides();
    delete overrides[key];
    persistDevUsers(overrides);
  }

  switchActiveUser(key: string): void {
    const user = this.getUser(key);
    if (!user) throw new Error(`Unknown user key: ${key}`);
    setActiveDevRole(user.user_metadata.role);
    if (isBrowser) window.localStorage.setItem('dev_role', key);
  }

  exportUsers(): string {
    return JSON.stringify(this.getAllUsers(), null, 2);
  }

  importUsers(json: string): void {
    const parsed = JSON.parse(json) as Record<string, DevUserProfile>;
    persistDevUsers(parsed);
  }

  resetOverrides(): void {
    if (!isBrowser) return;
    window.localStorage.removeItem(OVERRIDES_KEY);
    window.dispatchEvent(new CustomEvent('dev-users-changed'));
  }
}

let instance: LocalUserManagementService | null = null;
export function getLocalUserManagementService(): LocalUserManagementService {
  if (!instance) instance = new LocalUserManagementService();
  return instance;
}
