// src/dtos/entities/OrganizationDTO.ts

/**
 * OrganizationDTO — Représentation API/UI d'une organisation (camelCase)
 *
 * Aligné sur la table btp.organizations (snake_case) :
 *   name               → name
 *   code               → code
 *   orgType            → org_type
 *   externalRef        → external_ref
 *   description        → description
 *   address            → address
 *   phone              → phone
 *   email              → email
 *   nif                → nif
 *   rc                 → rc
 *   cb                 → cb
 *   sector             → sector
 *   website            → website
 *   logoUrl            → logo_url
 *   parentOrganizationId → parent_organization_id
 *   isDefault          → is_default
 *   isActive           → is_active
 *   category           → category (généré côté DB)
 */
export interface OrganizationDTO {
  id: string;
  name: string;
  code?: string;

  /** Type d'organisation (colonne DB : org_type) */
  orgType?: string;

  /** Catégorie calculée côté DB (institutionnel, commercial, communautaire, ong, autre) */
  category?: string;

  /** Référence externe (utilisée pour l'import/upsert) */
  externalRef?: string;

  description?: string;
  address?: string;
  phone?: string;
  email?: string;

  /** Numéro d'Identification Fiscale (8 à 12 chiffres) */
  nif?: string | null;

  /** Registre de Commerce */
  rc?: string | null;

  /** Coordonnées bancaires (Compte Bancaire) */
  cb?: string | null;

  /** Secteur d'activité (Énergie, BTP, Environnement, etc.) */
  sector?: string | null;

  website?: string;
  logoUrl?: string;

  /** Organisation parente (hiérarchie) */
  parentOrganizationId?: string;

  /** Organisation propriétaire par défaut des nouveaux projets */
  isDefault?: boolean;

  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOrganizationDTO = Omit<
  OrganizationDTO,
  'id' | 'createdAt' | 'updatedAt' | 'category'
> & {
  id?: string;
};

export type UpdateOrganizationDTO = Partial<Omit<CreateOrganizationDTO, 'id'>>;

/**
 * Rétrocompatibilité : certains composants utilisent encore `parentId`.
 * Cette propriété est dépréciée, utilisez `parentOrganizationId`.
 */
export interface LegacyOrganizationCompat {
  /** @deprecated Utilisez `parentOrganizationId` */
  parentId?: string;
}