/* eslint-disable @typescript-eslint/no-explicit-any */
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import type { CreateOrganizationDTO, OrganizationDTO, UpdateOrganizationDTO } from '@/dtos/entities/OrganizationDTO';
import type { IOrganizationRepository } from '@/domain/repositories/IOrganizationRepository';
import { OrganizationTransformer } from '@/dtos/transforms/OrganizationTransformer';

const TABLE = 'organizations';

type OrganizationRow = Record<string, unknown>;

const toDTO = (row: OrganizationRow): OrganizationDTO => OrganizationTransformer.toDTO(row);
const toRow = (data: CreateOrganizationDTO | UpdateOrganizationDTO): Record<string, unknown> =>
  OrganizationTransformer.toRow(data);

export class SupabaseOrganizationAdapter implements IOrganizationRepository {
  async findById(id: string): Promise<OrganizationDTO | null> {
    const { data, error } = await (supabase as any).from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDTO(data) : null;
  }

  async findByExternalRef(externalRef: string): Promise<OrganizationDTO | null> {
    const { data, error } = await (supabase as any).from(TABLE).select('*').eq('external_ref', externalRef).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDTO(data) : null;
  }

  async findAll(): Promise<OrganizationDTO[]> {
    const { data, error } = await (supabase as any).from(TABLE).select('*').order('name');
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

  async setDefault(id: string): Promise<OrganizationDTO> {
    const { error: clearError } = await (supabase as any)
      .from(TABLE)
      .update({ is_default: false })
      .eq('is_default', true)
      .neq('id', id);
    if (clearError) throw new Error(clearError.message);
    return this.update(id, { isDefault: true });
  }

  async create(data: CreateOrganizationDTO): Promise<OrganizationDTO> {
    const { data: row, error } = await (supabase as any).from(TABLE).insert(toRow(data)).select().single();
    if (error) throw new Error(error.message);
    return toDTO(row);
  }

  async update(id: string, data: UpdateOrganizationDTO): Promise<OrganizationDTO> {
    const { data: row, error } = await (supabase as any).from(TABLE).update(toRow(data)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toDTO(row);
  }

  async upsert(data: CreateOrganizationDTO): Promise<OrganizationDTO> {
    const payload = toRow(data);
    
    // Check by externalRef
    if (data.externalRef) {
      const { data: existing, error: findError } = await (supabase as any)
        .from(TABLE)
        .select('id')
        .eq('external_ref', data.externalRef)
        .maybeSingle();
      if (findError) throw new Error(findError.message);

      if (existing?.id) {
        return this.update(existing.id, data);
      }
    }

    // Check by code (UNIQUE constraint)
    if (data.code) {
      const { data: existing, error: findError } = await (supabase as any)
        .from(TABLE)
        .select('id')
        .eq('code', data.code)
        .maybeSingle();
      if (findError) throw new Error(findError.message);

      if (existing?.id) {
        return this.update(existing.id, data);
      }
    }

    const { data: row, error } = await (supabase as any)
      .from(TABLE)
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDTO(row);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await (supabase as any).from(TABLE).delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
}
