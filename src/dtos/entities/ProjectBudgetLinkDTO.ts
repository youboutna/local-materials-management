/**
 * Project Budget Link DTO (camelCase)
 * Optional linkage between a project and Loi de Finances 2026 budget rows.
 */
import type { BaseEntityDTO } from './BaseEntityDTO';

export interface ProjectBudgetLinkDTO extends BaseEntityDTO {
  projectId: string;
  ministryCode: string | null;
  programCode: string | null;
  actionCode: string | null;
  chapterCode: string | null;
  lineCode: string | null;
  allocatedCe: number;
  allocatedCp: number;
  fiscalYear: number;
  notes: string | null;
  createdBy: string | null;
}

export interface CreateProjectBudgetLinkDTO {
  projectId: string;
  ministryCode?: string | null;
  programCode?: string | null;
  actionCode?: string | null;
  chapterCode?: string | null;
  lineCode?: string | null;
  allocatedCe?: number;
  allocatedCp?: number;
  fiscalYear?: number;
  notes?: string | null;
}

export interface UpdateProjectBudgetLinkDTO {
  ministryCode?: string | null;
  programCode?: string | null;
  actionCode?: string | null;
  chapterCode?: string | null;
  lineCode?: string | null;
  allocatedCe?: number;
  allocatedCp?: number;
  fiscalYear?: number;
  notes?: string | null;
}
