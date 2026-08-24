export type ConsultantCandidateKind = 'stakeholder' | 'organization' | 'supplier' | 'employee';

export interface ProjectConsultantDTO {
  stakeholderId: string;
  projectId: string;
  name: string;
  businessRole: string;
  entityType: string;
  employeeId?: string | null;
  supplierId?: string | null;
  organizationId?: string | null;
  isConsultant: boolean;
}

export interface ConsultantCandidateDTO {
  key: string;
  sourceId: string;
  stakeholderId?: string;
  kind: ConsultantCandidateKind;
  name: string;
  detail?: string;
  email?: string;
  isAlreadyStakeholder: boolean;
}