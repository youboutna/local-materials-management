/**
 * Repository Factory
 * Creates repository instances based on configuration
 * Allows easy switching between adapters (Supabase, Java API, Prisma, etc.)
 */

import { IMilestoneRepository } from './interfaces/IMilestoneRepository';
import { SupabaseMilestoneAdapter } from './adapters/SupabaseMilestoneAdapter';

export type DataSourceType = 'supabase' | 'java_api' | 'prisma' | 'postgis';

// Default data source - can be changed via configuration
let currentDataSource: DataSourceType = 'supabase';

export function setDataSource(source: DataSourceType): void {
  currentDataSource = source;
}

export function getDataSource(): DataSourceType {
  return currentDataSource;
}

/**
 * Get Milestone Repository instance based on current data source
 */
export function getMilestoneRepository(): IMilestoneRepository {
  switch (currentDataSource) {
    case 'supabase':
      return new SupabaseMilestoneAdapter();
    
    case 'java_api':
      // Future: return new JavaApiMilestoneAdapter();
      console.warn('Java API adapter not implemented, falling back to Supabase');
      return new SupabaseMilestoneAdapter();
    
    case 'prisma':
      // Future: return new PrismaMilestoneAdapter();
      console.warn('Prisma adapter not implemented, falling back to Supabase');
      return new SupabaseMilestoneAdapter();
    
    case 'postgis':
      // Future: return new PostGISMilestoneAdapter();
      console.warn('PostGIS adapter not implemented, falling back to Supabase');
      return new SupabaseMilestoneAdapter();
    
    default:
      return new SupabaseMilestoneAdapter();
  }
}

// Singleton instances for performance
let milestoneRepositoryInstance: IMilestoneRepository | null = null;

export function getMilestoneRepositorySingleton(): IMilestoneRepository {
  if (!milestoneRepositoryInstance) {
    milestoneRepositoryInstance = getMilestoneRepository();
  }
  return milestoneRepositoryInstance;
}

export function resetRepositoryInstances(): void {
  milestoneRepositoryInstance = null;
}
