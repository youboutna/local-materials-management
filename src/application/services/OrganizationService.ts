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