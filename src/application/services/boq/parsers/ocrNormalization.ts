/**
 * ocrNormalization — réparation des cellules abîmées par l'extraction PDF / OCR.
 *
 * Bug traité : les colonnes étroites d'un DQE coupent les mots au milieu
 * (« Fournit ure de matière I », « forfa it », « Unit é »). Ces valeurs ne
 * correspondent alors plus aux référentiels (régimes fiscaux, unités) et la
 * ligne est classée à tort. On recolle donc chaque cellule sur un vocabulaire
 * canonique par similarité, avant toute interprétation métier.
 *
 * Pur TypeScript — aucune dépendance React / Supabase.
 */

/** Vocabulaire canonique : régimes fiscaux et unités rencontrés dans les DQE. */
const VOCABULARY: string[] = [
  // Régimes fiscaux / natures de prestation
  'Fourniture de matériel',
  'Fourniture de matériaux',
  'Travaux BTP',
  'Prestation de service',
  'Prestation de services',
  'Location de matériel',
  'Main d’œuvre',
  // Unités
  'forfait',
  'unité',
  'Ens.',
  'ensemble',
  'mois',
  'jour',
  'jours',
  'heure',
  'heures',
  'tonne',
  'kg',
  'ml',
  'm²',
  'm³',
  'km',
  // Libellés d'en-tête
  'Désignation',
  'Régime fiscal',
];

const deaccent = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
/** Les exposants deviennent des chiffres : `m²`/`m³` ne doivent pas se réduire à `m`. */
const key = (s: string): string =>
  deaccent(s)
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');


const VOCAB_INDEX = new Map<string, string>(VOCABULARY.map((v) => [key(v), v]));

/** Distance de Levenshtein (implémentation itérative, cellules courtes). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

const similarity = (a: string, b: string): number =>
  1 - levenshtein(a, b) / Math.max(a.length, b.length, 1);

/**
 * Répare une cellule : espaces parasites internes, artefact « … PDF » des
 * en-têtes, et recollage sur le vocabulaire canonique (seuil 0,84).
 */
export function repairOcrCell(value: unknown): string {
  const raw = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';

  // Seules les cellules purement textuelles sont réparées : une cellule portant
  // un chiffre peut être une valeur (ou plusieurs valeurs collées par
  // l'extraction) et doit rester intacte pour la reconstruction arithmétique.
  const cleaned = raw.replace(/\s+PDF$/i, '').trim() || raw;
  if (/\d/.test(cleaned) && !/²|³/.test(cleaned)) return cleaned;

  const k = key(cleaned);
  if (!k) return cleaned;


  const exact = VOCAB_INDEX.get(k);
  if (exact) return exact;

  // Les cellules courtes (`m`, `m³`, `Ens.`) ne sont jamais rapprochées par
  // similarité : le risque de confondre deux unités voisines est trop élevé.
  if (k.length < 5) return cleaned;

  let best: { canonical: string; score: number } | null = null;
  for (const [vk, canonical] of VOCAB_INDEX) {
    // Écart de longueur trop grand → jamais le même terme.
    if (Math.abs(vk.length - k.length) > Math.max(2, Math.round(vk.length * 0.25))) continue;
    const score = similarity(k, vk);
    if (!best || score > best.score) best = { canonical, score };
  }
  if (best && best.score >= 0.84) return best.canonical;
  return cleaned;
}

/** Répare toutes les cellules d'une matrice extraite. */
export function repairOcrMatrix(matrix: string[][]): string[][] {
  return matrix.map((row) => row.map((cell) => repairOcrCell(cell)));
}
