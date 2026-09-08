/**
 * wrappedTableLayout — reconstruction des tableaux DQE dont CHAQUE cellule est
 * repliée sur plusieurs lignes visuelles (colonnes très étroites).
 *
 * Bug traité : sur ce type de PDF, le regroupement classique par Y produit des
 * lignes hétérogènes (« # Désignation fiscal PDF Génie Civil », « é Qté PDF »,
 * « 1 500 »…) et aucune ligne DQE n'est valorisée. Le numéro de poste et les
 * montants étant centrés verticalement, les débuts de libellé apparaissent
 * AVANT la ligne portant les valeurs : seul un regroupement par enregistrement
 * permet de recomposer la ligne métier.
 *
 * Principe :
 *  1. bandes de colonnes = positions de départ (x0) récurrentes des fragments ;
 *  2. lignes visuelles regroupées en ENREGISTREMENTS par les respirations
 *     verticales (gap > 2,4 × interligne médian) ;
 *  3. par bande, les fragments sont recollés dans l'ordre de lecture, sans
 *     espace lorsque le mot est coupé par la largeur de colonne (fragment qui
 *     touche le bord droit de la bande) ou lorsqu'un nombre est coupé après sa
 *     virgule décimale.
 *
 * Pur TypeScript — aucune dépendance React / Supabase.
 */

export interface LayoutItem { str: string; transform: number[]; width?: number }

export interface Band { x0: number; x1: number }
interface Fragment { text: string; x0: number; x1: number }

const Y_TOL = 3;
const X_TOL = 6;          // px — tolérance de regroupement des x0 en bandes
const GLUE_GAP = 1.5;     // px — fragments jointifs d'une même ligne
const WORD_GAP = 18;      // px — au-delà, deux cellules distinctes

const isNumericish = (s: string) => /^[\d\s.,%()]+$/.test(s) && /\d/.test(s);

interface VisualLine { y: number; items: LayoutItem[] }

/** Regroupe les items d'une page en lignes visuelles (haut → bas). */
function clusterLines(items: LayoutItem[]): VisualLine[] {
  const lines: VisualLine[] = [];
  for (const it of [...items].sort((a, b) => b.transform[5] - a.transform[5])) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - it.transform[5]) <= Y_TOL) last.items.push(it);
    else lines.push({ y: it.transform[5], items: [it] });
  }
  return lines;
}

/**
 * Bandes de colonnes = positions de départ récurrentes. Les paragraphes pleine
 * largeur de l'enveloppe documentaire, dont les x0 sont uniques, sont ainsi
 * ignorés au lieu de fusionner toutes les colonnes en une seule bande.
 */
export function detectBands(items: LayoutItem[]): Band[] {
  const starts = [...items].sort((a, b) => a.transform[4] - b.transform[4]);
  const clusters: { x0: number; x1: number; count: number }[] = [];
  for (const it of starts) {
    const x0 = it.transform[4];
    const x1 = x0 + (it.width ?? 0);
    const last = clusters[clusters.length - 1];
    if (last && x0 - last.x0 <= X_TOL) {
      last.x1 = Math.max(last.x1, x1);
      last.count += 1;
    } else {
      clusters.push({ x0, x1, count: 1 });
    }
  }
  return clusters.filter((c) => c.count >= 3).map(({ x0, x1 }) => ({ x0, x1 }));
}

/** Découpe les lignes en enregistrements selon les respirations verticales. */
function groupRecords(lines: VisualLine[]): number[][] {
  const gaps = lines.slice(1).map((l, i) => lines[i].y - l.y).filter((g) => g > 0);
  // Interligne de référence = gap le plus FRÉQUENT (hauteur de ligne), et non la
  // médiane : sur une page mêlant enveloppe (interlignes larges) et tableau
  // (interlignes serrés), la médiane écrase les respirations entre lignes DQE.
  const histogram = new Map<number, number>();
  gaps.forEach((g) => {
    const bucket = Math.max(2, Math.round(g / 2) * 2);
    histogram.set(bucket, (histogram.get(bucket) ?? 0) + 1);
  });
  const buckets = [...histogram.entries()].sort((a, b) => a[0] - b[0]);
  const maxCount = buckets.reduce((m, [, c]) => Math.max(m, c), 0);
  // Le plus PETIT interligne significatif fait référence : un pied de page aux
  // paragraphes espacés ne doit pas dicter la hauteur de ligne du tableau.
  const lineHeight = buckets.find(([, c]) => c >= maxCount * 0.6)?.[0] ?? 12;
  const threshold = lineHeight * 2.4;
  const records: number[][] = [];
  let current: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i > 0 && lines[i - 1].y - lines[i].y > threshold && current.length) {
      records.push(current);
      current = [];
    }
    current.push(i);
  }
  if (current.length) records.push(current);
  return records;
}

