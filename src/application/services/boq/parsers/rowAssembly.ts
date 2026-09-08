/**
 * rowAssembly — « Structural Context-Aware Parsing » multi-format & multilingue.
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
 *  R3  Une SEULE colonne remplie → wrap typographique : le texte est concaténé
 *      dans la MÊME colonne de l'ancre (désignation, unité, régime fiscal…).
 *  R4  Désignation vide, plusieurs colonnes remplies (« Fourniture de » /
 *      « matériel ») → fusion HORIZONTALE colonne par colonne dans l'ancre.
 *  R5  Ligne isolée sans ancre → conservée telle quelle (le pipeline aval
 *      décidera si elle est valorisée).
 *
 * Les frontières (titres de sections en chiffres romains / lettres / 1.1,
 * en-tête documentaire, pied de page) réinitialisent l'ancre et ne sont jamais
 * absorbées. La détection est d'abord STRUCTURELLE (numéros, densité numérique,
 * longueur de texte) puis lexicale FR/EN/AR — un document arabe ou anglais est
 * traité sans traduction de mots-clés.
 *
 * Les lignes absorbées sont VIDÉES sur place (et non supprimées) afin que les
 * index de lignes restent stables pour les détections déjà effectuées
 * (enveloppe, en-tête, sections).
 */

/**
 * Frontières de FIN de tableau (FR / EN / AR) : dès qu'une de ces lignes
 * apparaît, plus aucune absorption n'est possible.
 */
const FOOTER_RX = new RegExp(
  [
    // Français
    'r[eé]capitulatif', 'conditions?\\s+g[eé]n[eé]rales?', 'validation', 'signature',
    'total\\s+ht', 'total\\s+ttc', 'total\\s+g[eé]n[eé]ral', 't\\.?v\\.?a\\.?\\b',
    'arr[eê]t[eé]\\s+le\\s+pr[eé]sent', 'factur-?x', 'en\\s?16931',
    // Anglais
    'summary', 'grand\\s+total', 'subtotal', 'terms?\\s+and\\s+conditions',
    'total\\s+(excl|incl)', '\\bvat\\b', 'signed?\\s+by',
    // Arabe
    'المجموع', 'الإجمالي', 'الشروط', 'التوقيع', 'الضريبة', 'ملخص',
  ].join('|'),
  'i',
);

/**
 * Métadonnées d'en-tête (projet, lot, émetteur, référence, date…) FR / EN / AR :
 * contexte documentaire, jamais une continuation de ligne DQE.
 */
const HEADER_META_RX = new RegExp(
  [
    '^(projet|lot\\s*n?[°o]?\\s*\\d|[eé]metteur|exp[eé]diteur|destinataire|client',
    '|ma[iî]tre\\s+d.?ouvrage|r[eé]f[eé]rence|date|devise|validit[eé]|appel\\s+d.?offres?',
    '|nif|adresse|t[eé]l|email|e-mail',
    '|project|reference|issuer|supplier|customer|currency|validity|address|phone|tender',
    '|المشروع|المرجع|التاريخ|العنوان|الهاتف|العملة|المورد|العميل',
    ')\\b',
  ].join(''),
  'i',
);

/** « ASSABA LOT 1 », « LOT 2 – NOUAKCHOTT » : code de lot / entête projet. */
const LOT_CODE_RX = /^[A-ZÀ-Ü][A-ZÀ-Ü\s'’-]{2,}\s*(?:[-–—]?\s*)?(LOT|BATCH)\s*\d+/i;

/**
 * Titre de section, toutes conventions confondues : « I. », « II », « A) »,
 * « 1.1 », « Lot 3 – … ». Utilisé pour réinitialiser l'ancre SANS vider la ligne
 * (le pipeline aval s'en sert comme lot / chapitre).
 */
const SECTION_NUMBER_RX = /^(?:[IVXLC]+|[A-H]|\d{1,2}(?:\.\d{1,2})+)\s*(?:[.)°]|\s+[-–—:]\s*|\s)/i;

/** Nombre « fort » : montant, quantité ou taux (≥ 3 chiffres ou décimales). */
const STRONG_NUMBER_RX = /\d[\d\u00A0\u202F\s.,]{2,}\d|\d+[.,]\d+/;

const isBlank = (v: string | undefined) => !String(v ?? '').trim();
const SEQUENCE_RE = /^\d{1,4}([.)]|\s*)$/;
const NUMERIC_RE = /\d/;

