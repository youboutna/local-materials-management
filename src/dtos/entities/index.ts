/**
 * DTOs Index - Centralized DTO Definitions
 * Following hexagonal architecture principles from PROMPTS.md
 * Rule #4: No DTOs in entities, proper type separation
 * Rule #5: UI layer can have state and display calculations
 */

// Core Entity DTOs
export * from './ProjectDTO';
export * from './UserDTO';
export * from './EmployeeDTO';
export * from './SupplierDTO';
export * from './MaterialDTO';
export * from './PaymentDTO';
export * from './DocumentDTO';
export * from './TaskDTO';
export * from './PhaseDTO';
export * from './MilestoneDTO';
export * from './InspectionDTO';
export * from './RiskDTO';
export * from './StakeholderDTO';
export * from './TenderDTO';

// Extended Entity DTOs
export * from './TenderEstimateDTO';
export * from './TenderDocumentDTO';
export * from './TenderSubmissionDTO';
export * from './PerformanceMonitoringDTO';
export * from './WorkspaceDTO';
export * from './CertificationDTO';
export * from './ParsedInvoiceDTO';
export * from './UserRoleDTO';
export * from './TemplateDTO';
export * from './HierarchyDTO';
export * from './PositionDTO';
export * from './AuthUserDTO';
export * from './UserProfileDTO';
export * from './ProjectStakeholderDTO';

// Specialized DTOs
export * from './InspectionPermissionDTO';
export * from './AlertDTO';
export * from './AuthDTO';
export * from './AutomaticDecompteDTO';
export * from './VerificationItemDTO';
export * from './CheckpointDTO';
export * from './CheckpointVerificationResultDTO';
export * from './MauritaniaBusinessRulesDTO';

// Shared utilities and common interfaces
export * from '../shared';
