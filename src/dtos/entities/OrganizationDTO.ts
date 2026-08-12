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
  /** Organisation parente (hiérarchie des organisations). */
  parentId?: string;
  /** Organisation propriétaire par défaut des nouveaux projets. */
  isDefault?: boolean;

  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOrganizationDTO = Omit<OrganizationDTO, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
export type UpdateOrganizationDTO = Partial<Omit<CreateOrganizationDTO, 'id'>>;