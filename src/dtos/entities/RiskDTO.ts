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
  
  resolutionDate?: string;
  
  // Relationships
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  relatedRisks?: string[]; // Risk IDs only for DTO
  
  // Assignment
  assignedTo?: string; // Employee ID only for DTO
  reviewer?: string; // Employee ID only for DTO
  
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
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  relatedRisks?: string[]; // Risk IDs only for DTO
  documents?: string[]; // Document IDs only for DTO
  attachments?: string[]; // Document IDs only for DTO
  tags?: string[];
  notes?: string;
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
  mitigationStatus?: 'not_started' | 'in_progress' | 'completed';
  mitigationCost?: number;
  mitigationOwner?: string; // Employee ID only for DTO
  reviewer?: string; // Employee ID only for DTO
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
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
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
