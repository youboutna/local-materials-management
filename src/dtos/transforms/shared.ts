/**
 * Shared Types for Domain Transformers
 * Common interfaces and types used across all transformers
 * Following hexagonal architecture principles
 */

import { CoordinatePoint } from '../entities/MaterialDTO';

export interface BaseEntityDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors?: Record<string, string[]>;
}

export interface EntityToDTOMapper<Entity, DTO> {
  toDTO(entity: Entity): DTO;
  fromDTO(dto: DTO): Entity;
  fromEntityToDTO(entity: Entity): DTO;
  fromDtosToAdapter(dtos: DTO[]): DTO[] | Record<string, unknown>[];
  toResponseDto(entity: Entity): DTO;
  toRequestDto(dto: DTO): DTO;
  toUpdateDto(dto: DTO): Partial<DTO>;
  validate(dto: DTO): ValidationResult;
}

export interface AnalyticsMetrics {
  total: number;
  active: number;
  completed: number;
  pending: number;
  cancelled: number;
  utilizationRate: number;
  averageValue: number;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
}

export interface PerformanceMetrics {
  score: number;
  efficiency: number;
  quality: number;
  timeliness: number;
}

// Tender Estimate Common Types - Centralized for reuse
export interface TenderEstimateFinancialData {
  subtotal?: number;
  taxRate?: number;        // ✅ Changed from tax_rate
  taxAmount?: number;      // ✅ Changed from tax_amount
  totalWithTax?: number;   // ✅ Changed from total_with_tax
  discountRate?: number;   // ✅ Changed from discount_rate
  discountAmount?: number;  // ✅ Changed from discount_amount
  overheadPercentage?: number;
  overheadAmount?: number;
  profitMarginPercentage?: number;
  profitMarginAmount?: number;
  finalTotal?: number;
}

export interface TenderEstimateCostBreakdown {
  totalMaterialsCost?: number;
  totalLaborCost?: number;
  totalEquipmentCost?: number;
}

export interface TenderEstimateBusinessLogic {
  margin_rules?: {
    overhead_percentage: number;
    profit_margin_percentage: number;
    risk_multiplier: number;
  };
  risk_assessment?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    score: number;
  };
}

// Report Export Common Types
export interface EstimateItem {
  id?: string;
  material_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  description: string | null;
  item_type: string | null;
}

export interface EstimateData {
  id?: string;
  tender_id?: string;
  estimate_type: string;
  total_materials_cost: number | null;
  total_labor_cost: number | null;
  total_equipment_cost: number | null;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  total_with_tax: number | null;
  overhead_percentage: number | null;
  overhead_amount: number | null;
  profit_margin_percentage: number | null;
  profit_margin_amount: number | null;
  final_total: number | null;
  currency: string | null;
  status: string;
  created_at?: string;
}

export interface ExportConfig {
  title: string;
  includeCompanyHeader: boolean;
  includeItemDetails: boolean;
  includePriceBreakdown: boolean;
  includeTermsConditions: boolean;
  includeSignature: boolean;
  termsConditions: string;
  recipientEmail?: string;
  notes?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  validityPeriod: number; // in days
}

export interface ComplianceStatus {
  isCompliant: boolean;
  lastAuditDate?: string;
  issues: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    status: 'open' | 'resolved';
  }>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, string | number | boolean>;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string[];
}

export interface ExportParams {
  format: 'csv' | 'excel' | 'pdf';
  includeHeaders?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, string | number | boolean>;
}

