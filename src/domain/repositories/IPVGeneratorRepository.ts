/**
 * PV Generator Repository Interface
 * Defines contract for PV generation data operations
 */

export interface SavedPVRecord {
  id: string;
  inspection_id: string;
  pv_number: string;
  pv_type: string;
  title?: string | null;
  content: string;
  pdf_url?: string | null;
  status: string;
  generated_by?: string | null;
  version: number;
  metadata?: Record<string, unknown> | null;
  generated_at: string;
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
    inspection_id: string;
    pv_number: string;
    pv_type: string;
    title?: string;
    content: string;
    pdf_url?: string;
    status?: string;
    generated_by?: string;
    version?: number;
    metadata?: Record<string, unknown>;
    generated_at?: string;
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
