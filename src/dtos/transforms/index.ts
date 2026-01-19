/**
 * Domain Transformers Index
 * Centralized exports for all domain transformers
 * Following hexagonal architecture principles
 */

// Core transformers
export { ProjectDomainTransformer } from './projectDomainTransform';
export { MaterialDomainTransformer } from './materialDomainTransform';
export { SupplierDomainTransformer } from './supplierDomainTransform';
export { EmployeeDomainTransformer } from './employeeDomainTransform';
export { DocumentDomainTransformer } from './documentDomainTransform';

// Enhanced transformers with calculations and business logic
export { PaymentDomainTransformer } from './paymentDomainTransform';
export { InspectionDomainTransformer } from './inspectionDomainTransform';
export { TaskDomainTransformer } from './taskDomainTransform';
export { PhaseDomainTransformer } from './phaseDomainTransform';
export { RiskDomainTransformer } from './riskDomainTransform';
export { TenderDomainTransformer } from './tenderDomainTransform';

// Newly created transformers for missing entities
export { StakeholderDomainTransformer } from './stakeholderDomainTransform';
export { BankGuaranteeDomainTransformer } from './bankGuaranteeDomainTransform';
export { InsuranceDomainTransformer } from './insuranceDomainTransform';
export { ContractDomainTransformer } from './contractDomainTransform';

// Re-export DTOs for convenience
export type { 
  ProjectResponseDto, 
  CreateProjectRequestDto, 
  UpdateProjectRequestDto 
} from './projectDomainTransform';

export type { 
  MaterialResponseDto, 
  CreateMaterialRequestDto, 
  UpdateMaterialRequestDto 
} from './materialDomainTransform';

export type { 
  SupplierResponseDto, 
  CreateSupplierRequestDto, 
  UpdateSupplierRequestDto 
} from './supplierDomainTransform';

export type { 
  EmployeeResponseDto, 
  CreateEmployeeRequestDto, 
  UpdateEmployeeRequestDto 
} from './employeeDomainTransform';

export type { 
  DocumentResponseDto, 
  CreateDocumentRequestDto, 
  UpdateDocumentRequestDto 
} from './documentDomainTransform';

export type { 
  PaymentResponseDto, 
  CreatePaymentRequestDto, 
  UpdatePaymentRequestDto 
} from './paymentDomainTransform';

export type { 
  InspectionResponseDto, 
  CreateInspectionRequestDto, 
  UpdateInspectionRequestDto 
} from './inspectionDomainTransform';

export type { 
  TaskResponseDto, 
  CreateTaskRequestDto, 
  UpdateTaskRequestDto 
} from './taskDomainTransform';

export type { 
  PhaseResponseDto, 
  CreatePhaseRequestDto, 
  UpdatePhaseRequestDto 
} from './phaseDomainTransform';

export type { 
  RiskResponseDto, 
  CreateRiskRequestDto, 
  UpdateRiskRequestDto 
} from './riskDomainTransform';

export type { 
  StakeholderResponseDto, 
  CreateStakeholderRequestDto, 
  UpdateStakeholderRequestDto 
} from './stakeholderDomainTransform';

export type { 
  BankGuaranteeResponseDto, 
  CreateBankGuaranteeRequestDto, 
  UpdateBankGuaranteeRequestDto 
} from './bankGuaranteeDomainTransform';

export type { 
  InsurancePolicyResponseDto, 
  CreateInsurancePolicyRequestDto, 
  UpdateInsurancePolicyRequestDto 
} from './insuranceDomainTransform';

export type { 
  ContractResponseDto, 
  CreateContractRequestDto, 
  UpdateContractRequestDto 
} from './contractDomainTransform';

export type { 
  TenderResponseDto, 
  CreateTenderRequestDto, 
  UpdateTenderRequestDto 
} from './tenderDomainTransform';

// Shared types
export type { 
  EntityToDTOMapper, 
  ValidationResult, 
  BaseEntityDTO,
  AnalyticsMetrics,
  RiskAssessment,
  PerformanceMetrics,
  ComplianceStatus,
  PaginationParams,
  PaginatedResult,
  SearchParams,
  ExportParams
} from './shared';