// Enhanced DTOs for BTP calculations and business logic
export interface MaterialDTO extends BaseEntityDTO {
  name: string;
  description: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  stockMetrics: {
    currentStock: number;
    minStock: number;
    maxStock: number;
    stockStatus: 'optimal' | 'low' | 'critical' | 'out_of_stock';
    reorderPoint: number;
    stockTurnover: number;
    daysUntilReorder: number;
  };
  costAnalysis: {
    unitCost: number;
    totalValue: number;
    costPerUnit: number;
    costVariance: number;
    efficiency: number;
  };
  qualityMetrics: {
    qualityScore: number;
    defectRate: number;
    supplierReliability: number;
    recommendations: string[];
  };
  specifications: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    thickness: number;
  };
  weight: number;
  density: number;
  supplierId: string;
  supplierName: string;
  leadTime: number;
  qualityCertificate: string;
  complianceStandards: string[];
  dailyUsage: number;
  monthlyUsage: number;
  lastUsed: string;
  expectedCost: number;
  actualCost: number;
  costVariance: number;
  storageLocation: string;
  storageConditions: string;
}

export interface CreateMaterialRequestDto {
  name: string;
  description: string;
  category: string;
  unit: string;
  currentStock?: number;
  minStock?: number;
  maxStock?: number;
  unitCost?: number;
  specifications?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    thickness: number;
  };
  weight?: number;
  density?: number;
  supplierId?: string;
  supplierName?: string;
  leadTime?: number;
  qualityCertificate?: string;
  complianceStandards?: string[];
  dailyUsage?: number;
  monthlyUsage?: number;
  expectedCost?: number;
  storageLocation?: string;
  storageConditions?: string;
}

export interface UpdateMaterialRequestDto {
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  currentStock?: number;
  minStock?: number;
  maxStock?: number;
  unitCost?: number;
  specifications?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    thickness: number;
  };
  weight?: number;
  density?: number;
  supplierId?: string;
  supplierName?: string;
  leadTime?: number;
  qualityCertificate?: string;
  complianceStandards?: string[];
  dailyUsage?: number;
  monthlyUsage?: number;
  expectedCost?: number;
  actualCost?: number;
  costVariance?: number;
  storageLocation?: string;
  storageConditions?: string;
}

export interface MaterialDetailDTO extends MaterialDTO {
  // Additional detailed fields for material detail view
  usageHistory: Array<{
    date: string;
    quantity: number;
    project: string;
    cost: number;
  }>;
  qualityReports: Array<{
    date: string;
    score: number;
    issues: string[];
    inspector: string;
  }>;
  supplierInfo: {
    name: string;
    contact: string;
    rating: number;
    certifications: string[];
  };
}

export interface MaterialSummaryDTO extends MaterialDTO {
  // Summary fields for list view
  usageRate: number;
  lastUpdated: string;
  criticalLevel: 'low' | 'medium' | 'high';
}

export interface MaterialListItemDTO extends BaseEntityDTO {
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  unitCost: number;
  stockStatus: 'optimal' | 'low' | 'critical' | 'out_of_stock';
  reorderPoint: number;
  daysUntilReorder: number;
}

/**
 * UI-specific Material DTO
 * Simplified for UI components with category as string
 * Following RULE #4: UI should use DTOs appropriate for presentation
 */
export interface MaterialUIDTO extends BaseEntityDTO {
  id: string;
  name: string;
  description?: string;
  category: string; // String ID instead of object
  unit: string; // String instead of enum for UI flexibility
  quantity: number;
  pricePerUnit: number;
  availableQuantity: number;
  image?: string;
  originLocation?: string;
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  forme?: string;
  adresse?: string;
  localisation?: CoordinatePoint[];
  isActive?: boolean;
  minimumQuantity?: number;
  localType?: string;
}

export interface InspectionDTO extends BaseEntityDTO {
  projectId: string;
  inspector: string;
  date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending';
  progress: number;
  comments: string;
  phaseId: string;
  complianceMetrics: {
    complianceScore: number;
    criticalIssues: string[];
    recommendations: string[];
    nextInspectionDate: Date;
  };
  qualityMetrics: {
    qualityScore: number;
    defectRate: number;
    inspectorPerformance: number;
    recommendations: string[];
  };
  riskAssessment: {
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
  };
  progressAtInspection: number;
  documents: string[];
  issues: string[];
  siteConditions: string;
  weatherConditions: string;
  temperature: number;
  humidity: number;
}

