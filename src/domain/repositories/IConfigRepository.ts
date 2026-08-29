/**
 * Config Repository Port — paramétrage système exposé dans l'UI d'administration.
 * Implémentations : Supabase (system_settings) et localStorage (mode local-bypass).
 */

export interface ConfigEntry {
  key: string;
  value: unknown;
  category?: string;
}

export interface IConfigRepository {
  findByKey(key: string): Promise<ConfigEntry | null>;
  findAll(): Promise<ConfigEntry[]>;
  upsert(entry: ConfigEntry): Promise<void>;
  delete(key: string): Promise<void>;
}
