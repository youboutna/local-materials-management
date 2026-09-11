// src/application/services/ProjectImportTemplateService.ts
//
// Génère des modèles de fichier d'import pour les projets.
// Formats supportés :
//   - json            : dataset complet (phases, jalons, tâches, DQE)
//   - csv             : tableau à plat (champs projet uniquement)
//   - geojson         : FeatureCollection QField/QGIS (1 Feature = 1 projet)
//   - kml             : Placemarks QGIS (1 Placemark = 1 projet)
//   - msproject-xml   : XML Microsoft Project (phases/steps/tasks)
//
// Source des données : référentiels (CUSTOM_STANDARD, BTP_INFRA, etc.).
// Aucune écriture en base, aucune lecture de données utilisateur.

import {
  getAllReferentials,
  getReferential,
  type ReferentialType,
} from '@/config/referentials';

// =============================================================================
// TYPES
// =============================================================================

export type TemplateFormat =
  | 'json'
  | 'csv'
  | 'geojson'
  | 'kml'
  | 'msproject-xml';

export type TemplateLanguage = 'fr' | 'ar' | 'en';

export interface TemplateOptions {
  /** Code du référentiel à utiliser comme source. */
  referentialCode: ReferentialType | string;
  /** Langue des labels. */
  language?: TemplateLanguage;
  /** Inclure les relations (phases/jalons/tâches). */
  withRelations?: boolean;
}

export interface SerializedTemplate {
  content: string;
  mimeType: string;
  filename: string;
}

export interface ReferentialOption {
  value: string;
  label: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export class ProjectImportTemplateService {
  // ---------------------------------------------------------------------------
  // LISTE DES RÉFÉRENTIELS
  // ---------------------------------------------------------------------------

  listReferentials(language: TemplateLanguage = 'fr'): ReferentialOption[] {
    try {
      const referentials = getAllReferentials();
      return referentials.map((ref) => ({
        value: ref.code,
        label: this.resolveLabel(ref.name, language) || ref.code,
      }));
    } catch {
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // SÉRIALISATION
  // ---------------------------------------------------------------------------

  serialize(
    format: TemplateFormat,
    options: TemplateOptions,
  ): SerializedTemplate {
    const language = options.language ?? 'fr';

    switch (format) {
      case 'json':
        return this.serializeJson(options, language);
      case 'csv':
        return this.serializeCsv(options, language);
      case 'geojson':
        return this.serializeGeoJson(options, language);
      case 'kml':
        return this.serializeKml(options, language);
      case 'msproject-xml':
        return this.serializeMsProjectXml(options, language);
      default:
        throw new Error(`Format de template non supporté : ${String(format)}`);
    }
  }

  // ---------------------------------------------------------------------------
  // JSON
  // ---------------------------------------------------------------------------

  private serializeJson(
    options: TemplateOptions,
    language: TemplateLanguage,
  ): SerializedTemplate {
    const referential = this.loadReferential(options.referentialCode);
    const withRelations = options.withRelations !== false;

    const project = {
      externalRef: 'EXT-PRJ-0001',
      projectReference: 'PRJ-XXXX-001',
      title: this.resolveLabel(referential?.name, language) ?? 'Projet exemple — à remplacer',
      description: this.resolveLabel(referential?.description, language) ?? 'Description du projet',
      location: 'Localisation à préciser',
      status: 'en attente',
      progress: 0,
      budget: 0,
      currency: 'MRU',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      teamSize: 1,
      referentialCode: options.referentialCode,
      // Relations (optionnelles)
      phases: withRelations ? this.buildPhaseTemplates(referential, language) : [],
    };

    const dataset = {
      referentialCode: options.referentialCode,
      projects: [project],
      organizations: [],
      suppliers: [],
      employees: [],
    };

    return {
      content: JSON.stringify(dataset, null, 2),
      mimeType: 'application/json',
      filename: `template_${options.referentialCode}_${language}.json`,
    };
  }

  // ---------------------------------------------------------------------------
  // CSV
  // ---------------------------------------------------------------------------

  private serializeCsv(
    options: TemplateOptions,
    language: TemplateLanguage,
  ): SerializedTemplate {
    const headers = [
      'title',
      'description',
      'location',
      'status',
      'progress',
      'budget',
      'currency',
      'startDate',
      'endDate',
      'teamSize',
      'projectReference',
      'externalRef',
      'referentialCode',
      'financingSource',
      'marketType',
      'selectionMode',
      'latitude',
      'longitude',
    ];

    const exampleRow = [
      'Projet exemple — à remplacer',
      'Description du projet',
      'Localisation à préciser',
      'en attente',
      '0',
      '0',
      'MRU',
      new Date().toISOString().split('T')[0],
      '',
      '1',
      'PRJ-XXXX-001',
      'EXT-PRJ-0001',
      String(options.referentialCode),
      '',
      '',
      '',
      '',
      '',
    ];

    const escape = (val: string): string =>
      /[",\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;

    const csv = [
      headers.join(','),
      exampleRow.map(escape).join(','),
    ].join('\n');

    return {
      content: csv,
      mimeType: 'text/csv',
      filename: `template_${options.referentialCode}_${language}.csv`,
    };
  }

  // ---------------------------------------------------------------------------
  // GEOJSON (QField / QGIS)
  // ---------------------------------------------------------------------------

  private serializeGeoJson(
    options: TemplateOptions,
    language: TemplateLanguage,
  ): SerializedTemplate {
    const referential = this.loadReferential(options.referentialCode);

    const template = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            fid: 'EXT-PRJ-0001',
            name: this.resolveLabel(referential?.name, language) ?? 'Projet exemple QField',
            description: 'Description du projet terrain',
            location: 'Nouakchott',
            budget: 0,
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            team_size: 1,
            status: 'en attente',
            progress: 0,
            financing_source: '',
            market_type: '',
            selection_mode: '',
            project_reference: 'PRJ-XXXX-001',
            referentialCode: options.referentialCode,
          },
          geometry: {
            type: 'Point',
            coordinates: [-15.9582, 18.0735], // [longitude, latitude]
          },
        },
      ],
    };

    return {
      content: JSON.stringify(template, null, 2),
      mimeType: 'application/geo+json',
      filename: `template_${options.referentialCode}_${language}.geojson`,
    };
  }

