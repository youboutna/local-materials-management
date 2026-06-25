/**
 * ProjectImportExportService
 *
 * Service applicatif unifié pour l'import et l'export de projets.
 * Respecte la règle hexagonale : zéro React, zéro `supabase.from(...)`,
 * uniquement orchestration via ProjectService + transformations DTO.
 *
 * - importProjects : valide chaque ligne, déduplique par titre, délègue
 *   la création au ProjectService (qui passe par le repository et les
 *   transformers hexagonaux : référentiel + génération de phases côté
 *   workflow si project_type est mappé).
 * - exportProjects : récupère les DTO et sérialise (JSON / CSV / Excel-ready),
 *   en incluant la zone d'intervention (interventionZone) lorsqu'elle existe.
 */

import { ProjectService } from '@/application/services/ProjectService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import type {
  CreateProjectDTO,
  ProjectDTO,
} from '@/dtos/entities/ProjectDTO';
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';
import type { InterventionZoneDTO } from '@/dtos/entities/InterventionZoneDTO';

export interface ProjectImportRow extends Partial<Omit<CreateProjectDTO, 'status'>> {
  title: string;
  description?: string;
  location?: string;
  status?: string;
  progress?: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  teamSize?: number;
  latitude?: number;
  longitude?: number;
  /** @deprecated — préférer `interventionZones` (multi). */
  interventionZone?: InterventionZoneDTO;
  /** Zones bénéficiaires (multi-polygones). */
  interventionZones?: InterventionZoneDTO[];
  /** Référentiel projet (ex: 'somelec', 'eter') pour génération de phases. */
  referentialCode?: string;
}


export interface ProjectImportResult {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; title: string; message: string }>;
  createdIds: string[];
}

export type ProjectExportFormat = 'json' | 'csv' | 'excel-rows';

export interface ProjectExportOptions {
  format: ProjectExportFormat;
  includeInterventionZone?: boolean;
  ids?: string[];
}

export class ProjectImportExportService {
  constructor(private readonly projectService: ProjectService) {}

  static default(): ProjectImportExportService {
    return new ProjectImportExportService(
      new ProjectService(RepositoryFactory.getProjectRepository()),
    );
  }

  // ============= IMPORT =============

  async importProjects(rows: ProjectImportRow[]): Promise<ProjectImportResult> {
    const result: ProjectImportResult = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      createdIds: [],
    };

