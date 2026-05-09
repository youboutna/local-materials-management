/**
 * ProjectBudgetLink Transformer - DB snake_case <-> DTO camelCase
 */
import { ProjectBudgetLink } from '@/domain/entities/ProjectBudgetLink';
import type {
  ProjectBudgetLinkDTO,
  CreateProjectBudgetLinkDTO,
} from '@/dtos/entities/ProjectBudgetLinkDTO';

type Row = {
  id: string;
  project_id: string;
  ministry_code: string | null;
  program_code: string | null;
  action_code: string | null;
  chapter_code: string | null;
  line_code: string | null;
  allocated_ce: number | string;
  allocated_cp: number | string;
  fiscal_year: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export class ProjectBudgetLinkTransformer {
  static fromSupabase(row: Row): ProjectBudgetLink {
    return ProjectBudgetLink.create({
      id: row.id,
      projectId: row.project_id,
      ministryCode: row.ministry_code,
      programCode: row.program_code,
      actionCode: row.action_code,
      chapterCode: row.chapter_code,
      lineCode: row.line_code,
      allocatedCe: Number(row.allocated_ce ?? 0),
      allocatedCp: Number(row.allocated_cp ?? 0),
      fiscalYear: row.fiscal_year,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static toDTO(e: ProjectBudgetLink): ProjectBudgetLinkDTO {
    return {
      id: e.id,
      projectId: e.projectId,
      ministryCode: e.ministryCode,
      programCode: e.programCode,
      actionCode: e.actionCode,
      chapterCode: e.chapterCode,
      lineCode: e.lineCode,
      allocatedCe: e.allocatedCe,
      allocatedCp: e.allocatedCp,
      fiscalYear: e.fiscalYear,
      notes: e.notes,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  static rowToDTO(row: Row): ProjectBudgetLinkDTO {
    return this.toDTO(this.fromSupabase(row));
  }

  static createToSupabase(dto: CreateProjectBudgetLinkDTO, userId?: string | null) {
    return {
      project_id: dto.projectId,
      ministry_code: dto.ministryCode ?? null,
      program_code: dto.programCode ?? null,
      action_code: dto.actionCode ?? null,
      chapter_code: dto.chapterCode ?? null,
      line_code: dto.lineCode ?? null,
      allocated_ce: dto.allocatedCe ?? 0,
      allocated_cp: dto.allocatedCp ?? 0,
      fiscal_year: dto.fiscalYear ?? 2026,
      notes: dto.notes ?? null,
      created_by: userId ?? null,
    };
  }

  static updateToSupabase(dto: Partial<CreateProjectBudgetLinkDTO>) {
    const out: Record<string, any> = {};
    if (dto.ministryCode !== undefined) out.ministry_code = dto.ministryCode;
    if (dto.programCode !== undefined) out.program_code = dto.programCode;
    if (dto.actionCode !== undefined) out.action_code = dto.actionCode;
    if (dto.chapterCode !== undefined) out.chapter_code = dto.chapterCode;
    if (dto.lineCode !== undefined) out.line_code = dto.lineCode;
    if (dto.allocatedCe !== undefined) out.allocated_ce = dto.allocatedCe;
    if (dto.allocatedCp !== undefined) out.allocated_cp = dto.allocatedCp;
    if (dto.fiscalYear !== undefined) out.fiscal_year = dto.fiscalYear;
    if (dto.notes !== undefined) out.notes = dto.notes;
    return out;
  }
}
