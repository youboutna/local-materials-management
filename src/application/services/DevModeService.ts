/**
 * DevModeService — pilote unique du mode de session (LOCAL DEV vs API réelle).
 *
 * Règles d'architecture :
 *  - Aucune persistance dédiée : réutilise SystemSettingsService (btp.system_settings).
 *  - Aucune logique de rôle dupliquée : délègue à @/config/constants
 *    (getActiveDevRole / setActiveDevRole / getDevUsersSnapshot).
 *  - Pure TypeScript : aucun hook ni composant React.
 */

import {
  DEV_MODE,
  DEV_ROLES,
  getActiveDevRole,
  getDevUsersSnapshot,
  setActiveDevRole,
} from '@/config/constants';
import { AuthAdapterFactory } from '@/infrastructure/adapters/auth/AuthAdapterFactory';
import { getSystemSettingsService, SystemSettingsService } from '@/application/services/SystemSettingsService';
import type { DevModeCode, DevModeRoleOptionDTO, DevModeStateDTO } from '@/dtos/dev/DevModeDTO';

const DEV_MODE_SETTING_KEY = 'DEV_MODE_SESSION';
const DEV_MODE_SETTING_CATEGORY = 'development';

export class DevModeService {
  constructor(private readonly systemSettings: SystemSettingsService) {}

  /** Profils DEV disponibles (codes en anglais, libellés résolus côté UI). */
  getAvailableRoles(): DevModeRoleOptionDTO[] {
    const users = getDevUsersSnapshot();
    return DEV_ROLES.filter((option) => Boolean(users[option.role])).map((option) => ({
      code: option.role.toUpperCase(),
      email: users[option.role]?.email ?? '',
      description: option.description,
    }));
  }

  getCurrentMode(): DevModeCode {
    return AuthAdapterFactory.getKind() === 'local' ? 'LOCAL' : 'API';
  }

  getState(): DevModeStateDTO {
    const mode = this.getCurrentMode();
    return {
      mode,
      devModeEnabled: DEV_MODE,
      activeRole: mode === 'LOCAL' ? getActiveDevRole().role.toUpperCase() : null,
      adapter: AuthAdapterFactory.getKind(),
      availableRoles: this.getAvailableRoles(),
    };
  }

  /** Bascule vers un rôle DEV local. Retourne le profil (email/password) à authentifier. */
  async switchToLocal(roleCode: string): Promise<{ role: string; email: string; password?: string }> {
    const normalized = roleCode.toLowerCase();
    const users = getDevUsersSnapshot();
    const profile = users[normalized];
    if (!profile) {
      throw new Error(`Unknown DEV role: ${roleCode}`);
    }
    setActiveDevRole(normalized);
    await this.persistState('LOCAL', normalized);
    return { role: normalized, email: profile.email, password: profile.password };
  }

  /** Bascule vers la session API réelle. L'UI doit ensuite purger le cache et rediriger /auth. */
  async switchToApi(): Promise<void> {
    await this.persistState('API', null);
  }

  /** Trace non bloquante du dernier mode choisi (les erreurs RLS ne cassent pas l'UI). */
  private async persistState(mode: DevModeCode, role: string | null): Promise<void> {
    try {
      await this.systemSettings.setConfiguration(
        DEV_MODE_SETTING_KEY,
        { mode, role, updatedAt: new Date().toISOString() },
        DEV_MODE_SETTING_CATEGORY
      );
    } catch (error) {
      console.warn('[DevModeService] mode persistence skipped:', error);
    }
  }
}

let instance: DevModeService | null = null;

export function getDevModeService(): DevModeService {
  if (!instance) {
    instance = new DevModeService(getSystemSettingsService());
  }
  return instance;
}
