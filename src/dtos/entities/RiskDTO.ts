/**
 * Risk Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 */

import { BaseEntityDTO } from '../shared';

/**
 * Risk status enumeration
 * Current state of risk management
 */
export enum RiskStatus {
  IDENTIFIED = 'identified',
  MONITORED = 'monitored',
  MITIGATED = 'mitigated',
  RESOLVED = 'resolved',
  ACCEPTED = 'accepted'
}

/**
 * Risk category enumeration
 * Classification of risk types
 */
export enum RiskCategory {
  TECHNICAL = 'technical',
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  STRATEGIC = 'strategic',
  COMPLIANCE = 'compliance',
  SAFETY = 'safety'
}

/**
 * Risk level enumeration
 * Severity levels for risk assessment
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Risk probability enumeration
 * Likelihood of risk occurrence
 */
export enum RiskProbability {
  VERY_LOW = 0.1,
  LOW = 0.3,
  MEDIUM = 0.5,
  HIGH = 0.7,
  VERY_HIGH = 0.9
}

/**
 * Risk impact enumeration
 * Potential impact of risk occurrence
 */
export enum RiskImpact {
  VERY_LOW = 0.1,
  LOW = 0.3,
  MEDIUM = 0.5,
  HIGH = 0.7,
  VERY_HIGH = 0.9
}

/**
 * UI Label mappings for risk categories
 * Used by components for display purposes
 */
export const RISK_CATEGORY_LABELS = {
  [RiskCategory.TECHNICAL]: { label: 'Technique', color: 'bg-blue-100 text-blue-800' },
  [RiskCategory.FINANCIAL]: { label: 'Financier', color: 'bg-green-100 text-green-800' },
  [RiskCategory.OPERATIONAL]: { label: 'Opérationnel', color: 'bg-orange-100 text-orange-800' },
  [RiskCategory.STRATEGIC]: { label: 'Stratégique', color: 'bg-indigo-100 text-indigo-800' },
  [RiskCategory.COMPLIANCE]: { label: 'Conformité', color: 'bg-purple-100 text-purple-800' },
  [RiskCategory.SAFETY]: { label: 'Sécurité', color: 'bg-red-100 text-red-800' }
} as const;

/**
 * UI Label mappings for probability levels
 * Used by components for display purposes
 */
export const PROBABILITY_LABELS = {
  [RiskProbability.VERY_LOW]: 'Très faible',
  [RiskProbability.LOW]: 'Faible',
  [RiskProbability.MEDIUM]: 'Moyen',
  [RiskProbability.HIGH]: 'Élevé',
  [RiskProbability.VERY_HIGH]: 'Très élevé'
} as const;

/**
 * UI Label mappings for impact levels
 * Used by components for display purposes
 */
export const IMPACT_LABELS = {
  [RiskImpact.VERY_LOW]: 'Négligeable',
  [RiskImpact.LOW]: 'Mineur',
  [RiskImpact.MEDIUM]: 'Modéré',
  [RiskImpact.HIGH]: 'Majeur',
  [RiskImpact.VERY_HIGH]: 'Critique'
} as const;

/**
 * Main Risk DTO
 * Core risk data structure
 */
export interface RiskDTO extends BaseEntityDTO {
  // Core identification
  id: string;
  title: string;
  description?: string;
  
  // Classification
  category: RiskCategory;
  status: RiskStatus;
  
  // Risk assessment
  probability: number; // 0.0-1.0
  impact: number; // 0.0-1.0
  riskScore?: number; // probability * impact
  riskLevel?: RiskLevel;
  
  // Mitigation
  mitigationStrategy?: string;
  mitigationPlan?: string;
  mitigationStatus?: 'not_started' | 'in_progress' | 'completed';
  mitigationCost?: number;
  mitigationOwner?: string; // Employee ID only for DTO
  
  // Timeline
  identifiedDate?: string;
  assessmentDate?: string;
  nextReviewDate?: string;
  
  // Form data fields (merged from RiskFormDataDTO)
  riskType?: string;
  severity?: RiskLevel;
  affectedAreas?: string[];
  mitigationActions?: string[];
  contingencyPlan?: string;
  monitoringPlan?: string;
  reviewFrequency?: string;
  
  // Additional UI fields
  reviewDate?: string; // Date for risk review
  costs?: number; // Estimated costs for risk
  timelineImpact?: number; // Timeline impact in days
  
  resolutionDate?: string;
  
  // Relationships
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  relatedRisks?: string[]; // Risk IDs only for DTO
  
  // Assignment
  assignedTo?: string; // Employee ID only for DTO
  reviewer?: string; // Employee ID only for DTO - legacy
  owner?: string; // Employee ID only for DTO - primary risk owner
  ownerId?: string; // Employee ID (alias UI de `owner`)
  identifiedBy?: string; // Employee/user ID
  dueDate?: string; // Échéance de traitement du risque
  
