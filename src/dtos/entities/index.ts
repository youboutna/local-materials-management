/**
 * Entity DTOs Index
 * Centralized DTOs for all domain entities
 * Follows hexagonal architecture principles
 */

// Re-export shared DTOs and utilities
export * from '../shared';

// Entity DTOs - Single source of truth
export * from './ProjectDTO';
export * from './InspectionDTO';
export * from './MaterialDTO';
export * from './SupplierDTO';
export * from './PaymentDTO';
export * from './TaskDTO';
export * from './EmployeeDTO';
export * from './AlertDTO';
export * from './AuthDTO';

// DTOs nouvellement migrés (critiques pour décomptes)
export * from './AutomaticDecompteDTO';
export * from './VerificationItemDTO';
export * from './CheckpointDTO';
export * from './CheckpointVerificationResultDTO';
export * from './MilestoneDTO';
export * from './MauritaniaBusinessRulesDTO';
