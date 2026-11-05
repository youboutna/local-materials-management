/** Référentiel des calques de la carte interactive et des tons par statut (tokens de thème). */
export type MapLayerCode = 'location' | 'status' | 'region' | 'materials' | 'infrastructure' | 'zones';

export const MAP_LAYERS: ReadonlyArray<{ code: MapLayerCode; labelKey: string; fallback: string; defaultOn: boolean }> = [
  { code: 'location', labelKey: 'map.layer.location', fallback: 'Localisation', defaultOn: true },
  { code: 'status', labelKey: 'map.layer.status', fallback: 'Statut', defaultOn: true },
  { code: 'region', labelKey: 'map.layer.region', fallback: 'Région', defaultOn: false },
  { code: 'materials', labelKey: 'map.layer.materials', fallback: 'Matériaux', defaultOn: true },
  { code: 'infrastructure', labelKey: 'map.layer.infrastructure', fallback: 'Infrastructures', defaultOn: true },
  { code: 'zones', labelKey: 'map.layer.zones', fallback: "Zones d'intervention", defaultOn: true },
];

/** Statut (code ou libellé normalisé) → variable CSS du thème. */
export const MAP_STATUS_TONES: Readonly<Record<string, string>> = {
  'en cours': '--primary', in_progress: '--primary', active: '--primary',
  'terminé': '--success', completed: '--success', adequate: '--success', high: '--success',
  'en attente': '--warning', pending: '--warning', planned: '--warning', low: '--warning',
  'en inspection': '--warning',
  suspendu: '--muted-foreground', suspended: '--muted-foreground',
  'annulé': '--destructive', cancelled: '--destructive', critical: '--destructive', out_of_stock: '--destructive',
};
export const MAP_DEFAULT_TONE = '--muted-foreground';
export const MAP_NEUTRAL_TONE = '--primary';
