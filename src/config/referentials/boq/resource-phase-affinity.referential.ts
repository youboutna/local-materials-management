/**
 * Resource ↔ Phase affinity — filtre les ressources proposées à la saisie
 * BOQ selon la phase active du projet (ex : Gros œuvre → béton/acier ;
 * Second œuvre → cloisons/revêtements).
 *
 * Les phases utilisent les codes WBS génériques ; l'appli mappe les codes
 * référentiels (SOMELEC / PNDS…) sur ces buckets via des mots-clés.
 */

export type ResourceAffinityBucket =
  | 'gros_oeuvre'
  | 'second_oeuvre'
  | 'vrd'
  | 'electricite'
  | 'plomberie'
  | 'finitions'
  | 'other';

/** Mots-clés matériau autorisés pour chaque bucket. */
export const RESOURCE_KEYWORDS: Record<ResourceAffinityBucket, RegExp> = {
  gros_oeuvre: /b[eé]ton|ciment|acier|ferraill|parpaing|agglo|brique|semelle|dalle|poutre|poteau|coffrage/i,
  second_oeuvre: /cloison|plaque\s*de\s*pl[aâ]tre|placo|isolant|menuis|porte|fen[eê]tre/i,
  vrd: /voirie|assainissement|drainage|regard|tranch[eé]e|caniveau/i,
  electricite: /c[aâ]ble|disjoncteur|prise|luminaire|tableau|gaine\s*[eé]lect/i,
  plomberie: /tube|tuyau|robinet|sanitaire|chauffe[-\s]?eau|vanne|per|multicouche/i,
  finitions: /peinture|enduit|carrelage|rev[eê]tement|fa[iï]ence|plafond/i,
  other: /.*/,
};

/** Devine le bucket d'affinité depuis un libellé de phase. */
export function bucketFromPhaseLabel(label: string | null | undefined): ResourceAffinityBucket {
  const s = (label ?? '').toLowerCase();
  if (/gros\s*[-\s]?œuvre|gros\s*oeuvre|structure|fondation/.test(s)) return 'gros_oeuvre';
  if (/second\s*[-\s]?œuvre|second\s*oeuvre|cloison|menuis/.test(s)) return 'second_oeuvre';
  if (/vrd|voirie|r[eé]seaux|assainissement/.test(s)) return 'vrd';
  if (/[eé]lectric/.test(s)) return 'electricite';
  if (/plomb|sanitaire|hydraulique/.test(s)) return 'plomberie';
  if (/finition|peinture|carrelage|rev[eê]tement/.test(s)) return 'finitions';
  return 'other';
}

/** Filtre une liste de ressources par bucket (matériau/main-d'œuvre/équipement). */
export function filterResourcesByBucket<T extends { name?: string; label?: string }>(
  resources: T[],
  bucket: ResourceAffinityBucket,
): T[] {
  if (bucket === 'other') return resources;
  const rx = RESOURCE_KEYWORDS[bucket];
  return resources.filter((r) => rx.test(r.name ?? r.label ?? ''));
}
