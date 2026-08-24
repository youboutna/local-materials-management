/**
 * TenderLotTransformer - DB row (snake_case) <-> TenderLotRecord (camelCase)
 */
export type TenderLotStatus = 'draft' | 'published' | 'under_evaluation' | 'awarded' | 'cancelled';

export interface TenderLotRecord {
  id: string;
  tenderId: string;
  projectId?: string | null;
  number: number;
  title: string;
  description?: string | null;
  estimatedAmount?: number | null;
  linkedPhaseIds: string[];
  linkedStepIds: string[];
  requirements: string[];
  deliverables: string[];
  status: TenderLotStatus;
  awardedTo?: string | null;
  awardedSubmissionId?: string | null;
  awardedAt?: string | null;
  awardedAmount?: number | null;
}

const isUuid = (v: string | undefined | null): v is string =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export class TenderLotTransformer {
  static fromRow(row: any): TenderLotRecord {
    return {
      id: row.id,
      tenderId: row.tender_id,
      projectId: row.project_id ?? null,
      number: row.number ?? 1,
      title: row.title ?? '',
      description: row.description ?? null,
      estimatedAmount: row.estimated_amount ?? null,
      linkedPhaseIds: row.linked_phase_ids ?? [],
      linkedStepIds: row.linked_step_ids ?? [],
      requirements: row.requirements ?? [],
      deliverables: row.deliverables ?? [],
      status: (row.status ?? 'draft') as TenderLotStatus,
      awardedTo: row.awarded_to ?? null,
      awardedSubmissionId: row.awarded_submission_id ?? null,
      awardedAt: row.awarded_at ?? null,
      awardedAmount: row.awarded_amount ?? null,
    };
  }

  static toRow(lot: Partial<TenderLotRecord> & { tenderId: string }) {
    return {
      tender_id: lot.tenderId,
      project_id: isUuid(lot.projectId ?? undefined) ? lot.projectId : null,
      number: lot.number ?? 1,
      title: lot.title ?? '',
      description: lot.description ?? null,
      estimated_amount: lot.estimatedAmount ?? null,
      linked_phase_ids: (lot.linkedPhaseIds ?? []).filter(isUuid),
      linked_step_ids: (lot.linkedStepIds ?? []).filter(isUuid),
      requirements: lot.requirements ?? [],
      deliverables: lot.deliverables ?? [],
      status: lot.status ?? 'draft',
      awarded_to: lot.awardedTo ?? null,
      awarded_submission_id: isUuid(lot.awardedSubmissionId ?? undefined) ? lot.awardedSubmissionId : null,
      awarded_at: lot.awardedAt ?? null,
      awarded_amount: lot.awardedAmount ?? null,
    };
  }
}

