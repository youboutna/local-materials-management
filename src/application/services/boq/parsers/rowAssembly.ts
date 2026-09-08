/**
 * rowAssembly — « Structural Context-Aware Parsing ».
 *
 * Un tableau DQE issu d'un PDF/OCR produit des lignes VISUELLES : un libellé
 * long, un régime fiscal ou une unité peuvent occuper plusieurs lignes
 * typographiques alors qu'ils appartiennent à UNE SEULE ligne logique.
 *
 * Ce module recompose les lignes logiques en appliquant des règles de contexte :
 *
 *  R1  Première cellule = numéro de séquence (1, 2, 3…) ou ligne portant des
 *      valeurs numériques (Qté / PU / Montant) → nouvelle ligne logique (ancre).
 *  R2  Ligne entièrement vide → ignorée.
 *  R3  Seule la colonne Désignation est remplie → wrap typographique : le texte
 *      est concaténé à la désignation de l'ancre.
 *  R4  Désignation vide, autres colonnes remplies (« Fourniture de » /
 *      « matériel ») → fusion HORIZONTALE colonne par colonne dans l'ancre.
 *  R5  Ligne isolée sans ancre → conservée telle quelle (le pipeline aval
 *      décidera si elle est valorisée).
 *
 * Les lignes absorbées sont VIDÉES sur place (et non supprimées) afin que les
 * index de lignes restent stables pour les détections déjà effectuées
 * (enveloppe, en-tête, sections).
 */

/**
 * Frontières de FIN de tableau : dès qu'une de ces lignes apparaît, plus aucune
 * absorption n'est possible (récapitulatif, conditions, validation, totaux).
 * Sans cette garde, le pied de page était fusionné dans la dernière ligne.
 */
const FOOTER_RX =
  /^(r[eé]capitulatif|conditions?\s+g[eé]n[eé]rales?|validation|signature|total\s+ht|total\s+ttc|total\s+g[eé]n[eé]ral|t\.?v\.?a\.?\b|arr[eê]t[eé]\s+le\s+pr[eé]sent|factur-?x|en\s?16931)/i;

/**
 * Métadonnées d'en-tête (projet, lot, émetteur, référence, date…) : contexte
 * documentaire, jamais une continuation de ligne DQE.
 */
const HEADER_META_RX =
  /^(projet|lot\s*n?[°o]?\s*\d|[eé]metteur|exp[eé]diteur|destinataire|client|ma[iî]tre\s+d.?ouvrage|r[eé]f[eé]rence|date|devise|validit[eé]|appel\s+d.?offres?|nif|adresse|t[eé]l|email|e-mail)\b/i;

/** « ASSABA LOT 1 », « LOT 2 – NOUAKCHOTT » : code de lot / entête projet. */
const LOT_CODE_RX = /^[A-ZÀ-Ü][A-ZÀ-Ü\s'’-]{2,}\s*(?:[-–—]?\s*)?LOT\s*\d+/i;

/** Une ligne visuelle qui est du contexte documentaire et non une continuation. */
export function isContextualNoise(text: string): boolean {
  const v = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!v) return false;
  return FOOTER_RX.test(v) || HEADER_META_RX.test(v) || LOT_CODE_RX.test(v);
}

export interface AssemblyContext {
  /** Index de la ligne d'en-tête (jamais fusionnée). */
  headerIdx: number;
  /** Index de la colonne Désignation dans les lignes alignées. */
  designationIdx: number;
  /** Index des colonnes numériques (Qté / PU / Montant / TVA). */
  numericIdx: number[];
  /** Lignes déjà consommées (enveloppe, en-tête administratif). */
  consumed: Set<number>;
  /** Ligne de section / titre de lot → réinitialise l'ancre. */
  isBoundary: (cells: string[]) => boolean;
}

const isBlank = (v: string | undefined) => !String(v ?? '').trim();
const SEQUENCE_RE = /^\d{1,4}([.)]|\s*)$/;
const NUMERIC_RE = /\d/;

/** Fusionne `src` dans `target` sans perdre de contenu (concaténation si collision). */
function mergeHorizontally(target: string[], src: string[]): void {
  for (let i = 0; i < src.length; i++) {
    const value = String(src[i] ?? '').trim();
    if (!value) continue;
    const existing = String(target[i] ?? '').trim();
    target[i] = existing ? `${existing} ${value}`.replace(/\s+/g, ' ') : value;
  }
}

/**
 * Recompose les lignes logiques d'un tableau. Retourne le nombre de lignes
 * absorbées (utile pour les avertissements du parseur).
 */
export function assembleLogicalRows(rows: string[][], ctx: AssemblyContext): number {
  const { headerIdx, designationIdx, numericIdx, consumed, isBoundary } = ctx;
  let anchor: string[] | null = null;
  let absorbed = 0;

  for (let i = 0; i < rows.length; i++) {
    if (i === headerIdx || consumed.has(i)) { anchor = null; continue; }
    const cells = rows[i];

    // R2 — ligne vide.
    if (cells.every(isBlank)) continue;

    // Titre de section / lot : contexte, jamais une continuation.
    if (isBoundary(cells)) { anchor = null; continue; }

    const texts = cells.map((c) => String(c ?? '').trim()).filter(Boolean);
    // Bugs 2 & 3 — en-tête projet / lot et pied de page (récapitulatif,
    // conditions, totaux) restent du CONTEXTE : jamais fusionnés dans une ligne.
    if (texts.length && texts.some((t) => isContextualNoise(t))) { anchor = null; continue; }

    const first = String(cells[0] ?? '').trim();
    const designation = String(cells[designationIdx] ?? '').trim();
    // Un chiffre HORS désignation (quantité, PU, montant, TVA, unité chiffrée…)
    // signe toujours une ligne valorisée : jamais une continuation.
    const hasNumeric =
      numericIdx.some((idx) => NUMERIC_RE.test(String(cells[idx] ?? ''))) ||
      cells.some((c, idx) => idx !== designationIdx && NUMERIC_RE.test(String(c ?? '')));
    const startsWithSequence = designationIdx > 0 && SEQUENCE_RE.test(first);

    // R1 — nouvelle ligne logique.
    if (startsWithSequence || hasNumeric || !anchor) {
      anchor = cells;
      continue;
    }


    // R3 — wrap typographique du libellé (seule la désignation est remplie).
    const onlyDesignation = designation && cells.every((c, idx) => idx === designationIdx || isBlank(c));
    if (onlyDesignation) {
      anchor[designationIdx] = `${String(anchor[designationIdx] ?? '')} ${designation}`
        .replace(/\s+/g, ' ')
        .trim();
      rows[i] = cells.map(() => '');
      absorbed += 1;
      continue;
    }

    // R4 — suite d'une autre colonne (régime fiscal, unité, observations…).
    mergeHorizontally(anchor, cells);
    rows[i] = cells.map(() => '');
    absorbed += 1;
  }

  return absorbed;
}
