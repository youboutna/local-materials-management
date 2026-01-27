/**
 * Tender DTO - Data Transfer Object for Tender Entity
 * Following hexagonal architecture principles
 */

import { BaseEntityDTO } from './BaseEntityDTO';
import { TenderStatus, SelectionMode, MarketType, EvaluationCriteria } from '@/domain/entities/Tender';

export interface TenderDTO extends BaseEntityDTO {
  // Basic Information
  projectId: string | null;
  title: string;
  description: string | null;
  tenderNumber: string | null;
  status: TenderStatus;
  
  // Tender Configuration
  selectionMode: SelectionMode | null;
  marketType: MarketType | null;
  financingSource: string | null;
  projectReference: string | null;
  
  // Dates
  publicationDate: string | null;
  deadlineDate: string | null;
  submissionDeadline: string | null;
  launchDate: string | null;
  attributionDate: string | null;
  
  // Budget Information
  budgetMin: number | null;
  budgetMax: number | null;
  estimatedValue: number | null;
  contractDuration: number | null;
  
  // Evaluation Configuration
  evaluationCriteria: EvaluationCriteria[];
  eligibilityRequirements: string[];
  evaluationDeadline: string | null;
  awardCriteria: string | null;
  
  // Workflow Information
  currentPhase: number | null;
  currentStage: string | null;
  tenderCategory: string | null;
  
  // Additional Fields
  procurementType: string | null;
  weight: number | null;
}

export interface TenderCreateDTO {
  projectId?: string;
  title: string;
  description?: string;
  tenderNumber?: string;
  selectionMode?: SelectionMode;
  marketType?: MarketType;
  deadlineDate?: string;
  budgetMin?: number;
  budgetMax?: number;
  evaluationCriteria?: EvaluationCriteria[];
  eligibilityRequirements?: string[];
  procurementType?: string;
  tenderCategory?: string;
}

export interface TenderUpdateDTO {
  title?: string;
  description?: string;
  status?: TenderStatus;
  selectionMode?: SelectionMode;
  marketType?: MarketType;
  financingSource?: string;
  projectReference?: string;
  publicationDate?: string;
  deadlineDate?: string;
  submissionDeadline?: string;
  launchDate?: string;
  attributionDate?: string;
  budgetMin?: number;
  budgetMax?: number;
  estimatedValue?: number;
  contractDuration?: number;
  evaluationCriteria?: EvaluationCriteria[];
  eligibilityRequirements?: string[];
  evaluationDeadline?: string;
  awardCriteria?: string;
  currentPhase?: number;
  currentStage?: string;
  tenderCategory?: string;
  procurementType?: string;
  weight?: number;
}

export interface TenderListDTO {
  id: string;
  title: string;
  status: TenderStatus;
  selectionMode: SelectionMode | null;
  marketType: MarketType | null;
  deadlineDate: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenderSummaryDTO {
  id: string;
  title: string;
  status: TenderStatus;
  deadlineDate: string | null;
  daysUntilDeadline: number | null;
  isOverdue: boolean;
  budgetRange: string;
  submissionCount: number;
  createdAt: string;
}
