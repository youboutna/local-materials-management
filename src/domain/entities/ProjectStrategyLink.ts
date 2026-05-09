/**
 * Domain entity: ProjectStrategyLink
 * Pure TS, immutable, factory pattern.
 */

export interface ProjectStrategyLinkProps {
  id: string;
  projectId: string;
  sourceReferential: string;
  leverCode: string | null;
  chantierCode: string | null;
  interventionCode: string | null;
  objectiveCode: string | null;
  contributionPct: number;
  justification: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ProjectStrategyLink {
  readonly id: string;
  readonly projectId: string;
  readonly sourceReferential: string;
  readonly leverCode: string | null;
  readonly chantierCode: string | null;
  readonly interventionCode: string | null;
  readonly objectiveCode: string | null;
  readonly contributionPct: number;
  readonly justification: string | null;
  readonly createdBy: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;

  private constructor(p: ProjectStrategyLinkProps) {
    this.id = p.id;
    this.projectId = p.projectId;
    this.sourceReferential = p.sourceReferential;
    this.leverCode = p.leverCode;
    this.chantierCode = p.chantierCode;
    this.interventionCode = p.interventionCode;
    this.objectiveCode = p.objectiveCode;
    this.contributionPct = p.contributionPct;
    this.justification = p.justification;
    this.createdBy = p.createdBy;
    this.createdAt = p.createdAt;
    this.updatedAt = p.updatedAt;
  }

  static create(p: ProjectStrategyLinkProps): ProjectStrategyLink {
    if (!p.projectId) throw new Error('ProjectStrategyLink: projectId is required');
    if (p.contributionPct < 0 || p.contributionPct > 100) {
      throw new Error('ProjectStrategyLink: contributionPct must be 0..100');
    }
    return new ProjectStrategyLink(p);
  }
}
