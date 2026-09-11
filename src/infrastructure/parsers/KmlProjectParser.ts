// src/infrastructure/parsers/KmlProjectParser.ts
//
// Parseur KML pour les relevés QGIS/KML.
// - 1 <Placemark> = 1 Projet
// - <name>, <description>, <ExtendedData> exploités

import type { ProjectImportRow } from '@/application/services/ProjectImportExportService';
import {
  IProjectFileParser,
  ProjectFileParserOptions,
  readFileAsText,
} from './IProjectFileParser';

export class KmlProjectParser implements IProjectFileParser {
  readonly name = 'KmlProjectParser';
  readonly supportedExtensions = ['kml'];

  async parse(file: File, options: ProjectFileParserOptions = {}): Promise<ProjectImportRow[]> {
    const content = await readFileAsText(file);
    return this.parseContent(content, options);
  }

  async parseContent(content: string, options: ProjectFileParserOptions = {}): Promise<ProjectImportRow[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'application/xml');

    if (doc.querySelector('parsererror')) {
      throw new Error('KML invalide : impossible de lire le fichier.');
    }

    const placemarks = Array.from(doc.querySelectorAll('Placemark'));
    if (placemarks.length === 0) {
      throw new Error('KML invalide : aucun <Placemark> trouvé.');
    }

    return placemarks.map((placemark) => this.placemarkToRow(placemark, options));
  }

  private placemarkToRow(
    placemark: Element,
    options: ProjectFileParserOptions,
  ): ProjectImportRow {
    const name = placemark.querySelector('name')?.textContent?.trim();
    const description = placemark.querySelector('description')?.textContent?.trim();
    const extendedData = this.extractExtendedData(placemark);
    const { latitude, longitude } = this.extractCoordinates(placemark);

    return {
      externalRef: extendedData.id ?? extendedData.fid ?? undefined,
      title: name ?? extendedData.name ?? options.fallbackTitle ?? 'Projet importé depuis KML',
      description: description ?? extendedData.description ?? '',
      location: extendedData.location ?? extendedData.lieu ?? options.fallbackLocation ?? '',
      status: extendedData.status ?? extendedData.statut ?? 'en attente',
      progress: this.toNumber(extendedData.progress ?? extendedData.avancement),
      budget: this.toNumber(extendedData.budget ?? extendedData.cout ?? extendedData.montant),
      startDate: extendedData.startDate ?? extendedData.start_date ?? extendedData.dateDebut,
      endDate: extendedData.endDate ?? extendedData.end_date ?? extendedData.dateFin,
      teamSize: this.toNumber(extendedData.teamSize ?? extendedData.team_size ?? extendedData.equipe) ?? 1,
      latitude,
      longitude,
      referentialCode: options.referentialCode,
      projectReference: extendedData.projectReference ?? extendedData.reference,
      financingSource: extendedData.financingSource ?? extendedData.financing_source,
      marketType: extendedData.marketType ?? extendedData.market_type,
      selectionMode: extendedData.selectionMode ?? extendedData.selection_mode,
    };
  }

  private extractExtendedData(placemark: Element): Record<string, string> {
    const result: Record<string, string> = {};
    placemark.querySelectorAll('ExtendedData > Data').forEach((data) => {
      const key = data.getAttribute('name');
      const value = data.querySelector('value')?.textContent?.trim();
      if (key && value) result[key] = value;
    });
    placemark.querySelectorAll('ExtendedData > SchemaData > SimpleData').forEach((data) => {
      const key = data.getAttribute('name');
      const value = data.textContent?.trim();
      if (key && value) result[key] = value;
    });
    return result;
  }

  private extractCoordinates(placemark: Element): { latitude?: number; longitude?: number } {
    const coordText =
      placemark.querySelector('Point > coordinates')?.textContent?.trim()
      ?? placemark.querySelector('LineString > coordinates')?.textContent?.trim()
      ?? placemark.querySelector('Polygon > outerBoundaryIs > LinearRing > coordinates')?.textContent?.trim();

    if (!coordText) return {};

    const first = coordText.split(/\s+/)[0];
    const parts = first.split(',').map((s) => Number(s.trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { longitude: parts[0], latitude: parts[1] };
    }
    return {};
  }

  private toNumber(value: string | undefined): number | undefined {
    if (value == null) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
}