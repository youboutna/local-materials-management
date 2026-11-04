/** Port de persistance des documents rattachés aux lots d'appel d'offres. */
export interface TenderLotDocumentRow {
  id: string;
  tender_id: string;
  lot_id: string | null;
  lot_ids: string[] | null;
  title: string | null;
  description: string | null;
  category: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ITenderLotDocumentRepository {
  findByTender(tenderId: string): Promise<TenderLotDocumentRow[]>;
  insert(row: Record<string, unknown>): Promise<TenderLotDocumentRow>;
  update(id: string, row: Record<string, unknown>): Promise<TenderLotDocumentRow>;
  delete(id: string): Promise<void>;
}
