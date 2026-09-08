/**
 * documentBlocks — segmentation d'un document DQE en trois blocs :
 *   1. EN-TÊTE  : émetteur, destinataire, n° DQE, date, projet, devise, normes ;
 *   2. TABLEAU  : lignes de prestation (à partir de l'en-tête de colonnes ou du
 *      premier numéro de séquence) ;
 *   3. PIED     : conditions générales, validation, signataire, mentions Factur-X.
 *
 * Bug corrigé : sur un PDF/OCR dont l'en-tête de colonnes est mal reconnu, les
 * lignes de l'en-tête documentaire (« Direction Générale de l'Électricité »,
 * « Carrefour SABAH Nouakchott ») étaient importées comme LIGNES DQE. Elles
 * sont désormais rattachées au bloc EN-TÊTE et lues uniquement comme contexte.
 *
 * Pur TypeScript — aucune dépendance React / Supabase.
 */

export interface DocumentBlocks {
  /** Index des lignes appartenant au bloc en-tête (à exclure des lignes DQE). */
  headerRows: number[];
  /** Première ligne du bloc tableau. */
  tableStart: number;
}

const clean = (v: unknown): string => String(v ?? '').replace(/\s+/g, ' ').trim();

/** Premier numéro de séquence d'une ligne de tableau (« 1 », « 1. », « 01 »). */
const SEQ_RX = /^(\d{1,3})\s*[.)°-]?$/;
/** Ligne dont la première cellule est « 1 Câble … » (colonnes fusionnées). */
const SEQ_INLINE_RX = /^(\d{1,3})\s*[.)-]?\s+\D{3,}/;
const NUMERIC_RX = /\d[\d\s.,]*\d|\d/;

/** Vrai si la ligne ressemble à une ligne de prestation numérotée et valorisée. */
export function looksLikeTableRow(cells: unknown[]): boolean {
  const texts = (cells ?? []).map(clean);
  const firstIdx = texts.findIndex(Boolean);
  if (firstIdx < 0) return false;
  const first = texts[firstIdx];
  const rest = texts.slice(firstIdx + 1).filter(Boolean);
  const numbered = SEQ_RX.test(first) || SEQ_INLINE_RX.test(first);
  if (!numbered) return false;
  // Une ligne de tableau porte au moins une valeur chiffrée (qté, P.U., montant)
  // en dehors de la cellule de numéro/désignation.
  return rest.some((t) => NUMERIC_RX.test(t) && !/^\d{4}-\d{2}-\d{2}$/.test(t));
}

/**
 * Segmente la matrice. `headerIdx` = ligne d'en-tête de colonnes détectée
 * (négative si absente). Les lignes de section (LOT / CHAPITRE) situées avant
 * le tableau restent hors bloc en-tête pour conserver le contexte de lot.
 */
export function segmentDocumentBlocks(
  matrix: unknown[][],
  opts: { headerIdx: number; isSectionRow?: (cells: unknown[]) => boolean },
): DocumentBlocks {
  const isSection = opts.isSectionRow ?? (() => false);
  let tableStart: number;

  if (opts.headerIdx >= 0) {
    tableStart = opts.headerIdx + 1;
  } else {
    const found = matrix.findIndex((cells) => looksLikeTableRow(cells));
    tableStart = found >= 0 ? found : 0;
  }

  const headerRows: number[] = [];
  for (let i = 0; i < tableStart; i++) {
    const cells = matrix[i] ?? [];
    if (i === opts.headerIdx) continue;
    if (isSection(cells)) continue;
    if (!cells.some((c) => clean(c))) continue;
    headerRows.push(i);
  }
  return { headerRows, tableStart };
}
