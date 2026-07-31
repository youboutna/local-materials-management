export interface OrganizationDTO {
  id: string;
  name: string;
  code?: string;
  orgType?: string;
  externalRef?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOrganizationDTO = Omit<OrganizationDTO, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
export type UpdateOrganizationDTO = Partial<Omit<CreateOrganizationDTO, 'id'>>;