export interface CreateInspectionRequestDto {
  projectId: string;
  inspector: string;
  date?: string;
  comments?: string;
  phaseId?: string;
  documents?: string[];
  issues?: string[];
  siteConditions?: string;
  weatherConditions?: string;
  temperature?: number;
  humidity?: number;
}

export interface UpdateInspectionRequestDto {
  inspector?: string;
  date?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending';
  progress?: number;
  comments?: string;
  phaseId?: string;
  documents?: string[];
  issues?: string[];
  siteConditions?: string;
  weatherConditions?: string;
  temperature?: number;
  humidity?: number;
}

export interface InspectionDetailDTO extends InspectionDTO {
  // Additional detailed fields for inspection detail view
  inspectionPlan: Array<{
    step: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo: string;
    dueDate: string;
    completedAt?: string;
  }>;
  findings: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    status: 'open' | 'resolved';
    reportedBy: string;
    reportedAt: string;
    resolvedAt?: string;
  }>;
  photos: string[];
  videos: string[];
  recommendations: string[];
}

export interface InspectionSummaryDTO extends InspectionDTO {
  // Summary fields for list view
  daysSinceLastInspection: number;
  totalFindings: number;
  criticalFindings: number;
  complianceScore: number;
  inspectorPerformance: number;
}

export interface InspectionListItemDTO extends BaseEntityDTO {
  projectId: string;
  inspector: string;
  date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending';
  progress: number;
  phaseId: string;
  complianceScore: number;
  daysSinceLastInspection: number;
  criticalFindings: number;
}

export interface PaymentDTO extends BaseEntityDTO {
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progressAtPayment: number;
  transactionId: string;
  contractorName: string;
  contractorContact: string;
  bankName: string;
  accountNumber: string;
  checkNumber: string;
  mobileNumber: string;
  receiverName: string;
  mobileOperator: string;
  secretCode: string;
  secretExpiresAt: string;
  isSecretActive: boolean;
  secretAccessCount: number;
  maxSecretAccess: number;
  risk: {
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
    financialHealth: 'healthy' | 'warning' | 'critical';
  };
  efficiency: {
    paymentRate: number;
    onTimePaymentRate: 'excellent' | 'good' | 'acceptable' | 'poor';
    daysOverdue: number;
    averagePaymentDelay: number;
  };
  daysOverdue: number;
  averagePaymentDelay: number;
  totalPaid: number;
  totalDue: number;
  costVariance: number;
  financialHealth: 'healthy' | 'warning' | 'critical';
  projectId: string;
  invoiceId: string;
  complianceScore: number;
  lastComplianceCheck: string;
  paymentWorkflowConfig: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    approvalRequired: boolean;
    autoApproveThreshold: number;
  };
  paymentFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  initialAdvance: number;
  retentionPercentage: number;
  advancePercentage: number;
  priority: 'low' | 'medium' | 'high';
  projectType: string;
  sector: string;
  permitNumber: string;
}

export interface CreatePaymentRequestDto {
  amount: number;
  paymentDate?: string;
  paymentMethod: string;
  progressAtPayment?: number;
  transactionId?: string;
  contractorName?: string;
  contractorContact?: string;
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  receiverName?: string;
  mobileOperator?: string;
  secretCode?: string;
  secretExpiresAt?: string;
  isSecretActive?: boolean;
  secretAccessCount?: number;
  maxSecretAccess?: number;
  projectId?: string;
  invoiceId?: string;
}

export interface UpdatePaymentRequestDto {
  amount?: number;
  paymentDate?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progressAtPayment?: number;
  transactionId?: string;
  contractorName?: string;
  contractorContact?: string;
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  receiverName?: string;
  mobileOperator?: string;
  secretCode?: string;
  secretExpiresAt?: string;
  isSecretActive?: boolean;
  secretAccessCount?: number;
  maxSecretAccess?: number;
  projectId?: string;
  invoiceId?: string;
}