/** Compte les mots alphabétiques (latin ou arabe) d'une ligne. */
function wordCount(cells: string[]): number {
  return cells
    .join(' ')
    .split(/[\s|;]+/)
    .filter((w) => /[A-Za-zÀ-ÿ\u0600-\u06FF]{2,}/.test(w)).length;
}

/** Une ligne visuelle qui est du contexte documentaire et non une continuation. */
export function isContextualNoise(text: string): boolean {
  const v = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!v) return false;
  return FOOTER_RX.test(v) || HEADER_META_RX.test(v) || LOT_CODE_RX.test(v);
}

/**
 * Détection STRUCTURELLE (indépendante de la langue) d'une ligne de
 * récapitulatif : aucun numéro de poste, au moins deux nombres forts et très
 * peu de texte (« Total HT 29 985 000 / TVA 1 499 250 »).
 */
export function isStructuralSummaryRow(cells: string[], hasSequence: boolean): boolean {
  if (hasSequence) return false;
  const filled = cells.filter((c) => String(c ?? '').trim()).length;
  // Une ligne DQE complète remplit désignation + unité + qté + PU + montant :
  // un récapitulatif, lui, est creux (libellé + montants) et peu bavard.
  if (filled > 3) return false;
  const strong = cells.filter((c) => STRONG_NUMBER_RX.test(String(c ?? ''))).length;
  return strong >= 2 && wordCount(cells) <= 4;
}

/** Titre de section : numérotation romaine / lettre / 1.1 sans valeur chiffrée. */
export function isSectionTitleRow(cells: string[]): boolean {
  const filled = cells.map((c) => String(c ?? '').trim()).filter(Boolean);
  if (filled.length === 0 || filled.length > 2) return false;
  const first = filled[0];
  const bareNumbering = /^(?:[IVXLC]+|[A-H]|\d{1,2}(?:[.\-]\d{1,2})*)[.)°]?$/i.test(first);
  if (
    !bareNumbering &&
    !SECTION_NUMBER_RX.test(first) &&
    !/^(lot|section|chapitre|chapter|الفصل|القسم)\b/i.test(first)
  ) {
    return false;
  }
  // Un titre de section ne porte jamais de montant : la numérotation
  // elle-même (« 1.1 ») n'est pas un montant.
  const rest = bareNumbering ? filled.slice(1) : filled;
  return !rest.some((c) => STRONG_NUMBER_RX.test(c));
}

/**
 * Deux fragments OCR doivent-ils être collés sans espace ? Seul un mot
 * réellement coupé (« géotechniq » + « ue ») est recollé ; deux mots complets
 * (« dalle » + « support ») restent séparés.
 */
export function shouldGlue(prev: string, next: string): boolean {
  const a = String(prev ?? '').trim();
  const b = String(next ?? '').trim();
  if (!a || !b) return false;
  if (/-$/.test(a) || /^-/.test(b)) return true;
  const firstTokenB = b.split(/\s+/)[0] ?? '';
  const SHORT_WORDS = /^(et|ou|de|du|des|la|le|les|un|une|au|aux|en|par|sur|and|or|of|to|the|in|m|ml|kg|km)$/i;
  return (
    /[A-Za-zÀ-ÿ]$/.test(a) &&
    /^[a-zà-ÿ]{1,3}$/.test(firstTokenB) &&
    !SHORT_WORDS.test(firstTokenB) &&
    !/[.,;:]$/.test(a)
  );
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
  /**
   * Source de la grille : `grid` (Excel/Word — colonnes fiables) ou `fragments`
   * (PDF/OCR — cellules repliées). En mode `grid` la fusion horizontale est plus
   * prudente : les colonnes sont déjà correctement alignées.
   */
  gridKind?: 'grid' | 'fragments';
  /** Dernière ligne du tableau : au-delà, tout est du contexte (pied de page). */
  tableEndIdx?: number;
}

/** Fusionne `src` dans `target` sans perdre de contenu (concaténation si collision). */
function mergeHorizontally(target: string[], src: string[]): void {
  for (let i = 0; i < src.length; i++) {
    const value = String(src[i] ?? '').trim();
    if (!value) continue;
    const existing = String(target[i] ?? '').trim();
    if (!existing) { target[i] = value; continue; }
    target[i] = shouldGlue(existing, value)
      ? `${existing}${value}`
      : `${existing} ${value}`.replace(/\s+/g, ' ');
  }
}

