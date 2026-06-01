/**
 * TenderTransformer — bidirectional mapping between
 * Supabase row (snake_case) ↔ Domain Entity (camelCase) ↔ DTO (camelCase).
 *
 * Architecture: PROMPTS.md §RÈGLE #4. Every field in the public.tenders table
 * is round-tripped so UI forms hydrate and persist without silent loss.
 */

import {
  Tender,
  TenderStatus,
  SelectionMode,
  MarketType,
  EvaluationCriteria,
} from '@/domain/entities/Tender';
import { TenderDTO } from '@/dtos/entities/TenderDTO';

type TenderRow = Record<string, any>;

const toArray = <T>(value: unknown, fallback: T[] = []): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export class TenderTransformer {
  /** DB row → Domain entity */
  static fromSupabase(row: TenderRow): Tender {
    return new Tender(
      row.id,
      row.project_id ?? null,
      row.title,
      row.description ?? null,
      row.tender_number ?? null,
      (row.status as TenderStatus) ?? 'draft',
      (row.selection_mode as SelectionMode) ?? null,
      (row.market_type as MarketType) ?? null,
      row.financing_source ?? null,
      row.project_reference ?? null,
      row.publication_date ?? null,
      row.deadline_date ?? null,
      row.launch_date ?? null,
      row.attribution_date ?? null,
      toNumber(row.budget_min),
      toNumber(row.budget_max),
      toArray<EvaluationCriteria>(row.evaluation_criteria),
      toArray<string>(row.eligibility_requirements),
      row.created_at ?? new Date().toISOString(),
      row.updated_at ?? new Date().toISOString()
    );
  }

  /** Domain entity → DB row (UPDATE / INSERT payload) */
  static toSupabase(entity: Tender): TenderRow {
    return {
      id: entity.id,
      project_id: entity.projectId,
      title: entity.title,
      description: entity.description,
      tender_number: entity.tenderNumber,
      status: entity.status,
      selection_mode: entity.selectionMode,
      market_type: entity.marketType,
      financing_source: entity.financingSource,
      project_reference: entity.projectReference,
      publication_date: entity.publicationDate,
      deadline_date: entity.deadlineDate,
      launch_date: entity.launchDate,
      attribution_date: entity.attributionDate,
      budget_min: entity.budgetMin,
      budget_max: entity.budgetMax,
      evaluation_criteria: entity.evaluationCriteria,
      eligibility_requirements: entity.eligibilityRequirements,
    };
  }

  /** Domain entity → DTO (UI-ready camelCase) */
  static toDTO(entity: Tender): TenderDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      title: entity.title,
      description: entity.description,
      tenderNumber: entity.tenderNumber,
      status: entity.status,
      selectionMode: entity.selectionMode,
      marketType: entity.marketType,
      financingSource: entity.financingSource,
      projectReference: entity.projectReference,
      publicationDate: entity.publicationDate,
      deadlineDate: entity.deadlineDate,
      submissionDeadline: entity.deadlineDate,
      launchDate: entity.launchDate,
      attributionDate: entity.attributionDate,
      budgetMin: entity.budgetMin,
      budgetMax: entity.budgetMax,
      estimatedValue: null,
      contractDuration: null,
      evaluationCriteria: entity.evaluationCriteria,
      eligibilityRequirements: entity.eligibilityRequirements,
      evaluationDeadline: null,
      awardCriteria: null,
      currentPhase: null,
      currentStage: null,
      tenderCategory: null,
      procurementType: null,
      weight: null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /** Convenience: DB row → DTO (skip explicit entity step in read paths) */
  static rowToDTO(row: TenderRow): TenderDTO {
    return this.toDTO(this.fromSupabase(row));
  }

  /** DTO patch → DB partial (UPDATE payload) — only defined keys are emitted */
  static patchToSupabase(patch: Partial<TenderDTO>): TenderRow {
    const out: TenderRow = {};
    if (patch.projectId !== undefined) out.project_id = patch.projectId;
    if (patch.title !== undefined) out.title = patch.title;
    if (patch.description !== undefined) out.description = patch.description;
    if (patch.tenderNumber !== undefined) out.tender_number = patch.tenderNumber;
    if (patch.status !== undefined) out.status = patch.status;
    if (patch.selectionMode !== undefined) out.selection_mode = patch.selectionMode;
    if (patch.marketType !== undefined) out.market_type = patch.marketType;
    if (patch.financingSource !== undefined) out.financing_source = patch.financingSource;
    if (patch.projectReference !== undefined) out.project_reference = patch.projectReference;
    if (patch.publicationDate !== undefined) out.publication_date = patch.publicationDate;
    if (patch.deadlineDate !== undefined) out.deadline_date = patch.deadlineDate;
    if (patch.launchDate !== undefined) out.launch_date = patch.launchDate;
    if (patch.attributionDate !== undefined) out.attribution_date = patch.attributionDate;
    if (patch.budgetMin !== undefined) out.budget_min = patch.budgetMin;
    if (patch.budgetMax !== undefined) out.budget_max = patch.budgetMax;
    if (patch.evaluationCriteria !== undefined) out.evaluation_criteria = patch.evaluationCriteria;
    if (patch.eligibilityRequirements !== undefined) out.eligibility_requirements = patch.eligibilityRequirements;
    return out;
  }
}
