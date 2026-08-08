/**
 * project status types
 */
export type ProjectStatus =
  | "en cours"
  | "terminé"
  | "en attente"
  | "en inspection"
  | "suspendu"
  | "annulé"
  | "attribué"
  | "planifié"
  | "pré-qualification"
  | "en conception"
  | "en construction"
  | "en clôture"
  | "en retard";

// New construction phase types
export type ConstructionPhase =
  | "pre_construction"
  | "site_preparation"
  | "foundation"
  | "framing"
  | "structural_work"
  | "finishing"
  | "post_construction"
  | "handover";

export type ConstructionStage =
  | "planning_design"
  | "permits_approvals"
  | "site_clearing"
  | "excavation"
  | "foundation_work"
  | "structural_framing"
  | "roofing"
  | "electrical_plumbing"
  | "interior_finishing"
  | "exterior_finishing"
  | "final_inspection"
  | "handover_complete";

/**
 * ---------------------------
 * Interfaces principales
 * ---------------------------
 */

export interface InsurancePolicy {
  id: string;
  type: "assurance" | "garantie_bancaire";
  reference: string;
  projectId: string;
  issuer: string;
  startDate: string;
  endDate: string;
  amount: number;
  coverage: string;
  status: "active" | "expiring_soon" | "expired";
  renewalDate?: string;
  documents?: string[];
  notes?: string;
  alertSent?: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  phaseId: string;
  dependencies: string[];
  assignedTo: string[];
  estimatedDuration: number;
  actualDuration?: number;
  startDate: string;
  endDate: string;
  status: "not_started" | "in_progress" | "completed" | "delayed";
  progress: number;
  weight: number;
  costEstimate: number;
  actualCost?: number;
  optimisticEstimate?: number;
  pessimisticEstimate?: number;
  criticalPath?: boolean;
  ganttColor?: string;
}

export interface Inspection {
  id: string;
  projectId: string;
  inspector: string;
  date: string;
  inspectionDate?: string;
  status:
    | "scheduled"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "approved"
    | "rejected"
    | "requires_changes"
    | "pending"
    | "planned";
  progressAtInspection: number;
  progressAtInspection?: number;
  comments?: string | null;
  createdAt: string;
  updatedAt: string;
  phaseId?: string | null;
  documents?: string[];
  issues?: InspectionIssue[] | string[];
  recommendations?: string[];
}

export interface InspectionIssue {
  id: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved";
  deadline?: string;
  assignedTo?: string;
}

export interface Alert {
  id: string;
  type:
    | "insurance_expiry"
    | "project_delay"
    | "inspection_issue"
    | "financial_risk"
    | "bank_guarantee"
    | "inspection_overdue"
    | "payment_blocked"
    | "compliance_violation"
    | "delivery"
    | "deadline"
    | "quality";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  projectId: string;
  relatedEntityId?: string;
  source?:
    | "insurance"
    | "bank_guarantee"
    | "inspection"
    | "payment"
    | "notification";
  projectTitle?: string;
  delayDays?: number;
  timestamp: string;
  triggerDate: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  actionRequired: boolean;
  actionTaken?: string;
  actionTakenBy?: string;
  actionTakenAt?: string;
  escalationLevel?: number;
  availableActions?: string[];
  actionProof?: ActionProof[];
  deadline?: string;
  recurrence?: number;
}

export interface ActionProof {
  type: "email" | "sms" | "document" | "call" | "meeting";
  timestamp: string;
  performedBy: string;
  details: string;
  documentUrl?: string;
}

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  location: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  endDate?: string;
  thumbnail?: string;
  teamSize: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  geographicZone?: string;
  terrainType?: string;
  environmentalConstraints?: string;
  hasUtilities?: boolean;
  requiresPermits?: boolean;

  // Project classification
  category?: string;
  subCategory?: string;
  priorityLevel?: "Faible" | "Moyenne" | "Élevée" | "Très élevée";
  riskLevel?: "Faible" | "Moyen" | "Élevé" | "Critique";
  environmentalImpact?: "Nul" | "Faible" | "Modéré" | "Élevé";
  sustainabilityScore?: number;

  // Procurement details
  financingSource?: string;
  marketType?: string;
  selectionMode?: string;
  launchDate?: string;
  attributionDate?: string;
  projectReference?: string;
  mainContractor?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  projectResponsableId?: string;
  currentPhase?: ConstructionPhase;
  currentStage?: ConstructionStage;
  plannedPhases?: {
    id: string;
    phase: ConstructionPhase;
    startDate: string;
    endDate: string;
    estimatedDuration: number;
    status: "not_started" | "in_progress" | "completed" | "delayed";
    weight: number;
    dependencies?: any[];
  }[];
  constructionMilestones?: {
    id: string;
    title: string;
    phase: ConstructionPhase;
    stage: ConstructionStage;
    targetDate: string;
    completionDate?: string;
    status: "pending" | "completed" | "overdue";
    notes?: string;
    weight: number;
    dependencies?: any[];
  }[];

  // Enhanced milestones structure
  milestones?: {
    name: string;
    plannedDate: string;
    actualDate?: string | null;
    status: "planned" | "in_progress" | "completed" | "delayed";
  }[];

  inspections?: Inspection[];
  tasks?: Task[];
  risks?: ProjectRisk[];
  expenses?: any[]; //real budget project consumation
  resources?: ProjectResource[];

  // Documents
  documents?: {
    name: string;
    type: string;
    url: string;
    uploadDate: string;
  }[];

  // Stakeholders
  stakeholders?: {
    name: string;
    email: string;
    phone: string;
    role: string;
    organization: string;
    isPrimary: boolean;
  }[];

  insurancePolicies?: InsurancePolicy[];
  alerts?: Alert[];
  escalationThresholds?: {
    alert: number;
    notification: number;
    guarantee: number;
    legal: number;
  };
  forme?: string;
  localisation?: any[];

  methodology?: "waterfall" | "agile" | "hybrid";
  ganttChart?: GanttChartData;
  pertAnalysis?: PERTAnalysis;
  earnedValueManagement?: EVMData;
  contacts?: ProjectContact[];
  checkScheduleLastRun?: CheckScheduleLastRun;
}

