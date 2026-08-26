/**
 * PhaseAggregateDTO — point de vérité unique consommé par TOUS les onglets d'une
 * phase (Ressources, Équipe, Finances, Jalons, Intervenants).
 *
 * Il agrège, sans saisie manuelle :
 *   - la chaîne documentaire (DQE → Devis) via `boq_lines` filtrées sur la phase,
 *   - la doctrine financière (Budget → Engagé → Dépensé → Payé → Restant),
 *   - les intervenants rattachés au projet / à la phase,
 *   - la main d'œuvre planifiée (DQE) et déclarée (phase_employees).
 */
import type { PhasePlannedResourcesDTO, PhaseResourceLineDTO } from './PhasePlannedResourcesDTO';
import type { ProjectFinancialDTO } from './ProjectFinancialDTO';

/** Provenance dominante des données de la phase. */
export type PhaseDataSource = 'devis' | 'dqe' | 'manuel' | 'aucune';

export interface PhaseStakeholderRefDTO {
  id: string;
  name: string;
  /** Code métier (stakeholder_type) — à traduire côté UI via useI18n. */
  roleCode: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  isInternal: boolean;
  /** Rattachement direct à la phase (sinon héritage projet). */
  scopedToPhase: boolean;
}

export interface PhaseTeamMemberDTO {
  id: string;
  name: string;
  role: string;
  /** `dqe` = ligne de main d'œuvre du bordereau ; `manuel` = saisie phase_employees. */
  origin: 'dqe' | 'manuel';
  quantity: number | null;
  unit: string | null;
  dailyRate: number | null;
  totalCost: number;
  locked: boolean;
}

export interface PhaseAggregateDTO {
  projectId: string;
  phaseId: string;
  /** Provenance dominante : devis accepté > DQE > saisie manuelle. */
  source: PhaseDataSource;
  /** Vrai dès qu'au moins une ligne de bordereau est rattachée à la phase. */
  linkedToBoq: boolean;

  currency: string;
  /** Budget de référence (DQE validé sinon budget déclaré de la phase). */
  totalPlanned: number;
  totalEngaged: number;
  totalSpent: number;
  totalPaid: number;
  remaining: number;
  remainingToPay: number;
  /** Synthèse financière doctrinale complète (traçabilité de la source). */
  financials: ProjectFinancialDTO;

  resources: PhasePlannedResourcesDTO;
  /** Lignes de main d'œuvre issues du bordereau (source de l'onglet Équipe). */
  laborLines: PhaseResourceLineDTO[];
  team: PhaseTeamMemberDTO[];
  stakeholders: PhaseStakeholderRefDTO[];

  counts: {
    materials: number;
    equipment: number;
    labor: number;
    team: number;
    stakeholders: number;
  };
}

export const emptyPhaseAggregate = (
  projectId: string,
  phaseId: string,
  currency = 'MRU',
): PhaseAggregateDTO => ({
  projectId,
  phaseId,
  source: 'aucune',
  linkedToBoq: false,
  currency,
  totalPlanned: 0,
  totalEngaged: 0,
  totalSpent: 0,
  totalPaid: 0,
  remaining: 0,
  remainingToPay: 0,
  financials: {
    scope: 'phase',
    entityId: phaseId,
    currency,
    budgetTotal: 0,
    budgetSource: 'none',
    engaged: 0,
    spent: 0,
    paid: 0,
    remainingToPay: 0,
    remaining: 0,
    consumptionRate: 0,
    engagementRate: 0,
    decompteCount: 0,
    validatedDecompteCount: 0,
    pendingDecompteCount: 0,
  },
  resources: {
    projectId,
    phaseId,
    materials: { family: 'material', lines: [], count: 0, plannedCost: 0, engagedCost: 0 },
    equipment: { family: 'equipment', lines: [], count: 0, plannedCost: 0, engagedCost: 0 },
    labor: { family: 'labor', lines: [], count: 0, plannedCost: 0, engagedCost: 0 },
    totals: { plannedCost: 0, engagedCost: 0, lineCount: 0 },
    chain: {
      hasDqe: false,
      dqeValidated: false,
      tenderPublished: false,
      quotesReceived: 0,
      quoteAccepted: false,
      acceptedTotalHt: 0,
    },
    linkedToBoq: false,
  },
  laborLines: [],
  team: [],
  stakeholders: [],
  counts: { materials: 0, equipment: 0, labor: 0, team: 0, stakeholders: 0 },
});