  // ---------------------------------------------------------------------------
  // KML (QGIS)
  // ---------------------------------------------------------------------------

  private serializeKml(
    options: TemplateOptions,
    language: TemplateLanguage,
  ): SerializedTemplate {
    const referential = this.loadReferential(options.referentialCode);
    const name = this.escapeXml(
      this.resolveLabel(referential?.name, language) ?? 'Projet exemple KML',
    );

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Template import projets — ${this.escapeXml(String(options.referentialCode))}</name>
    <Placemark>
      <name>${name}</name>
      <description>Description du projet</description>
      <ExtendedData>
        <Data name="fid"><value>EXT-PRJ-0001</value></Data>
        <Data name="location"><value>Nouakchott</value></Data>
        <Data name="budget"><value>0</value></Data>
        <Data name="startDate"><value>${new Date().toISOString().split('T')[0]}</value></Data>
        <Data name="endDate"><value></value></Data>
        <Data name="teamSize"><value>1</value></Data>
        <Data name="status"><value>en attente</value></Data>
        <Data name="progress"><value>0</value></Data>
        <Data name="projectReference"><value>PRJ-XXXX-001</value></Data>
        <Data name="referentialCode"><value>${this.escapeXml(String(options.referentialCode))}</value></Data>
      </ExtendedData>
      <Point>
        <coordinates>-15.9582,18.0735,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

    return {
      content: kml,
      mimeType: 'application/vnd.google-earth.kml+xml',
      filename: `template_${options.referentialCode}_${language}.kml`,
    };
  }

  // ---------------------------------------------------------------------------
  // MS PROJECT XML
  // ---------------------------------------------------------------------------

