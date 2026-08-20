/**
 * Référentiel « identité de marque » (branding).
 *
 * Chaque profil décrit l'identité visible d'un client : nom applicatif,
 * organisation propriétaire, sceau / logo et bandeaux d'accent.
 * Aucune couleur codée en dur dans les composants : les bandeaux consomment
 * des tokens CSS (`--brand-band-*`) définis par thème dans `src/index.css`.
 *
 * Ajouter un client = ajouter une entrée ici (aucun code UI à modifier).
 */
import sealRim from '@/assets/seal-rim.png.asset.json';

export interface BrandingDefinition {
  /** Identifiant persisté. */
  id: string;
  /** Libellé du profil dans le sélecteur. */
  label: string;
  /** Nom applicatif affiché. */
  appName: string;
  /** Nom de l'organisation propriétaire (texte affiché sous / à côté du sceau). */
  ownerName: string;
  /** Sous-titre optionnel (ministère, direction, etc.). */
  ownerSubtitle?: string;
  /** URL du sceau / logo (CDN). Vide = pas de sceau. */
  sealUrl?: string;
  /** Affiche le sceau par défaut. */
  showSeal: boolean;
  /** Affiche les bandeaux d'accent par défaut. */
  showBands: boolean;
  /** Thème UI recommandé pour ce profil. */
  suggestedThemeId?: string;
}

export const BRANDING_PROFILES: BrandingDefinition[] = [
  {
    id: 'neutral',
    label: 'Neutre (SaaS)',
    appName: 'HadraTech-GPI',
    ownerName: 'HadraTech',
    ownerSubtitle: 'Gestion de projets d’infrastructure',
    showSeal: false,
    showBands: false,
    suggestedThemeId: 'adrar-stone',
  },
  {
    id: 'rim-etat',
    label: 'État — République Islamique de Mauritanie',
    appName: 'HadraTech-GPI',
    ownerName: 'République Islamique de Mauritanie',
    ownerSubtitle: 'Ministère en charge des infrastructures',
    sealUrl: window.location.origin + sealRim.url,
    showSeal: true,
    showBands: true,
    suggestedThemeId: 'rim',
  },
];

export const DEFAULT_BRANDING_ID = 'rim-etat';
export const BRANDING_STORAGE_KEY = 'hadratech.branding';
export const BRANDING_OVERRIDES_STORAGE_KEY = 'hadratech.branding.overrides';

/** Surcharges client (paramétrables depuis Paramètres → Apparence). */
export interface BrandingOverrides {
  appName?: string;
  ownerName?: string;
  ownerSubtitle?: string;
  sealUrl?: string;
  showSeal?: boolean;
  showBands?: boolean;
}

export const getBrandingProfile = (id?: string | null): BrandingDefinition =>
  BRANDING_PROFILES.find((b) => b.id === id) ??
  BRANDING_PROFILES.find((b) => b.id === DEFAULT_BRANDING_ID)!;

/** Fusionne un profil du référentiel avec les surcharges client. */
export const resolveBranding = (
  id?: string | null,
  overrides?: BrandingOverrides | null,
): BrandingDefinition => {
  const base = getBrandingProfile(id);
  if (!overrides) return base;
  return {
    ...base,
    appName: overrides.appName?.trim() || base.appName,
    ownerName: overrides.ownerName?.trim() || base.ownerName,
    ownerSubtitle: overrides.ownerSubtitle?.trim() || base.ownerSubtitle,
    sealUrl: overrides.sealUrl?.trim() || base.sealUrl,
    showSeal: overrides.showSeal ?? base.showSeal,
    showBands: overrides.showBands ?? base.showBands,
  };
};