export interface ProjectRisk {
  id: string;
  title: string;
  description: string;
  probability: number;
  impact: number;
  mitigationPlan: string;
  status: "identified" | "monitored" | "mitigated" | "resolved";
  relatedTasks: string[];
}

export interface ProjectResource {
  id: string;
  name: string;
  type: "human" | "material" | "equipment";
  skills?: string[];
  costPerHour?: number;
  availability: number;
  assignedTasks: string[];
}

export interface GanttChartData {
  tasks: GanttTask[];
  dependencies: GanttDependency[];
}

export interface GanttTask {
  id: string;
  text: string;
  startDate: string;
  duration: number;
  progress: number;
  parent?: string;
  color?: string;
}

export interface GanttDependency {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface EVMMetrics {
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

export interface PERTActivity {
  name: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  pertEstimate: number;
  standardDeviation: number;
}

export interface PERTAnalysis {
  activities: PERTActivity[];
  expectedDurations: { [taskId: string]: number };
  criticalPath: string[];
  totalExpectedDuration: number;
  variances: { [taskId: string]: number };
}
export interface EVMData {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  varianceAtCompletion: number;
}

export interface ProjectContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  company?: string;
  isPrimary: boolean;
}

export interface CheckScheduleLastRun {
  insurance?: string;
  delay?: string;
  inspection?: string;
}

export type EscalationRoles = {
  level1: string;
  level2: string;
  level3: string;
  level4: string;
};

/**
 * ---------------------------
 * Actions disponibles
 * ---------------------------
 */
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
};

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  progressAtPayment: number;
  transactionId: string;
  // New contractor fields
  contractorId?: string;
  contractorName: string;
  contractorContact: string;
  // Method-specific fields
  bankName?: string;
  accountNumber?: string;
  checkNumber?: string;
  mobileNumber?: string;
  mobileOperator?: string;
  receiverName?: string;
}

export type InspectionStatus =
  | "approved"
  | "requires_changes"
  | "rejected"
  | "pending";

export interface InspectionData {
  id: string;
  date: string;
  status: InspectionStatus;
  inspector: string;
  progressAtInspection: number;
  comments?: string | null;
  documents?: any[];
}

// Import types
export interface ImportFile {
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer | string;
}

export interface ImportOptions {
  maxFileSize: number; // in bytes
  allowedFormats: string[];
  encoding?: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
}

// Enhanced project type for ORM operations
export interface ProjectEntity {
  id: string;
  title: string;
  description: string;
  location: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: Date;
  endDate?: Date;
  thumbnail: string;
  teamSize: number;
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  // New optional fields
  financingSource?: string;
  marketType?: string;
  selectionMode?: string;
  launchDate?: Date;
  attributionDate?: Date;
  projectResponsableId?: string;
  mainContractor?: string;
  projectReference?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  // Construction workflow fields
  currentPhase?: ConstructionPhase;
  currentStage?: ConstructionStage;
  plannedPhases?: any; // JSON field
  constructionMilestones?: any; // JSON field
  createdAt: Date;
  updatedAt: Date;
  // Relations
  payments?: Payment[];
  inspections?: Inspection[];
  materials?: ProjectMaterial[];
  assignments?: TaskAssignment[];
}

export interface ProjectMaterial {
  id: string;
  projectId: string;
  materialId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithPayments extends ProjectData {
  payments?: Payment[];
  inspections?: Inspection[];
  phases?: any[];
  milestones?: any[];
  materials?: any[];
  team?: any[];
}

export interface TaskAssignment {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedBy?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: Date;
  completionDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankGuaranteeData {
  projectId: string;
  contractorId: string;
  bankLiaisonEmail: string;
  guaranteeAmount: number;
  delayPercentage: number;
  contractClause: string;
}

export interface ProjectDelay {
  projectId: string;
  projectName: string;
  contractorName: string;
  plannedEndDate: string;
  currentDate: string;
  delayDays: number;
  delayPercentage: number;
  milestonesMissed: number;
}

// Role-based notification recipients
export const NOTIFICATION_ROLES = {
  PROJECT_MANAGER: "project_manager",
  DIRECTOR_PROGRAMMING: "director_programming",
  DIRECTOR: "director",
  BANK_LIAISON: "bank_liaison",
  ENGINEERING_CONSULTANT: "engineering_consultant",
  CONTRACTOR: "contractor",
};

// Delay thresholds for escalation
export const DELAY_THRESHOLDS = {
  WARNING: 10, // 10% delay triggers warning
  BANK_NOTIFICATION: 20, // 20% delay triggers bank notification
  GUARANTEE_TRIGGER: 30, // 30% delay triggers guarantee clause
  LEGAL_ESCALATION: 40, // 40% delay triggers legal team
};
