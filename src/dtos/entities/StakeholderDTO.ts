/**
 * Stakeholder Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 */

import { BaseEntityDTO } from '../shared';

/**
 * Stakeholder type enumeration
 * Classification of stakeholder types
 */
export enum StakeholderType {
  EMPLOYEE = 'employee',
  EXTERNAL = 'external',
  PRINCIPAL_CONTRACTOR = 'principal_contractor',
  CLIENT = 'client',
  VENDOR = 'vendor',
  PARTNER = 'partner',
  REGULATOR = 'regulator',
  INVESTOR = 'investor'
}

/**
 * Stakeholder entity type enumeration
 * Type of entity the stakeholder represents
 */
export enum StakeholderEntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  DEPARTMENT = 'department',
  TEAM = 'team'
}

/**
 * Stakeholder role enumeration
 * Common stakeholder roles
 */
export enum StakeholderRole {
  PROJECT_MANAGER = 'project_manager',
  TEAM_LEAD = 'team_lead',
  DEVELOPER = 'developer',
  DESIGNER = 'designer',
  ANALYST = 'analyst',
  TESTER = 'tester',
  ARCHITECT = 'architect',
  CONSULTANT = 'consultant',
  SPONSOR = 'sponsor',
  CLIENT = 'client',
  VENDOR = 'vendor',
  CONTRACTOR = 'contractor',
  STAKEHOLDER = 'stakeholder'
}

/**
 * Main Stakeholder DTO
 * Core stakeholder data structure
 */
export interface StakeholderDTO extends BaseEntityDTO {
  // Core identification
  id: string;
  name: string;
  email?: string;
  phone?: string;
  
  // Classification
  stakeholderType: StakeholderType;
  entityType: StakeholderEntityType;
  role: StakeholderRole;
  
  // Project relationship
  projectId: string;
  isPrimary: boolean;
  isInternal: boolean;
  
  // Organizational details
  organizationId?: string;
  employeeId?: string;
  department?: string;
  position?: string; // Added for UI needs
  organization?: string; // Added for UI needs
  
  // Responsibilities and scope
  responsibilities?: string[];
  scope?: string;
  influence?: 'low' | 'medium' | 'high' | 'critical';
  accessLevel?: 'read' | 'write' | 'admin'; // Added for UI needs
  
  // Contract and engagement
  contractType?: string;
  startDate?: string;
  endDate?: string;
  hourlyRate?: number;
  budgetAllocation?: number;
  
  // Communication preferences
  preferredContactMethod?: 'email' | 'phone' | 'meeting' | 'portal';
  communicationFrequency?: 'daily' | 'weekly' | 'monthly' | 'as_needed';
  
  // Status and activity
  isActive: boolean;
  engagementLevel?: 'low' | 'medium' | 'high';
  lastContactDate?: string;
  
  // Contact information (structured)
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
  }; // Added for UI needs
  
  // Metadata
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Stakeholder creation request interface
 * Input for creating new stakeholders
 */
export interface CreateStakeholderDTO {
  id?: string; // Added missing field for component usage
  name: string;
  email?: string;
  phone?: string;
  stakeholderType: StakeholderType;
  entityType: StakeholderEntityType;
  role: StakeholderRole;
  projectId: string;
  isPrimary?: boolean;
  isInternal?: boolean;
  organizationId?: string;
  employeeId?: string;
  department?: string;
  position?: string; // Added for UI needs
  organization?: string; // Added for UI needs
  responsibilities?: string[];
  scope?: string;
  influence?: 'low' | 'medium' | 'high' | 'critical';
  accessLevel?: 'read' | 'write' | 'admin'; // Added for UI needs
  contractType?: string;
  startDate?: string;
  endDate?: string;
  hourlyRate?: number;
  budgetAllocation?: number;
  preferredContactMethod?: 'email' | 'phone' | 'meeting' | 'portal';
  communicationFrequency?: 'daily' | 'weekly' | 'monthly' | 'as_needed';
  notes?: string;
  tags?: string[];
  isActive?: boolean; // Added missing field
  
  // Contact information (structured)
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
  }; // Added for UI needs
}

/**
 * Stakeholder update request interface
 * Input for updating existing stakeholders
 */
