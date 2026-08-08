/**
 * Inspection Payment Validation Repository Interface
 * Defines contract for inspection payment validation data access
 */

export interface PaymentRequest {
  id: string;
  inspectionId: string;
  contractorId: string;
  amount: number;
  status: string;
  requestDate: string;
  createdAt: string;
}

export interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  stakeholders?: any;
}

export interface InspectionDetails {
  id: string;
  projectId: string;
  status: string;
  progressAtInspection: number;
  comments?: string | null;
  inspector: string;
  date: string;
  phaseId?: string | null;
}

export interface IInspectionPaymentValidationRepository {
  // ============= Inspection Queries =============
  
  /**
   * Get inspection details with payment request validation
   */
  getInspectionWithPaymentRequest(inspectionId: string): Promise<InspectionDetails | null>;

  /**
   * Get project details with stakeholders
   */
  getProjectWithStakeholders(projectId: string): Promise<ProjectDetails | null>;

  /**
   * Update inspection status
   */
  updateInspectionStatus(inspectionId: string, status: string, comments: string): Promise<void>;

  // ============= Stakeholder Information =============
  
  /**
   * Get contractor information from project stakeholders
   */
  getContractorInfo(projectId: string): Promise<any>;

  /**
   * Get engineer information from project stakeholders
   */
  getEngineerInfo(projectId: string): Promise<any>;
}
