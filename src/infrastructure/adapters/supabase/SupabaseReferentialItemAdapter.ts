/**
 * SupabaseReferentialItemAdapter — accès à `btp.referential_items`.
 * Convertit les colonnes snake_case en DTO camelCase (labels fr/ar/en).
 */

import type {
  ReferentialDomain,
  ReferentialItemDTO,
  UpsertReferentialItemDTO,
} from '@/dtos/entities/ReferentialItemDTO';

type Row = Record<string, unknown>;

const toDto = (row: Row): ReferentialItemDTO => ({
  id: String(row.id),
  domain: String(row.domain),
  code: String(row.code),
  labelFr: String(row.label_fr ?? row.code),
  labelAr: (row.label_ar as string | null) ?? null,
  labelEn: (row.label_en as string | null) ?? null,
  parentCode: (row.parent_code as string | null) ?? null,
  orderIndex: Number(row.order_index ?? 0),
  isCustom: Boolean(row.is_custom),
  isActive: row.is_active !== false,
  projectId: (row.project_id as string | null) ?? null,
  metadata: (row.metadata as Record<string, unknown>) ?? {},
  createdAt: (row.created_at as string | null) ?? null,
  updatedAt: (row.updated_at as string | null) ?? null,
});

const toRow = (dto: UpsertReferentialItemDTO): Row => ({
  ...(dto.id ? { id: dto.id } : {}),
  domain: dto.domain,
  code: dto.code,
  label_fr: dto.labelFr,
  label_ar: dto.labelAr ?? null,
  label_en: dto.labelEn ?? null,
  parent_code: dto.parentCode ?? null,
  order_index: dto.orderIndex ?? 0,
  is_custom: dto.isCustom ?? true,
  is_active: dto.isActive ?? true,
  project_id: dto.projectId ?? null,
  metadata: dto.metadata ?? {},
});

export class SupabaseReferentialItemAdapter {
  private async client() {
    const { btpClient } = await import('@/integrations/supabase/schema-clients');
    return btpClient as unknown as {
      from: (table: string) => any;
    };
  }

  async list(domain?: ReferentialDomain, projectId?: string | null): Promise<ReferentialItemDTO[]> {
    const client = await this.client();
    let query = client.from('referential_items').select('*').eq('is_active', true);
    if (domain) query = query.eq('domain', domain);
    if (projectId) query = query.or(`project_id.is.null,project_id.eq.${projectId}`);
    const { data, error } = await query.order('order_index', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toDto);
  }

  async upsert(dto: UpsertReferentialItemDTO): Promise<ReferentialItemDTO> {
    const client = await this.client();
    const { data, error } = await client
      .from('referential_items')
      .upsert(toRow(dto), { onConflict: 'domain,code,project_id' })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return toDto(data as Row);
  }

  async deactivate(id: string): Promise<void> {
    const client = await this.client();
    const { error } = await client.from('referential_items').update({ is_active: false }).eq('id', id);
    if (error) throw new Error(error.message);
  }
}

let instance: SupabaseReferentialItemAdapter | null = null;
export const getReferentialItemAdapter = (): SupabaseReferentialItemAdapter => {
  if (!instance) instance = new SupabaseReferentialItemAdapter();
  return instance;
};
