/**
 * SystemSettingsService — btp.system_settings
 *
 * Façade métier au-dessus de ISystemSettingsRepository.
 * Toutes les lectures/écritures de paramètres système passent par ce service.
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import type {
  ISystemSettingsRepository,
  SystemSettingRow,
} from '@/domain/repositories/ISystemSettingsRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';

const ADMIN_EMAILS_KEY = 'admin_notification_emails';

export class SystemSettingsService {
  constructor(private repository: ISystemSettingsRepository) {}

  // =========================================================================
  // Lecture
  // =========================================================================

  async getAll(): Promise<SystemSettingRow[]> {
    return this.repository.findAll();
  }

  /**
   * @deprecated Préférer `getByCategoryAndKey()` : la contrainte UNIQUE est
   * composite (category, key), donc `findByKey()` peut être ambigu.
   */
  async getConfiguration(key: string): Promise<Record<string, unknown>> {
    if (!key) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Setting key is required');
    const row = await this.repository.findByKey(key);
    return (row?.configuration as Record<string, unknown>) ?? {};
  }

  /**
   * ✅ NOUVEAU : récupère un paramètre par (category, key).
   */
  async getByCategoryAndKey(
    category: string,
    key: string
  ): Promise<Record<string, unknown> | null> {
    if (!category || !key) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Both category and key are required'
      );
    }
    const row = await this.repository.findByCategoryAndKey(category, key);
    return (row?.configuration as Record<string, unknown>) ?? null;
  }

  /**
   * ✅ NOUVEAU : récupère tous les paramètres d'une catégorie.
   */
  async getByCategory(category: string): Promise<SystemSettingRow[]> {
    if (!category) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Category is required');
    }
    return this.repository.findByCategory(category);
  }

  // =========================================================================
  // Écriture
  // =========================================================================

  async setConfiguration(
    key: string,
    configuration: Record<string, unknown>,
    category = 'general'
  ): Promise<SystemSettingRow> {
    if (!key) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Setting key is required');
    return this.repository.upsert({ key, category, configuration });
  }

  /**
   * ✅ NOUVEAU : upsert par (category, key).
   * Wrapper explicite pour clarifier l'intention côté appelant.
   */
  async upsertByCategoryAndKey(
    category: string,
    key: string,
    configuration: Record<string, unknown>
  ): Promise<SystemSettingRow> {
    if (!category || !key) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Both category and key are required'
      );
    }
    return this.repository.upsert({ category, key, configuration });
  }

  /**
   * ✅ NOUVEAU : supprime un paramètre par (category, key).
   */
  async deleteByCategoryAndKey(category: string, key: string): Promise<void> {
    if (!category || !key) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Both category and key are required'
      );
    }
    return this.repository.delete(category, key);
  }

  // =========================================================================
  // Helpers métier (emails admin)
  // =========================================================================

  async getAdminEmails(): Promise<string[]> {
    const config = await this.getConfiguration(ADMIN_EMAILS_KEY);
    const value = config.emails;
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
    }
    return [];
  }

  async setAdminEmails(emails: string[]): Promise<string[]> {
    const cleaned = Array.from(new Set(emails.map((e) => e.trim()).filter(Boolean)));
    const invalid = cleaned.filter((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
    if (invalid.length) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Emails invalides: ${invalid.join(', ')}`
      );
    }
    await this.setConfiguration(ADMIN_EMAILS_KEY, { emails: cleaned }, 'notifications');
    return cleaned;
  }
}

// =============================================================================
// Singleton
// =============================================================================

let instance: SystemSettingsService | null = null;

export function getSystemSettingsService(): SystemSettingsService {
  if (!instance) {
    instance = new SystemSettingsService(RepositoryFactory.getSystemSettingsRepository());
  }
  return instance;
}

/**
 * Réinitialise le singleton (utile en tests ou changement de profil).
 */
export function resetSystemSettingsService(): void {
  instance = null;
}