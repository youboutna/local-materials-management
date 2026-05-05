/**
 * ProjectWithPaymentsTransformer
 * ------------------------------
 * Mapping snake_case (DB / legacy aggregate) → camelCase
 * (`ProjectWithPaymentsDTO`). Conforme à la flèche sacrée:
 *   DB (snake_case) → Adapter → Transformer → DTO (camelCase) → UI
 */
import type {
  ProjectWithPaymentsDTO,
  InspectionSummaryDTO,
  PaymentSummaryDTO,
  InspectionStatus,
  CreateInspectionDTO,
  UpdateProjectStatusDTO,
} from '@/dtos/entities/ProjectWithPaymentsDTO';

/** Row snake_case prêt pour insert dans `inspections`. */
export interface InspectionInsertRow {
  project_id: string;
  date: string;
  status: string;
  inspector: string;
  progress_at_inspection: number;
  comments: string | null;
}

/** Patch snake_case prêt pour update dans `projects`. */
export interface ProjectStatusUpdateRow {
  status: string;
}

interface RawInspection {
  id: string;
  date?: string | null;
  inspection_date?: string | null;
  status?: string | null;
  inspector?: string | null;
  progress_at_inspection?: number | null;
  comments?: string | null;
}

interface RawPayment {
  id: string;
  amount: number;
  payment_date?: string | null;
  contractor_name?: string | null;
}

interface RawProjectWithPayments {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  progress?: number | null;
  start_date?: string | null;
  startDate?: string | null;
  end_date?: string | null;
  endDate?: string | null;
  budget?: number | null;
  location?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  inspections?: RawInspection[] | null;
  payments?: RawPayment[] | null;
}

export class ProjectWithPaymentsTransformer {
  static fromSupabase(row: RawProjectWithPayments): ProjectWithPaymentsDTO {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      status: row.status,
      progress: row.progress ?? 0,
      startDate: row.start_date ?? row.startDate ?? '',
      endDate: row.end_date ?? row.endDate ?? null,
      budget: row.budget ?? null,
      location: row.location ?? null,
      createdAt: row.created_at ?? '',
      updatedAt: row.updated_at ?? '',
      inspections: (row.inspections ?? []).map(ProjectWithPaymentsTransformer.toInspectionSummary),
      payments: (row.payments ?? []).map(ProjectWithPaymentsTransformer.toPaymentSummary),
    };
  }

  static toInspectionSummary(raw: RawInspection): InspectionSummaryDTO {
    return {
      id: raw.id,
      date: raw.date ?? raw.inspection_date ?? '',
      status: (raw.status ?? 'pending') as InspectionStatus,
      inspector: raw.inspector ?? null,
      progressAtInspection: raw.progress_at_inspection ?? null,
      comments: raw.comments ?? null,
    };
  }

  static toPaymentSummary(raw: RawPayment): PaymentSummaryDTO {
    return {
      id: raw.id,
      amount: Number(raw.amount ?? 0),
      paymentDate: raw.payment_date ?? '',
      contractorName: raw.contractor_name ?? null,
    };
  }

  /** UI camelCase → DB snake_case (insert inspection). */
  static toSupabaseInsert(dto: CreateInspectionDTO): InspectionInsertRow {
    return {
      project_id: dto.projectId,
      date: dto.date,
      status: dto.status,
      // L'adapter inspections stocke le nom (cf. SupabaseInspectionAdapter.mapToRow)
      inspector: dto.inspectorName || dto.inspectorId,
      progress_at_inspection: dto.progressAtInspection,
      comments: dto.comments ?? null,
    };
  }

  /** UI camelCase → DB snake_case (update project status). */
  static toSupabaseStatusUpdate(dto: UpdateProjectStatusDTO): ProjectStatusUpdateRow {
    return { status: String(dto.status) };
  }
}
