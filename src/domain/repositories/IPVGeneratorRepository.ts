/**
 * PV Generator Repository Interface
 * Defines contract for PV generation data operations
 */

export interface SavedPVRecord {
  id: string;
  inspectionId: string;
  pvNumber: string;
  pvType: string;
  title?: string | null;
  content: string;
  pdfUrl?: string | null;
  status: string;
  generatedBy?: string | null;
  version: number;
  metadata?: Record<string, unknown> | null;
  generatedAt: string;
}

export interface IPVGeneratorRepository {
  /**
   * Get inspection with project and phase data
   */
  getInspectionWithProject(inspectionId: string): Promise<any>;

  /**
   * Save generated PV to database
   */
  savePV(pvData: {
    inspectionId: string;
    pvNumber: string;
    pvType: string;
    title?: string;
    content: string;
    pdfUrl?: string;
    status?: string;
    generatedBy?: string;
    version?: number;
    metadata?: Record<string, unknown>;
    generatedAt?: string;
  }): Promise<SavedPVRecord>;

  /**
   * Get all PVs for an inspection
   */
  getInspectionPVs(inspectionId: string): Promise<SavedPVRecord[]>;

  /**
   * Get PV by ID
   */
  getPVById(pvId: string): Promise<SavedPVRecord | null>;

  /**
   * Get PV content for download
   */
  getPVContent(pvId: string): Promise<string | null>;
}
