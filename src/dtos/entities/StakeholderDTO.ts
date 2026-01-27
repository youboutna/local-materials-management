/**
 * Stakeholder Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO } from '../shared';
import { StakeholderType, StakeholderEntityType } from '@/domain/entities/ProjectStakeholder';

export interface StakeholderDTO extends BaseEntityDTO {
  projectId: string;
  stakeholderType: StakeholderType;
  stakeholderEntityType: StakeholderEntityType;
  employeeId?: string;
  supplierId?: string;
  externalName?: string;
  externalEmail?: string;
  externalPhone?: string;
  roleDescription?: string;
  responsibilities?: string[];
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  hourlyRate?: number;
  contractType?: string;
  notes?: string;
}

export interface StakeholderSummaryDTO {
  id: string;
  projectId: string;
  stakeholderType: StakeholderType;
  displayName: string;
  isActive: boolean;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
}

export interface ProjectWithStakeholdersDTO extends BaseEntityDTO {
  id: string;
  title: string;
  status: string;
  progress: number;
  budget: number;
  stakeholders: StakeholderDTO[];
}

export type CreateStakeholderDTO = Omit<StakeholderDTO, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateStakeholderDTO = Partial<CreateStakeholderDTO>;

export interface StakeholderFilterDTO {
  projectId?: string;
  stakeholderType?: StakeholderType;
  stakeholderEntityType?: StakeholderEntityType;
  isActive?: boolean;
  searchQuery?: string;
}
