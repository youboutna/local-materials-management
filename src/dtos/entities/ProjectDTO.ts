/**
 * Project Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO, ContactInfoDTO, LocationDTO } from '../shared';
import { ProjectStatus } from '@/types/project';

export interface ProjectDTO extends BaseEntityDTO {
  title: string;
  description: string;
  location: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  endDate?: string;
  thumbnail: string;
  teamSize: number;
  coordinates?: LocationDTO;
  
  // Localization fields
  localisation?: any[];
  forme?: string;
  adresse?: string | any;
  
  // Location-specific fields
  geographicZone?: string;
  terrainType?: string;
  environmentalConstraints?: string;
  hasUtilities?: boolean;
  requiresPermits?: boolean;
  
  // Classification
  category?: string;
  subCategory?: string;
  priorityLevel?: 'Faible' | 'Moyenne' | 'Élevée' | 'Très élevée';
  riskLevel?: 'Faible' | 'Moyen' | 'Élevé' | 'Critique';
  environmentalImpact?: 'Nul' | 'Faible' | 'Modéré' | 'Élevé';
  sustainabilityScore?: number;
  
  financingSource?: string;
  marketType?: string;
  selectionMode?: string;
  launchDate?: string;
  attributionDate?: string;
  projectResponsableId?: string;
  mainContractor?: string;
  projectReference?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  currentPhase?: string;
  currentStage?: string;
}

export interface ProjectSummaryDTO extends ProjectDTO {
  tasksCount: number;
  risksCount: number;
  inspectionsCount: number;
  paymentsCount: number;
  phasesCount: number;
  lastActivity?: string;
}

export interface ProjectDetailDTO extends ProjectDTO {
  tasks: any[];
  risks: any[];
  resources: any[];
  inspections: any[];
  plannedPhases: any[];
  expenses: any[];
  alerts?: any[];
  insurancePolicies?: any[];
  methodology?: 'waterfall' | 'agile' | 'hybrid';
  ganttChart?: any;
  pertAnalysis?: any;
  earnedValueManagement?: any;
  contacts?: any[];
  constructionMilestones?: any[];
  milestones?: any[];
  documents?: any[];
  stakeholders?: any[];
  escalationThresholds?: {
    alert: number;
    notification: number;
    guarantee: number;
    legal: number;
  };
  checkScheduleLastRun?: any;
}

export interface ProjectFormDTO {
  id?: string;
  title: string;
  description: string;
  location: string;
  budget: number;
  startDate: string;
  endDate?: string;
  teamSize: number;
  coordinates?: LocationDTO;
  
  // Location-specific fields
  geographicZone?: string;
  terrainType?: string;
  environmentalConstraints?: string;
  hasUtilities?: boolean;
  requiresPermits?: boolean;
  
  // Classification
  category?: string;
  subCategory?: string;
  priorityLevel?: 'Faible' | 'Moyenne' | 'Élevée' | 'Très élevée';
  riskLevel?: 'Faible' | 'Moyen' | 'Élevé' | 'Critique';
  environmentalImpact?: 'Nul' | 'Faible' | 'Modéré' | 'Élevé';
  sustainabilityScore?: number;
  
  financingSource?: string;
  marketType?: string;
  selectionMode?: string;
  launchDate?: string;
  attributionDate?: string;
  projectResponsableId?: string;
  mainContractor?: string;
  projectReference?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  
  // Additional data (for import only)
  status?: string;
  progress?: number;
  thumbnail?: string;
  milestones?: any[];
  documents?: any[];
  stakeholders?: any[];
  inspections?: any[];
  risks?: any[];
  tasks?: any[];
  payments?: any[];
  phases?: any[];
  plannedPhases?: any[];
  constructionMilestones?: any[];
  expenses?: any[];
  resources?: any[];
}

export interface ProjectListItemDTO extends BaseEntityDTO {
  title: string;
  location: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  endDate?: string;
  thumbnail: string;
  teamSize: number;
  coordinates?: LocationDTO;
}

export interface CreateProjectDTO extends Omit<ProjectDTO, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdateProjectDTO extends Partial<CreateProjectDTO> {}
