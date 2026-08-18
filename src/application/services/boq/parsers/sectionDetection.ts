/**
 * sectionDetection — détection des lignes « section » (LOT / CHAPITRE / SECTION)
 * dans les documents DQE tabulaires (PDF, Excel, CSV).
 *
 * Les DQE réels n'ont pas de colonne « Lot » : le lot est porté par une ligne
 * titre au-dessus du bloc de lignes. Ce module extrait ce contexte pour
 * l'injecter dans chaque ligne (colonnes `Lot` / `Lot libellé`), ce qui permet
 * ensuite à `resolveDqeLot` (référentiel de dispatch) de retrouver le lot.
 */

/** Colonnes synthétiques injectées par les parseurs. */
export const SECTION_LOT_COLUMN = 'Lot';
export const SECTION_LABEL_COLUMN = 'Lot libellé';

const SECTION_RE = /^\s*(?:lot|chapitre|section|partie)\s*[:\-]?\s*([A-Z]?\d+[A-Za-z]?)\s*[:.\-–]?\s*(.*)$/i;

export interface DetectedSection {
  /** Clé normalisée du lot (ex. `L2`). */
  lot: string;
  /** Libellé complet de la section (ex. `LOT L2: POSE CONDUCTEURS HT`). */
  label: string;
}

/**
 * Détecte une ligne de section. Une ligne de section n'a pas de montant
 * exploitable dans ses autres cellules (sinon c'est un total de lot).
 */
export function detectSection(cells: (string | number | null | undefined)[]): DetectedSection | null {
  const first = String(cells[0] ?? '').trim();
  if (!first) return null;
  const match = first.match(SECTION_RE);
  if (!match) return null;
  const raw = match[1].toUpperCase();
  const lot = /^\d/.test(raw) ? `L${raw}` : raw;
  const title = (match[2] ?? '').trim();
  return { lot, label: title ? `Lot ${lot} – ${title}` : `Lot ${lot}` };
}

/** Vrai si la ligne est une répétition de l'en-tête du tableau. */
export function isRepeatedHeaderRow(cells: (string | number | null | undefined)[], header: string[]): boolean {
  const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
  const nonEmpty = cells.filter((c) => norm(c));
  if (nonEmpty.length < 1) return false;
  return nonEmpty.every((c) => header.some((h) => norm(h) && norm(h) === norm(c)));
}
