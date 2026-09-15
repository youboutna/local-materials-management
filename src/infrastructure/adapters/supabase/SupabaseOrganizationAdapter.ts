/* eslint-disable @typescript-eslint/no-explicit-any */
// src/infrastructure/adapters/supabase/SupabaseOrganizationAdapter.ts

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import type {
  CreateOrganizationDTO,
  OrganizationDTO,
  UpdateOrganizationDTO,
} from '@/dtos/entities/OrganizationDTO';
import type { IOrganizationRepository } from '@/domain/repositories/IOrganizationRepository';
import { OrganizationTransformer } from '@/dtos/transforms/OrganizationTransformer';

const TABLE = 'organizations';

type OrganizationRow = Record<string, unknown>;

const toDTO = (row: OrganizationRow): OrganizationDTO =>
  OrganizationTransformer.toDTO(row);

const toRow = (
  data: CreateOrganizationDTO | UpdateOrganizationDTO,
): Record<string, unknown> => OrganizationTransformer.toRow(data);

export class SupabaseOrganizationAdapter implements IOrganizationRepository {
  // ============================================================
  // LECTURE
  // ============================================================

  async findById(id: string): Promise<OrganizationDTO | null> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDTO(data) : null;
  }

  async findByExternalRef(externalRef: string): Promise<OrganizationDTO | null> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('external_ref', externalRef)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDTO(data) : null;
  }

  async findByCode(code: string): Promise<OrganizationDTO | null> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDTO(data) : null;
  }

  async findByNif(nif: string): Promise<OrganizationDTO | null> {
    const normalized = nif.replace(/\s/g, '');
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('nif', normalized)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDTO(data) : null;
  }

  async findAll(): Promise<OrganizationDTO[]> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(toDTO);
  }

  async findByType(orgType: string): Promise<OrganizationDTO[]> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('org_type', orgType)
      .order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(toDTO);
  }

  async findByCategory(category: string): Promise<OrganizationDTO[]> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('category', category)
      .order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(toDTO);
  }

  async findChildren(parentOrganizationId: string): Promise<OrganizationDTO[]> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('parent_organization_id', parentOrganizationId)
      .order('name');
    if (error) throw new Error(error.message);
    return (data ?? []).map(toDTO);
  }

  async findDefault(): Promise<OrganizationDTO | null> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('is_default', true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDTO(data) : null;
  }

  // ============================================================
  // ÉCRITURE
  // ============================================================

  async create(data: CreateOrganizationDTO): Promise<OrganizationDTO> {
    const { data: row, error } = await (supabase as any)
      .from(TABLE)
      .insert(toRow(data))
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDTO(row);
  }

  async update(id: string, data: UpdateOrganizationDTO): Promise<OrganizationDTO> {
    const { data: row, error } = await (supabase as any)
      .from(TABLE)
      .update(toRow(data))
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDTO(row);
  }

  /**
   * Upsert intelligent : cherche par external_ref → code → nif → name
   */
  async upsert(data: CreateOrganizationDTO): Promise<OrganizationDTO> {
    // 1. Par externalRef
    if (data.externalRef) {
      const existing = await this.findByExternalRef(data.externalRef);
      if (existing?.id) {
        return this.update(existing.id, data);
      }
    }

    // 2. Par code
    if (data.code) {
      const existing = await this.findByCode(data.code);
      if (existing?.id) {
        return this.update(existing.id, data);
      }
    }

    // 3. Par nif
    if (data.nif) {
      const existing = await this.findByNif(data.nif);
      if (existing?.id) {
        return this.update(existing.id, data);
      }
    }

    // 4. Par nom (fallback)
    if (data.name) {
      const all = await this.findAll();
      const existing = all.find(
        (o) => o.name?.trim().toLowerCase() === data.name.trim().toLowerCase(),
      );
      if (existing?.id) {
        return this.update(existing.id, data);
      }
    }

    // 5. Création
    return this.create(data);
  }

  async setDefault(id: string): Promise<OrganizationDTO> {
    // Retirer is_default des autres
    const { error: clearError } = await (supabase as any)
      .from(TABLE)
      .update({ is_default: false })
      .eq('is_default', true)
      .neq('id', id);
    if (clearError) throw new Error(clearError.message);

    // Définir sur l'organisation cible
    return this.update(id, { isDefault: true });
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await (supabase as any)
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // ============================================================
  // IMPORT EN MASSE
  // ============================================================

  /**
   * Import par lot avec upsert intelligent
   */
  async bulkUpsert(rows: CreateOrganizationDTO[]): Promise<Map<string, string>> {
    const references = new Map<string, string>();

    for (const row of rows) {
      try {
        const org = await this.upsert(row);
        const key = row.externalRef ?? row.code ?? row.name;
        if (key) references.set(key, org.id);
      } catch (err) {
        console.error(`[bulkUpsert] Failed for "${row.name}":`, err);
      }
    }

    return references;
  }
}