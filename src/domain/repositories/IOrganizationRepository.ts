import type { CreateOrganizationDTO, OrganizationDTO, UpdateOrganizationDTO } from '@/dtos/entities/OrganizationDTO';

export interface IOrganizationRepository {
  findById(id: string): Promise<OrganizationDTO | null>;
  findByExternalRef(externalRef: string): Promise<OrganizationDTO | null>;
  findAll(): Promise<OrganizationDTO[]>;
  create(data: CreateOrganizationDTO): Promise<OrganizationDTO>;
  update(id: string, data: UpdateOrganizationDTO): Promise<OrganizationDTO>;
  upsert(data: CreateOrganizationDTO): Promise<OrganizationDTO>;
  delete(id: string): Promise<boolean>;
}