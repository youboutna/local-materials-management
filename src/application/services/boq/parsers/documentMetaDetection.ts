/**
 * documentMetaDetection — extraction des métadonnées documentaires d'un DQE
 * structuré en feuilles « clé / valeur » (Résumé & En-tête, Conditions…).
 *
 * Les DQE réels exportés par la plateforme portent une feuille de synthèse
 * (Référence DQE, TypeCode Factur-X, Devise, Validité, Émetteur/Destinataire,
 * Référence & Titre du projet, Budget) puis une feuille « Détail des Postes ».
 * Ce module lit ces couples label→valeur, quelle que soit la feuille.
 *
 * Pur TypeScript — aucune dépendance React / Supabase.
 */
import type { DocumentParties, DocumentParty } from './headerDetection';

export interface DocumentMeta {
  /** Référence du document (ex. DQE-2026-0826-PPGASDL1). */
  reference?: string;
  /** Code type Factur-X / EN 16931 (310 = devis, 380 = facture…). */
  typeCode?: string;
  issueDate?: string;
  currency?: string;
  validity?: string;
  /** Référence du marché / projet, utilisée pour rattacher le document. */
  projectReference?: string;
  projectTitle?: string;
  projectStatus?: string;
  projectBudget?: number;
  marketType?: string;
  selectionMode?: string;
  description?: string;
}

type Row = (string | number | null)[];

const META_PATTERNS: { key: keyof DocumentMeta; rx: RegExp; numeric?: boolean }[] = [
  { key: 'reference', rx: /^r[eé]f[eé]rence\s+(dqe|document|devis|facture)/i },
  { key: 'typeCode', rx: /^type\s*code$/i },
  { key: 'issueDate', rx: /^date\s+d.?[eé]mission/i },
  { key: 'currency', rx: /^devise$/i },
  { key: 'validity', rx: /^validit[eé]/i },
  { key: 'projectReference', rx: /^r[eé]f[eé]rence\s+projet/i },
  { key: 'projectTitle', rx: /^titre\s+du\s+projet/i },
  { key: 'projectStatus', rx: /^statut$/i },
  { key: 'projectBudget', rx: /^budget\s+total/i, numeric: true },
  { key: 'marketType', rx: /^type\s+de\s+march[eé]/i },
  { key: 'selectionMode', rx: /^mode\s+de\s+s[eé]lection/i },
  { key: 'description', rx: /^description$/i },
];

/** « Émetteur - Organisation », « Destinataire - NIF », « Client / Adresse »… */
const PARTY_PATTERNS: { side: 'supplier' | 'organization'; field: keyof DocumentParty; rx: RegExp }[] = [
  { side: 'supplier', field: 'name', rx: /^([eé]metteur|exp[eé]diteur|fournisseur)\s*[-–/:]\s*(organisation|raison\s*sociale|nom)/i },
  { side: 'supplier', field: 'taxId', rx: /^([eé]metteur|exp[eé]diteur|fournisseur)\s*[-–/:]\s*(nif|ninea|rc)/i },
  { side: 'supplier', field: 'address', rx: /^([eé]metteur|exp[eé]diteur|fournisseur)\s*[-–/:]\s*adresse/i },
  { side: 'supplier', field: 'email', rx: /^([eé]metteur|exp[eé]diteur|fournisseur)\s*[-–/:]\s*(e-?mail|courriel)/i },
  { side: 'supplier', field: 'phone', rx: /^([eé]metteur|exp[eé]diteur|fournisseur)\s*[-–/:]\s*(t[eé]l|phone)/i },
  { side: 'organization', field: 'name', rx: /^(destinataire|client|ma[iî]tre\s*d.?ouvrage)\s*[-–/:]\s*(organisation|raison\s*sociale|nom)/i },
  { side: 'organization', field: 'taxId', rx: /^(destinataire|client|ma[iî]tre\s*d.?ouvrage)\s*[-–/:]\s*(nif|ninea|rc)/i },
  { side: 'organization', field: 'address', rx: /^(destinataire|client|ma[iî]tre\s*d.?ouvrage)\s*[-–/:]\s*adresse/i },
  { side: 'organization', field: 'email', rx: /^(destinataire|client|ma[iî]tre\s*d.?ouvrage)\s*[-–/:]\s*(e-?mail|courriel)/i },
  { side: 'organization', field: 'phone', rx: /^(destinataire|client|ma[iî]tre\s*d.?ouvrage)\s*[-–/:]\s*(t[eé]l|phone)/i },
];

function firstValue(row: Row, fromIndex: number): string {
  for (let i = fromIndex; i < row.length; i++) {
    const v = row[i];
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return '';
}

function toNumber(value: string): number | undefined {
  const n = Number(value.replace(/[^\d.,-]/g, '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Lit une matrice (feuille) et complète `meta` / `parties` avec les couples
 * label → valeur reconnus. Idempotent : ne remplace jamais une valeur déjà lue.
 */
export function extractDocumentMeta(
  matrix: Row[],
  meta: DocumentMeta = {},
  parties: { supplier: DocumentParty; organization: DocumentParty } = { supplier: {}, organization: {} },
): { meta: DocumentMeta; parties: { supplier: DocumentParty; organization: DocumentParty } } {
  for (const row of matrix) {
    if (!row || !row.length) continue;
    for (let ci = 0; ci < row.length; ci++) {
      const cell = row[ci];
      if (cell == null) continue;
      const label = String(cell).trim();
      if (!label || label.length > 60) continue;

      const metaHit = META_PATTERNS.find((p) => p.rx.test(label));
      if (metaHit) {
        const value = firstValue(row, ci + 1);
        if (value && meta[metaHit.key] == null) {
          if (metaHit.numeric) meta.projectBudget = toNumber(value);
          else (meta[metaHit.key] as string) = value;
        }
        continue;
      }

      const partyHit = PARTY_PATTERNS.find((p) => p.rx.test(label));
      if (partyHit) {
        const value = firstValue(row, ci + 1);
        const target = parties[partyHit.side];
        if (value && target[partyHit.field] == null) target[partyHit.field] = value;
      }
    }
  }
  return { meta, parties };
}

/** Fusionne les parties issues des métadonnées avec celles détectées par heuristique. */
export function mergeParties(
  base: DocumentParties | undefined,
  fromMeta: { supplier: DocumentParty; organization: DocumentParty },
): DocumentParties {
  const merge = (a?: DocumentParty, b?: DocumentParty): DocumentParty | undefined => {
    const merged = { ...(b ?? {}), ...(a ?? {}) };
    // Une raison sociale générique détectée par heuristique ne doit pas primer.
    if (b?.name && (!a?.name || /^organisation$|^fournisseur$/i.test(a.name))) merged.name = b.name;
    return Object.keys(merged).length ? merged : undefined;
  };
  return {
    supplier: merge(base?.supplier, fromMeta.supplier),
    organization: merge(base?.organization, fromMeta.organization),
    documentTitle: base?.documentTitle,
    consumedRows: base?.consumedRows ?? [],
  };
}
