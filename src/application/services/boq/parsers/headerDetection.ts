/**
 * headerDetection — extraction de l'en-tête administratif des documents DQE/EDB.
 *
 * Les Expressions de Besoins réelles portent un bloc « Expéditeur / Destinataire »
 * au-dessus du tableau : l'expéditeur est le fournisseur (entreprise émettrice),
 * le destinataire est l'organisation maître d'ouvrage. Ces informations sont
 * nécessaires pour pré-remplir le fournisseur et l'organisation à l'import.
 */
import { detectSection } from './sectionDetection';

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

/** Client annoncé en ligne : « Devis pour : … », « Client : … », « À l'attention de : … ». */
const ORG_INLINE_RE =
  /^(?:devis\s+pour|devis\s+[àa]\s+l['’]attention\s+de|[àa]\s+l['’]attention\s+de|client|destinataire|ma[iî]tre\s+d['’]ouvrage|organisation)\s*[:\-]\s*([\s\S]+)$/i;
/** Raison sociale émettrice (généralement en pied de devis). */
const COMPANY_RE = /\b(soci[eé]t[eé]|sarl|suarl|s\.a\.r\.l|s\.a\.s|sas|spa|ets|etablissements?|group(?:e)?)\b/i;
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:[.,][\w-]+)+/;
const PHONE_RE = /\+?\d[\d\s().\-]{6,}\d/;

/** Alimente une partie depuis une cellule multi-lignes (raison sociale + coordonnées). */
function applyMultilineCell(party: DocumentParty, cell: string): void {
  for (const line of cell.split(/\r?\n/)) {
    const v = line.trim();
    if (!v || isPlaceholder(v)) continue;
    const email = v.match(EMAIL_RE);
    if (email && !party.email) party.email = email[0].replace(/,$/, '');
    const phone = v.match(PHONE_RE);
    if (phone && !party.phone && !email) party.phone = phone[0].trim();
    if (email || (phone && party.phone === phone?.[0]?.trim())) continue;
    if (!party.name) party.name = v;
    else party.address = party.address ? `${party.address}, ${v}` : v;
  }
}

/**
 * Heuristique pour les devis sans bloc « Expéditeur / Destinataire » explicite :
 * le client est détecté sur une étiquette en ligne, l'émetteur sur une raison
 * sociale (SARL/SUARL/SOCIETE…) où qu'elle apparaisse dans le document.
 */
function heuristicParties(rows: string[][]): Pick<DocumentParties, 'supplier' | 'organization'> {
  const supplier: DocumentParty = {};
  const organization: DocumentParty = {};
  for (const cells of rows) {
    for (const raw of cells ?? []) {
      const v = String(raw ?? '').trim();
      if (!v) continue;
      const inline = v.match(ORG_INLINE_RE);
      if (inline && !organization.name) { applyMultilineCell(organization, inline[1]); continue; }
      if (!supplier.name && COMPANY_RE.test(v)) applyMultilineCell(supplier, v);
    }
  }
  const clean = (p: DocumentParty) => (Object.keys(p).length ? p : undefined);
  return { supplier: clean(supplier), organization: clean(organization) };
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
    // Pas de bloc « Expéditeur / Destinataire » : devis type Excel où le client
    // est annoncé en ligne (« Devis pour : … ») et l'émetteur figure en pied.
    return { ...heuristicParties(rows), documentTitle: title, consumedRows };
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
    // Le bloc en-tête s'arrête dès la première section (LOT / PHASE / CHAPITRE).
    if (detectSection(cells)) break;
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
