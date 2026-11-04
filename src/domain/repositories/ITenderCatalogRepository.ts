/** Port de persistance des appels d'offres, lots et documents partagés (schéma btp). */
export interface ITenderCatalogRepository {
  findLotsByTender(tenderId: string): Promise<Record<string, any>[]>;
  insertLot(row: Record<string, unknown>): Promise<Record<string, any>>;
  updateLot(id: string, row: Record<string, unknown>): Promise<Record<string, any>>;
  deleteLot(id: string): Promise<void>;
  findSubmissionsByLot(lotId: string): Promise<Record<string, any>[]>;
  findOpenTenders(statuses: string[]): Promise<Record<string, any>[]>;
  findPublicTenderById(id: string): Promise<Record<string, any> | null>;
  insertTenders(rows: Record<string, unknown>[]): Promise<number>;
  findTenderProjectId(tenderId: string): Promise<string | null>;
  findSharedDocuments(tenderId: string, projectId: string | null, allowedIds?: string[]): Promise<Record<string, any>[]>;
}