  private serializeMsProjectXml(
    options: TemplateOptions,
    language: TemplateLanguage,
  ): SerializedTemplate {
    const referential = this.loadReferential(options.referentialCode);
    const phases = referential?.phases ?? [];

    const startDate = new Date().toISOString();
    const finishDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    let taskId = 1;
    const taskBlocks: string[] = [];

    // Tâche racine (niveau 0)
    taskBlocks.push(this.buildMsProjectTask({
      id: taskId++,
      name: this.resolveLabel(referential?.name, language) ?? 'Projet exemple MS Project',
      outlineLevel: 0,
      summary: 1,
      start: startDate,
      finish: finishDate,
      durationHours: 8 * 90,
      percentComplete: 0,
      wbs: '1',
      notes: 'Projet exemple — à remplacer',
    }));

    // Phases (niveau 1)
    let phaseIndex = 0;
    for (const phase of phases) {
      phaseIndex++;
      const phaseWbs = `1.${phaseIndex}`;
      const phaseLabel = this.resolveLabel((phase as { label?: unknown }).label ?? (phase as { name?: string }).name, language);
      const phaseStart = startDate;
      const phaseFinish = finishDate;

      taskBlocks.push(this.buildMsProjectTask({
        id: taskId++,
        name: phaseLabel || `Phase ${phaseIndex}`,
        outlineLevel: 1,
        summary: 1,
        start: phaseStart,
        finish: phaseFinish,
        durationHours: 8 * 30,
        percentComplete: 0,
        wbs: phaseWbs,
        notes: `Phase issue du référentiel ${options.referentialCode}`,
      }));

      // Steps (niveau 2)
      const steps = (phase as { steps?: Array<{ label?: unknown; name?: string; tasks?: Array<{ label?: unknown; name?: string; estimatedDurationDays?: number }> }> }).steps ?? [];
      let stepIndex = 0;
      for (const step of steps) {
        stepIndex++;
        const stepWbs = `${phaseWbs}.${stepIndex}`;
        const stepLabel = this.resolveLabel(step.label ?? step.name, language);

        taskBlocks.push(this.buildMsProjectTask({
          id: taskId++,
          name: stepLabel || `Étape ${stepIndex}`,
          outlineLevel: 2,
          summary: 1,
          start: phaseStart,
          finish: phaseFinish,
          durationHours: 8 * 15,
          percentComplete: 0,
          wbs: stepWbs,
        }));

        // Tasks (niveau 3)
        let taskInStepIndex = 0;
        for (const task of step.tasks ?? []) {
          taskInStepIndex++;
          const taskWbs = `${stepWbs}.${taskInStepIndex}`;
          const taskLabel = this.resolveLabel(task.label ?? task.name, language);
          const durationDays = task.estimatedDurationDays ?? 7;

          taskBlocks.push(this.buildMsProjectTask({
            id: taskId++,
            name: taskLabel || `Tâche ${taskInStepIndex}`,
            outlineLevel: 3,
            summary: 0,
            start: startDate,
            finish: finishDate,
            durationHours: 8 * durationDays,
            percentComplete: 0,
            wbs: taskWbs,
          }));
        }
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>${this.escapeXml(this.resolveLabel(referential?.name, language) ?? 'Projet exemple')}</Name>
  <Tasks>
${taskBlocks.map((block) => this.indent(block, 4)).join('\n')}
  </Tasks>
</Project>`;

    return {
      content: xml,
      mimeType: 'application/xml',
      filename: `template_${options.referentialCode}_${language}.xml`,
    };
  }

  // ---------------------------------------------------------------------------
  // HELPERS INTERNES
  // ---------------------------------------------------------------------------

  private loadReferential(code: ReferentialType | string): ReturnType<typeof getReferential> {
    try {
      return getReferential(code as ReferentialType) ?? null;
    } catch {
      return null;
    }
  }

  private resolveLabel(label: unknown, language: TemplateLanguage): string {
    if (!label) return '';
    if (typeof label === 'string') return label;
    if (typeof label === 'object') {
      const obj = label as Record<string, string>;
      return obj[language] || obj.fr || obj.code || '';
    }
    return String(label);
  }

  private buildPhaseTemplates(
    referential: ReturnType<typeof getReferential>,
    language: TemplateLanguage,
  ): Array<Record<string, unknown>> {
    if (!referential) return [];
    const phases = (referential as { phases?: Array<Record<string, unknown>> }).phases ?? [];

    return phases.map((phase, index) => {
      const phaseLabel = this.resolveLabel(phase.label ?? phase.name, language);
      const steps = (phase.steps as Array<Record<string, unknown>> | undefined) ?? [];

      // Somme des durées des tâches pour calculer estimatedDuration
      let totalDays = 0;
      const taskTemplates: Array<Record<string, unknown>> = [];
      for (const step of steps) {
        const tasks = (step.tasks as Array<Record<string, unknown>> | undefined) ?? [];
        for (const task of tasks) {
          const days = (task.estimatedDurationDays as number | undefined) ?? 7;
          totalDays += days;
          taskTemplates.push({
            title: this.resolveLabel(task.label ?? task.name, language),
            estimatedDurationDays: days,
            requiresInspection: task.requiresInspection ?? false,
            requiresEngineerApproval: task.requiresEngineerApproval ?? false,
            status: 'pending',
            priority: 'medium',
            progress: 0,
          });
        }
      }

      return {
        code: phase.code ?? `PH${index + 1}`,
        name: phaseLabel || `Phase ${index + 1}`,
        order: (phase.order as number | undefined) ?? index + 1,
        durationDays: totalDays > 0 ? totalDays : undefined,
        estimatedDuration: totalDays > 0 ? totalDays : undefined,
        startDate: '',
        endDate: '',
        status: 'not_started',
        progress: 0,
        tasks: taskTemplates,
        milestones: [],
        dqeLines: [],
      };
    });
  }

  private buildMsProjectTask(params: {
    id: number;
    name: string;
    outlineLevel: number;
    summary: 0 | 1;
    start: string;
    finish: string;
    durationHours: number;
    percentComplete: number;
    wbs: string;
    notes?: string;
  }): string {
    const durationIso = this.hoursToIsoDuration(params.durationHours);
    const taskBlock = `<Task>
  <UID>${params.id}</UID>
  <ID>${params.id}</ID>
  <Name>${this.escapeXml(params.name)}</Name>
  <OutlineLevel>${params.outlineLevel}</OutlineLevel>
  <Summary>${params.summary}</Summary>
  <Start>${params.start}</Start>
  <Finish>${params.finish}</Finish>
  <Duration>${durationIso}</Duration>
  <PercentComplete>${params.percentComplete}</PercentComplete>
  <WBS>${this.escapeXml(params.wbs)}</WBS>${params.notes ? `\n  <Notes>${this.escapeXml(params.notes)}</Notes>` : ''}
</Task>`;
    return taskBlock;
  }

  private hoursToIsoDuration(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `PT${h}H${m}M0S`;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private indent(text: string, spaces: number): string {
    const pad = ' '.repeat(spaces);
    return text
      .split('\n')
      .map((line) => (line.trim() ? pad + line : line))
      .join('\n');
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

export const projectImportTemplateService = new ProjectImportTemplateService();
export default ProjectImportTemplateService;