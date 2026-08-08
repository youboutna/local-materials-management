export interface OrganizationHierarchyDTO {
  id: string;
  organizationId?: string;
  employeeId?: string;
  parentId?: string;
  department?: string;
  positionTitle?: string;
  level?: number;
  directReportsCount?: number;
  canApproveProjects?: boolean;
  canApprovePayments?: boolean;
  canEscalateToDirector?: boolean;
  notificationPreferences?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOrganizationHierarchyDTO = Omit<OrganizationHierarchyDTO, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
export type UpdateOrganizationHierarchyDTO = Partial<Omit<CreateOrganizationHierarchyDTO, 'id'>>;