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
    return this.repository.update(id, data);
  }

  async upsert(data: CreateOrganizationDTO): Promise<OrganizationDTO> {
    this.validate(data);
    return this.repository.upsert(data);
  }

  async delete(id: string): Promise<boolean> {
    if (!id) throw new Error('Organization ID is required');
    return this.repository.delete(id);
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
