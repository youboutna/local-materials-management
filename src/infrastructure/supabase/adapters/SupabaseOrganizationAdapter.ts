/* eslint-disable @typescript-eslint/no-explicit-any */
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import type { CreateOrganizationDTO, OrganizationDTO, UpdateOrganizationDTO } from '@/dtos/entities/OrganizationDTO';
import type { IOrganizationRepository } from '@/domain/repositories/IOrganizationRepository';

const TABLE = 'organizations';

type OrganizationRow = Record<string, unknown>;

function toDTO(row: OrganizationRow): OrganizationDTO {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    code: row.code as string | undefined,
    orgType: row.org_type as string | undefined,
    externalRef: row.external_ref as string | undefined,
    description: row.description as string | undefined,
    address: row.address as string | undefined,
    phone: row.phone as string | undefined,
    email: row.email as string | undefined,
    website: row.website as string | undefined,
    logoUrl: row.logo_url as string | undefined,
    isActive: row.is_active !== false,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

function toRow(data: CreateOrganizationDTO | UpdateOrganizationDTO): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ('id' in data && data.id !== undefined) row.id = data.id;
  if (data.name !== undefined) row.name = data.name;
  if (data.code !== undefined) row.code = data.code;
  if (data.orgType !== undefined) row.org_type = data.orgType;
  if (data.externalRef !== undefined) row.external_ref = data.externalRef;
  if (data.description !== undefined) row.description = data.description;
  if (data.address !== undefined) row.address = data.address;
  if (data.phone !== undefined) row.phone = data.phone;
  if (data.email !== undefined) row.email = data.email;
  if (data.website !== undefined) row.website = data.website;
  if (data.logoUrl !== undefined) row.logo_url = data.logoUrl;
  if (data.isActive !== undefined) row.is_active = data.isActive;
  return row;
}

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
    if (data.externalRef) {
      const { data: existing, error: findError } = await (supabase as any)

    if (data.code) {
      const { data: existing, error: findError } = await (supabase as any)
        .from(TABLE)
        .select("id")
        .eq("code", data.code)
        .maybeSingle();
      if (findError) throw new Error(findError.message);

      if (existing?.id) {
        return this.update(existing.id, data);
      }
    }
        .from(TABLE)
        .select('id')
        .eq('external_ref', data.externalRef)
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