/**
 * LocalStorageConfigRepository — persistance du paramétrage en mode local-bypass.
 */

import { defaultLocalStorageAdapter } from '@/infrastructure/adapters/localStorage/LocalStorageAdapter';
import type { IConfigRepository, ConfigEntry } from '@/domain/repositories/IConfigRepository';

const STORAGE_KEY = 'app_config_entries';

export class LocalStorageConfigRepository implements IConfigRepository {
  private getEntries(): ConfigEntry[] {
    return defaultLocalStorageAdapter.get<ConfigEntry[]>(STORAGE_KEY) || [];
  }

  private persistEntries(entries: ConfigEntry[]): void {
    defaultLocalStorageAdapter.set(STORAGE_KEY, entries);
  }

  async findByKey(key: string): Promise<ConfigEntry | null> {
    return this.getEntries().find((entry) => entry.key === key) || null;
  }

  async findAll(): Promise<ConfigEntry[]> {
    return this.getEntries();
  }

  async upsert(entry: ConfigEntry): Promise<void> {
    const entries = this.getEntries();
    const index = entries.findIndex((e) => e.key === entry.key);
    if (index >= 0) entries[index] = { ...entries[index], ...entry };
    else entries.push(entry);
    this.persistEntries(entries);
  }

  async delete(key: string): Promise<void> {
    this.persistEntries(this.getEntries().filter((entry) => entry.key !== key));
  }
}
