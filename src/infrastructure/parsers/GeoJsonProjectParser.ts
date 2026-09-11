// src/infrastructure/parsers/GeoJsonProjectParser.ts
//
// Parseur GeoJSON pour les relevés QField/QGIS.
// - 1 Feature = 1 Projet
// - Coordonnées extraites de geometry
// - Zones d'intervention construites depuis Polygon/MultiPolygon

import type {
  ProjectImportRow,
  ProjectImportPhase,
} from '@/application/services/ProjectImportExportService';
import type { InterventionZoneDTO } from '@/dtos/entities/InterventionZoneDTO';
import {
  IProjectFileParser,
  ProjectFileParserOptions,
  readFileAsText,
} from './IProjectFileParser';

interface GeoJsonFeature {
  type: 'Feature';
  geometry?: { type: string; coordinates: unknown } | null;
  properties?: Record<string, unknown> | null;
}

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

type Position = [number, number];

export class GeoJsonProjectParser implements IProjectFileParser {
  readonly name = 'GeoJsonProjectParser';
  readonly supportedExtensions = ['geojson'];

  async parse(file: File, options: ProjectFileParserOptions = {}): Promise<ProjectImportRow[]> {
    const content = await readFileAsText(file);
    return this.parseContent(content, options);
  }

  async parseContent(content: string, options: ProjectFileParserOptions = {}): Promise<ProjectImportRow[]> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('GeoJSON invalide : impossible de lire le fichier.');
    }

    if (!this.isFeatureCollection(parsed)) {
      throw new Error('Format invalide : attendu un FeatureCollection GeoJSON.');
    }

    return parsed.features.map((feature) => this.featureToRow(feature, options));
  }

  private isFeatureCollection(value: unknown): value is GeoJsonFeatureCollection {
    return (
      !!value &&
      typeof value === 'object' &&
      (value as { type?: string }).type === 'FeatureCollection' &&
      Array.isArray((value as { features?: unknown[] }).features)
    );
  }

  private featureToRow(
    feature: GeoJsonFeature,
    options: ProjectFileParserOptions,
  ): ProjectImportRow {
    const props = (feature.properties ?? {}) as Record<string, unknown>;

    const title = this.pickString(props, ['name', 'title', 'projet', 'nom'])
      ?? options.fallbackTitle
      ?? 'Projet importé depuis QField/QGIS';

    const location = this.pickString(props, ['location', 'lieu', 'localisation', 'address'])
      ?? options.fallbackLocation
      ?? '';

    const startDate = this.pickString(props, ['start_date', 'startDate', 'dateDebut', 'date_debut']);
    const endDate = this.pickString(props, ['end_date', 'endDate', 'dateFin', 'date_fin']);
    const { latitude, longitude } = this.extractCentroid(feature.geometry);
    const zones = this.buildZones(feature.geometry, title);

    return {
      externalRef: this.pickString(props, ['fid', 'id', 'externalRef']),
      title,
      description: this.pickString(props, ['description', 'desc', 'notes']) ?? '',
      location,
      status: this.pickString(props, ['status', 'statut']) ?? 'en attente',
      progress: this.pickNumber(props, ['progress', 'avancement']) ?? 0,
      budget: this.pickNumber(props, ['budget', 'cout', 'montant', 'cost']) ?? 0,
      currency: this.pickString(props, ['currency', 'devise']) ?? 'MRU',
      startDate,
      endDate,
      teamSize: this.pickNumber(props, ['team_size', 'teamSize', 'equipe']) ?? 1,
      latitude,
      longitude,
      referentialCode: options.referentialCode,
      financingSource: this.pickString(props, ['financing_source', 'financingSource', 'financement']),
      marketType: this.pickString(props, ['market_type', 'marketType', 'type_marche']),
      selectionMode: this.pickString(props, ['selection_mode', 'selectionMode', 'mode_selection']),
      projectReference: this.pickString(props, ['project_reference', 'projectReference', 'reference']),
      interventionZones: zones.length > 0 ? zones : undefined,
      phases: this.extractPhases(props),
    };
  }

  private buildZones(
    geometry: GeoJsonFeature['geometry'],
    title: string,
  ): InterventionZoneDTO[] {
    if (!geometry) return [];
    const { type, coordinates } = geometry;

    if (type === 'Polygon' || type === 'MultiPolygon') {
      const multiCoords =
        type === 'Polygon'
          ? [coordinates as Position[][]]
          : (coordinates as Position[][][]);

      return multiCoords.map((polygon, index) => ({
        id: `zone-${Date.now()}-${index}`,
        code: `Z${index + 1}`,
        name: `${title} — Zone ${index + 1}`,
        coordinates: polygon[0].map(([lng, lat]) => ({ lat, lng })),
      })) as unknown as InterventionZoneDTO[];
    }

    return [];
  }

  private extractCentroid(geometry: GeoJsonFeature['geometry']): {
    latitude?: number;
    longitude?: number;
  } {
    if (!geometry) return {};
    const { type, coordinates } = geometry;

    if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
      const [lng, lat] = coordinates as Position;
      return { latitude: lat, longitude: lng };
    }
    if (type === 'Polygon' && Array.isArray(coordinates)) {
      const first = (coordinates as Position[][])[0]?.[0];
      if (first) return { latitude: first[1], longitude: first[0] };
    }
    if (type === 'MultiPolygon' && Array.isArray(coordinates)) {
      const first = (coordinates as Position[][][])[0]?.[0]?.[0];
      if (first) return { latitude: first[1], longitude: first[0] };
    }

    return {};
  }

  private extractPhases(props: Record<string, unknown>): ProjectImportPhase[] | undefined {
    const raw = props.phases ?? props.plannedPhases;
    if (!Array.isArray(raw)) return undefined;

    return raw.map((item, index) => {
      const p = item as Record<string, unknown>;
      return {
        code: (p.code as string | undefined) ?? `PH${index + 1}`,
        name: (p.name as string | undefined) ?? (p.title as string | undefined) ?? `Phase ${index + 1}`,
        description: (p.description as string | undefined) ?? undefined,
        order: (p.order as number | undefined) ?? index + 1,
        durationDays: p.durationDays as number | undefined,
        estimatedDuration: p.estimatedDuration as number | undefined,
        startDate: (p.startDate as string | undefined) ?? (p.start_date as string | undefined),
        endDate: (p.endDate as string | undefined) ?? (p.end_date as string | undefined),
        status: p.status as string | undefined,
      } as ProjectImportPhase;
    });
  }

  private pickString(props: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = props[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return undefined;
  }

  private pickNumber(props: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
      const value = props[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() && !isNaN(Number(value))) {
        return Number(value);
      }
    }
    return undefined;
  }
}