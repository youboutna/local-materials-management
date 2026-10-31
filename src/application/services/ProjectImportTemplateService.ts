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
import type { PlanningPreviewDTO, PlanningPreviewInputDTO } from '@/dtos/entities/PlanningPreviewDTO';
import { addDays,format,isValid,parseISO } from 'date-fns';
import type { PlanningWorkbookInputDTO, PlanningWorkbookPreviewDTO } from '@/dtos/entities/PlanningWorkbookDTO';

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
  async readWorkbook(file: File) {
    const { PlanningWorkbookReader } = await import('@/infrastructure/parsers/PlanningWorkbookReader');
    return PlanningWorkbookReader.read(file);
  }

  async readNarrative(file: File): Promise<string> {
    const { PlanningWorkbookReader } = await import('@/infrastructure/parsers/PlanningWorkbookReader');
    return PlanningWorkbookReader.narrative(file);
  }

  isPlanningWorkbook(source: PlanningWorkbookInputDTO['source']): boolean {
    return source.sheets.some(sheet => sheet.rows.slice(0, 5).some(row => row.some(cell => /^(libellé|activités)$/i.test(String(cell.value ?? '').trim()))));
  }

  async readProjectDataset(file: File): Promise<unknown> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const { readFileAsText, readFileAsArrayBuffer } = await import('@/infrastructure/parsers/IProjectFileParser');
    if (extension === 'json') return JSON.parse(await readFileAsText(file));
    if (extension === 'csv') {
      const Papa = await import('papaparse');
      const result = Papa.default.parse(await readFileAsText(file), { header: true, skipEmptyLines: true }) as { data: Record<string, unknown>[]; errors: Array<{ message: string }> };
      if (result.errors.length) throw new Error(result.errors.map(error => error.message).join('; '));
      return result.data;
    }
    if (extension === 'xlsx' || extension === 'xls') {
      const source = await this.readWorkbook(file);
      if (this.isPlanningWorkbook(source)) throw new Error('Planning workbook requires mapping review');
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await readFileAsArrayBuffer(file), { type: 'array' });
      // Every worksheet is retained; metadata/foreign sheets are not mislabelled as projects.
      const projects = workbook.SheetNames.flatMap(name => XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name]));
      return { projects: projects.map(project => ({ ...project, description: project.description ?? JSON.stringify({ planningSource: source }) })) };
    }
    throw new Error('Unsupported project document');
  }

  async archiveSources(projectId: string, files: File[]): Promise<void> {
    const { getDocumentService } = await import('./DocumentService');
    const documents = getDocumentService();
    const existing = await documents.getProjectDocuments(projectId);
    for (const file of files) {
      const { readFileAsArrayBuffer } = await import('@/infrastructure/parsers/IProjectFileParser');
      const digest = await crypto.subtle.digest('SHA-256', await readFileAsArrayBuffer(file));
      const hash = Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, '0')).join('');
      if (existing.some(document => document.metadata?.sourceHash === hash)) continue;
      const saved = await documents.createDocument({ title: file.name, file, projectId, documentType: 'supporting_document', isInternalOnly: true, metadata: { sourceHash: hash, source: 'project_import' } });
      existing.push(saved);
    }
  }

  previewWorkbook(input: PlanningWorkbookInputDTO): PlanningWorkbookPreviewDTO {
    if (!input.title.trim() || !input.reference.trim() || !isValid(parseISO(input.startDate))) throw new Error('Title, reference and valid start date are required');
    const { source, mapping } = input;
    if (!Number.isFinite(mapping.amountMultiplier) || mapping.amountMultiplier <= 0) throw new Error('Invalid monetary scale');
    for (const [key, value] of Object.entries(mapping)) if (key.endsWith('Column') && (!Number.isInteger(value) || Number(value) < 0)) throw new Error('Invalid column');
    const codePattern = new RegExp(mapping.codePattern);
    const totalPattern = new RegExp(mapping.totalPattern, 'i');
    const rows: PlanningWorkbookPreviewDTO['rows'] = [];
    const warnings: PlanningWorkbookPreviewDTO['warnings'] = [];
    const phases: NonNullable<PlanningWorkbookPreviewDTO['project']['phases']> = [];
    for (const sheet of source.sheets) {
      const cellText = (r: number, c: number) => String(sheet.rows[r]?.[c]?.value ?? '').trim();
      const numeric = (r: number, c: number): number | undefined => {
        const value = sheet.rows[r]?.[c]?.value;
        if (value === null || value === undefined || value === '') return undefined;
        const number = typeof value === 'number' ? value : Number(String(value).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.'));
        return Number.isFinite(number) ? number : undefined;
      };
      const candidates = sheet.rows.map((_, index) => ({ index, code: cellText(index, mapping.codeColumn).replace(/[.-]+$/, '').replace(/-/g, '.'), title: cellText(index, mapping.titleColumn) }));
      const seen = new Set<string>();
      const phase: NonNullable<typeof phases>[number] = { code: sheet.name, name: sheet.name, externalRef: `${input.reference}:sheet:${sheet.name}`, order: phases.length, tasks: [], metadata: { planningSource: { filename: source.filename, sheet: sheet.name } } };
      for (const { index, code, title } of candidates) {
        if (!sheet.rows[index].some(cell => cell.value !== null || cell.formula || cell.style)) continue;
        const validCode = codePattern.test(cellText(index, mapping.codeColumn));
        const responsible = cellText(index, mapping.responsibleColumn);
        const quantity = numeric(index, mapping.quantityColumn);
        const unitPrice = numeric(index, mapping.unitPriceColumn);
        const sourceAmount = numeric(index, mapping.amountColumn);
        const unit = cellText(index, mapping.unitColumn);
        const hasChildren = validCode && candidates.some(other => other.index !== index && other.code.startsWith(`${code}.`));
        const kind = !validCode || !title || totalPattern.test(title) ? 'unmapped' : hasChildren && quantity === undefined && !unit && !responsible ? 'group' : 'task';
        rows.push({ sheet: sheet.name, row: index + 1, code: cellText(index, mapping.codeColumn), title, responsible, quantity, unit, sourceAmount, amount: sourceAmount === undefined ? undefined : sourceAmount * mapping.amountMultiplier, kind });
        if (kind === 'unmapped') { if (title && quantity !== undefined) warnings.push({ code: 'missing_code', sheet: sheet.name, row: index + 1 }); continue; }
        if (seen.has(code)) warnings.push({ code: 'duplicate_code', sheet: sheet.name, row: index + 1 });
        seen.add(code);
        if (quantity !== undefined && unitPrice !== undefined && sourceAmount !== undefined && Math.abs(quantity * unitPrice - sourceAmount) > Number.EPSILON * Math.max(1, Math.abs(sourceAmount), Math.abs(quantity * unitPrice)) * 16) warnings.push({ code: 'arithmetic_difference', sheet: sheet.name, row: index + 1 });
        // Stable source row identity avoids collapsing repeated documentary codes.
        if (kind === 'task') phase.tasks?.push({ id: `${input.reference}:${sheet.name}:row:${index + 1}`, title, description: `${cellText(index, mapping.codeColumn)} · ${title}`, assigneeName: responsible || undefined, metadata: { planningSource: { filename: source.filename, sheet: sheet.name, row: index + 1, code: cellText(index, mapping.codeColumn), path: code.split('.'), associates: cellText(index, mapping.associatesColumn), quantity, unit, unitPrice, sourceAmount, amountMultiplier: mapping.amountMultiplier, plannedAmount: sourceAmount === undefined ? undefined : sourceAmount * mapping.amountMultiplier, cells: sheet.rows[index] } } });
      }
      if (phase.tasks?.length) phases.push(phase);
      warnings.push({ code: 'period_review', sheet: sheet.name, row: 1 });
    }
    if (!phases.length) throw new Error('No activity matched the selected mapping');
    // Original values, formulas, styles, totals and unmatched sections survive in
    // the persisted description; budgets/periods are never inferred from subtotals or colours.
    const project: PlanningWorkbookPreviewDTO['project'] = { title: input.title.trim(), externalRef: input.reference.trim(), projectReference: input.reference.trim(), startDate: input.startDate, currency: input.currency, referentialCode: input.referentialCode, phases, description: JSON.stringify({ planningSource: source, mapping }), metadata: { planningSource: source, mapping } };
    return { project, source, rows, warnings };
  }
  /** Controlled table import, not an inference engine for arbitrary prose. */
  previewPlanning(input: PlanningPreviewInputDTO): PlanningPreviewDTO {
    const anchor=parseISO(input.startDate);
    if(!isValid(anchor) || !input.title.trim() || !input.reference.trim()) throw new Error('Title, reference and valid start date are required');
    const {mapping}=input;
    if(!Number.isInteger(mapping.daysPerWeek) || mapping.daysPerWeek<=0) throw new Error('Invalid calendar period');
    const week=new RegExp(mapping.weekPattern,'i');
    const post=new RegExp(mapping.postDeliveryPattern,'i');
    const milestone=new RegExp(mapping.milestonePattern,'i');
    const dateAt=(offset:number)=>format(addDays(anchor,offset),'yyyy-MM-dd');
    const project: PlanningPreviewDTO['project']={title:input.title.trim(),externalRef:input.reference.trim(),projectReference:input.reference.trim(),startDate:input.startDate,currency:input.currency,referentialCode:input.referentialCode,phases:[]};
    const unmatchedLines:PlanningPreviewDTO['unmatchedLines']=[];
    const pendingPost:Array<{index:number;start:number;end:number}>=[];
    const warnings:string[]=[];
    for(const [index,text] of input.text.split(/\r?\n/).entries()) {
      if(!text.trim()) continue;
      const columns=text.split(mapping.delimiter);
      const schedule=columns[mapping.scheduleColumn] ?? '';
      const range=schedule.match(week); const after=schedule.match(post);
      const name=columns[mapping.phaseColumn]?.trim();
      if(!name || (!range && !after)) {unmatchedLines.push({line:index+1,text});continue;}
      const phaseIndex=project.phases?.length ?? 0;
      const ref=`${input.reference}:phase:${phaseIndex}`;
      const phase: NonNullable<typeof project.phases>[number]={externalRef:ref,code:`import_${phaseIndex}`,name,description:columns[mapping.missionsColumn]?.trim(),order:phaseIndex,progress:0};
      if(range) {
        const start=Number(range[1]);const end=Number(range[2] ?? range[1]);
        if(start<1 || end<start) throw new Error(`Invalid schedule at line ${index+1}`);
        phase.startDate=dateAt((start-1)*mapping.daysPerWeek);
        phase.endDate=dateAt(end*mapping.daysPerWeek-1);
      } else if(after) pendingPost.push({index:phaseIndex,start:Number(after[1]),end:Number(after[2])});
      const deliverable=columns[mapping.deliverableColumn]?.trim();
      if(deliverable) {
        const explicit=deliverable.match(milestone);
        phase.milestones=[{title:deliverable,name:deliverable,targetDate:explicit?dateAt(Number(explicit[1])*mapping.daysPerWeek-1):phase.endDate,externalRef:`${ref}:delivery`}];
      }
      phase.tasks=(phase.description ?? '').split(',').map(title=>title.trim()).filter(Boolean).map((title,taskIndex)=>({id:`${ref}:task:${taskIndex}`,title,startDate:phase.startDate,endDate:phase.endDate}));
      project.phases?.push(phase);
    }
    const delivery=(project.phases ?? []).map(p=>p.endDate).filter((d):d is string=>Boolean(d)).sort().at(-1);
    for(const pending of pendingPost) {
      const phase=project.phases?.[pending.index];
      if(!phase || !delivery || pending.end<pending.start) throw new Error('Post-delivery period has no valid anchor');
      phase.startDate=format(addDays(parseISO(delivery),pending.start),'yyyy-MM-dd');
      phase.endDate=format(addDays(parseISO(delivery),pending.end),'yyyy-MM-dd');
      for(const task of phase.tasks ?? []) {task.startDate=phase.startDate;task.endDate=phase.endDate;}
      for(const item of phase.milestones ?? []) if(!item.targetDate) item.targetDate=phase.endDate;
    }
    if(!project.phases?.length) throw new Error('No schedule row matched the selected mapping');
    project.endDate=project.phases.map(phase=>phase.endDate).filter((date):date is string=>Boolean(date)).sort().at(-1);
    for(const phase of project.phases) for(const item of phase.milestones ?? []) {
      if(item.targetDate && phase.endDate && item.targetDate>phase.endDate) warnings.push(`${phase.name}: ${item.title} (${item.targetDate}) > ${phase.endDate}`);
    }
    // Unmapped sections remain in the exported source, never silently discarded.
    project.description=input.text;
    return {project,unmatchedLines,warnings,sourceText:input.text};
  }
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
      return getReferential(code as ReferentialType) ?? undefined;
    } catch {
      return undefined;
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
    const phases = (referential as unknown as { phases?: Array<Record<string, unknown>> }).phases ?? [];

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