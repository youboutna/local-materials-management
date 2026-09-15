
// src/dtos/transforms/OrganizationTransformer.ts

/**
 * OrganizationTransformer
 * DB row (snake_case) ↔ OrganizationDTO (camelCase)
 */

import type {
  CreateOrganizationDTO,
  OrganizationDTO,
  UpdateOrganizationDTO,
} from '@/dtos/entities/OrganizationDTO';

export type OrganizationRow = Record<string, unknown>;

export class OrganizationTransformer {
  // ============================================================
  // DB → DTO
  // ============================================================

  static toDTO(row: OrganizationRow): OrganizationDTO {
    return {
      id: String(row.id ?? ''),
      name: String(row.name ?? ''),
      code: (row.code as string | null) ?? undefined,

      // Type / catégorie
      orgType: (row.org_type as string | null) ?? undefined,
      category: (row.category as string | null) ?? undefined,

      // Identification
      externalRef: (row.external_ref as string | null) ?? undefined,
      nif: (row.nif as string | null) ?? null,
      rc: (row.rc as string | null) ?? null,
      cb: (row.cb as string | null) ?? null,

      // Détails
      description: (row.description as string | null) ?? undefined,
      address: (row.address as string | null) ?? undefined,
      phone: (row.phone as string | null) ?? undefined,
      email: (row.email as string | null) ?? undefined,
      sector: (row.sector as string | null) ?? null,
      website: (row.website as string | null) ?? undefined,
      logoUrl: (row.logo_url as string | null) ?? undefined,

      // Hiérarchie
      parentOrganizationId:
        (row.parent_organization_id as string | null) ??
        (row.parent_id as string | null) ??  // rétrocompat
        undefined,

      // Flags
      isDefault: row.is_default === true,
      isActive: row.is_active !== false,

      // Timestamps
      createdAt: (row.created_at as string | null) ?? undefined,
      updatedAt: (row.updated_at as string | null) ?? undefined,
    };
  }

  // ============================================================
  // DTO → DB
  // ============================================================

  static toRow(
    data: CreateOrganizationDTO | UpdateOrganizationDTO,
  ): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if ('id' in data && data.id !== undefined) row.id = data.id;

    // Champs simples
    if (data.name !== undefined) row.name = data.name;
    if (data.code !== undefined) row.code = data.code;

    // Type
    if (data.orgType !== undefined) row.org_type = data.orgType;

    // Identification
    if (data.externalRef !== undefined) row.external_ref = data.externalRef;
    if (data.nif !== undefined) row.nif = data.nif || null;
    if (data.rc !== undefined) row.rc = data.rc || null;
    if (data.cb !== undefined) row.cb = data.cb || null;

    // Détails
    if (data.description !== undefined) row.description = data.description;
    if (data.address !== undefined) row.address = data.address;
    if (data.phone !== undefined) row.phone = data.phone;
    if (data.email !== undefined) row.email = data.email;
    if (data.sector !== undefined) row.sector = data.sector || null;
    if (data.website !== undefined) row.website = data.website;
    if (data.logoUrl !== undefined) row.logo_url = data.logoUrl;

    // Hiérarchie (nouveau + rétrocompat)
    const parentOrg =
      (data as any).parentOrganizationId ??
      (data as any).parentId;

    if (parentOrg !== undefined) {
      row.parent_organization_id = parentOrg || null;
    }

    // Flags
    if (data.isDefault !== undefined) row.is_default = data.isDefault;
    if (data.isActive !== undefined) row.is_active = data.isActive;

    return row;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Fusionne un DTO existant avec un payload partiel (mise à jour)
   */
  static merge(
    existing: OrganizationDTO,
    patch: UpdateOrganizationDTO,
  ): CreateOrganizationDTO {
    return {
      ...existing,
      ...patch,
    } as CreateOrganizationDTO;
  }

  /**
   * Valide un DTO avant persistance
   */
  static validate(data: Partial<CreateOrganizationDTO>): string[] {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Le nom est obligatoire');
    }

    if (data.nif && !/^[0-9]{8,12}$/.test(data.nif.replace(/\s/g, ''))) {
      errors.push('Le NIF doit contenir entre 8 et 12 chiffres');
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Format d\'email invalide');
    }

    return errors;
  }
}