/**
 * Action Data Transfer Objects
 */

export interface ActionMetadataDTO {
  source?: string;
  category?: string;
  urgency?: 'normal' | 'urgent' | 'critical';
  attachments?: string[];
  customFields?: Record<string, string | number | boolean>;
  priority?: number;
  deadline?: Date;
  estimatedDuration?: number; // en minutes
  requiredSkills?: string[];
  location?: string;
  budget?: number;
  certificateData?: Record<string, unknown>;
}

export interface EnhancedActionDTO {
  id: string;
  entityType: 'insurance' | 'bankGuarantee' | 'payment' | 'project' | 'document';
  entityId: string;
  projectId?: string;
  contractorId?: string;
  actionType: 'taskAssignment' | 'hierarchyNotification' | 'sms' | 'call' | 'email' | 'mail' | 'notification';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled';
  assigneeId?: string;
  recipientIds: string[];
  metadata?: ActionMetadataDTO;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateEnhancedActionRequestDTO {
  insuranceId?: string;
  projectId?: string;
  contractorId?: string;
  actionType: EnhancedActionDTO['actionType'];
  title: string;
  message: string;
  priority?: EnhancedActionDTO['priority'];
  assigneeId?: string;
  recipientIds?: string[];
  metadata?: ActionMetadataDTO;
}
// Moved from src/components/project/steps/EnhancedValidationStep.tsx
export interface ValidationField {
  id: string;
  name: string;
  status: 'pending' | 'inProgress' | 'completed' | 'failed';
  description: string;
  required: boolean;
  lastUpdated?: string;
  assignedTo?: string;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    uploadedAt: string;
  }>;
}
// Moved from src/dtos/entities/AlertDTO.ts (reconciled)
export interface ActionProofData {
  type: 'email' | 'sms' | 'document' | 'call' | 'meeting';
  timestamp: string;
  performedBy: string;
  details: string;
  documentUrl?: string;
}

// Moved from src/dtos/entities/AlertDTO.ts (reconciled)
export interface EscalationRule {
  id: string;
  alertType: string;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  timeThreshold: number; // minutes
  escalationLevel: number;
  targetRole: string;
  actionRequired: string[];
  autoAssign: boolean;
}

// Moved from src/dtos/entities/CalculationsDTO.ts (reconciled)
export interface EVMCalculations {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  budgetAtCompletion: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  varianceAtCompletion: number;
}

// Moved from src/dtos/entities/DecompteDTO.ts (reconciled)
export interface CalculateProjectDecompteRequestDto {
  projectId: string;
  customRules?: Partial<MauritaniaBusinessRulesDTO>;
}

// Moved from src/dtos/entities/DecompteDTO.ts (reconciled)
export interface CalculatePhaseDecompteRequestDto {
  projectId: string;
  phaseId: string;
  customRules?: Partial<MauritaniaBusinessRulesDTO>;
}

// Moved from src/dtos/entities/HierarchyMappingDTO.ts (reconciled)
export interface PositionTemplateDTO {
  title: string;
  department: string;
  category: string;
  level: number;
  parent?: string;
  permissions: {
    can_approve_projects: boolean;
    can_approve_payments: boolean;
    can_escalate_to_director: boolean;
  };
}

// Moved from src/dtos/entities/HierarchyMappingDTO.ts (reconciled)
export interface HierarchyMappingDTO {
  organizationName: string;
  totalPositions: number;
  assignedPositions: number;
  unassignedPositions: number;
  assignments: HierarchyAssignmentDTO[];
  validationResults: RoleValidationDTO[];
  mappingDate: string;
}

// Moved from src/dtos/entities/InterventionZoneDTO.ts (reconciled)
export interface InterventionZoneLatLng {
  lat: number;
  lng: number;
}

// Moved from src/dtos/entities/InterventionZoneDTO.ts (reconciled)
export interface InterventionZoneGeocodingMeta {
  provider?: string;
  confidence?: number;
  displayName?: string;
  placeId?: string | number;
  geocodedAt?: string;
}

// Moved from src/dtos/entities/MaterialDTO.ts (reconciled)
export interface CoordinatePoint {
  lat: number;
  lng: number;
  address?: string;
  type?: 'point' | 'polygon' | 'rectangle' | 'circle';
  confidence?: number;
}

// Moved from src/dtos/entities/MilestoneDTO.ts (reconciled)
export interface MilestoneTemplateDTO {
  id: string;
  name: string;
  description?: string;
  /** Relative offset in days from phase start */
  relativeOffsetDays: number;
  /** Weight for progress calculation (0.1 - 1.0) */
  weight: number;
  /** If true, this milestone is critical for phase completion (CPM) */
  isCritical: boolean;
  /** Type of milestone according to PM standards */
  type: MilestoneType;
  /** Priority level for scheduling */
  priority: MilestonePriority;
  /** Tags/categories for filtering */
  tags?: string[];
  /** Predecessor milestone IDs (for PERT/CPM dependency tracking) */
  predecessorIds?: string[];
  /** Deliverables expected at this milestone */
  deliverables?: string[];
  /** Approval requirements for gate milestones */
  approvalRequirements?: string[];
  requiresInspection?: true;
}

