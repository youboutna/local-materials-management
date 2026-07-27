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


export * from './RiskDTO';

export * from './StakeholderDTO';

export * from './TenderDTO';

export * from './ComplianceDTO';



// Extended Entity DTOs

export * from './TenderEstimateDTO';



export * from './WorkspaceDTO';

export * from './InsuranceDTO';

export * from './InvoiceDTO';

export * from './HierarchyDTO';
export * from './UserDTO';

export * from './HierarchyMappingDTO';


// Specialized DTOs

export * from './InspectionPermissionDTO';

export * from './AlertDTO';

export * from './AuthDTO';

export * from './AutomaticDecompteDTO';

export * from './InspectionDTO';

export * from './CheckpointDTO';

export * from './CheckpointVerificationResultDTO';

export * from './NotificationDTO';


export * from './ContractDTO';

export * from './ProjectDTO';

export * from './SupplierPaymentDTO';

// Payment initiation DTOs
export * from './PaymentInitiationDTO';

// Material categories
export * from './MaterialCategoryDTO';

// Notification types
export * from './NotificationTypeDTO';

// Unified workflow
export * from './UnifiedWorkflowDTO';
// src/dtos/entities/index.ts
export * from './OAuthProviderDTO';

