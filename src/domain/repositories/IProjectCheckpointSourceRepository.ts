/** Port de lecture des sources brutes consolidées par le contexte de jalons projet. */
export interface IProjectCheckpointSourceRepository {
  findPhases(projectId: string): Promise<Record<string, any>[]>;
  findInspections(projectId: string): Promise<Record<string, any>[]>;
  findDocuments(projectId: string): Promise<Record<string, any>[]>;
  findPayments(projectId: string): Promise<Record<string, any>[]>;
  /** Inspections approuvées les plus récentes (justificatifs de demande de paiement). */
  findApprovedInspections(projectId: string, limit: number): Promise<Record<string, any>[]>;
  findDocumentsByTypes(projectId: string, types: string[]): Promise<Record<string, any>[]>;
  insertPaymentRequest(row: Record<string, unknown>): Promise<void>;
}
