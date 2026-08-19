/**
 * GeoFeatureDTO — représentation unifiée de TOUT objet géographique du système,
 * quelle que soit sa source (zone d'intervention projet, dépôt/entrepôt matériau,
 * simple adresse géocodée) et quel que soit son futur usage (couche limites
 * administratives, infrastructures réalisées, réseaux « network utility »).
 *
 * Un seul concept géographique : la géométrie est portée ici, la sémantique
 * administrative est portée par l'entité de domaine `Location` (region/city).
 */
import type { InterventionZoneDTO, InterventionZoneLatLng, InterventionZoneShape } from './InterventionZoneDTO';

/** Nature métier de l'objet géographique (extensible : futures couches réseau). */
export type GeoFeatureKind =
  | 'project_intervention_zone'
  | 'material_warehouse'
  | 'address'
  | 'infrastructure'
  | 'utility_network';

export interface GeoFeatureDTO {
  /** Identifiant stable `${kind}:${sourceId}:${index}`. */
  id: string;
  kind: GeoFeatureKind;
  /** Identifiant de l'entité porteuse (projet, matériau…). */
  sourceId: string;
  sourceLabel: string;
  label: string;
  geometryType: InterventionZoneShape;
  coordinates: InterventionZoneLatLng[];
  radiusMeters?: number;
  /** Centroïde (toujours défini : point de projection sur les couches). */
  center: InterventionZoneLatLng;
  address?: string;
  /** Wilaya résolue (référentiel limites administratives ou reverse geocoding). */
  regionCode?: string;
  regionName?: string;
  cityCode?: string;
  areaSqm?: number;
}

/** Diagnostic de couverture géographique (audit de stockage). */
export interface GeoCoverageReportDTO {
  total: number;
  byKind: Record<string, number>;
  /** Objets sans coordonnées exploitables (adresse seule, non géocodée). */
  missingGeometry: number;
  /** Objets géolocalisés mais hors des limites administratives connues. */
  outsideBoundaries: number;
  /** Objets rattachés à une wilaya. */
  resolvedRegions: number;
}

export type { InterventionZoneDTO };