    let existingTitles = new Set<string>();
    try {
      const existing = await this.projectService.getAllProjects();
      existingTitles = new Set(existing.map((p) => p.title?.trim().toLowerCase()));
    } catch (e) {
      // non-blocking; we still attempt import. Errors will surface per-row if any.
      console.warn('[ProjectImportExportService] Cannot list existing projects:', e);
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const titleKey = (row.title || '').trim().toLowerCase();
      if (!titleKey) {
        result.failed += 1;
        result.errors.push({ row: i + 1, title: '(empty)', message: 'Missing title' });
        continue;
      }
      if (existingTitles.has(titleKey)) {
        result.skipped += 1;
        continue;
      }

      try {
        const dto = this.toCreateDTO(row);
        const created = await this.projectService.createProject(dto);
        result.imported += 1;
        if (created?.id) result.createdIds.push(created.id);
        existingTitles.add(titleKey);
      } catch (e) {
        result.failed += 1;
        result.errors.push({
          row: i + 1,
          title: row.title,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return result;
  }

  private toCreateDTO(row: ProjectImportRow): CreateProjectDTO {
    const zones = row.interventionZones && row.interventionZones.length > 0
      ? row.interventionZones
      : row.interventionZone
      ? [row.interventionZone]
      : undefined;
    const firstZone = zones?.[0];
    const dto: CreateProjectDTO = {
      title: row.title,
      description: row.description ?? '',
      status: (row.status as ProjectStatus) ?? ProjectStatus.DRAFT,
      progress: row.progress ?? 0,
      budget: row.budget ?? 0,
      currency: row.currency ?? 'MRU',
      startDate: row.startDate ?? new Date().toISOString(),
      endDate: row.endDate,
      location: row.location ?? firstZone?.address ?? '',
      latitude: row.latitude ?? firstZone?.coordinates?.[0]?.lat,
      longitude: row.longitude ?? firstZone?.coordinates?.[0]?.lng,
      teamSize: row.teamSize ?? 0,
      financingSource: row.financingSource,
      marketType: row.marketType,
      selectionMode: row.selectionMode,
      projectType: row.projectType ?? row.referentialCode,
      attributionDate: row.attributionDate,
      launchDate: row.launchDate,
      completionDate: row.completionDate,
      interventionZones: zones,
      interventionZone: firstZone,
    } as CreateProjectDTO;
    return dto;
  }

  // ============= EXPORT =============

  async exportProjects(opts: ProjectExportOptions): Promise<{
    payload: string;
    mimeType: string;
    extension: string;
    rows?: Record<string, unknown>[];
  }> {
    const all = await this.projectService.getAllProjects();
    const selected = opts.ids?.length
      ? all.filter((p) => opts.ids!.includes(p.id))
      : all;

    const includeZone = opts.includeInterventionZone ?? true;
    const enriched = selected.map((p) => this.toExportRow(p, includeZone));

    switch (opts.format) {
      case 'json':
        return {
          payload: JSON.stringify(enriched, null, 2),
          mimeType: 'application/json',
          extension: 'json',
          rows: enriched,
        };
      case 'csv':
        return {
          payload: this.toCSV(enriched),
          mimeType: 'text/csv',
          extension: 'csv',
          rows: enriched,
        };
      case 'excel-rows':
      default:
        return {
          payload: JSON.stringify(enriched),
          mimeType: 'application/json',
          extension: 'json',
          rows: enriched,
        };
    }
  }

  private toExportRow(p: ProjectDTO, includeZone: boolean): Record<string, unknown> {
    const base: Record<string, unknown> = {
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      progress: p.progress,
      budget: p.budget,
      currency: p.currency,
      startDate: p.startDate,
      endDate: p.endDate,
      location: p.location,
      latitude: p.latitude,
      longitude: p.longitude,
      teamSize: p.teamSize,
      financingSource: p.financingSource,
      marketType: p.marketType,
      selectionMode: p.selectionMode,
      projectType: p.subCategory,
      sector: p.sector,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
    const zones = p.interventionZones && p.interventionZones.length > 0
      ? p.interventionZones
      : p.interventionZone
      ? [p.interventionZone]
      : [];
    if (includeZone && zones.length > 0) {
      base.interventionZones = zones;
      base.interventionZoneCount = zones.length;
      base.interventionZoneTotalAreaSqm = zones.reduce(
        (sum, z) => sum + (z.areaSqm ?? 0),
        0,
      );
      // GeoJSON FeatureCollection for tooling
      base.interventionZonesGeoJSON = {
        type: 'FeatureCollection',
        features: zones.map((z, idx) => ({
          type: 'Feature',
          properties: {
            label: z.label ?? `Zone ${idx + 1}`,
            shape: z.type,
            areaSqm: z.areaSqm,
            radiusMeters: z.radiusMeters,
            address: z.address,
          },
          geometry:
            z.type === 'circle' || z.type === 'point'
              ? {
                  type: 'Point',
                  coordinates: [z.coordinates[0]?.lng, z.coordinates[0]?.lat],
                }
              : {
                  type: 'Polygon',
                  coordinates: [
                    [
                      ...z.coordinates.map((c) => [c.lng, c.lat]),
                      [z.coordinates[0]?.lng, z.coordinates[0]?.lat],
                    ],
                  ],
                },
        })),
      };
    }
    return base;
  }

  private toCSV(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';
    // Flatten any object/array cells to JSON-stringified scalars.
    const flat = rows.map((r) => {
      const o: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) {
        o[k] = v && typeof v === 'object' ? JSON.stringify(v) : v;
      }
      return o;
    });
    const headers = Array.from(
      flat.reduce<Set<string>>((acc, r) => {
        Object.keys(r).forEach((k) => acc.add(k));
        return acc;
      }, new Set()),
    );
    const escape = (val: unknown) => {
      if (val == null) return '';
      const s = String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(',')];
    for (const r of flat) lines.push(headers.map((h) => escape(r[h])).join(','));
    return lines.join('\n');
  }
}
