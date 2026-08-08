import type { IOrganizationHierarchyRepository } from '@/domain/repositories/IOrganizationHierarchyRepository';
import type { CreateOrganizationHierarchyDTO, OrganizationHierarchyDTO, UpdateOrganizationHierarchyDTO } from '@/dtos/entities/OrganizationHierarchyDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

export class OrganizationHierarchyService {
  constructor(private readonly repository: IOrganizationHierarchyRepository = RepositoryFactory.getOrganizationHierarchyRepository()) {}

  async list(organizationId: string): Promise<OrganizationHierarchyDTO[]> {
    if (!organizationId) throw new Error('Organization ID is required');
    return this.repository.findByOrganizationId(organizationId);
  }

  async get(id: string): Promise<OrganizationHierarchyDTO | null> {
    if (!id) throw new Error('Hierarchy node ID is required');
    return this.repository.findById(id);
  }

  async create(data: CreateOrganizationHierarchyDTO): Promise<OrganizationHierarchyDTO> {
    if (!data.organizationId && !data.employeeId) throw new Error('Organization or employee is required');
    return this.repository.create(data);
  }

  async replaceForOrganization(organizationId: string, nodes: CreateOrganizationHierarchyDTO[]): Promise<OrganizationHierarchyDTO[]> {
    if (!organizationId) throw new Error('Organization ID is required');
    return this.repository.replaceForOrganization(organizationId, nodes);
  }

  async update(id: string, data: UpdateOrganizationHierarchyDTO): Promise<OrganizationHierarchyDTO> {
    if (!id) throw new Error('Hierarchy node ID is required');
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    if (!id) throw new Error('Hierarchy node ID is required');
    const children = await this.repository.findByParentId(id);
    if (children.length > 0) throw new Error('Cannot delete a hierarchy node with children');
    return this.repository.delete(id);
  }
}

let organizationHierarchyServiceInstance: OrganizationHierarchyService | null = null;
export function getOrganizationHierarchyService(): OrganizationHierarchyService {
  if (!organizationHierarchyServiceInstance) {
    organizationHierarchyServiceInstance = new OrganizationHierarchyService();
  }
  return organizationHierarchyServiceInstance;
}
