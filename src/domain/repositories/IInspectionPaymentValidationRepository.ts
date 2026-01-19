/**
 * Inspection Payment Validation Repository Interface
 * Defines contract for inspection payment validation data access
 */

export interface PaymentRequest {
  id: string;
  inspection_id: string;
  contractor_id: string;
  amount: number;
  status: string;
  request_date: string;
  created_at: string;
}

export interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  stakeholders?: any;
}

export interface InspectionDetails {
  id: string;
  project_id: string;
  status: string;
  progress_at_inspection: number;
  comments?: string | null;
  inspector: string;
  date: string;
  phase_id?: string | null;
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
