/**
 * Project Strategy Link DTO (camelCase)
 * Optionally links a project to SCAPP / sectorial strategies and KPIs.
 */
import type { BaseEntityDTO } from './BaseEntityDTO';

export type StrategyReferentialSource = 'SCAPP' | 'PNDS_2021_2030' | 'SDAU_NKC_2018_2040' | 'OTHER';

export interface ProjectStrategyLinkDTO extends BaseEntityDTO {
  projectId: string;
  sourceReferential: StrategyReferentialSource;
  leverCode: string | null;
  chantierCode: string | null;
  interventionCode: string | null;
  objectiveCode: string | null;
  contributionPct: number;
  justification: string | null;
  createdBy: string | null;
}

export interface CreateProjectStrategyLinkDTO {
  projectId: string;
  sourceReferential?: StrategyReferentialSource;
  leverCode?: string | null;
  chantierCode?: string | null;
  interventionCode?: string | null;
  objectiveCode?: string | null;
  contributionPct?: number;
  justification?: string | null;
}

export interface UpdateProjectStrategyLinkDTO {
  sourceReferential?: StrategyReferentialSource;
  leverCode?: string | null;
  chantierCode?: string | null;
  interventionCode?: string | null;
  objectiveCode?: string | null;
  contributionPct?: number;
  justification?: string | null;
}
