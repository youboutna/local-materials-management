/**
 * PV Generator Repository Interface
 * Defines contract for PV generation data operations
 */

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
    pv_type: string;
    content: string;
    generated_at: string;
  }): Promise<any>;

  /**
   * Get all PVs for an inspection
   */
  getInspectionPVs(inspectionId: string): Promise<any[]>;

  /**
   * Get PV content for download
   */
  getPVContent(pvId: string): Promise<string | null>;
}
