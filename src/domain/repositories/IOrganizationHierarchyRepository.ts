import type { CreateOrganizationHierarchyDTO, OrganizationHierarchyDTO, UpdateOrganizationHierarchyDTO } from '@/dtos/entities/OrganizationHierarchyDTO';

export interface IOrganizationHierarchyRepository {
  findById(id: string): Promise<OrganizationHierarchyDTO | null>;
  findByOrganizationId(organizationId: string): Promise<OrganizationHierarchyDTO[]>;
  findByEmployeeId(employeeId: string): Promise<OrganizationHierarchyDTO | null>;
  findByParentId(parentId: string): Promise<OrganizationHierarchyDTO[]>;
  replaceForOrganization(organizationId: string, nodes: CreateOrganizationHierarchyDTO[]): Promise<OrganizationHierarchyDTO[]>;
  create(data: CreateOrganizationHierarchyDTO): Promise<OrganizationHierarchyDTO>;
  update(id: string, data: UpdateOrganizationHierarchyDTO): Promise<OrganizationHierarchyDTO>;
  delete(id: string): Promise<boolean>;
}