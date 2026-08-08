/**
 * ProjectWithPaymentsDTO
 * ----------------------
 * Vue projet enrichie (inspections + paiements récents) consommée par les
 * composants `ProjectStatusCard` et `InspectionDialog`.
 *
 * Conventions: camelCase strict côté UI/DTO. Les transformers
 * (`ProjectWithPaymentsTransformer`) assurent le mapping snake_case ↔ camelCase
 * au passage des frontières Adapter/Service.
 */
import type { BaseEntityDTO } from './BaseEntityDTO';

export type ProjectStatus =
  | 'en cours'
  | 'terminé'
  | 'en attente'
  | 'en inspection'
  | 'suspendu'
  | 'annulé'
  | 'attribué'
  | 'planifié'
  | 'en conception'
  | 'en construction'
  | 'en clôture'
  | 'en retard';

export type InspectionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'requires_changes'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface PaymentSummaryDTO {
  id: string;
  amount: number;
  paymentDate: string;
  contractorName?: string | null;
}

/**
 * Payload UI → Service pour créer une inspection (camelCase strict).
 *Id: string;
  date: string;
  status: InspectionStatus;
  inspectorId: string;
  inspectorName: string;
  progressAtInspection: number;
  comments?: string | null;
}

/**
 * Payload UI → Service pour mettre à jour le statut d'un projet.
 */
export interface UpdateProjectStatusng;
  progress: number;
  startDate: string;
  endDate?: string | null;
  budget?: number | null;
  location?: string | null;
  inspections: InspectionSummaryDTO[];
  payments: PaymentSummaryDTO[];
}