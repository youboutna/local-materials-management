/**
 * earthwork-metre.referential — profils de métré terrassement / tranchée /
 * remblai / fouille et règles de recommandation associées.
 *
 * Scénarios 3 et 8 du parser intelligent DQE : une ligne saisie en mètre
 * linéaire (« Terrassement et fouilles (Réseaux) … 3 500 m ») doit produire un
 * volume en m³ via la section forfaitaire du profil, puis des recommandations
 * dérivées (remblai, drainage, regards).
 *
 * Aucune valeur n'est codée dans l'UI ni dans les parseurs : tout passe par ce
 * référentiel (code unique + libellés fr/ar/en).
 */

export type EarthworkProfileCode = 'TERRASSEMENT' | 'TRANCHEE' | 'REMBLAI' | 'FOUILLE';

export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface EarthworkRecommendationRule {
  /** Code de l'ouvrage recommandé. */
  code: string;
  label_fr: string;
  label_ar: string;
  label_en: string;
  /** Base de calcul : volume détecté (m³) ou quantité linéaire source (m/ml). */
  base: 'volume' | 'linear';
  /** Coefficient appliqué à la base. */
  coefficient: number;
  unit: string;
  priority: RecommendationPriority;
}

export interface EarthworkProfile {
  code: EarthworkProfileCode;
  label_fr: string;
  label_ar: string;
  label_en: string;
  /** Mots-clés (libellé de ligne) déclenchant le profil. */
  keywords: string[];
  /** Largeur forfaitaire de la tranchée / emprise (m). */
  width: number;
  /** Profondeur forfaitaire (m). */
  depth: number;
  /** Unités linéaires acceptées pour le déclenchement du calcul volumique. */
  linearUnits: string[];
  recommendations: EarthworkRecommendationRule[];
}

export const EARTHWORK_PROFILES: EarthworkProfile[] = [
  {
    code: 'TERRASSEMENT',
    label_fr: 'Terrassement général',
    label_ar: 'أعمال الحفر العامة',
    label_en: 'General earthworks',
    keywords: ['terrassement', 'excavation', 'deblai', 'déblai', 'decapage', 'décapage'],
    width: 1.5,
    depth: 2.5,
    linearUnits: ['m', 'ml', 'mL'],
    recommendations: [
      { code: 'REMBLAI', label_fr: 'Remblai compacté', label_ar: 'ردم مضغوط', label_en: 'Compacted backfill', base: 'volume', coefficient: 0.3, unit: 'm3', priority: 'HIGH' },
      { code: 'DRAINAGE', label_fr: 'Drainage', label_ar: 'تصريف', label_en: 'Drainage', base: 'linear', coefficient: 2.0016, unit: 'm', priority: 'MEDIUM' },
      { code: 'REGARDS', label_fr: 'Regards de visite', label_ar: 'غرف تفتيش', label_en: 'Inspection chambers', base: 'linear', coefficient: 0.02, unit: 'u', priority: 'LOW' },
    ],
  },
  {
    code: 'TRANCHEE',
    label_fr: 'Tranchée réseaux',
    label_ar: 'خندق الشبكات',
    label_en: 'Utility trench',
    keywords: ['tranchee', 'tranchée', 'saignee', 'saignée', 'caniveau technique'],
    width: 0.8,
    depth: 1.2,
    linearUnits: ['m', 'ml'],
    recommendations: [
      { code: 'LIT_SABLE', label_fr: 'Lit de sable', label_ar: 'طبقة رملية', label_en: 'Sand bedding', base: 'linear', coefficient: 0.08, unit: 'm3', priority: 'HIGH' },
      { code: 'GRILLAGE_AVERTISSEUR', label_fr: 'Grillage avertisseur', label_ar: 'شبكة تحذيرية', label_en: 'Warning mesh', base: 'linear', coefficient: 1, unit: 'm', priority: 'MEDIUM' },
      { code: 'REMBLAI', label_fr: 'Remblai de tranchée', label_ar: 'ردم الخندق', label_en: 'Trench backfill', base: 'volume', coefficient: 0.85, unit: 'm3', priority: 'HIGH' },
    ],
  },
  {
    code: 'REMBLAI',
    label_fr: 'Remblai / apport',
    label_ar: 'ردم / إمداد',
    label_en: 'Backfill / supply',
    keywords: ['remblai', 'remblaiement', 'apport de terre'],
    width: 2.0,
    depth: 1.0,
    linearUnits: ['m', 'ml'],
    recommendations: [
      { code: 'COMPACTAGE', label_fr: 'Compactage', label_ar: 'ضغط', label_en: 'Compaction', base: 'volume', coefficient: 1, unit: 'm3', priority: 'HIGH' },
      { code: 'ARROSAGE', label_fr: 'Arrosage', label_ar: 'رَي', label_en: 'Watering', base: 'volume', coefficient: 0.05, unit: 'm3', priority: 'LOW' },
    ],
  },
  {
    code: 'FOUILLE',
    label_fr: 'Fouille standard',
    label_ar: 'حفرة قياسية',
    label_en: 'Standard pit',
    keywords: ['fouille', 'fouilles', 'puits', 'massif de fondation'],
    width: 1.0,
    depth: 1.0,
    linearUnits: ['m', 'ml', 'u', 'unite', 'unité'],
    recommendations: [
      { code: 'BETON_PROPRETE', label_fr: 'Béton de propreté', label_ar: 'خرسانة نظافة', label_en: 'Blinding concrete', base: 'linear', coefficient: 0.05, unit: 'm3', priority: 'MEDIUM' },
      { code: 'EVACUATION', label_fr: 'Évacuation des déblais', label_ar: 'نقل الأتربة', label_en: 'Spoil removal', base: 'volume', coefficient: 1, unit: 'm3', priority: 'HIGH' },
    ],
  },
];

/** Section forfaitaire (m²) du profil : largeur × profondeur. */
export function earthworkSection(profile: EarthworkProfile): number {
  return profile.width * profile.depth;
}

export function getEarthworkProfile(code: string | null | undefined): EarthworkProfile | null {
  if (!code) return null;
  return EARTHWORK_PROFILES.find((p) => p.code === code) ?? null;
}

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Résout le profil de métré depuis un libellé. La tranchée est prioritaire sur
 * le terrassement générique (« Terrassement en tranchée » = tranchée).
 */
export function detectEarthworkProfile(designation: string | null | undefined): EarthworkProfile | null {
  const text = normalize(String(designation ?? ''));
  if (!text) return null;
  // Priorité : la tranchée qualifie mieux qu'un terrassement générique, et
  // « Terrassement et fouilles » reste un terrassement (pas une fouille isolée).
  const order: EarthworkProfileCode[] = ['TRANCHEE', 'REMBLAI', 'TERRASSEMENT', 'FOUILLE'];
  for (const code of order) {
    const profile = EARTHWORK_PROFILES.find((p) => p.code === code)!;
    if (profile.keywords.some((k) => text.includes(normalize(k)))) return profile;
  }
  return null;
}
