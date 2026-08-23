/**
 * Hook hexagonal pour l'import d'appels d'offres (Excel bulk / ligne par ligne).
 */
import { bulkInsertTenders, insertTender, TenderBulkImportRow } from '@/application/services/TenderService';

export function useTenderImport() {
  return {
    bulkInsertTenders: (rows: TenderBulkImportRow[]) => bulkInsertTenders(rows),
    insertTender: (row: TenderBulkImportRow) => insertTender(row),
  };
}
