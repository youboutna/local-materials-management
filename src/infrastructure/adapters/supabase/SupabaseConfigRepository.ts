/**
 * SupabaseConfigRepository — persistance du paramétrage système dans system_settings.
 * Réutilise l'adaptateur existant afin de ne pas dupliquer la logique de schéma.
 */

import { requireSupabaseConfig } from '@/config/supabaseConfig';
import { SupabaseSystemSettingsAdapter } from '@/infrastructure/adapters/supabase/SupabaseSystemSettingsAdapter';
import type { IConfigRepository, ConfigEntry } from '@/domain/repositories/IConfigRepository';

export class SupabaseConfigRepository implements IConfigRepository {
  private readonly settings = new SupabaseSystemSettingsAdapter();

  constructor() {
    // Valide la cohérence URL/clé avant tout appel réseau.
    requireSupabaseConfig();
  }

  async findByKey(key: string): Promise<ConfigEntry | null> {
    const row = await this.settings.findByKey(key);
    if (!row) return null;
    return { key: row.key, value: (row.configuration ?? {}).value, category: row.category };
  }

  async findAll(): Promise<ConfigEntry[]> {
    const rows = await this.settings.findAll();
    return rows.map((row) => ({
      key: row.key,
      value: (row.configuration ?? {}).value,
      category: row.category,
    }));
  }

  async upsert(entry: ConfigEntry): Promise<void> {
    await this.settings.upsert({
      key: entry.key,
      category: entry.category ?? 'general',
      configuration: { value: entry.value },
    });
  }

  async delete(key: string): Promise<void> {
    // Suppression logique : la valeur est vidée (pas de DELETE exposé côté RLS).
    await this.settings.upsert({ key, category: 'general', configuration: {} });
  }
}
