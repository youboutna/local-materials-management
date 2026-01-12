/**
 * Repository Factory
 * Creates repository instances based on configuration
 * Allows easy switching between adapters (Supabase, Java API, Prisma, etc.)
 */

import { IMilestoneRepository } from './interfaces/IMilestoneRepository';
import { SupabaseMilestoneAdapter } from './adapters/SupabaseMilestoneAdapter';
import { IProjectRepository, IPhaseRepository, IHierarchyRepository } from '@/domain/repositories';
import { 
  SupabaseProjectAdapter, 
  SupabasePhaseAdapter, 
  SupabaseHierarchyAdapter 
} from '@/infrastructure';

export type DataSourceType = 'supabase' | 'java_api' | 'prisma' | 'postgis';

// Default data source - can be changed via configuration
let currentDataSource: DataSourceType = 'supabase';

export function setDataSource(source: DataSourceType): void {
  currentDataSource = source;
}

export function getDataSource(): DataSourceType {
  return currentDataSource;
}

// ============= Singleton Instances =============
let milestoneRepositoryInstance: IMilestoneRepository | null = null;
let projectRepositoryInstance: IProjectRepository | null = null;
let phaseRepositoryInstance: IPhaseRepository | null = null;
let hierarchyRepositoryInstance: IHierarchyRepository | null = null;

// ============= Factory Methods =============

export function getMilestoneRepository(): IMilestoneRepository {
  switch (currentDataSource) {
    case 'supabase':
    default:
      return new SupabaseMilestoneAdapter();
  }
}

export function getProjectRepository(): IProjectRepository {
  switch (currentDataSource) {
    case 'supabase':
    default:
      return new SupabaseProjectAdapter();
  }
}

export function getPhaseRepository(): IPhaseRepository {
  switch (currentDataSource) {
    case 'supabase':
    default:
      return new SupabasePhaseAdapter();
  }
}

export function getHierarchyRepository(): IHierarchyRepository {
  switch (currentDataSource) {
    case 'supabase':
    default:
      return new SupabaseHierarchyAdapter();
  }
}

// ============= Singleton Getters =============

export function getMilestoneRepositorySingleton(): IMilestoneRepository {
  if (!milestoneRepositoryInstance) {
    milestoneRepositoryInstance = getMilestoneRepository();
  }
  return milestoneRepositoryInstance;
}

export function getProjectRepositorySingleton(): IProjectRepository {
  if (!projectRepositoryInstance) {
    projectRepositoryInstance = getProjectRepository();
  }
  return projectRepositoryInstance;
}

export function getPhaseRepositorySingleton(): IPhaseRepository {
  if (!phaseRepositoryInstance) {
    phaseRepositoryInstance = getPhaseRepository();
  }
  return phaseRepositoryInstance;
}

export function getHierarchyRepositorySingleton(): IHierarchyRepository {
  if (!hierarchyRepositoryInstance) {
    hierarchyRepositoryInstance = getHierarchyRepository();
  }
  return hierarchyRepositoryInstance;
}

export function resetRepositoryInstances(): void {
  milestoneRepositoryInstance = null;
  projectRepositoryInstance = null;
  phaseRepositoryInstance = null;
  hierarchyRepositoryInstance = null;
}
