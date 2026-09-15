// src/domain/repositories/IOrganizationRepository.ts

import type {
  CreateOrganizationDTO,
  OrganizationDTO,
  UpdateOrganizationDTO,
} from '@/dtos/entities/OrganizationDTO';

/**
 * IOrganizationRepository
 * 
 * Contrat d'accès aux données pour les organisations.
 * 
 * Doit être implémenté par :
 *   - SupabaseOrganizationAdapter (production)
 *   - InMemoryOrganizationAdapter (tests)
 *   - MockOrganizationAdapter (tests unitaires)
 */
export interface IOrganizationRepository {
  // ============================================================
  // LECTURE — Recherche par identifiant unique
  // ============================================================

  /** Récupère une organisation par son UUID */
  findById(id: string): Promise<OrganizationDTO | null>;

  /** Récupère une organisation par sa référence externe */
  findByExternalRef(externalRef: string): Promise<OrganizationDTO | null>;

  /** Récupère une organisation par son code métier */
  findByCode(code: string): Promise<OrganizationDTO | null>;

  /** Récupère une organisation par son NIF (8-12 chiffres) */
  findByNif(nif: string): Promise<OrganizationDTO | null>;

  // ============================================================
  // LECTURE — Recherche par critères
  // ============================================================

  /** Récupère toutes les organisations, triées par nom */
  findAll(): Promise<OrganizationDTO[]>;

  /** Récupère les organisations d'un type donné (org_type) */
  findByType(orgType: string): Promise<OrganizationDTO[]>;

  /** Récupère les organisations d'une catégorie donnée (category) */
  findByCategory(category: string): Promise<OrganizationDTO[]>;

  /** Récupère les enfants directs d'une organisation parente */
  findChildren(parentOrganizationId: string): Promise<OrganizationDTO[]>;

  /** Récupère l'organisation marquée "par défaut" (is_default = true) */
  findDefault(): Promise<OrganizationDTO | null>;

  // ============================================================
  // ÉCRITURE
  // ============================================================

  /** Crée une nouvelle organisation */
  create(data: CreateOrganizationDTO): Promise<OrganizationDTO>;

  /** Met à jour une organisation existante (partiel) */
  update(id: string, data: UpdateOrganizationDTO): Promise<OrganizationDTO>;

  /**
   * Upsert intelligent.
   * 
   * Stratégie de résolution (ordre de priorité) :
   *   1. Par `externalRef`
   *   2. Par `code`
   *   3. Par `nif`
   *   4. Par `name` (insensible à la casse)
   *   5. Sinon → création
   */
  upsert(data: CreateOrganizationDTO): Promise<OrganizationDTO>;

  /** Définit une organisation comme "par défaut" (retire le flag aux autres) */
  setDefault(id: string): Promise<OrganizationDTO>;

  /** Supprime une organisation */
  delete(id: string): Promise<boolean>;

  // ============================================================
  // OPÉRATIONS EN MASSE
  // ============================================================

  /**
   * Import par lot avec upsert intelligent.
   * 
   * @returns Map<clé_de_résolution, uuid_organisation>
   *          où clé_de_résolution = externalRef ?? code ?? name
   */
  bulkUpsert(rows: CreateOrganizationDTO[]): Promise<Map<string, string>>;
}