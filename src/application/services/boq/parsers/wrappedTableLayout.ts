/**
 * wrappedTableLayout — reconstruction des tableaux DQE dont CHAQUE cellule est
 * repliée sur plusieurs lignes visuelles (colonnes très étroites).
 *
 * Bug traité : sur ce type de PDF, le regroupement classique par Y produit des
 * lignes composées de morceaux hétérogènes (« # Désignation fiscal PDF Génie
 * Civil », « é Qté PDF », « 1 500 »…). Aucune ligne DQE n'est alors valorisée.
 *
 * Principe :
 *  1. bandes de colonnes détectées sur toute la page (intervalles X fusionnés) ;
 *  2. lignes visuelles regroupées en ENREGISTREMENTS par les respirations
 *     verticales (gap > 1,8 × interligne médian) ;
 *  3. par bande, les fragments sont recollés dans l'ordre de lecture, en
 *     recollant sans espace les mots coupés par la largeur de colonne
 *     (fragment qui touche le bord droit de la bande) et les nombres coupés
 *     après une virgule décimale.
 *
 * Pur TypeScript — aucune dépendance React / Supabase.
 */

export interface LayoutItem { str: string; transform: number[]; width?: number }

interface Band { x0: number; x1: number }
interface Fragment { text: string; x0: number; x1: number; line: number }

const Y_TOL = 3;
const X_GAP = 18;

const isNumericish = (s: string) => /^[\d\s.,%()]+$/.test(s) && /\d/.test(s);

/** Regroupe les items d'une page en lignes visuelles (haut → bas). */
function clusterLines(items: LayoutItem[]): LayoutItem[][] {
  const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5]);
  const lines: LayoutItem[][] = [];
  let currentY: number | null = null;
  let bucket: LayoutItem[] = [];
  for (const it of sorted) {
    const y = it.transform[5];
    if (currentY === null || Math.abs(y - currentY) <= Y_TOL) {
      bucket.push(it);
      currentY = currentY ?? y;
    } else {
      lines.push(bucket);
      bucket = [it];
      currentY = y;
    }
  }
  if (bucket.length) lines.push(bucket);
  return lines;
}

/** Bandes de colonnes : intervalles X fusionnés sur l'ensemble de la page. */
function detectBands(items: LayoutItem[]): Band[] {
  const intervals = items
    .map((i) => ({ x0: i.transform[4], x1: i.transform[4] + (i.width ?? 0) }))
    .sort((a, b) => a.x0 - b.x0);
  const bands: Band[] = [];
  for (const iv of intervals) {
    const last = bands[bands.length - 1];
    if (last && iv.x0 - last.x1 <= X_GAP) last.x1 = Math.max(last.x1, iv.x1);
    else bands.push({ ...iv });
  }
  return bands;
}

/** Découpe les lignes en enregistrements selon les respirations verticales. */
function groupRecords(lines: LayoutItem[][]): number[][] {
  const ys = lines.map((l) => Math.max(...l.map((i) => i.transform[5])));
  const gaps = ys.slice(1).map((y, i) => ys[i] - y).filter((g) => g > 0).sort((a, b) => a - b);
  const median = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 12;
  const threshold = median * 1.8;
  const records: number[][] = [];
  let current: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i > 0 && ys[i - 1] - ys[i] > threshold && current.length) {
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
  const lastChar = prev[prev.length - 1];
  const firstChar = next[0];

  if (isNumericish(prev) && isNumericish(next)) {
    // « 1 500 » + « 000, » → « 1 500 000, » ; « 000, » + « 00 » → « 000,00 »
    if (/[.,]$/.test(prev) || /^[.,]/.test(next)) return `${prev}${next}`;
    return `${prev} ${next}`;
  }

  // Mot coupé par la largeur de colonne : le fragment précédent remplit la
  // bande jusqu'au bord droit et la suite commence par une minuscule.
  if (prevTouchesRightEdge && /[A-Za-zÀ-ÿ]$/.test(lastChar) && /^[a-zà-ÿ]/.test(firstChar)) {
    return `${prev}${next}`;
  }
  return `${prev} ${next}`;
}

/**
 * Reconstruit la matrice d'une page « repliée ». Retourne [] si la page n'a
 * pas assez de structure pour être exploitée.
 */
export function rebuildWrappedRows(items: LayoutItem[]): string[][] {
  const usable = items.filter((i) => i && i.str && i.str.trim());
  if (usable.length < 5) return [];
  const lines = clusterLines(usable);
  const bands = detectBands(usable);
  if (bands.length < 3) return [];
  const records = groupRecords(lines);

  const bandIndexOf = (x0: number, x1: number): number => {
    let best = 0;
    let bestScore = -Infinity;
    bands.forEach((band, i) => {
      const overlap = Math.min(x1, band.x1) - Math.max(x0, band.x0);
      const score = overlap > 0 ? overlap : -Math.abs((x0 + x1) / 2 - (band.x0 + band.x1) / 2);
      if (score > bestScore) { bestScore = score; best = i; }
    });
    return best;
  };

  const matrix: string[][] = [];
  for (const record of records) {
    const perBand: Fragment[][] = bands.map(() => []);
    record.forEach((lineIdx) => {
      const line = [...lines[lineIdx]].sort((a, b) => a.transform[4] - b.transform[4]);
      // fragments contigus d'une même ligne → une seule cellule par bande
      const cells: Fragment[] = [];
      for (const it of line) {
        const x0 = it.transform[4];
        const x1 = x0 + (it.width ?? 0);
        const last = cells[cells.length - 1];
        if (last && x0 - last.x1 <= X_GAP) {
          last.text = `${last.text} ${it.str.trim()}`.trim();
          last.x1 = Math.max(last.x1, x1);
        } else {
          cells.push({ text: it.str.trim(), x0, x1, line: lineIdx });
        }
      }
      cells.forEach((cell) => {
        if (cell.text) perBand[bandIndexOf(cell.x0, cell.x1)].push(cell);
      });
    });

    const row = perBand.map((fragments, bandIdx) => {
      if (!fragments.length) return '';
      const band = bands[bandIdx];
      const charWidth = Math.max(
        3,
        ...fragments.map((f) => (f.text.length ? (f.x1 - f.x0) / f.text.length : 0)),
      );
      let acc = '';
      fragments.forEach((fragment, i) => {
        const previous = fragments[i - 1];
        const touches = !!previous && band.x1 - previous.x1 < charWidth * 1.2;
        acc = i === 0 ? fragment.text : joinFragments(acc, fragment.text, touches);
      });
      return acc.replace(/,\s+(?=\d)/g, ',').trim();
    });

    if (row.some((c) => c)) matrix.push(row);
  }
  return matrix;
}

/** Nombre de lignes réellement valorisées (≥ 3 cellules numériques). */
export function scoreValuedRows(matrix: string[][]): number {
  return matrix.filter(
    (row) => row.filter((c) => isNumericish(String(c ?? '')) && /\d/.test(String(c ?? ''))).length >= 3,
  ).length;
}
