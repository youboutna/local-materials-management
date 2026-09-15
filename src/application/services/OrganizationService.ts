// src/application/services/OrganizationService.ts

import type { IOrganizationRepository } from '@/domain/repositories/IOrganizationRepository';
import type {
  CreateOrganizationDTO,
  OrganizationDTO,
  UpdateOrganizationDTO,
} from '@/dtos/entities/OrganizationDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

export class OrganizationService {
  constructor(
    private readonly repository: IOrganizationRepository =
      RepositoryFactory.getOrganizationRepository(),
  ) {}

  // ============================================================
  // LECTURE
  // ============================================================

  async list(): Promise<OrganizationDTO[]> {
    return this.repository.findAll();
  }

  async get(id: string): Promise<OrganizationDTO | null> {
    if (!id) throw new Error('Organization ID is required');
    return this.repository.findById(id);
  }

  async getByExternalRef(externalRef: string): Promise<OrganizationDTO | null> {
    if (!externalRef) throw new Error('External reference is required');
    return this.repository.findByExternalRef(externalRef);
  }

  async getByCode(code: string): Promise<OrganizationDTO | null> {
    if (!code) throw new Error('Code is required');
    return this.repository.findByCode(code);
  }

  async getByNif(nif: string): Promise<OrganizationDTO | null> {
    if (!nif) throw new Error('NIF is required');
    const normalized = nif.replace(/\s/g, '');
    return this.repository.findByNif(normalized);
  }

  async getDefault(): Promise<OrganizationDTO | null> {
    return this.repository.findDefault();
  }

  /**
   * Liste les organisations par type (org_type)
   * Ex: 'public', 'prestataire', 'community', 'ong'
   */
  async listByType(orgType: string): Promise<OrganizationDTO[]> {
    if (!orgType) throw new Error('Organization type is required');
    return this.repository.findByType(orgType);
  }

  /**
   * Liste les organisations par catégorie
   * Ex: 'institutionnel', 'commercial', 'communautaire', 'ong'
   */
  async listByCategory(category: string): Promise<OrganizationDTO[]> {
    if (!category) throw new Error('Category is required');
    return this.repository.findByCategory(category);
  }

  /**
   * Récupère les enfants directs d'une organisation parente
   */
  async getChildren(parentOrganizationId: string): Promise<OrganizationDTO[]> {
    if (!parentOrganizationId) throw new Error('Parent organization ID is required');
    return this.repository.findChildren(parentOrganizationId);
  }

  /**
   * Récupère l'organisation propriétaire par défaut,
   * ou la première active à défaut.
   */
  async resolveOwnerOrganizationId(): Promise<string | undefined> {
    const explicit = await this.repository.findDefault().catch(() => null);
    if (explicit?.id) return explicit.id;

    const all = await this.repository.findAll().catch(() => [] as OrganizationDTO[]);
    return all.find((o) => o.isActive)?.id ?? all[0]?.id;
  }

  // ============================================================
  // ÉCRITURE
  // ============================================================

  async create(data: CreateOrganizationDTO): Promise<OrganizationDTO> {
    this.validate(data);
    return this.repository.create(this.normalize(data));
  }

  async update(id: string, data: UpdateOrganizationDTO): Promise<OrganizationDTO> {
    if (!id) throw new Error('Organization ID is required');
    this.validate(data);

    // Vérification de la hiérarchie
    const parentId =
      (data as any).parentOrganizationId ??
      (data as any).parentId;

    if (parentId) {
      if (parentId === id) {
        throw new Error('Une organisation ne peut pas être son propre parent');
      }

      const all = await this.repository.findAll().catch(() => [] as OrganizationDTO[]);
      if (this.isDescendant(all, id, parentId)) {
        throw new Error('Hiérarchie invalide : le parent choisi est une sous-organisation');
      }
    }

    const updated = await this.repository.update(id, this.normalize(data));

    // Si on demande isDefault = true, garantir l'unicité
    if (data.isDefault === true && !updated.isDefault) {
      return this.repository.setDefault(id);
    }

    return updated;
  }

  async upsert(data: CreateOrganizationDTO): Promise<OrganizationDTO> {
    this.validate(data);
    return this.repository.upsert(this.normalize(data));
  }

  async setDefault(id: string): Promise<OrganizationDTO> {
    if (!id) throw new Error('Organization ID is required');
    return this.repository.setDefault(id);
  }

