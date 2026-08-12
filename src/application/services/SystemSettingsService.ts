/**
 * SystemSettingsService — btp.system_settings
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

  async getAll(): Promise<SystemSettingRow[]> {
    return this.repository.findAll();
  }

  async getConfiguration(key: string): Promise<Record<string, unknown>> {
    if (!key) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Setting key is required');
    const row = await this.repository.findByKey(key);
    return (row?.configuration as Record<string, unknown>) ?? {};
  }

  async setConfiguration(
    key: string,
    configuration: Record<string, unknown>,
    category = 'general'
  ): Promise<SystemSettingRow> {
    if (!key) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Setting key is required');
    return this.repository.upsert({ key, category, configuration });
  }

  /** Emails admin (liste) : helper métier utilisé par les réglages. */
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
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Emails invalides: ${invalid.join(', ')}`);
    }
    await this.setConfiguration(ADMIN_EMAILS_KEY, { emails: cleaned }, 'notifications');
    return cleaned;
  }
}

let instance: SystemSettingsService | null = null;

export function getSystemSettingsService(): SystemSettingsService {
  if (!instance) {
    instance = new SystemSettingsService(RepositoryFactory.getSystemSettingsRepository());
  }
  return instance;
}
