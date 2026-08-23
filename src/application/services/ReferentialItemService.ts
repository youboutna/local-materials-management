/**
 * ReferentialItemService — résolution des référentiels configurables.
 *
 * Chaîne de résolution d'un libellé :
 *   1. base (`btp.referential_items`, label_fr/ar/en, éventuellement par projet)
 *   2. référentiel code (labels système, via I18nService)
 *   3. code technique brut
 *
 * TypeScript pur : aucun hook / contexte React ici.
 */

import type {
  ReferentialDomain,
  ReferentialItemDTO,
  UpsertReferentialItemDTO,
} from '@/dtos/entities/ReferentialItemDTO';
import { getReferentialItemAdapter } from '@/infrastructure/adapters/supabase/SupabaseReferentialItemAdapter';
import type { ReferentialLanguage } from '@/config/referentials/i18n/status-labels.referential';

export class ReferentialItemService {
  private adapter = getReferentialItemAdapter();

  async list(domain?: ReferentialDomain, projectId?: string | null): Promise<ReferentialItemDTO[]> {
    return this.adapter.list(domain, projectId);
  }

  async save(dto: UpsertReferentialItemDTO): Promise<ReferentialItemDTO> {
    return this.adapter.upsert(dto);
  }

  async remove(id: string): Promise<void> {
    return this.adapter.deactivate(id);
  }

  /** Libellé d'un item déjà chargé, dans la langue demandée (fallback fr puis code). */
  labelOf(item: ReferentialItemDTO, lang: ReferentialLanguage): string {
    if (lang === 'ar') return item.labelAr || item.labelFr || item.code;
    if (lang === 'en') return item.labelEn || item.labelFr || item.code;
    return item.labelFr || item.code;
  }

  /** Options `{ value, label }` prêtes pour un Select. */
  toOptions(items: ReferentialItemDTO[], lang: ReferentialLanguage) {
    return items.map((item) => ({ value: item.code, label: this.labelOf(item, lang) }));
  }
}

let instance: ReferentialItemService | null = null;
export const getReferentialItemService = (): ReferentialItemService => {
  if (!instance) instance = new ReferentialItemService();
  return instance;
};