export interface PaymentDetailDTO extends PaymentDTO {
  // Additional detailed fields for payment detail view
  paymentHistory: Array<{
    date: string;
    amount: number;
    status: string;
    method: string;
    processor: string;
    reference: string;
  }>;
  complianceChecks: Array<{
    date: string;
    status: 'passed' | 'failed' | 'pending';
    checker: string;
    notes: string;
  }>;
  relatedDocuments: string[];
  approvalWorkflow: Array<{
    step: string;
    status: 'pending' | 'approved' | 'rejected';
    approver: string;
    date: string;
    comments: string;
  }>;
}

export interface PaymentSummaryDTO extends PaymentDTO {
  // Summary fields for list view
  daysOverdue: number;
  averagePaymentDelay: number;
  cashFlowVariance: number;
  paymentEfficiency: {
    paymentRate: number;
    onTimePaymentRate: 'excellent' | 'good' | 'acceptable' | 'poor';
    daysOverdue: number;
    averagePaymentDelay: number;
  };
  financialHealth: 'healthy' | 'warning' | 'critical';
  complianceScore: number;
  lastComplianceCheck: string;
}

export interface PaymentListItemDTO extends BaseEntityDTO {
  amount: number;
  paymentDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progressAtPayment: number;
  contractorName: string;
  daysOverdue: number;
  averagePaymentDelay: number;
  financialHealth: 'healthy' | 'warning' | 'critical';
}

export interface ProjectDTO extends BaseEntityDTO {
  title: string;
  description: string;
  location: string;
  status: 'planning' | 'en cours' | 'terminé' | 'suspendu' | 'annulé';
  progress: number;
  budget: number;
  startDate: string;
  endDate: string;
  thumbnail: string;
  teamSize: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  health: 'healthy' | 'warning' | 'critical';
  progressMetrics: {
    estimatedCompletionDate: Date;
    progressRate: number;
    efficiency: number;
  };
  evmMetrics: {
    plannedValue: number;
    earnedValue: number;
    scheduleVariance: number;
    costVariance: number;
    schedulePerformanceIndex: number;
    costPerformanceIndex: number;
  };
  riskAssessment: {
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
  };
  estimatedCost: number;
  actualCost: number;
  costVariance: number;
  productivityIndex: number;
  geographicZone: string;
  terrainType: string;
  environmentalConstraints: string;
  financingSource: string;
  marketType: string;
  selectionMode: string;
  launchDate: string;
  attributionDate: string;
  projectReference: string;
  mainContractor: string;
  allowsInitialPayment: boolean;
  initialPaymentPercentage: number;
  currentPhase: string;
  currentStage: string;
}

export interface CreateProjectRequestDto {
  title: string;
  description: string;
  location: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  thumbnail?: string;
  teamSize?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  estimatedCost?: number;
  geographicZone?: string;
  terrainType?: string;
  environmentalConstraints?: string;
  financingSource?: string;
  marketType?: string;
  selectionMode?: string;
  launchDate?: string;
  attributionDate?: string;
  projectReference?: string;
  mainContractor?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  currentPhase?: string;
  currentStage?: string;
}

export interface UpdateProjectRequestDto {
  title?: string;
  description?: string;
  location?: string;
  status?: 'planning' | 'en cours' | 'terminé' | 'suspendu' | 'annulé';
  progress?: number;
  budget?: number;
  endDate?: string;
  thumbnail?: string;
  teamSize?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  estimatedCost?: number;
  geographicZone?: string;
  terrainType?: string;
  environmentalConstraints?: string;
  financingSource?: string;
  marketType?: string;
  selectionMode?: string;
  launchDate?: string;
  attributionDate?: string;
  projectReference?: string;
  mainContractor?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  currentPhase?: string;
  currentStage?: string;
}