/**
 * Recompose les lignes logiques d'un tableau. Retourne le nombre de lignes
 * absorbées (utile pour les avertissements du parseur).
 */
export function assembleLogicalRows(rows: string[][], ctx: AssemblyContext): number {
  const { headerIdx, designationIdx, numericIdx, consumed, isBoundary, tableEndIdx } = ctx;
  let anchor: string[] | null = null;
  let absorbed = 0;

  for (let i = 0; i < rows.length; i++) {
    if (i === headerIdx || consumed.has(i)) { anchor = null; continue; }
    const cells = rows[i];

    // R2 — ligne vide.
    if (cells.every(isBlank)) continue;

    // Au-delà de la dernière ligne de données : pied de page.
    if (typeof tableEndIdx === 'number' && i > tableEndIdx) { anchor = null; continue; }

    // Titre de section / lot : contexte, jamais une continuation.
    if (isBoundary(cells) || isSectionTitleRow(cells)) { anchor = null; continue; }

    const first = String(cells[0] ?? '').trim();
    const startsWithSequence = designationIdx > 0 && SEQUENCE_RE.test(first);

    const texts = cells.map((c) => String(c ?? '').trim()).filter(Boolean);
    // Bugs 2 & 3 — en-tête projet / lot et pied de page (récapitulatif,
    // conditions, totaux) restent du CONTEXTE : jamais fusionnés dans une ligne.
    // Détection structurelle d'abord (toutes langues), lexicale ensuite.
    if (
      isStructuralSummaryRow(cells, startsWithSequence) ||
      (texts.length && !startsWithSequence && texts.some((t) => isContextualNoise(t)))
    ) {
      anchor = null;
      continue;
    }

    // Un chiffre HORS désignation (quantité, PU, montant, TVA, unité chiffrée…)
    // signe toujours une ligne valorisée : jamais une continuation.
    const hasNumeric =
      numericIdx.some((idx) => NUMERIC_RE.test(String(cells[idx] ?? ''))) ||
      cells.some((c, idx) => idx !== designationIdx && NUMERIC_RE.test(String(c ?? '')));

    // R1 — nouvelle ligne logique.
    if (startsWithSequence || hasNumeric || !anchor) {
      anchor = cells;
      continue;
    }

    // R3 — wrap typographique : une SEULE colonne remplie, quelle qu'elle soit
    // (désignation, unité, régime fiscal, observations).
    const filledIdx = cells.findIndex((c) => !isBlank(c));
    const onlyOneColumn = filledIdx >= 0 && cells.every((c, idx) => idx === filledIdx || isBlank(c));
    if (onlyOneColumn) {
      const value = String(cells[filledIdx]).trim();
      const existing = String(anchor[filledIdx] ?? '').trim();
      anchor[filledIdx] = existing
        ? (shouldGlue(existing, value) ? `${existing}${value}` : `${existing} ${value}`.replace(/\s+/g, ' '))
        : value;
      rows[i] = cells.map(() => '');
      absorbed += 1;
      continue;
    }

    // R4 — suite de plusieurs colonnes (régime fiscal + unité, observations…).
    mergeHorizontally(anchor, cells);
    rows[i] = cells.map(() => '');
    absorbed += 1;
  }

  return absorbed;
}

/**
 * Pré-processeur multi-format : normalise une matrice en grille exploitable.
 *
 * - `grid` (Excel / Word / CSV) : les colonnes sont fiables, on ne fait que
 *   compléter les lignes courtes pour que tous les index existent.
 * - `fragments` (PDF / OCR) : idem, la reconstruction géométrique (bandes X/Y)
 *   est faite en amont par le parseur PDF ; ici on garantit l'homogénéité.
 */
export function normalizeGrid(matrix: string[][]): { rows: string[][]; kind: 'grid' | 'fragments' } {
  const width = matrix.reduce((max, r) => Math.max(max, r.length), 0);
  const ragged = matrix.filter((r) => r.length && r.length !== width).length;
  const kind: 'grid' | 'fragments' = ragged > matrix.length * 0.2 ? 'fragments' : 'grid';
  const rows = matrix.map((r) => {
    const next = r.map((c) => String(c ?? '').replace(/\s+/g, ' ').trim());
    while (next.length < width) next.push('');
    return next;
  });
  return { rows, kind };
}