// Moved from src/dtos/entities/PaymentInitiationDTO.ts (reconciled)
export interface ApprovalActionDTO {
  notificationId: string;
  action: 'approved' | 'rejected';
  comments?: string;
}

// Moved from src/dtos/entities/PhaseDTO.ts (reconciled)
export interface PhaseResourceAllocationDTO {
  phaseId: string;
  resourceId: string;
  resourceType: 'employee' | 'contractor' | 'equipment' | 'material';
  allocationPercentage: number;
  allocatedAt?: string;
  allocatedBy?: string;
  startDate?: string;
  endDate?: string;
  cost?: number;
}

// Moved from src/dtos/entities/ProjectAggregateDTO.ts (reconciled)
export interface ActionProof {
  type: "email" | "sms" | "document" | "call" | "meeting";
  timestamp: string;
  performedBy: string;
  details: string;
  documentUrl?: string;
}

// Moved from src/dtos/entities/ProjectAggregateDTO.ts (reconciled)
export type EscalationRoles = {
  level1: string;
  level2: string;
  level3: string;
  level4: string;
}

// Moved from src/dtos/entities/ProjectAggregateDTO.ts (reconciled)
export type ActionLabels = {
  taskAssignment: "Assigner une tâche";
  hierarchyNotification: "Notifier la hiérarchie";
  sms: "Envoyer SMS";
  call: "Programmer appel";
  email: "Envoyer email";
  mail: "Courrier postal";
  exportReceipt: "Exporter reçu";
  blockchainVerification: "Vérification blockchain";
  documentUpload: "Uploader document";
  meetingSchedule: "Planifier réunion";
  financialReview: "Revue financière";
  legalConsultation: "Consultation juridique";
}

// Moved from src/dtos/entities/ProjectDTO.ts (reconciled)
export interface ProjectLocationData {
  address?: string;
  latitude?: number;
  longitude?: number;
  regionCode?: string;
  cityCode?: string;
  locationData?: AutoFillLocationData;
  // Additional metadata
  validatedAt?: string;
  validationSource?: string;
  confidence?: number;
}

// Moved from src/dtos/entities/ProjectDTO.ts (reconciled)
export interface TeamAllocationDTO {
  id: string;
  teamId: string;
  projectId: string;
  role: string;
  members: string[];
  capacity: number;
  allocated: number;
  startDate: string;
  endDate?: string;
}

// Moved from src/dtos/entities/ProjectReportDTO.ts (reconciled)
export interface CostCalculation {
  directCosts: number;
  indirectCosts: number;
  totalCost: number;
  currency: string;
  breakdown: {
    labor: number;
    materials: number;
    equipment: number;
    overhead: number;
    profit: number;
  };
}

// Moved from src/dtos/entities/QuantityTakeoffDTO.ts (reconciled)
export interface QuantityCalculationResult {
  materialId: string;
  materialName: string;
  originalQuantity: number;
  calculatedQuantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  wastageFactor: number;
  wastageQuantity: number;
  totalWithWastage: number;
}

// Moved from src/dtos/entities/QuantityTakeoffDTO.ts (reconciled)
export interface QuantityCalculationParams {
  length?: number;
  width?: number;
  height?: number;
  depth?: number;
  area?: number;
  volume?: number;
  weight?: number;
  count?: number;
  wastageFactor?: number;
}

// Moved from src/dtos/entities/ReportDTO.ts (reconciled)
export interface CostCalculation {
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  costVariance: number;
  estimatedCost: number;
  actualCost: number;
  efficiency: number;
  projectedCompletion: string;
  projectedOverrun: number;
}

// Moved from src/dtos/entities/TenderEstimateDTO.ts (reconciled)
export interface CalculateEstimateTotalsRequestDto {
  estimateId: string;
}

// Moved from src/dtos/workflows/ProjectWorkflowDTOs.ts (reconciled)
export interface StepRelatedDataDTO {
  phases?: PhaseDTO[];
  milestones?: MilestoneDTO[];
  dqeLines?: BoqLineDTO[];
  risks?: RiskDTO[];
  materials?: MaterialDTO[];
  stakeholders?: ProjectStakeholderDTO[];
  compliance?: ComplianceDataDTO;
  tasks?: TaskAssignmentDTO[]; // Utilise TaskAssignmentDTO
  inspections?: InspectionDTO[];
  strategyLinks?: ProjectStrategyLinkDTO[];
  budgetLinks?: ProjectBudgetLinkDTO[];
}

// Moved from src/dtos/workflows/ProjectWorkflowDTOs.ts (reconciled)
export interface WorkflowTemplateDTO {
  id: string;
  name: string;
  description: string;
  category: 'projectCreation' | 'projectEdit' | 'procurement' | 'inspection' | 'compliance';
  steps: WorkflowStep[];
  defaultSettings: {
    allowSkipSteps: boolean;
    requireValidation: boolean;
    autoSave: boolean;
    maxRetries: number;
  };
  isActive: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
}