export interface ProjectDetailDTO extends ProjectDTO {
  // Additional detailed fields for project detail view
  risks: Array<{
    id: string;
    title: string;
    description: string;
    probability: number;
    impact: number;
    mitigationPlan: string;
    status: 'identified' | 'monitored' | 'mitigated' | 'resolved';
    relatedTasks: string[];
  }>;
  tasks: Array<{
    id: string;
    name: string;
    description: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
    progress: number;
    startDate: string;
    endDate: string;
    estimatedDuration: number;
    actualDuration?: number;
    costEstimate: number;
    actualCost?: number;
    weight: number;
    estimatedDurationDays: number;
    optimisticEstimate?: number;
    pessimisticEstimate?: number;
    criticalPath: boolean;
    ganttColor: string;
    assignedTo: string[];
    dependencies: string[];
  }>;
  inspections: Array<{
    id: string;
    projectId: string;
    inspector: string;
    date: string;
    status: string;
    progress: number;
    comments: string;
    phaseId: string;
    documents: string[];
    issues: string[];
    created_at: string;
    updated_at: string;
    projects: Array<{
      id: string;
      name: string;
      status: string;
      progress: number;
      budget?: number;
    }>;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    status: string;
    progressAtPayment: number;
    transactionId: string;
    contractorName: string;
    contractorContact: string;
    bankName: string;
    accountNumber: string;
    checkNumber: string;
    mobileNumber: string;
    receiverName: string;
    mobileOperator: string;
    secretCode: string;
    secretExpiresAt: string;
    isSecretActive: boolean;
    secretAccessCount: number;
    maxSecretAccess: number;
    created_at: string;
    updated_at: string;
  }>;
  phases: Array<{
    id: string;
    project_id: string;
    phase_name: string;
    construction_phase: string;
    construction_stage: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending';
    progress: number;
    estimated_cost: number;
    actual_cost: number;
    estimated_duration_days: number;
    actual_duration_days: number;
    start_date: string;
    end_date: string;
    actual_start_date: string;
    actual_end_date: string;
    order_index: number;
    dependencies: string[];
    steps: Array<{
      id: string;
      name: string;
      description: string;
      status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending';
      progress: number;
      estimated_duration_days: number;
      actual_duration_days: number;
      start_date: string;
      end_date: string;
      order_index: number;
      tasks: Array<{
        id: string;
        name: string;
        description: string;
        status: 'pending' | 'in_progress' | 'completed' | 'delayed';
        progress: number;
        estimated_duration_days: number;
        actual_duration_days: number;
        start_date: string;
        end_date: string;
        order_index: number;
        assigned_to: string[];
        dependencies: string[];
        weight: number;
      }>;
    }>;
    created_at: string;
    updated_at: string;
  }>;
}

export interface ProjectSummaryDTO extends ProjectDTO {
  // Summary fields for list view
  totalTasks: number;
  completedTasks: number;
  totalRisks: number;
  totalInspections: number;
  totalPayments: number;
  totalPhases: number;
  lastActivity: string;
}

