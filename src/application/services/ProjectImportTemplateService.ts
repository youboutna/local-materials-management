/**
 * ProjectImportTemplateService — génération des modèles d'import projets.
 *
 * Le modèle n'est PAS codé en dur : il est dérivé des référentiels métier
 * (`src/config/referentials/*`) et aligné sur la structure de base
 * (`btp.projects`, `btp.project_phases`, `btp.project_milestones`,
 *  `btp.project_tasks`, `btp.project_stakeholders`, `btp.boq_lines`).
 *
 * Service pur TypeScript (aucun React, aucun accès Supabase).
 */

import {
  getLabel,
  getReferential,
  getReferentialOptions,
  type ReferentialType,
} from '@/config/referentials';
import type {
  ProjectImportPhase,
  ProjectImportRow,
} from '@/application/services/ProjectImportExportService';

export type TemplateFormat = 'json' | 'csv';

export interface TemplateOptions {
  referentialCode?: ReferentialType;
  language?: 'fr' | 'ar' | 'en';
  /** Inclut les sous-objets (phases, jalons, tâches, DQE, parties prenantes). */
  withRelations?: boolean;
}

/** Colonnes plates du modèle CSV / Excel — 1 ligne = 1 projet. */
export const TEMPLATE_FLAT_COLUMNS = [
  'externalRef',
  'reference',
  'title',
  'description',
  'projectType',
  'referentialCode',
  'status',
  'progress',
  'budget',
  'currency',
  'startDate',
  'endDate',
  'location',
  'latitude',
  'longitude',
  'teamSize',
  'financingSource',
  'marketType',
  'selectionMode',
  'launchDate',
  'attributionDate',
  'completionDate',
  'organizationId',
] as const;

const iso = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export class ProjectImportTemplateService {
  /** Liste des référentiels sélectionnables pour le modèle. */
  listReferentials(language: 'fr' | 'ar' | 'en' = 'fr') {
    return getReferentialOptions(language);
  }

  /** Construit les phases du modèle à partir du référentiel choisi. */
  buildPhasesFromReferential(
    referentialCode: ReferentialType,
    language: 'fr' | 'ar' | 'en' = 'fr',
  ): ProjectImportPhase[] {
    const referential = getReferential(referentialCode);
    if (!referential) return [];

    let cursor = 0;
    return [...referential.phases]
      .sort((a, b) => a.order - b.order)
      .map((phase) => {
        const duration =
          phase.defaultDurationDays ?? phase.dqeMapping?.defaultDurationDays ?? 30;
        const startDate = iso(cursor);
        cursor += duration;
        const endDate = iso(cursor);

        const firstStep = phase.steps?.[0];
        const tasks = (firstStep?.tasks ?? []).slice(0, 2).map((task) => ({
          title: getLabel(task.label, language),
          description: task.description ? getLabel(task.description, language) : undefined,
          status: 'pending',
          priority: 'medium',
          progress: 0,
          startDate,
          endDate,
        }));

        const dqeCategory = phase.dqeMapping?.categories?.[0];

        return {
          // `code` alimente `project_phases.phase_code` (le code métier),
          // `phase_type` est calculé côté service ('standard' | 'custom').
          code: phase.code,
          externalRef: `${referential.code}:${phase.code}`,
          name: getLabel(phase.label, language),
          description: phase.description ? getLabel(phase.description, language) : undefined,
          order: phase.order,
          durationDays: duration,
          startDate,
          endDate,
          progress: 0,
          milestones: [
            {
              externalRef: `${referential.code}:${phase.code}:MS1`,
              title: `Validation ${getLabel(phase.label, language)}`,
              targetDate: endDate,
              status: 'pending',
              progress: 0,
            },
          ],
          tasks,
          dqeLines: dqeCategory
            ? ([
                {
                  source: 'project',
                  contextId: '',
                  btpCode: `${phase.code}-001`,
                  designation: `Prestation type — ${dqeCategory}`,
                  unit: 'U',
                  quantity: 1,
                  unitPrice: 0,
                  resourceType: 'material',
                  note: `Catégorie DQE référentiel : ${dqeCategory}`,
                },
              ] as unknown as ProjectImportPhase['dqeLines'])
            : [],
        } as ProjectImportPhase;
      });
  }

  /** Modèle complet (1 projet d'exemple, structure exhaustive). */
  buildTemplateRows(options: TemplateOptions = {}): ProjectImportRow[] {
    const language = options.language ?? 'fr';
    const referentialCode = options.referentialCode ?? 'CUSTOM_STANDARD';
    const referential = getReferential(referentialCode);
    const withRelations = options.withRelations !== false;

    const row: ProjectImportRow = {
      externalRef: 'EXT-PRJ-0001',
      reference: 'PRJ-2026-001',
      title: 'Projet exemple — à remplacer',
      description: referential
        ? `Exemple conforme au référentiel ${getLabel(referential.name, language)}`
        : 'Exemple de projet',
      projectType: 'infrastructure',
      referentialCode,
      status: 'en cours',
      progress: 0,
      budget: { total: 50_000_000, currency: 'MRU', sources: [{ name: 'État', amount: 50_000_000 }] },
      startDate: iso(0),
      endDate: iso(360),
      location: 'Nouakchott',
      latitude: 18.0735,
      longitude: -15.9582,
      teamSize: 5,
      financingSource: 'État',
      marketType: 'appel_offre_local',
      selectionMode: 'prix_le_plus_bas',
      launchDate: iso(5),
      attributionDate: iso(45),
      completionDate: iso(360),
      organizationId: 'EXT-ORG-0001',
    } as ProjectImportRow;

    if (!withRelations) return [row];

    return [
      {
        ...row,
        phases: this.buildPhasesFromReferential(referentialCode, language),
        stakeholders: [
          {
            stakeholderType: 'project_manager',
            stakeholderEntityType: 'employee',
            roleDescription: 'Chef de projet',
            externalRef: 'EXT-STK-0001',
            organizationId: 'EXT-ORG-0001',
            isPrimary: true,
          },
        ] as ProjectImportRow['stakeholders'],
      },
    ];
  }

  /** Sérialise le modèle dans le format demandé. */
  serialize(
    format: TemplateFormat,
    options: TemplateOptions = {},
  ): { content: string; mimeType: string; filename: string } {
    const referentialCode = options.referentialCode ?? 'CUSTOM_STANDARD';
    const rows = this.buildTemplateRows(options);

    if (format === 'csv') {
      const flat = rows.map((r) => {
        const record = r as unknown as Record<string, unknown>;
        return TEMPLATE_FLAT_COLUMNS.map((col) => {
          const value =
            col === 'budget' && typeof record.budget === 'object'
              ? (record.budget as { total?: number }).total
              : record[col];
          if (value == null) return '';
          const str = String(value);
          return /[",;\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',');
      });
      return {
        content: [TEMPLATE_FLAT_COLUMNS.join(','), ...flat].join('\n'),
        mimeType: 'text/csv;charset=utf-8',
        filename: `modele_projets_${referentialCode.toLowerCase()}.csv`,
      };
    }

    return {
      content: JSON.stringify({ referentialCode, projects: rows }, null, 2),
      mimeType: 'application/json',
      filename: `modele_projets_${referentialCode.toLowerCase()}.json`,
    };
  }
}

export const projectImportTemplateService = new ProjectImportTemplateService();
