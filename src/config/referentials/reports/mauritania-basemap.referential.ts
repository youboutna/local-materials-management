/**
 * Référentiel « fond de carte statique » (Mauritanie).
 *
 * Fournit :
 *  - la calibration géographique de l'image statique utilisée dans les rapports PDF
 *    (bbox du raster) afin de projeter correctement coordonnées et zones d'intervention ;
 *  - la liste des villes de repère (chefs-lieux et villes voisines) avec leurs
 *    coordonnées, pour situer le projet sans aucune valeur codée en dur dans l'UI.
 */

export interface BasemapCalibration {
  /** Longitude au bord gauche de l'image. */
  lngMin: number;
  /** Longitude au bord droit de l'image. */
  lngMax: number;
  /** Latitude au bord bas de l'image. */
  latMin: number;
  /** Latitude au bord haut de l'image. */
  latMax: number;
}

/** Calibration du raster `src/assets/mauritania-basemap.png` (1024x768). */
export const MAURITANIA_BASEMAP: BasemapCalibration = {
  lngMin: -20.47,
  lngMax: -0.63,
  latMin: 12.77,
  latMax: 27.6,
};

export interface ReferenceCity {
  name: string;
  lat: number;
  lng: number;
  /** true = capitale ou grande ville (affichage prioritaire). */
  major?: boolean;
  /** Pays voisin le cas échéant (repère régional). */
  country?: string;
}

export const MAURITANIA_REFERENCE_CITIES: ReferenceCity[] = [
  { name: 'Nouakchott', lat: 18.0858, lng: -15.9785, major: true },
  { name: 'Nouadhibou', lat: 20.9333, lng: -17.0333, major: true },
  { name: 'Rosso', lat: 16.5138, lng: -15.8052 },
  { name: 'Kaédi', lat: 16.1503, lng: -13.5058 },
  { name: 'Sélibaby', lat: 15.1594, lng: -12.1847 },
  { name: 'Aleg', lat: 17.053, lng: -13.9094 },
  { name: 'Kiffa', lat: 16.6203, lng: -11.4014 },
  { name: 'Ayoun el Atrous', lat: 16.6636, lng: -9.6147 },
  { name: 'Néma', lat: 16.6178, lng: -7.2569 },
  { name: 'Tidjikja', lat: 18.5561, lng: -11.4269 },
  { name: 'Atar', lat: 20.5169, lng: -13.0489 },
  { name: 'Zouérate', lat: 22.7354, lng: -12.4718 },
  { name: 'Akjoujt', lat: 19.7458, lng: -14.3853 },
  { name: 'Aioun', lat: 16.6636, lng: -9.6147 },
  { name: 'Saint-Louis', lat: 16.0326, lng: -16.4818, country: 'Sénégal' },
  { name: 'Dakar', lat: 14.7167, lng: -17.4677, major: true, country: 'Sénégal' },
  { name: 'Bakel', lat: 14.9046, lng: -12.4583, country: 'Sénégal' },
  { name: 'Nara', lat: 15.1667, lng: -7.2833, country: 'Mali' },
  { name: 'Tombouctou', lat: 16.7735, lng: -3.0074, country: 'Mali' },
  { name: 'Dakhla', lat: 23.6848, lng: -15.958, country: 'Sahara occidental' },
];

/**
 * Villes de repère les plus proches d'un point (tri par distance approximative).
 */
export function nearestReferenceCities(
  lat: number,
  lng: number,
  limit = 4,
): ReferenceCity[] {
  return [...MAURITANIA_REFERENCE_CITIES]
    .map((city) => ({
      city,
      d: Math.hypot(city.lat - lat, (city.lng - lng) * Math.cos((lat * Math.PI) / 180)),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, Math.max(0, limit))
    .map((entry) => entry.city);
}
