/**
 * metreDetection — Scénarios 3 et 8 du parser intelligent DQE.
 *
 * Une ligne d'ouvrage saisie en linéaire (« Terrassement et fouilles (Réseaux) »
 * 3 500 m) porte en réalité un volume : le métré est recalculé avec la section
 * forfaitaire du référentiel `earthwork-metre`, puis des recommandations
 * d'ouvrages complémentaires sont dérivées.
 *
 * Pure TS — consommé par BoqImportOrchestrator et par l'UI d'import (aperçu).
 */
import {
  detectEarthworkProfile,
  earthworkSection,
  getEarthworkProfile,
  type EarthworkProfile,
  type RecommendationPriority,
} from '@/config/referentials/boq/earthwork-metre.referential';
import { extractDimensions } from './dimensionExtraction';

export interface MetreRecommendation {
  code: string;
  label: string;
  quantity: number;
  unit: string;
  priority: RecommendationPriority;
}

export interface DetectedMetre {
  profileCode: string;
  profileLabel: string;
  /** Volume calculé (m³). */
  volume: number;
  unit: 'm3';
  width: number;
  depth: number;
  /** Formule lisible affichée dans l'aperçu d'import. */
  formula: string;
  /** true lorsque largeur/profondeur viennent du libellé et non du forfait. */
  fromDesignation: boolean;
  recommendations: MetreRecommendation[];
}

const round = (n: number): number => Math.round(n * 1000) / 1000;

function buildRecommendations(
  profile: EarthworkProfile,
  volume: number,
  linear: number,
): MetreRecommendation[] {
  return profile.recommendations
    .map((rule) => {
      const base = rule.base === 'volume' ? volume : linear;
      return {
        code: rule.code,
        label: rule.label_fr,
        quantity: round(base * rule.coefficient),
        unit: rule.unit,
        priority: rule.priority,
      };
    })
    .filter((r) => r.quantity > 0);
}

/**
 * Calcule le métré volumique d'une ligne linéaire d'ouvrage de terrassement.
 * Retourne `null` si la ligne ne relève pas d'un profil de terrassement ou si
 * l'unité n'est pas linéaire (une ligne déjà en m³ n'est pas recalculée).
 */
export function detectMetre(input: {
  designation?: string | null;
  unit?: string | null;
  quantity?: number | null;
  profileCode?: string | null;
}): DetectedMetre | null {
  const linear = Number(input.quantity ?? 0);
  if (!Number.isFinite(linear) || linear <= 0) return null;

  const profile = getEarthworkProfile(input.profileCode) ?? detectEarthworkProfile(input.designation);
  if (!profile) return null;

  const unit = String(input.unit ?? '').trim().toLowerCase();
  if (unit && !profile.linearUnits.some((u) => u.toLowerCase() === unit)) return null;

  // Dimensions inscrites dans le libellé (« Larg. 1.0m, prof. 1.5m ») : elles
  // prévalent sur la section forfaitaire du référentiel.
  const dims = extractDimensions(input.designation);
  const width = dims.width && dims.width > 0 ? dims.width : profile.width;
  const depth = dims.height && dims.height > 0 ? dims.height : profile.depth;
  const fromDesignation = width !== profile.width || depth !== profile.depth;
  const volume = round(linear * width * depth);
  if (volume <= 0) return null;

  return {
    profileCode: profile.code,
    profileLabel: profile.label_fr,
    volume,
    unit: 'm3',
    width,
    depth,
    formula: `${linear} × ${width} × ${depth} = ${volume} m³ (section ${round(earthworkSection(profile))} m²)`,
    fromDesignation,
    recommendations: buildRecommendations(profile, volume, linear),
  };
}
