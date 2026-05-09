/**
 * Domain entity: ProjectBudgetLink
 */

export interface ProjectBudgetLinkProps {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export class ProjectBudgetLink {
  readonly id: string;
  readonly projectId: string;
  readonly ministryCode: string | null;
  readonly programCode: string | null;
  readonly actionCode: string | null;
  readonly chapterCode: string | null;
  readonly lineCode: string | null;
  readonly allocatedCe: number;
  readonly allocatedCp: number;
  readonly fiscalYear: number;
  readonly notes: string | null;
  readonly createdBy: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;

  private constructor(p: ProjectBudgetLinkProps) {
    Object.assign(this, p);
  }

  static create(p: ProjectBudgetLinkProps): ProjectBudgetLink {
    if (!p.projectId) throw new Error('ProjectBudgetLink: projectId is required');
    if (p.allocatedCe < 0 || p.allocatedCp < 0) {
      throw new Error('ProjectBudgetLink: allocations must be >= 0');
    }
    return new ProjectBudgetLink(p);
  }
}