export interface ProjectListItemDTO extends BaseEntityDTO {
  title: string;
  location: string;
  status: 'planning' | 'en cours' | 'terminé' | 'suspendu' | 'annulé';
  progress: number;
  budget: number;
  startDate: string;
  endDate: string;
  thumbnail: string;
  teamSize: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Phase DTOs
export interface PhaseStepDTO {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes';
  progress: number;
  order_index: number;
  tasks: PhaseTaskDTO[];
}

export interface PhaseTaskDTO {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  order_index: number;
  assigned_to: string[];
  requires_inspection: boolean;
  requires_engineer_approval: boolean;
  estimated_duration_days?: number;
  actual_duration_days?: number;
  start_date?: string;
  end_date?: string;
  dependencies?: string[];
  weight?: number;
  cost_estimate?: number;
  actual_cost?: number;
}

export interface PhaseDTO extends BaseEntityDTO {
  id: string;
  project_id: string;
  phase_name: string;
  description: string;
  construction_phase: string | null;
  construction_stage: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes';
  progress: number;
  estimated_cost: number;
  actual_cost: number;
  estimated_duration_days: number;
  start_date: string;
  end_date: string;
  order_index: number;
  steps: PhaseStepDTO[];
  dependencies: string[]; // JSONB array of phase IDs
  milestones: string[]; // JSONB array of milestone IDs
  location?: string | null;
  notes?: string | null;
  weight?: number | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePhaseRequestDto {
  project_id: string;
  phase_name: string;
  description?: string;
  construction_phase?: string;
  construction_stage?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes';
  progress?: number;
  estimated_cost?: number;
  estimated_duration_days?: number;
  start_date?: string;
  end_date?: string;
  order_index?: number;
  steps?: PhaseStepDTO[];
  location?: string | null;
  notes?: string | null;
  weight?: number | null;
}

export interface UpdatePhaseRequestDto {
  phase_name?: string;
  description?: string;
  construction_phase?: string;
  construction_stage?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes';
  progress?: number;
  estimated_cost?: number;
  actual_cost?: number;
  estimated_duration_days?: number;
  start_date?: string;
  end_date?: string;
  order_index?: number;
  steps?: PhaseStepDTO[];
  location?: string | null;
  notes?: string | null;
  weight?: number | null;
}

// Workspace DTOs
export interface WorkspaceDTO {
  id: string;
  name: string;
  location: string;
  status: string;
  contact_manager?: string;
  contact_phone?: string;
  facilities?: {
    offices?: number;
    warehouses?: number;
    laboratories?: number;
    equipment?: string[];
    certifications?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceRequestDto {
  name: string;
  location: string;
  status?: string;
  contact_manager?: string;
  contact_phone?: string;
  facilities?: {
    offices?: number;
    warehouses?: number;
    laboratories?: number;
    equipment?: string[];
    certifications?: string[];
  };
}

export interface UpdateWorkspaceRequestDto {
  name?: string;
  location?: string;
  status?: string;
  contact_manager?: string;
  contact_phone?: string;
  facilities?: {
    offices?: number;
    warehouses?: number;
    laboratories?: number;
    equipment?: string[];
    certifications?: string[];
  };
}

// Project Alert DTOs
export interface ProjectAlertDTO {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  type: string;
  severity: string;
  source?: string;
  escalation_level?: number;
  acknowledged?: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
  assigned_actions?: string[];
  action_proofs?: {
    documentId?: string;
    timestamp?: string;
    userId?: string;
    notes?: string;
  };
  metadata?: {
    priority?: 'low' | 'medium' | 'high';
    source?: string;
    category?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateProjectAlertRequestDto {
  project_id: string;
  title: string;
  description?: string;
  type: string;
  severity: string;
  source?: string;
  escalation_level?: number;
  assigned_actions?: string[];
  metadata?: {
    priority?: 'low' | 'medium' | 'high';
    source?: string;
    category?: string;
  };
}

export interface UpdateProjectAlertRequestDto {
  title?: string;
  description?: string;
  type?: string;
  severity?: string;
  source?: string;
  escalation_level?: number;
  acknowledged?: boolean;
  resolved?: boolean;
  assigned_actions?: string[];
  action_proofs?: {
    documentId?: string;
    timestamp?: string;
    userId?: string;
    notes?: string;
  };
  metadata?: {
    priority?: 'low' | 'medium' | 'high';
    source?: string;
    category?: string;
  };
}

// Action DTOs
export interface ActionDTO {
  id: string;
  action_type: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActionRequestDto {
  action_type: string;
  message: string;
}

export interface UpdateActionRequestDto {
  action_type?: string;
  message?: string;
}

// Task Assignment DTOs
export interface TaskAssignmentDTO {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  assigned_to?: string;
  assigned_by?: string;
  assignee_type?: "supplier" | "employee" | "user";
  assignee_name?: string;
  assignee_email?: string;
  due_date?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskAssignmentRequestDto {
  title: string;
  description?: string;
  project_id?: string;
  assigned_to?: string;
  assignee_type?: "supplier" | "employee" | "user";
  assignee_name?: string;
  assignee_email?: string;
  due_date?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string;
}

export interface UpdateTaskAssignmentRequestDto {
  title?: string;
  description?: string;
  project_id?: string;
  assigned_to?: string;
  assignee_type?: "supplier" | "employee" | "user";
  assignee_name?: string;
  assignee_email?: string;
  due_date?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string;
}

export interface MaterialFormDataDTO {
  name: string;
  description?: string;
  category: string; // String for UI flexibility
  subcategory?: string;
  unit: string; // String for UI flexibility
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  availableQuantity: number;
  workspaceId: string;
  image?: string;
  adresse?: string;
  forme?: string;
  localisation?: CoordinatePoint[];
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  gtin?: string;
  sku?: string;
  ean?: string;
  asin?: string;
  multilangLabels?: Record<string, string>;
  timeline?: {
    start: Date;
    end: Date;
    estimatedDuration: number;
  };
  supplier?: {
    name: string;
    contact: string;
    leadTime: number;
  };
}

// Performance Monitoring DTOs
export interface DatabaseMetricsDTO {
  connections: number;
  maxConnections: number;
  queryTime: number;
  slowQueries: number;
}

export interface PerformanceMetricsDTO {
  database: DatabaseMetricsDTO;
  timestamp: number;
}

// Tender Estimate DTOs
export interface TenderEstimateDTO {
  id: string;
  tender_id: string;
  project_id?: string | null;
  estimate_type: string;
  total_materials_cost?: number | null;
  total_labor_cost?: number | null;
  total_equipment_cost?: number | null;
  subtotal?: number | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  total_with_tax?: number | null;
  overhead_percentage?: number | null;
  overhead_amount?: number | null;
  profit_margin_percentage?: number | null;
  profit_margin_amount?: number | null;
  final_total?: number | null;
  currency?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
  submitted_by?: string | null;
}

export interface TenderEstimateItemDTO {
  id: string;
  estimate_id: string;
  material_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string | null;
  item_type?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenderEstimateCreateDTO {
  tender_id: string;
  project_id?: string;
  estimate_type: string;
  total_materials_cost?: number;
  total_labor_cost?: number;
  total_equipment_cost?: number;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  total_with_tax?: number;
  overhead_percentage?: number;
  overhead_amount?: number;
  profit_margin_percentage?: number;
  profit_margin_amount?: number;
  final_total?: number;
  currency?: string;
  status?: string;
}

export interface TenderEstimateItemCreateDTO {
  estimate_id: string;
  material_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string;
  item_type?: string;
}

export interface UpdateTenderEstimateRequestDto {
  tender_id?: string;
  project_id?: string;
  estimate_type?: string;
  total_materials_cost?: number;
  total_labor_cost?: number;
  total_equipment_cost?: number;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  total_with_tax?: number;
  overhead_percentage?: number;
  overhead_amount?: number;
  profit_margin_percentage?: number;
  profit_margin_amount?: number;
  final_total?: number;
  currency?: string;
  status?: string;
}

export interface UpdateTenderEstimateItemRequestDto {
  material_id?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  description?: string;
  item_type?: string;
}

// Task DTOs
export interface TaskDTO extends BaseEntityDTO {
  title: string;
  description?: string;
  project_id?: string;
  assigned_to?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  weight?: number;
  dependencies?: string[];
  tags?: string[];
  created_by?: string;
  updated_by?: string;
}

export interface CreateTaskRequestDto {
  title: string;
  description?: string;
  project_id?: string;
  assigned_to?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  progress?: number;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  estimated_duration?: number;
  weight?: number;
  dependencies?: string[];
  tags?: string[];
}

export interface UpdateTaskRequestDto {
  title?: string;
  description?: string;
  project_id?: string;
  assigned_to?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  progress?: number;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  weight?: number;
  dependencies?: string[];
  tags?: string[];
  updated_by?: string;
}