export interface UpdateStakeholderDTO {
  name?: string;
  email?: string;
  phone?: string;
  stakeholderType?: StakeholderType;
  entityType?: StakeholderEntityType;
  role?: StakeholderRole;
  isPrimary?: boolean;
  isInternal?: boolean;
  organizationId?: string;
  employeeId?: string;
  department?: string;
  position?: string; // Added for UI needs
  organization?: string; // Added for UI needs
  responsibilities?: string[];
  scope?: string;
  influence?: 'low' | 'medium' | 'high' | 'critical';
  accessLevel?: 'read' | 'write' | 'admin'; // Added for UI needs
  contractType?: string;
  startDate?: string;
  endDate?: string;
  hourlyRate?: number;
  budgetAllocation?: number;
  preferredContactMethod?: 'email' | 'phone' | 'meeting' | 'portal';
  communicationFrequency?: 'daily' | 'weekly' | 'monthly' | 'as_needed';
  engagementLevel?: 'low' | 'medium' | 'high';
  lastContactDate?: string;
  notes?: string;
  tags?: string[];
  
  // Metadata
  updatedBy?: string;
  changeReason?: string;
  isActive?: boolean; // Added missing field
  
  // Contact information (structured)
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
  }; // Added for UI needs
}

/**
 * Stakeholder summary interface
 * Lightweight stakeholder representation for lists
 */
export interface StakeholderSummaryDTO extends BaseEntityDTO {
  id: string;
  name: string;
  stakeholderType: StakeholderType;
  role: StakeholderRole;
  projectId: string;
  isPrimary: boolean;
  isActive: boolean;
  engagementLevel?: 'low' | 'medium' | 'high';
  influence?: 'low' | 'medium' | 'high' | 'critical';
  lastContactDate?: string;
  email?: string;
  projectTitle?: string;
}

/**
 * Stakeholder statistics interface
 * Performance metrics for stakeholder management
 */
export interface StakeholderStatisticsDTO {
  totalStakeholders: number;
  activeStakeholders: number;
  internalStakeholders: number;
  externalStakeholders: number;
  primaryStakeholders: number;
  byType: Record<StakeholderType, number>;
  byRole: Record<StakeholderRole, number>;
  byEngagementLevel: Record<string, number>;
  averageEngagementScore?: number;
  lastUpdated?: string;
}

/**
 * Stakeholder communication interface
 * Communication tracking for stakeholders
 */
export interface StakeholderCommunicationDTO {
  id: string;
  stakeholderId: string;
  projectId: string;
  type: 'email' | 'phone' | 'meeting' | 'portal' | 'document';
  subject?: string;
  content?: string;
  direction: 'inbound' | 'outbound';
  date: string;
  duration?: number; // in minutes for meetings/calls
  participants?: string[]; // Stakeholder IDs only for DTO
  attachments?: string[]; // Document IDs only for DTO
  followUpRequired?: boolean;
  followUpDate?: string;
  createdById?: string;
  createdAt: string;
}

export interface ProjectWithStakeholdersDTO extends BaseEntityDTO {
  id: string;
  title: string;
  status: string;
  progress: number;
  budget: number;
  stakeholders: StakeholderDTO[];
}

export interface StakeholderFilterDTO {
  projectId?: string;
  stakeholderType?: StakeholderType;
  stakeholderEntityType?: StakeholderEntityType;
  isActive?: boolean;
  searchQuery?: string;
}

// Legacy compatibility types from transforms
export interface CreateStakeholderRequestDTO {
  name: string;
  email?: string;
  phone?: string;
  role: string;
  organization?: string;
  projectId?: string;
  type: 'employee' | 'supplier' | 'client' | 'other';
}

export interface UpdateStakeholderRequestDTO {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  organization?: string;
  type?: 'employee' | 'supplier' | 'client' | 'other';
}

export interface StakeholderFormDataDTO {
  stakeholderType: 'employee' | 'external';
  entityId: string;
  role: string;
  isPrimary: boolean;
  isInternal: boolean;
  name: string;
  email?: string;
  phone?: string;
  organizationId?: string;
  employeeId?: string;
}

export interface StakeholderResponseDTO extends StakeholderDTO {
  employeeDetails?: {
    id: string;
    fullName: string;
    position: string;
    department: string;
  };
  supplierDetails?: {
    id: string;
    name: string;
    category: string;
    rating: number;
  };
  projectCount?: number;
  totalHours?: number;
  averageRate?: number;
}

export interface StakeholderContactDTO {
  id: string;
  stakeholderId: string;
  contactType: 'email' | 'phone' | 'address';
  value: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface StakeholderOrganizationDTO {
  id: string;
  name: string;
  type: string;
  industry?: string;
  size?: string;
  address?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface StakeholderServiceResult<T = StakeholderResponseDTO> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type StakeholderListResult = StakeholderServiceResult<StakeholderResponseDTO[]>;
