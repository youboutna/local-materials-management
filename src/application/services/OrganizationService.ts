import type { IOrganizationRepository } from '@/domain/repositories/IOrganizationRepository';
import type { CreateOrganizationDTO, OrganizationDTO, UpdateOrganizationDTO } from '@/dtos/entities/OrganizationDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

export class OrganizationService {
  constructor(private readonly repository: IOrganizationRepository = RepositoryFactory.getOrganizationRepository()) {}

  async list(): Promise<OrganizationDTO[]> { return this.repository.findAll(); }

  async get(id: string): Promise<OrganizationDTO | null> {
    if (!id) throw new Error('Organization ID is required');
    return this.repository.findById(id);
  }

  async getDefault(): Promise<OrganizationDTO | null> { return this.repository.findDefault(); }

  async setDefault(id: string): Promise<OrganizationDTO> {
    if (!id) throw new Error('Organization ID is required');
    return this.repository.setDefault(id);
  }

  /** Retourne l'organisation propriétaire par défaut, ou la première active à défaut. */
  async resolveOwnerOrganizationId(): Promise<string | undefined> {
    const explicit = await this.repository.findDefault().catch(() => null);
    if (explicit?.id) return explicit.id;
    const all = await this.repository.findAll().catch(() => [] as OrganizationDTO[]);
    return all.find((o) => o.isActive)?.id ?? all[0]?.id;
  }

  async create(data: CreateOrganizationDTO): Promise<OrganizationDTO> {
    this.validate(data);
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateOrganizationDTO): Promise<OrganizationDTO> {
    if (!id) throw new Error('Organization ID is required');
    this.validate(data);
    if (data.parentId) {
      if (data.parentId === id) throw new Error('Une organisation ne peut pas être son propre parent');
      const all = await this.repository.findAll().catch(() => [] as OrganizationDTO[]);
      if (this.isDescendant(all, id, data.parentId)) {
        throw new Error('Hiérarchie invalide : le parent choisi est une sous-organisation');
      }
    }
    const updated = await this.repository.update(id, data);
    if (data.isDefault === true && !updated.isDefault) {
      return this.repository.setDefault(id);
    }
    if (data.isDefault === true) {
      // garantit l'unicité du flag par défaut
      return this.repository.setDefault(id);
    }
    return updated;
  }

  async upsert(data: CreateOrganizationDTO): Promise<OrganizationDTO> {
    this.validate(data);
    return this.repository.upsert(data);
  }

  async delete(id: string): Promise<boolean> {
    if (!id) throw new Error('Organization ID is required');
    const all = await this.repository.findAll().catch(() => [] as OrganizationDTO[]);
    const target = all.find((o) => o.id === id);
    if (target?.isDefault) {
      throw new Error('Impossible de supprimer l’organisation par défaut : définissez-en une autre d’abord');
    }
    if (all.some((o) => o.parentId === id)) {
      throw new Error('Impossible de supprimer : cette organisation possède des sous-organisations');
    }
    return this.repository.delete(id);
  }

  /** true si candidateId se trouve dans la descendance de rootId */
  private isDescendant(all: OrganizationDTO[], rootId: string, candidateId: string): boolean {
    let current = all.find((o) => o.id === candidateId);
    const seen = new Set<string>();
    while (current?.parentId && !seen.has(current.parentId)) {
      if (current.parentId === rootId) return true;
      seen.add(current.parentId);
      current = all.find((o) => o.id === current?.parentId);
    }
    return false;
  }


  private validate(data: Partial<CreateOrganizationDTO>): void {
    if ('name' in data && !data.name?.trim()) throw new Error('Organization name is required');
  }
}

let organizationServiceInstance: OrganizationService | null = null;
export function getOrganizationService(): OrganizationService {
  if (!organizationServiceInstance) {
    organizationServiceInstance = new OrganizationService();
  }
  return organizationServiceInstance;
}
