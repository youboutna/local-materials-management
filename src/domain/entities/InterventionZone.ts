/**
 * InterventionZone — Domain entity
 *
 * Représente la "zone d'intervention" géographique d'un projet.
 * Remplace conceptuellement la simple adresse : un projet n'a pas seulement
 * un point GPS mais une surface (polygone, rectangle ou cercle) sur le terrain.
 *
 * Persistée dans la colonne `projects.localisation` (jsonb) afin de ne pas
 * impliquer de migration destructive. La colonne `forme` reçoit le type court.
 */

export type InterventionZoneShape = 'polygon' | 'rectangle' | 'circle' | 'point';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface InterventionZoneProps {
  type: InterventionZoneShape;
  /**
   * Sommets du polygone/rectangle ; pour un cercle ou un point, un seul couple (le centre).
   */
  coordinates: LatLng[];
  /** Rayon en mètres — applicable uniquement aux cercles. */
  radiusMeters?: number;
  /** Libellé court (ex. "Lot 3 — wilaya de Trarza"). */
  label?: string;
  /** Adresse textuelle libre (remplace l'ancien `location`). */
  address?: string;
  /** Superficie en m² (calculée si absente). */
  areaSqm?: number;
}

const EARTH_RADIUS_M = 6_371_000;
const toRad = (d: number) => (d * Math.PI) / 180;

export class InterventionZone {
  readonly type: InterventionZoneShape;
  readonly coordinates: LatLng[];
  readonly radiusMeters?: number;
  readonly label?: string;
  readonly address?: string;
  readonly areaSqm?: number;

  private constructor(props: InterventionZoneProps) {
    this.type = props.type;
    this.coordinates = props.coordinates;
    this.radiusMeters = props.radiusMeters;
    this.label = props.label;
    this.address = props.address;
    this.areaSqm = props.areaSqm ?? InterventionZone.computeAreaSqm(props);
  }

  static create(props: InterventionZoneProps): InterventionZone {
    if (!props || !Array.isArray(props.coordinates) || props.coordinates.length === 0) {
      throw new Error('InterventionZone: coordinates must contain at least one LatLng');
    }
    if (props.type === 'circle' && (!props.radiusMeters || props.radiusMeters <= 0)) {
      throw new Error('InterventionZone: circle requires positive radiusMeters');
    }
    return new InterventionZone(props);
  }

  /** Centre géographique (centroïde simple). */
  getCenter(): LatLng {
    const n = this.coordinates.length;
    const sum = this.coordinates.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
      { lat: 0, lng: 0 },
    );
    return { lat: sum.lat / n, lng: sum.lng / n };
  }

  /** Sérialisation pour persistance JSONB. */
  toJSON(): InterventionZoneProps {
    return {
      type: this.type,
      coordinates: this.coordinates,
      radiusMeters: this.radiusMeters,
      label: this.label,
      address: this.address,
      areaSqm: this.areaSqm,
    };
  }

  /** Reconstruction depuis un JSONB stocké. */
  static fromJSON(value: unknown): InterventionZone | undefined {
    if (!value || typeof value !== 'object') return undefined;
    const v = value as Partial<InterventionZoneProps>;
    if (!v.type || !Array.isArray(v.coordinates) || v.coordinates.length === 0) {
      return undefined;
    }
    try {
      return InterventionZone.create({
        type: v.type,
        coordinates: v.coordinates as LatLng[],
        radiusMeters: v.radiusMeters,
        label: v.label,
        address: v.address,
        areaSqm: v.areaSqm,
      });
    } catch {
      return undefined;
    }
  }

  /** Calcul approximatif d'aire en m² (Shoelace sur projection equirectangulaire). */
  static computeAreaSqm(props: InterventionZoneProps): number | undefined {
    if (props.type === 'circle' && props.radiusMeters) {
      return Math.PI * props.radiusMeters * props.radiusMeters;
    }
    if (props.type === 'point' || props.coordinates.length < 3) return undefined;
    const coords = props.coordinates;
    const lat0 = coords.reduce((a, p) => a + p.lat, 0) / coords.length;
    const cosLat0 = Math.cos(toRad(lat0));
    const project = (p: LatLng) => ({
      x: toRad(p.lng) * EARTH_RADIUS_M * cosLat0,
      y: toRad(p.lat) * EARTH_RADIUS_M,
    });
    const pts = coords.map(project);
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      s += a.x * b.y - b.x * a.y;
    }
    return Math.abs(s) / 2;
  }
}

/**
 * Collection de zones d'intervention (un projet peut couvrir plusieurs zones
 * bénéficiaires, potentiellement non disjointes).
 *
 * Format JSON stocké en DB (`projects.localisation`) :
 *   { version: 2, zones: InterventionZoneProps[] }
 *
 * Rétro-compatibilité : si la racine ressemble à un `InterventionZoneProps`
 * (legacy mono-zone), elle est automatiquement wrappée dans `{ zones: [...] }`.
 */
export class InterventionZoneCollection {
  readonly zones: InterventionZone[];

  private constructor(zones: InterventionZone[]) {
    this.zones = zones;
  }

  static create(zones: InterventionZone[]): InterventionZoneCollection {
    return new InterventionZoneCollection(zones);
  }

  static fromJSON(value: unknown): InterventionZoneCollection {
    if (!value || typeof value !== 'object') return new InterventionZoneCollection([]);
    const v = value as Record<string, unknown>;
    // Format v2
    if (Array.isArray(v.zones)) {
      const zones = v.zones
        .map((z) => InterventionZone.fromJSON(z))
        .filter((z): z is InterventionZone => !!z);
      return new InterventionZoneCollection(zones);
    }
    // Legacy mono-zone wrap
    const single = InterventionZone.fromJSON(value);
    return new InterventionZoneCollection(single ? [single] : []);
  }

  isEmpty(): boolean {
    return this.zones.length === 0;
  }

  getBoundingCenter(): LatLng | undefined {
    if (this.zones.length === 0) return undefined;
    const centers = this.zones.map((z) => z.getCenter());
    const lat = centers.reduce((a, p) => a + p.lat, 0) / centers.length;
    const lng = centers.reduce((a, p) => a + p.lng, 0) / centers.length;
    return { lat, lng };
  }

  getTotalAreaSqm(): number {
    return this.zones.reduce((sum, z) => sum + (z.areaSqm ?? 0), 0);
  }

  toJSON(): { version: 2; zones: InterventionZoneProps[] } {
    return { version: 2, zones: this.zones.map((z) => z.toJSON()) };
  }
}
