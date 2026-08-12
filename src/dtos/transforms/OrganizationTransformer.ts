/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OrganizationTransformer - DB row (snake_case) <-> OrganizationDTO (camelCase)
 */
import type { CreateOrganizationDTO, OrganizationDTO, UpdateOrganizationDTO } from '@/dtos/entities/OrganizationDTO';

export type OrganizationRow = Record<string, unknown>;

export class OrganizationTransformer {
  static toDTO(row: OrganizationRow): OrganizationDTO {
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
      parentId: (row.parent_id as string | null) ?? undefined,
      isDefault: row.is_default === true,
      isActive: row.is_active !== false,
      createdAt: row.created_at as string | undefined,
      updatedAt: row.updated_at as string | undefined,
    };
  }

  static toRow(data: CreateOrganizationDTO | UpdateOrganizationDTO): Record<string, unknown> {
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
    if (data.parentId !== undefined) row.parent_id = data.parentId || null;
    if (data.isDefault !== undefined) row.is_default = data.isDefault;
    if (data.isActive !== undefined) row.is_active = data.isActive;
    return row;
  }
}
