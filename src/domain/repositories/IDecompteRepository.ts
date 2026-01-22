/**
 * IDecompteRepository
 * 
 * Interface pour le calcul automatique des décomptes
 * Utilise les repositories existants : Project, Payment, Phase, Milestone, Inspection
 */

import {
  AutomaticDecompteDTO,
  DecompteLineDTO,
  DecompteStatus,
  PaymentType,
  MauritaniaBusinessRulesDTO,
} from '@/dtos/entities';
import { MilestoneDTO } from '@/dtos/entities';

// Types internes pour le calcul des décomptes
export interface ProjectFinancials {
  budget: number;
  totalPaid: number;
  totalRetentionHeld: number;
  paymentCount: number;
  allowsInitialPayment: boolean;
  initialPaymentPercentage: number;
}

export interface PhaseFinancials {
  id: string;
  phaseName: string;
  estimatedCost: number;
  totalPaid: number;
  progress: number;
  remainingBudget: number;
}

export interface VerifiedMilestone {
  id: string;
  title: string;
  weight: number;
  completedDate: string;
  phaseId: string;
  phaseEstimatedCost: number;
}

export interface DecompteCalculationContext {
  projectId: string;
  businessRules: MauritaniaBusinessRulesDTO;
  previousDecomptes: AutomaticDecompteDTO[];
  paidThresholds: number[];
  verifiedMilestones: VerifiedMilestone[];
  projectFinancials: ProjectFinancials;
  phaseFinancials: PhaseFinancials[];
}

export interface IDecompteRepository {
  // === Données Projet ===
  getProjectFinancials(projectId: string): Promise<ProjectFinancials>;
  
  // === Données Phase ===
  getPhaseFinancials(projectId: string): Promise<PhaseFinancials[]>;
  getPhaseData(phaseId: string): Promise<PhaseFinancials | null>;
  getPhaseMilestones(phaseId: string): Promise<MilestoneDTO[]>;
  
  // === Données Jalon ===
  getVerifiedMilestones(projectId: string): Promise<VerifiedMilestone[]>;
  
  // === Données Paiement ===
  getPreviousDecomptes(projectId: string, phaseId?: string): Promise<AutomaticDecompteDTO[]>;
  getPaidThresholds(projectId: string): Promise<number[]>;
  
  // === Données Inspection ===
  hasApprovedInspectionForThreshold(projectId: string, threshold: number): Promise<boolean>;
  
  // === Calcul Décompte ===
  calculateDecompte(context: DecompteCalculationContext): Promise<AutomaticDecompteDTO>;
  validateDecompte(decompte: AutomaticDecompteDTO): Promise<boolean>;
  saveDecompte(decompte: AutomaticDecompteDTO): Promise<AutomaticDecompteDTO>;
}