  // Documentation
  documents?: string[]; // Document IDs only for DTO
  attachments?: string[]; // Document IDs only for DTO
  
  // Metadata
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Risk creation request interface
 * Input for creating new risks
 */
export interface CreateRiskDTO {
  title: string;
  description?: string;
  category: RiskCategory;
  probability: number; // 0.0-1.0
  impact: number; // 0.0-1.0
  mitigationStrategy?: string;
  mitigationPlan?: string;
  assignedTo?: string; // Employee ID only for DTO
  reviewer?: string; // Employee ID only for DTO
  owner?: string; // Employee ID only for DTO - primary risk owner
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  relatedRisks?: string[]; // Risk IDs only for DTO
  documents?: string[]; // Document IDs only for DTO
  attachments?: string[]; // Document IDs only for DTO
  tags?: string[];
  notes?: string;
  // Additional UI fields
  reviewDate?: string; // Date for risk review
  costs?: number; // Estimated costs for risk
  timelineImpact?: number; // Timeline impact in days
}

/**
 * Risk update request interface
 * Input for updating existing risks
 */
export interface UpdateRiskDTO {
  title?: string;
  description?: string;
  category?: RiskCategory;
  status?: RiskStatus;
  probability?: number; // 0.0-1.0
  impact?: number; // 0.0-1.0
  riskScore?: number;
  riskLevel?: RiskLevel;
  mitigationStrategy?: string;
  mitigationPlan?: string;
  mitigationStatus?: 'notStarted' | 'in_progress' | 'completed';
  mitigationCost?: number;
  mitigationOwner?: string; // Employee ID only for DTO
  reviewer?: string; // Employee ID only for DTO
  owner?: string; // Employee ID only for DTO - primary risk owner
  identifiedDate?: string;
  assessmentDate?: string;
  nextReviewDate?: string;
  resolutionDate?: string;
  assignedTo?: string; // Employee ID only for DTO
  relatedRisks?: string[]; // Risk IDs only for DTO
  documents?: string[]; // Document IDs only for DTO
  attachments?: string[]; // Document IDs only for DTO
  tags?: string[];
  notes?: string;
  // Additional UI fields
  reviewDate?: string; // Date for risk review
  costs?: number; // Estimated costs for risk
  timelineImpact?: number; // Timeline impact in days
  // Metadata
  updatedBy?: string;
  changeReason?: string;
}

/**
 * Risk summary interface
 * Lightweight risk representation for lists
 */
export interface RiskSummaryDTO extends BaseEntityDTO {
  id: string;
  title: string;
  category: RiskCategory;
  status: RiskStatus;
  riskLevel: RiskLevel;
  riskScore?: number;
  probability: number;
  impact: number;
  projectId?: string;
  phaseId?: string;
  assignedTo?: string; // Employee ID only for DTO
  isOverdue?: boolean;
  nextReviewDate?: string;
  tags?: string[];
  projectTitle?: string;
  phaseName?: string;
}

/**
 * Risk statistics interface
 * Performance metrics for risk management
 */
export interface RiskStatisticsDTO {
  totalRisks: number;
  activeRisks: number;
  mitigatedRisks: number;
  resolvedRisks: number;
  averageRiskScore?: number;
  highRiskCount: number;
  criticalRiskCount: number;
  byCategory: Record<RiskCategory, number>;
  byLevel: Record<RiskLevel, number>;
  byStatus: Record<RiskStatus, number>;
  averageMitigationTime?: number;
  lastUpdated?: string;
}

/**
 * Risk assessment interface
 * Detailed risk assessment data
 */
export interface RiskAssessmentDTO {
  riskId: string;
  assessedBy: string; // Employee ID only for DTO
  assessmentDate: string;
  methodology: string;
  criteria: Array<{
    name: string;
    weight: number;
    score: number;
    maxScore: number;
  }>;
  overallScore: number;
  recommendations: string[];
  nextAssessmentDate?: string;
  notes?: string;
}

/**
 * Risk mitigation interface
 * Risk mitigation tracking data
 */
export interface RiskMitigationDTO {
  riskId: string;
  mitigationPlan: string;
  assignedTo: string; // Employee ID only for DTO
  startDate?: string;
  targetDate?: string;
  completionDate?: string;
  status: 'planned' | 'inProgress' | 'completed' | 'cancelled';
  cost?: number;
  effectiveness?: 'low' | 'medium' | 'high';
  lessons?: string[];
  documents?: string[]; // Document IDs only for DTO
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Risk filter interface
 * Filter criteria for risk queries
 */
export interface RiskFilterDTO {
  projectId?: string;
  phaseId?: string;
  assignedTo?: string;
  category?: RiskCategory;
  status?: RiskStatus;
  riskLevel?: RiskLevel;
  probabilityRange?: {
    min: number;
    max: number;
  };
  impactRange?: {
    min: number;
    max: number;
  };
  searchQuery?: string;
  tags?: string[];
  isOverdue?: boolean;
  assessmentDateRange?: {
    startDate?: string;
    endDate?: string;
  };
}
// Moved from src/components/project/steps/EnhancedRiskAnalysisStep.tsx
export interface EnhancedRisk {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'financial' | 'environmental' | 'regulatory' | 'operational' | 'security' | 'healthSafety' | 'quality' | 'schedule' | 'resource' | 'stakeholder';
  probability: number; // 1-10 scale
  impact: number; // 1-10 scale
  riskScore: number; // probability * impact * weight
  weight: number; // Category weight
  mitigationPlan: string;
  contingencyPlan: string;
  status: 'identified' | 'assessed' | 'mitigated' | 'monitoring' | 'closed' | 'escalated';
  owner: string;
  reviewDate: string;
  costs: number;
  timelineImpact: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  affectedPhases: string[];
  riskResponse: 'accept' | 'mitigate' | 'transfer' | 'avoid';
  lastUpdated: string;
}

// Moved from src/hooks/hexagonal/index.ts
export interface ProjectRisk {
  id: string;
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  category: string;
  mitigation?: string;
  status: 'active' | 'mitigated' | 'closed';
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// Moved from src/application/services/RiskService.ts
export interface CreateRiskRequest {
  projectId: string;
  title: string;
  description?: string;
  probability: number;
  impact: number;
  category?: string;
  mitigationStrategy?: string;
  identifiedBy?: string;
}

// Moved from src/application/services/RiskService.ts
export interface UpdateRiskRequest {
  title?: string;
  description?: string;
  probability?: number;
  impact?: number;
  status?: string;
  category?: string;
  mitigationStrategy?: string;
}
// Moved from src/dtos/entities/AdvancedTenderEstimateDTO.ts (reconciled)
export interface RiskFactorDTO {
  type: 'amount' | 'validityPeriod' | 'itemCount' | 'expiry' | 'currency' | 'market';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impactScore: number;
  mitigationSuggestion: string;
}

// Moved from src/dtos/entities/ContractDTO.ts (reconciled)
export interface ContractRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  financialRisk: 'low' | 'medium' | 'high' | 'critical';
  operationalRisk: 'low' | 'medium' | 'high' | 'critical';
  complianceRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: Array<{
    factor: string;
    level: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string;
  }>;
  lastAssessed: string;
}

// Moved from src/dtos/entities/ProjectAnalyticsDTO.ts (reconciled)
export interface CreateProjectRiskRequestDTO {
  projectId: string;
  riskTitle: string;
  riskDescription: string;
  riskCategory: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigationStrategy: string;
  targetResolutionDate?: string;
  assignedTo?: string;
}

// Moved from src/dtos/entities/ProjectAnalyticsDTO.ts (reconciled)
export interface UpdateProjectRiskRequestDTO {
  riskTitle?: string;
  riskDescription?: string;
  riskCategory?: string;
  probability?: 'low' | 'medium' | 'high';
  impact?: 'low' | 'medium' | 'high';
  mitigationStrategy?: string;
  status?: 'active' | 'mitigated' | 'closed';
  targetResolutionDate?: string;
  assignedTo?: string;
}

// Moved from src/dtos/entities/ReportDTO.ts (reconciled)
export interface RiskAssessmentDTO {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  risks: RiskDTO[];
  mitigationStrategies: MitigationStrategyDTO[];
}

// Moved from src/dtos/entities/ReportDTO.ts (reconciled)
export interface RiskItemDTO {
  id: string;
  category: 'financial' | 'technical' | 'environmental' | 'regulatory' | 'schedule';
  description: string;
  probability: number; // 0-100
  impact: number; // 0-100
  riskScore: number; // probability * impact
  status: 'identified' | 'assessed' | 'mitigated' | 'closed';
}

// Moved from src/dtos/entities/ReportDTO.ts (reconciled)
export interface IdentifiedRiskDTO {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  riskScore: number;
  status: 'identified' | 'mitigated' | 'accepted' | 'monitoring';
  identifiedDate: string;
  mitigation?: MitigationStrategyDTO;
}

// Moved from src/dtos/entities/ReportDTO.ts (reconciled)
export interface RiskMatrixDTO {
  low: string[];
  medium: string[];
  high: string[];
  critical: string[];
  overallStrategy: string;
}
