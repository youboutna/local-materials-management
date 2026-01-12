/**
 * Domain Layer Index
 * Central export point for all domain entities and repository interfaces
 * 
 * The domain layer contains:
 * - Entities: Core business objects with logic
 * - Repository Interfaces: Contracts for data access (ports)
 * 
 * No infrastructure dependencies allowed here!
 */

// Entities
export * from './entities';

// Repository Interfaces (Ports)
export * from './repositories';
