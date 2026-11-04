/**
 * Port de résolution/écriture des références lors de l'import de projets
 * (organisations, fournisseurs, employés, parties prenantes).
 * Les résultats exposent { data, error } pour conserver les reprises fines de l'importeur
 * (code d'erreur, violation de clé étrangère) sans exposer le client fournisseur.
 */
export interface ImportQueryError { code?: string; message: string; details?: string; hint?: string }
export interface ImportQueryOutcome<T> { data: T | null; error: ImportQueryError | null }

export type ImportReferenceTable = string;

export interface IImportReferenceRepository {
  findOne(table: ImportReferenceTable, columns: string, column: string, value: string): Promise<ImportQueryOutcome<Record<string, any>>>;
  insertReturning(table: ImportReferenceTable, row: Record<string, unknown>): Promise<ImportQueryOutcome<Record<string, any>>>;
  insert(table: ImportReferenceTable, row: Record<string, unknown>): Promise<ImportQueryOutcome<null>>;
  updateById(table: ImportReferenceTable, id: string, row: Record<string, unknown>): Promise<ImportQueryOutcome<null>>;
}
