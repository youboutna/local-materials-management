/**
 * Repositories Module
 * 
 * Clean Architecture with Repository Pattern:
 * - Interfaces define contracts
 * - Adapters implement for specific data sources
 * - Factory creates instances based on configuration
 * 
 * This allows easy migration to different backends:
 * - Supabase (current)
 * - Java Spring Boot API
 * - Prisma ORM
 * - PostGIS for spatial data
 */

export * from './interfaces';
export * from './adapters';
export * from './RepositoryFactory';