  async delete(id: string): Promise<boolean> {
    if (!id) throw new Error('Organization ID is required');

    const all = await this.repository.findAll().catch(() => [] as OrganizationDTO[]);
    const target = all.find((o) => o.id === id);

    // Protection : ne pas supprimer l'organisation par défaut
    if (target?.isDefault) {
      throw new Error(
        'Impossible de supprimer l’organisation par défaut : définissez-en une autre d’abord',
      );
    }

    // Protection : ne pas supprimer une organisation avec des enfants
    if (all.some((o) => o.parentOrganizationId === id)) {
      throw new Error(
        'Impossible de supprimer : cette organisation possède des sous-organisations',
      );
    }

    return this.repository.delete(id);
  }

  // ============================================================
  // IMPORT EN MASSE
  // ============================================================

  /**
   * Import en masse avec upsert intelligent.
   * 
   * @returns Map<externalRef | code | name, uuid>
   */
  async importMany(rows: CreateOrganizationDTO[]): Promise<Map<string, string>> {
    for (const row of rows) {
      this.validate(row);
    }
    return this.repository.bulkUpsert(rows.map((r) => this.normalize(r)));
  }

  // ============================================================
  // HELPERS PRIVÉS
  // ============================================================

  /**
   * true si candidateId se trouve dans la descendance de rootId
   */
  private isDescendant(
    all: OrganizationDTO[],
    rootId: string,
    candidateId: string,
  ): boolean {
    let current = all.find((o) => o.id === candidateId);
    const seen = new Set<string>();

    while (current?.parentOrganizationId && !seen.has(current.parentOrganizationId)) {
      if (current.parentOrganizationId === rootId) return true;
      seen.add(current.parentOrganizationId);
      current = all.find((o) => o.id === current?.parentOrganizationId);
    }

    return false;
  }

  /**
   * Valide les données d'une organisation
   */
  private validate(data: Partial<CreateOrganizationDTO>): void {
    if ('name' in data && !data.name?.trim()) {
      throw new Error('Organization name is required');
    }

    // NIF : 8 à 12 chiffres (aligné sur la contrainte DB)
    if (data.nif !== undefined && data.nif !== null) {
      const nif = data.nif.replace(/\s/g, '');
      if (nif.length > 0 && !/^[0-9]{8,12}$/.test(nif)) {
        throw new Error('Le NIF doit contenir entre 8 et 12 chiffres');
      }
    }

    // Email (si fourni)
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Format d\'email invalide');
    }

    // Type d'organisation (si fourni)
    const VALID_TYPES = [
      'public', 'prive', 'ong',
      'prestataire', 'fournisseur', 'groupement', 'sous_traitant',
      'community', 'association', 'cooperative', 'groupement_communautaire',
      'autorite_regionale', 'autorite_locale', 'administration',
      'autre',
    ];

    if (data.orgType && !VALID_TYPES.includes(data.orgType)) {
      throw new Error(
        `Type d'organisation invalide : "${data.orgType}". Valeurs autorisées : ${VALID_TYPES.join(', ')}`,
      );
    }
  }

  /**
   * Normalise les données avant envoi en DB
   */
  private normalize<T extends Partial<CreateOrganizationDTO> | Partial<UpdateOrganizationDTO>>(
    data: T,
  ): T {
    const normalized: any = { ...data };

    // NIF : retirer espaces
    if (normalized.nif) {
      normalized.nif = normalized.nif.replace(/\s/g, '');
    }

    // Nom : trim
    if (normalized.name) {
      normalized.name = normalized.name.trim();
    }

    // Code : trim + uppercase
    if (normalized.code) {
      normalized.code = normalized.code.trim();
    }

    // ExternalRef : trim
    if (normalized.externalRef) {
      normalized.externalRef = normalized.externalRef.trim();
    }

    // Rétrocompat : parentId → parentOrganizationId
    if (normalized.parentId && !normalized.parentOrganizationId) {
      normalized.parentOrganizationId = normalized.parentId;
      delete normalized.parentId;
    }

    return normalized as T;
  }
}

// ============================================================
// SINGLETON
// ============================================================

let organizationServiceInstance: OrganizationService | null = null;

export function getOrganizationService(): OrganizationService {
  if (!organizationServiceInstance) {
    organizationServiceInstance = new OrganizationService();
  }
  return organizationServiceInstance;
}

/**
 * Réinitialise l'instance (utile pour les tests)
 */
export function resetOrganizationService(): void {
  organizationServiceInstance = null;
}