/** Recolle deux fragments d'une même bande (mot coupé, nombre coupé, mots). */
function joinFragments(prev: string, next: string, prevTouchesRightEdge: boolean): string {
  if (!prev) return next;
  if (!next) return prev;

  if (isNumericish(prev) && isNumericish(next)) {
    // « 1 500 » + « 000, » → « 1 500 000, » ; « 000, » + « 00 » → « 000,00 »
    if (/[.,]$/.test(prev) || /^[.,]/.test(next)) return `${prev}${next}`;
    return `${prev} ${next}`;
  }

  // Mot coupé par la largeur de colonne : le fragment précédent remplit la
  // bande jusqu'à son bord droit et la suite commence par une minuscule.
  if (prevTouchesRightEdge && /[A-Za-zÀ-ÿ]$/.test(prev) && /^[a-zà-ÿ]/.test(next)) {
    return `${prev}${next}`;
  }
  return `${prev} ${next}`;
}

/** Cellules d'une ligne visuelle (fragments jointifs recollés sans espace). */
function lineCells(line: VisualLine): Fragment[] {
  const cells: Fragment[] = [];
  for (const it of [...line.items].sort((a, b) => a.transform[4] - b.transform[4])) {
    const text = it.str.trim();
    if (!text) continue;
    const x0 = it.transform[4];
    const x1 = x0 + (it.width ?? 0);
    const last = cells[cells.length - 1];
    if (last && x0 - last.x1 <= WORD_GAP) {
      const glued = x0 - last.x1 <= GLUE_GAP || /-$/.test(last.text) || /^-/.test(text);
      last.text = glued ? `${last.text}${text}` : `${last.text} ${text}`;
      last.x1 = Math.max(last.x1, x1);
    } else {
      cells.push({ text, x0, x1 });
    }
  }
  return cells;
}

/**
 * Reconstruit la matrice d'une page « repliée ». Retourne [] si la page n'a pas
 * assez de structure tabulaire pour être exploitée.
 */
export function rebuildWrappedRows(items: LayoutItem[], sharedBands?: Band[]): string[][] {
  const usable = items.filter((i) => i && i.str && i.str.trim());
  if (usable.length < 5) return [];
  // Les bandes partagées garantissent le MÊME nombre de colonnes sur toutes les
  // pages : sans cela, une page sans enveloppe décale toutes ses cellules.
  const bands = sharedBands?.length ? sharedBands : detectBands(usable);
  if (bands.length < 3) return [];
  const lines = clusterLines(usable);
  const records = groupRecords(lines);

  const bandIndexOf = (x0: number): number => {
    let best = 0;
    for (let i = 0; i < bands.length; i++) if (x0 + X_TOL >= bands[i].x0) best = i;
    return best;
  };

  const matrix: string[][] = [];
  for (const record of records) {
    const perBand: Fragment[][] = bands.map(() => []);
    record.forEach((lineIdx) => {
      lineCells(lines[lineIdx]).forEach((cell) => perBand[bandIndexOf(cell.x0)].push(cell));
    });

    const row = perBand.map((fragments, bandIdx) => {
      if (!fragments.length) return '';
      const band = bands[bandIdx];
      const charWidth = Math.max(
        3,
        ...fragments.map((f) => (f.text.length ? (f.x1 - f.x0) / f.text.length : 0)),
      );
      let acc = fragments[0].text;
      for (let i = 1; i < fragments.length; i++) {
        const previous = fragments[i - 1];
        acc = joinFragments(acc, fragments[i].text, band.x1 - previous.x1 < charWidth * 0.6);
      }
      return acc.replace(/,\s+(?=\d)/g, ',').trim();
    });

    if (row.some((c) => c)) matrix.push(row);
  }
  return matrix;
}

/** Nombre de lignes réellement valorisées (≥ 3 cellules numériques). */
export function scoreValuedRows(matrix: string[][]): number {
  return matrix.filter((row) => row.filter((c) => isNumericish(String(c ?? ''))).length >= 3).length;
}
