/**
 * ProjectStrategyLink Transformer - DB snake_case <-> DTO camelCase
 */
import { ProjectStrategyLink } from '@/domain/entities/ProjectStrategyLink';
import type {
  ProjectStrategyLinkDTO,
  CreateProjectStrategyLinkDTO,
  StrategyReferentialSource,
} from '@/dtos/entities/ProjectStrategyLinkDTO';

type Row = {
  id: string;
  project_id: string;
  source_referential: string;
  lever_code: string | null;
  chantier_code: string | null;
  intervention_code: string | null;
  objective_code: string | null;
  contribution_pct: number | string;
  justification: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export class ProjectStrategyLinkTransformer {
  static fromSupabase(row: Row): ProjectStrategyLink {
    return ProjectStrategyLink.create({
      id: row.id,
      projectId: row.project_id,
      sourceReferential: row.source_referential,
      leverCode: row.lever_code,
      chantierCode: row.chantier_code,
      interventionCode: row.intervention_code,
      objectiveCode: row.objective_code,
      contributionPct: Number(row.contribution_pct ?? 0),
      justification: row.justification,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static toDTO(e: ProjectStrategyLink): ProjectStrategyLinkDTO {
    return {
      id: e.id,
      projectId: e.projectId,
      sourceReferential: e.sourceReferential as StrategyReferentialSource,
      leverCode: e.leverCode,
      chantierCode: e.chantierCode,
      interventionCode: e.interventionCode,
      objectiveCode: e.objectiveCode,
      contributionPct: e.contributionPct,
      justification: e.justification,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  static rowToDTO(row: Row): ProjectStrategyLinkDTO {
    return this.toDTO(this.fromSupabase(row));
  }

  static createToSupabase(dto: CreateProjectStrategyLinkDTO, userId?: string | null) {
    return {
      project_id: dto.projectId,
      source_referential: dto.sourceReferential ?? 'SCAPP',
      lever_code: dto.leverCode ?? null,
      chantier_code: dto.chantierCode ?? null,
      intervention_code: dto.interventionCode ?? null,
      objective_code: dto.objectiveCode ?? null,
      contribution_pct: dto.contributionPct ?? 0,
      justification: dto.justification ?? null,
      created_by: userId ?? null,
    };
  }

  static updateToSupabase(dto: Partial<CreateProjectStrategyLinkDTO>) {
    const out: Record<string, any> = {};
    if (dto.sourceReferential !== undefined) out.source_referential = dto.sourceReferential;
    if (dto.leverCode !== undefined) out.lever_code = dto.leverCode;
    if (dto.chantierCode !== undefined) out.chantier_code = dto.chantierCode;
    if (dto.interventionCode !== undefined) out.intervention_code = dto.interventionCode;
    if (dto.objectiveCode !== undefined) out.objective_code = dto.objectiveCode;
    if (dto.contributionPct !== undefined) out.contribution_pct = dto.contributionPct;
    if (dto.justification !== undefined) out.justification = dto.justification;
    return out;
  }
}
