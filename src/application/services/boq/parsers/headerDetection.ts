/**
 * headerDetection — extraction de l'en-tête administratif des documents DQE/EDB.
 *
 * Les Expressions de Besoins réelles portent un bloc « Expéditeur / Destinataire »
 * au-dessus du tableau : l'expéditeur est le fournisseur (entreprise émettrice),
 * le destinataire est l'organisation maître d'ouvrage. Ces informations sont
 * nécessaires pour pré-remplir le fournisseur et l'organisation à l'import.
 */

export interface DocumentParty {
  name?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  address?: string;
  contact?: string;
}

export interface DocumentParties {
  /** Expéditeur / émetteur → fournisseur. */
  supplier?: DocumentParty;
  /** Destinataire → organisation (maître d'ouvrage). */
  organization?: DocumentParty;
  /** Titre du document (première ligne significative hors bloc parties). */
  documentTitle?: string;
  /** Index des lignes consommées par l'en-tête (à exclure des lignes DQE). */
  consumedRows: number[];
}

const SUPPLIER_RE = /^(exp[eé]diteur|[eé]metteur|fournisseur|soumissionnaire|entreprise)\s*:?\s*$/i;
const ORG_RE = /^(destinataire|client|ma[iî]tre d['’]ouvrage|organisation|organisme)\s*:?\s*$/i;

const FIELD_PATTERNS: { key: keyof DocumentParty; rx: RegExp }[] = [
  { key: 'taxId', rx: /^(nif|n\.?i\.?f\.?|ninea|rc|registre)\s*[:\-]\s*(.+)$/i },
  { key: 'phone', rx: /^(t[eé]l|tel|t[eé]l[eé]phone|phone|mobile)\.?\s*[:\-]\s*(.+)$/i },
  { key: 'email', rx: /^(e?-?mail|courriel)\s*[:\-]\s*(.+)$/i },
  { key: 'address', rx: /^(adresse|address|si[eè]ge)\s*[:\-]\s*(.+)$/i },
  { key: 'contact', rx: /^(contact|interlocuteur|responsable)\s*[:\-]\s*(.+)$/i },
];

const PLACEHOLDER_RE = /^\[?[àa]\s*compl[eé]ter\]?$/i;

function isPlaceholder(v: string): boolean {
  return !v || PLACEHOLDER_RE.test(v.trim());
}

function applyCell(party: DocumentParty, cell: string): void {
  const value = cell.trim();
  if (!value) return;
  for (const { key, rx } of FIELD_PATTERNS) {
    const m = value.match(rx);
    if (m) {
      const raw = m[2].trim();
      if (!isPlaceholder(raw)) party[key] = raw;
      return;
    }
  }
  // Ligne sans étiquette → raison sociale (ou suite de la raison sociale).
  if (isPlaceholder(value)) return;
  party.name = party.name ? `${party.name} ${value}`.trim() : value;
}

/**
 * Analyse les premières lignes d'un document pour en extraire les parties.
 * `rows` = lignes/cellules issues du clustering du parseur (PDF, Excel, CSV).
 * `stopIndex` = index de l'en-tête du tableau DQE (exclu du balayage).
 */
export function extractDocumentParties(rows: string[][], stopIndex?: number): DocumentParties {
  const limit = stopIndex != null && stopIndex >= 0 ? stopIndex : Math.min(rows.length, 20);
  const consumedRows: number[] = [];
  let supplierIdx = -1;
  let organizationIdx = -1;
  let anchorRow = -1;

  for (let i = 0; i < limit; i++) {
    const cells = rows[i] ?? [];
    cells.forEach((cell, ci) => {
      const v = String(cell ?? '').trim();
      if (SUPPLIER_RE.test(v)) { supplierIdx = ci; anchorRow = i; }
      if (ORG_RE.test(v)) { organizationIdx = ci; anchorRow = i; }
    });
    if (anchorRow === i && (supplierIdx >= 0 || organizationIdx >= 0)) break;
  }

  if (anchorRow < 0) {
    const title = rows.slice(0, limit).map((r) => String(r[0] ?? '').trim()).find((v) => v.length > 8);
    return { documentTitle: title, consumedRows };
  }

  consumedRows.push(anchorRow);
  const supplier: DocumentParty = {};
  const organization: DocumentParty = {};
  // Frontière de colonnes : tout ce qui est à droite de l'index destinataire
  // appartient au destinataire (mise en page à deux colonnes).
  const boundary = organizationIdx >= 0 ? organizationIdx : Number.POSITIVE_INFINITY;

  let documentTitle: string | undefined;
  for (let i = anchorRow + 1; i < limit; i++) {
    const cells = (rows[i] ?? []).map((c) => String(c ?? ''));
    const nonEmpty = cells.filter((c) => c.trim());
    if (!nonEmpty.length) continue;
    const labelled = nonEmpty.some((c) => FIELD_PATTERNS.some(({ rx }) => rx.test(c.trim())));
    // Une ligne unique non étiquetée après le bloc = titre du document.
    if (!labelled && nonEmpty.length === 1 && (supplier.name || organization.name)) {
      documentTitle = documentTitle ?? nonEmpty[0].trim();
      consumedRows.push(i);
      continue;
    }
    cells.forEach((cell, ci) => {
      if (!cell.trim()) return;
      applyCell(ci >= boundary ? organization : supplier, cell);
    });
    consumedRows.push(i);
  }

  const clean = (p: DocumentParty) => (Object.keys(p).length ? p : undefined);
  return {
    supplier: clean(supplier),
    organization: clean(organization),
    documentTitle,
    consumedRows,
  };
}
