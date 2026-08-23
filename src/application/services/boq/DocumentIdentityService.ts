/**
 * DocumentIdentityService — normalisation de l'identité documentaire (D1 / D2).
 *
 *  • Référence stable : `PREFIX-YYYYMMDD-XXXX` (le suffixe dérive du contexte,
 *    la date de la création du document → aucune variabilité entre générations).
 *  • Date d'émission stable : date de création de la 1ʳᵉ ligne, sinon aujourd'hui.
 *  • Désignations explicites : jamais de code technique (`L1`, `L2`, uuid…) en
 *    libellé de poste.
 *
 * Pure TS — aucune dépendance React / Supabase.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

/** Codes techniques non signifiants pour un lecteur métier. */
const TECHNICAL_LABEL = /^(l|p|ligne|item|poste)?\s*[-_]?\d{1,4}$/i;
/** Codes de nomenclature (« 1.1 », « 02.3.4 ») : appartiennent à la colonne Réf. */
const NUMERIC_CODE = /^[\d]+([.\-][\d]+)*$/;
const UUID_LIKE = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;


function hash4(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).toUpperCase().padStart(4, '0').slice(-4);
}

export interface DocumentIdentityInput {
  docPrefix: string;
  contextId?: string;
  documentId?: string | null;
  lines?: BoqLineDTO[];
  /** Référence fournie par l'appelant (prioritaire). */
  reference?: string | null;
  /** Date d'émission forcée (ISO). */
  issueDate?: string | null;
}

export interface DocumentIdentity {
  reference: string;
  /** ISO 8601 `YYYY-MM-DD` — valeur canonique portée par le PDF et le XML. */
  issueDateIso: string;
  /** Horodatage complet ISO (Factur-X / archivage). */
  issueDateTimeIso: string;
}

export const DocumentIdentityService = {
  /** Date d'émission stable du document. */
  resolveIssueDate(input: DocumentIdentityInput): string {
    if (input.issueDate) {
      const forced = new Date(input.issueDate);
      if (!Number.isNaN(forced.getTime())) return forced.toISOString();
    }
    const stamps = (input.lines ?? [])
      .map((l) => (l.createdAt ? new Date(l.createdAt).getTime() : Number.NaN))
      .filter((n) => Number.isFinite(n)) as number[];
    if (stamps.length) return new Date(Math.min(...stamps)).toISOString();
    return new Date().toISOString();
  },

  resolve(input: DocumentIdentityInput): DocumentIdentity {
    const issueDateTimeIso = this.resolveIssueDate(input);
    const issueDateIso = issueDateTimeIso.slice(0, 10);
    const prefix = (input.docPrefix || 'doc').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const seed =
      input.documentId ||
      (input.lines ?? []).find((l) => l.documentId)?.documentId ||
      input.contextId ||
      issueDateIso;
    const reference =
      input.reference?.trim() ||
      `${prefix}-${issueDateIso.replace(/-/g, '')}-${hash4(String(seed))}`;
    return { reference, issueDateIso, issueDateTimeIso };
  },

  /**
   * Libellé métier explicite d'un poste : jamais un code technique.
   * Ordre de résolution : désignation signifiante → note/description →
   * type de ressource + code métier → « Poste n° i ».
   */
  lineLabel(line: BoqLineDTO, index: number): string {
    const candidates = [line.designation, line.note, line.elementType, line.category];
    for (const raw of candidates) {
      const value = String(raw ?? '').trim();
      if (!value) continue;
      if (TECHNICAL_LABEL.test(value) || NUMERIC_CODE.test(value) || UUID_LIKE.test(value)) continue;
      return value;
    }
    const code = String(line.btpCode ?? line.code ?? '').trim();
    if (code && !TECHNICAL_LABEL.test(code) && !NUMERIC_CODE.test(code)) return code;
    return `Poste n° ${index + 1}`;
  },

  /** Code métier affiché en colonne « Réf. » (jamais en désignation). */
  lineCode(line: BoqLineDTO): string {
    return String(line.btpCode ?? line.code ?? '').trim();
  },
};
