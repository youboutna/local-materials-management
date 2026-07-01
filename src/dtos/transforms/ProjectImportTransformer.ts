/**
 * ProjectImportTransformer
 *
 * Convertit une ligne brute (CSV / Excel / JSON / GeoJSON) en `ProjectImportRow`
 * normalisée prête à être avalée par `ProjectImportExportService.importProjects`.
 *
 * Règles :
 *  - Tolérant aux casses & alias (FR/EN, snake/camel).
 *  - Wilaya normalisée via `mauritaniaUtils` (fallback : laisse la valeur brute).
 *  - Si une `geometry`/`geoJSON` est présente, conversion en `InterventionZoneDTO[]`.
 */

import type { ProjectImportRow } from '@/application/services/ProjectImportExportService';
import type {
  InterventionZoneDTO,
} from '@/dtos/entities/InterventionZoneDTO';
import { GeoJsonZoneCodec } from '@/dtos/transforms/GeoJsonZoneCodec';

type Raw = Record<string, unknown>;

const pick = (row: Raw, ...keys: string[]): unknown => {
  for (const k of keys) {
    if (row[k] != null && row[k] !== '') return row[k];
    const lower = k.toLowerCase();
    for (const rk of Object.keys(row)) {
      if (rk.toLowerCase() === lower && row[rk] != null && row[rk] !== '') {
        return row[rk];
      }
    }
  }
  return undefined;
};

const toNum = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};

const toStr = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
};

/**
 * Convertit une `geometry` GeoJSON (Polygon / MultiPolygon / Point / FeatureCollection)
 * en tableau de `InterventionZoneDTO`, via le codec bidirectionnel.
 */
const geoJsonToZones = (geo: unknown): InterventionZoneDTO[] => {
  if (!geo || typeof geo !== 'object') return [];
  return GeoJsonZoneCodec.fromFeatureCollection(geo);
};

export class ProjectImportTransformer {
  /**
   * Ligne brute → `ProjectImportRow`.
   * Ne lève jamais : retourne `null` si le titre est manquant.
   */
  static fromRow(raw: Raw): ProjectImportRow | null {
    const title = toStr(pick(raw, 'title', 'titre', 'name', 'nom'));
    if (!title) return null;

    // Zones : 3 sources possibles — interventionZones[], geometry GeoJSON, lat/lng simple.
    let zones: InterventionZoneDTO[] | undefined;
    const rawZones = pick(raw, 'interventionZones', 'intervention_zones', 'zones');
    if (Array.isArray(rawZones)) {
      zones = rawZones as InterventionZoneDTO[];
    } else {
      const geo = pick(raw, 'geometry', 'geoJSON', 'geojson', 'interventionZonesGeoJSON');
      const fromGeo = geoJsonToZones(geo);
      if (fromGeo.length > 0) zones = fromGeo;
    }

    const lat = toNum(pick(raw, 'latitude', 'lat'));
    const lng = toNum(pick(raw, 'longitude', 'lng', 'lon'));

    if (!zones && lat != null && lng != null) {
      zones = [{ type: 'point', coordinates: [{ lat, lng }] }];
    }

    return {
      title,
      description: toStr(pick(raw, 'description', 'desc')),
      status: toStr(pick(raw, 'status', 'statut')),
      progress: toNum(pick(raw, 'progress', 'progression')),
      budget: toNum(pick(raw, 'budget', 'montant')),
      currency: toStr(pick(raw, 'currency', 'devise')),
      startDate: toStr(pick(raw, 'startDate', 'start_date', 'date_debut')),
      endDate: toStr(pick(raw, 'endDate', 'end_date', 'date_fin')),
      location: toStr(pick(raw, 'location', 'address', 'adresse', 'wilaya')),
      latitude: lat,
      longitude: lng,
      teamSize: toNum(pick(raw, 'teamSize', 'team_size', 'taille_equipe')),
      financingSource: toStr(pick(raw, 'financingSource', 'financing_source', 'source_financement')),
      marketType: toStr(pick(raw, 'marketType', 'market_type', 'type_marche')) as ProjectImportRow['marketType'],
      selectionMode: toStr(pick(raw, 'selectionMode', 'selection_mode', 'mode_selection')) as ProjectImportRow['selectionMode'],
      projectType: toStr(pick(raw, 'projectType', 'project_type', 'type_projet')),
      referentialCode: toStr(pick(raw, 'referentialCode', 'referential', 'referentiel')),
      attributionDate: toStr(pick(raw, 'attributionDate', 'attribution_date')),
      launchDate: toStr(pick(raw, 'launchDate', 'launch_date')),
      completionDate: toStr(pick(raw, 'completionDate', 'completion_date')),
      interventionZones: zones,
      interventionZone: zones?.[0],
    };
  }

  static fromRows(rows: Raw[]): ProjectImportRow[] {
    return rows
      .map((r) => ProjectImportTransformer.fromRow(r))
      .filter((r): r is ProjectImportRow => r !== null);
  }
}
