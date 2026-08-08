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
  co "bank_guarantee"
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
  g;
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
  mainContractor?: strinStage;
  plannedPhases?: {
    id: string;
    phase: ConstructionPhase;
    startDate: string;
    endDate: string;
    estimatedDuration: number;
    status: "not_started" | "in_per;
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
  // ConstionStage;
  plannedPhases?: any; // JSON field
  constructionMilestones?: any; // JSON field
   TaskAssignment[];
}

export interface ProjectMaterial {
  id: string;
  projectId: string;
  materialId: string;
  quantity: number;
  createdAt: Date;
  update
  inspections?: Inspection[];
  phases?: any[];
  milestones?: any[];
  materials?: any[];
  team?: any[]g;
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
  p
export const NOTIFICATION_ROLES = {
  PROJECT_MANAGER: "project_manager",
  DIRECTOR_PROGRAMMING: "director_programming",
  DIRECTOR: "director",
  BANK_LIAISON: "bank_liaisoK_NOTIFICATION: 20, // 20% delay triggers bank notification
  GUARANTEE_TRIGGER: 30, // 30% delay triggers guarantee clause
  LEGAL_ESCALATION: 40, // 40% delay triggers legal team
};