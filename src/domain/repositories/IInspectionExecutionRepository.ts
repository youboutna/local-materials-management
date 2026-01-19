/**
 * Inspection Execution Repository Interface
 * Defines contract for inspection execution data access
 */

export interface InspectionDocument {
  name: string;
  url: string;
  uploadedAt: string;
}

export interface InspectionExecutionData {
  inspectionId: string;
  status: string;
  progress?: number;
  documents?: File[];
  syncResult?: any;
}

export interface IInspectionExecutionRepository {
  // ============= Document Management =============
  
  /**
   * Upload inspection documents
   */
  uploadDocuments(inspectionId: string, documents: File[]): Promise<InspectionDocument[]>;

  /**
   * Create document records
   */
  createDocumentRecords(inspectionId: string, documents: InspectionDocument[]): Promise<void>;

  // ============= Inspection Management =============
  
  /**
   * Update inspection status and progress
   */
  updateInspection(inspectionId: string, status: string, progress?: number, comments?: string): Promise<void>;

  /**
   * Get inspection by ID
   */
  getInspectionById(inspectionId: string): Promise<any>;
}
