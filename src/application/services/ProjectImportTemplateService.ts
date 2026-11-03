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
import type { PlanningWorkbookInputDTO, PlanningWorkbookPreviewDTO, PlanningWorkbookSuggestionDTO } from '@/dtos/entities/PlanningWorkbookDTO';
import { DEFAULT_WORKBOOK_MAPPING } from '@/config/referentials/projects/planning-import.referential';
import { IMPORT_FORMAT_EXTENSIONS, IMPORT_PROFILES, getImportProfile, type ImportFileFormat, type ImportProfile } from '@/config/referentials/projects/import-profiles.referential';
import type { PlanningWorkbookDTO } from '@/dtos/entities/PlanningWorkbookDTO';

export type ParsedImport =
  | { kind: 'dataset'; dataset: unknown }
  | { kind: 'hierarchical_workbook'; profile: ImportProfile; source: PlanningWorkbookDTO; defaults: PlanningWorkbookSuggestionDTO };

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

  /**
   * Blank hierarchical workbook template generated from the profile mapping
   * (column positions, header vocabulary), so it round-trips through readWorkbook.
   */
  async buildWorkbookTemplate(profileCode: string): Promise<{ content: ArrayBuffer; filename: string; mimeType: string }> {
    const profile = getImportProfile(profileCode);
    const mapping = profile.mapping ?? DEFAULT_WORKBOOK_MAPPING;
    const XLSX = await import('xlsx');
    const width = Math.max(mapping.codeColumn, mapping.titleColumn, mapping.responsibleColumn, mapping.associatesColumn,
      mapping.unitColumn, mapping.quantityColumn, mapping.unitPriceColumn, mapping.amountColumn) + 1;
    const row = (cells: Partial<Record<keyof typeof mapping, string | number>>) => {
      const out: Array<string | number> = Array(width).fill('');
      for (const [key, value] of Object.entries(cells)) {
        const idx = mapping[key as keyof typeof mapping];
        if (typeof idx === 'number' && value !== undefined) out[idx] = value;
      }
      return out;
    };
    const header = row({ codeColumn: 'Code', titleColumn: 'Libellé', responsibleColumn: 'Responsable', associatesColumn: 'Associés',
      unitColumn: 'Unité', quantityColumn: 'Qté', unitPriceColumn: 'PU-MRU milliers', amountColumn: 'PT-MRU milliers' });
    const wb = XLSX.utils.book_new();
    const recap = [['Récapitulatif'], [''], ['Composante', 'Montant (MRU milliers)'], ['Composante 1', 0]];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(recap), 'Récap');
    const sheet = [
      ['Composante 1 : <intitulé de la composante>'], [''], header,
      row({ codeColumn: '1.1', titleColumn: '<Sous-composante>' }),
      row({ codeColumn: '1.1.1', titleColumn: '<Activité>', responsibleColumn: '<Responsable>', associatesColumn: '<Associé 1>/<Associé 2>',
        unitColumn: '<Unité>', quantityColumn: 0, unitPriceColumn: 0, amountColumn: 0 }),
      row({ titleColumn: 'Total sous composante 1.1', amountColumn: 0 }),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet), 'C1');
    const content = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    return { content, filename: `modele_${profile.code.toLowerCase()}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  }

  async readNarrative(file: File): Promise<string> {
    const { PlanningWorkbookReader } = await import('@/infrastructure/parsers/PlanningWorkbookReader');
    return PlanningWorkbookReader.narrative(file);
  }

  listImportProfiles(language: TemplateLanguage = 'fr'): Array<{ value: string; label: string; formats: readonly ImportFileFormat[] }> {
    return IMPORT_PROFILES.map(profile => ({ value: profile.code, label: profile.label[language], formats: profile.formats }));
  }

  acceptFor(format: ImportFileFormat): string {
    return IMPORT_FORMAT_EXTENSIONS[format].map(extension => `.${extension}`).join(',');
  }

  /**
   * Single generic entry point: the file is read without assumption, then the
   * selected profile (referential) decides how its rows are interpreted.
   */
  async parseWithProfile(file: File, profileCode: string, format: ImportFileFormat): Promise<ParsedImport> {
    const profile = getImportProfile(profileCode);
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!profile.formats.includes(format)) throw new Error(`Format ${format} not supported by ${profile.code}`);
    if (!IMPORT_FORMAT_EXTENSIONS[format].includes(extension)) throw new Error(`File .${extension} does not match format ${format}`);
    if (profile.kind === 'hierarchical_workbook') {
      const source = await this.readWorkbook(file);
      const mapping = profile.mapping ?? DEFAULT_WORKBOOK_MAPPING;
      return { kind: 'hierarchical_workbook', profile, source, defaults: this.suggestWorkbookDefaults(source, mapping) };
    }
    return { kind: 'dataset', dataset: await this.readProjectDataset(file) };
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
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await readFileAsArrayBuffer(file), { type: 'array' });
      // Every worksheet is retained; metadata/foreign sheets are not mislabelled as projects.
      const projects = workbook.SheetNames.flatMap(name => XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name]));
      return { projects };
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

  /** Reviewable defaults read from the workbook itself (recap title, scale, total). */
  suggestWorkbookDefaults(source: PlanningWorkbookInputDTO['source'], mapping = DEFAULT_WORKBOOK_MAPPING): PlanningWorkbookSuggestionDTO {
    const summaryPattern = new RegExp(mapping.summarySheetPattern, 'i');
    const componentPattern = new RegExp(mapping.componentPattern, 'i');
    const thousands = new RegExp(mapping.thousandsPattern, 'i');
    const text = (value: unknown) => String(value ?? '').replace(/\u00a0/g, ' ').trim();
    const components: Record<string, string> = {};
    let title: string | undefined; let budget: number | undefined;
    const scaled = source.sheets.some(sheet => sheet.rows.slice(0, Math.max(mapping.headerRows, 5)).some(row => row.some(cell => thousands.test(text(cell.value)))));
    for (const sheet of source.sheets.filter(item => summaryPattern.test(item.name))) {
      for (const row of sheet.rows) {
        const first = text(row.find(cell => text(cell.value))?.value);
        if (!first) continue;
        title ??= first;
        const match = first.match(componentPattern);
        if (match) components[match[1]] = first;
        if (budget === undefined && /^total/i.test(first)) { const value = row.find(cell => typeof cell.value === 'number')?.value; if (typeof value === 'number') budget = value; }
      }
    }
    const amountMultiplier = scaled ? 1000 : undefined;
    return { title, amountMultiplier, budget: budget === undefined ? undefined : budget * (amountMultiplier ?? 1), components };
  }

  /**
   * Direct import path for a workbook profile: values read from the workbook
   * (title, scale, budget) are applied; missing identity falls back to the file name and today.
   */
  workbookToDataset(parsed: Extract<ParsedImport, { kind: 'hierarchical_workbook' }>, referentialCode: string, today = new Date()): { projects: unknown[]; organizations: unknown[]; preview: PlanningWorkbookPreviewDTO } {
    const base = parsed.source.filename.replace(/\.[^.]+$/, '').trim();
    const reference = base.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40).toUpperCase() || 'PTBA';
    const mapping = { ...(parsed.profile.mapping ?? DEFAULT_WORKBOOK_MAPPING), ...(parsed.defaults.amountMultiplier ? { amountMultiplier: parsed.defaults.amountMultiplier } : {}) };
    const preview = this.previewWorkbook({
      source: parsed.source, title: parsed.defaults.title || base, reference,
      startDate: today.toISOString().slice(0, 10), currency: 'MRU',
      budget: parsed.defaults.budget ?? 0, referentialCode, mapping,
      templateDefaults: parsed.profile.templateDefaults,
    });
    const { organizations, ...project } = preview.project as typeof preview.project & { organizations?: unknown[] };
    return { projects: [project], organizations: organizations ?? [], preview };
  }

  previewWorkbook(input: PlanningWorkbookInputDTO): PlanningWorkbookPreviewDTO {
    if (!input.title.trim() || !input.reference.trim() || !isValid(parseISO(input.startDate))) throw new Error('Title, reference and valid start date are required');
    if (!Number.isFinite(input.budget) || input.budget < 0) throw new Error('A reviewed non-negative project budget is required');
    const source = input.source;
    const mapping = { ...DEFAULT_WORKBOOK_MAPPING, ...input.mapping };
    if (!Number.isFinite(mapping.amountMultiplier) || mapping.amountMultiplier <= 0) throw new Error('Invalid monetary scale');
    for (const [key, value] of Object.entries(mapping)) if ((key.endsWith('Column') || key.endsWith('Depth') || key === 'headerRows') && (!Number.isInteger(value) || Number(value) < 0)) throw new Error('Invalid column');
    const codePattern = new RegExp(mapping.codePattern);
    const totalPattern = new RegExp(mapping.totalPattern, 'i');
    const titleCodePattern = new RegExp(mapping.titleCodePattern);
    const groupPattern = new RegExp(mapping.financingGroupPattern, 'i');
    const periodPattern = new RegExp(mapping.periodPattern);
    const summaryPattern = new RegExp(mapping.summarySheetPattern, 'i');
    const componentPattern = new RegExp(mapping.componentPattern, 'i');
    const headerTitlePattern = new RegExp(mapping.headerTitlePattern, 'i');
    const td = input.templateDefaults ?? {};
    const recap = this.suggestWorkbookDefaults(source, mapping);
    const rows: PlanningWorkbookPreviewDTO['rows'] = [];
    const warnings: PlanningWorkbookPreviewDTO['warnings'] = [];
    const summary: PlanningWorkbookPreviewDTO['summary'] = [];
    const phases: NonNullable<PlanningWorkbookPreviewDTO['project']['phases']> = [];
    const scale = (value: number) => value * mapping.amountMultiplier;
    // Actors (responsible/associates) are collected generically and become organizations + project stakeholders.
    const actors = new Map<string, { name: string; roles: Set<string>; tasks: string[] }>();
    const actorSeparator = new RegExp(mapping.actorSeparatorPattern ?? '\\s*[/,;]\\s*', 'i');
    const slug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase();
    const collectActors = (text: string, role: string, taskTitle = '') => text.split(actorSeparator).map(name => name.trim()).filter(name => name.length > 1).forEach(name => {
      const key = slug(name).replace(/S$/, ''); if (!key) return;
      const actor = actors.get(key) ?? { name, roles: new Set<string>(), tasks: [] }; actor.roles.add(role); if (taskTitle) actor.tasks.push(taskTitle); actors.set(key, actor);
    });
    for (const sheet of source.sheets) {
      // Recap sheets are evidence for title/budget/labels; their totals are not activities.
      if (summaryPattern.test(sheet.name)) continue;
      const cellText = (r: number, c: number) => String(sheet.rows[r]?.[c]?.value ?? '').replace(/\u00a0/g, ' ').trim();
      const numeric = (r: number, c: number): number | undefined => {
        const value = sheet.rows[r]?.[c]?.value;
        if (value === null || value === undefined || value === '') return undefined;
        const number = typeof value === 'number' ? value : Number(String(value).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.'));
        return Number.isFinite(number) ? number : undefined;
      };
      // Columns are detected per sheet from header synonyms (referential); the preset indexes are only a fallback.
      const cols = { code: mapping.codeColumn, title: mapping.titleColumn, responsible: mapping.responsibleColumn, associates: mapping.associatesColumn, unit: mapping.unitColumn, quantity: mapping.quantityColumn, unitPrice: mapping.unitPriceColumn, amount: mapping.amountColumn };
      const detected = new Set<string>();
      for (let r = 0; r < Math.min(sheet.rows.length, mapping.headerRows + 2); r++) {
        (sheet.rows[r] ?? []).forEach((_, c) => {
          const label = cellText(r, c).toLowerCase().replace(/\s+/g, ' ');
          if (!label) return;
          for (const [field, pattern] of Object.entries(mapping.columnSynonyms ?? {})) {
            if (pattern && !detected.has(field) && new RegExp(pattern, 'i').test(label)) { (cols as Record<string, number>)[field] = c; detected.add(field); break; }
          }
        });
      }
      const candidates = sheet.rows.map((_, index) => {
        const raw = cellText(index, cols.code); const title = cellText(index, cols.title);
        const fromTitle = !raw ? title.match(titleCodePattern)?.[1] : undefined;
        return { index, raw: raw || fromTitle || '', code: (raw || fromTitle || '').replace(/[.-]+$/, '').replace(/-/g, '.'), title, validCode: codePattern.test(raw) || Boolean(fromTitle) };
      });
      const firstCoded = candidates.find(item => item.validCode)?.index ?? sheet.rows.length;
      const headerEnd = Math.min(firstCoded, mapping.headerRows);
      // Financing columns are discovered from headers, never from a fixed donor list.
      const financingColumns: Array<{ column: number; source: string }> = [];
      const width = Math.max(0, ...sheet.rows.map(row => row.length));
      for (let column = cols.amount + 1; column < width; column++) {
        let label = '';
        for (let r = 0; r < headerEnd; r++) { const value = cellText(r, column); if (value && !groupPattern.test(value)) label = value; }
        if (label && !periodPattern.test(label)) financingColumns.push({ column, source: label });
      }
      const number = sheet.name.match(/\d+/)?.[0];
      const uncodedComponent = candidates.find(item => !item.raw && componentPattern.test(item.title))?.title;
      const phaseName = (number && recap.components[number]) || uncodedComponent || sheet.name;
      const seen = new Set<string>();
      const subComponents = new Map<string, { title: string; externalRef: string }>();
      const titles = new Map(candidates.filter(item => item.validCode).map(item => [item.code, item.title]));
      const phase: NonNullable<typeof phases>[number] = { ...td.phase, code: sheet.name.trim(), name: phaseName, externalRef: `${input.reference}:sheet:${sheet.name}`, order: phases.length, tasks: [], milestones: [], metadata: { planningSource: { filename: source.filename, sheet: sheet.name, financingColumns } } };
      const phaseFinancing: Record<string, number> = {};
      let phaseAmount = 0;
      for (const { index, raw, code, title, validCode } of candidates) {
        if (!sheet.rows[index].some(cell => cell.value !== null || cell.formula || cell.style)) continue;
        const responsible = cellText(index, cols.responsible);
        const quantity = numeric(index, cols.quantity);
        const unitPrice = numeric(index, cols.unitPrice);
        const sourceAmount = numeric(index, cols.amount);
        const unit = cellText(index, cols.unit);
        const path = code.split('.');
        const hasChildren = validCode && candidates.some(other => other.index !== index && other.code.startsWith(`${code}.`));
        const structural = (!validCode && (!title || headerTitlePattern.test(title) || totalPattern.test(title) || totalPattern.test(raw))) || (validCode && totalPattern.test(title));
        const kind = structural ? 'structural' : !validCode || !title ? 'unmapped' : path.length <= mapping.subComponentDepth || (hasChildren && quantity === undefined && !unit && !responsible) ? 'group' : 'task';
        const subCode = path.length >= mapping.subComponentDepth ? path.slice(0, mapping.subComponentDepth).join('.') : undefined;
        const financing = kind === 'task' ? financingColumns.flatMap(({ column, source: name }) => { const value = numeric(index, column); return value ? [{ source: name, column, sourceAmount: value, amount: scale(value) }] : []; }) : undefined;
        rows.push({ sheet: sheet.name, row: index + 1, code: raw, title, responsible, quantity, unit, sourceAmount, amount: sourceAmount === undefined ? undefined : scale(sourceAmount), subComponent: subCode, financing, kind });
        if (kind === 'structural') continue;
        if (kind === 'unmapped') { if (title && quantity !== undefined) warnings.push({ code: 'missing_code', sheet: sheet.name, row: index + 1 }); continue; }
        if (seen.has(code)) warnings.push({ code: 'duplicate_code', sheet: sheet.name, row: index + 1 });
        seen.add(code);
        if (quantity !== undefined && unitPrice !== undefined && sourceAmount !== undefined && Math.abs(quantity * unitPrice - sourceAmount) > Math.max(Number.EPSILON * 16, mapping.arithmeticTolerance) * Math.max(1, Math.abs(sourceAmount), Math.abs(quantity * unitPrice))) warnings.push({ code: 'arithmetic_difference', sheet: sheet.name, row: index + 1 });
        if (kind !== 'task') continue;
        // Sub-components become phase milestones, created from the code even when the row order is broken.
        let milestoneRef: string | undefined;
        if (subCode) {
          if (!subComponents.has(subCode)) subComponents.set(subCode, { title: titles.get(subCode) ?? subCode, externalRef: `${input.reference}:${sheet.name}:sub:${subCode}` });
          milestoneRef = subComponents.get(subCode)!.externalRef;
        }
        const groups = path.slice(mapping.subComponentDepth, -1).map((_, i) => path.slice(0, mapping.subComponentDepth + i + 1).join('.')).map(group => ({ code: group, title: titles.get(group) ?? '' }));
        const plannedAmount = sourceAmount === undefined ? undefined : scale(sourceAmount);
        phaseAmount += plannedAmount ?? 0;
        for (const share of financing ?? []) phaseFinancing[share.source] = (phaseFinancing[share.source] ?? 0) + share.amount;
        // Stable source row identity avoids collapsing repeated documentary codes.
        const associates = cellText(index, cols.associates);
        collectActors(responsible, 'responsable', title); collectActors(associates, 'associe', title);
        // Costed activities also feed the DQE of the same phase (one line ↔ one phase), linked to the task by its source id.
        const taskRef = `${input.reference}:${sheet.name}:row:${index + 1}`;
        if (quantity !== undefined || plannedAmount !== undefined) {
          const linePrice = unitPrice === undefined ? (plannedAmount !== undefined && quantity ? plannedAmount / quantity : undefined) : scale(unitPrice);
          (phase as { dqeLines?: unknown[] }).dqeLines = [...((phase as { dqeLines?: unknown[] }).dqeLines ?? []), { source: 'dqe', contextId: '', designation: title, unit: unit || 'u', quantity: quantity ?? 1, unitPrice: linePrice ?? null, totalHt: plannedAmount ?? null, btpCode: raw, sourceType: 'import', note: `${sheet.name} · ligne ${index + 1}`, metadata: { importTaskRef: taskRef, planningSource: { sheet: sheet.name, row: index + 1, code: raw } } }];
        }
        phase.tasks?.push({ ...td.task, id: taskRef, title, description: `${raw} · ${title}`, assigneeName: responsible || undefined, metadata: { planningSource: { filename: source.filename, sheet: sheet.name, row: index + 1, code: raw, path, associates: cellText(index, cols.associates), quantity, quantityText: quantity === undefined ? cellText(index, cols.quantity) || undefined : undefined, unit, unitPrice: unitPrice === undefined ? undefined : scale(unitPrice), sourceUnitPrice: unitPrice, sourceAmount, amountMultiplier: mapping.amountMultiplier, plannedAmount, subComponent: subCode ? { code: subCode, title: subComponents.get(subCode)?.title, milestoneRef } : undefined, groups, financingSources: financing, cells: sheet.rows[index] } } });
      }
      phase.milestones = [...subComponents.entries()].map(([code, item], order) => ({ ...td.milestone, externalRef: item.externalRef, title: `${code} · ${item.title}`, name: item.title, order, metadata: { planningSource: { sheet: sheet.name, code } } }));
      if (phase.tasks?.length) {
        phase.budget = phaseAmount; phase.estimatedCost = phaseAmount;
        phase.metadata = { ...phase.metadata, financingTotals: phaseFinancing };
        phases.push(phase);
        summary.push({ sheet: sheet.name, phase: phaseName, subComponents: subComponents.size, tasks: phase.tasks.length, amount: phaseAmount, financing: phaseFinancing });
      }
      warnings.push({ code: 'period_review', sheet: sheet.name, row: 1 });
    }
    if (!phases.length) throw new Error('No activity matched the selected mapping');
    const imported = summary.reduce((total, item) => total + item.amount, 0);
    if (recap.budget !== undefined && Math.abs(recap.budget / (recap.amountMultiplier ?? 1) * mapping.amountMultiplier - imported) > 1) warnings.push({ code: 'recap_difference', sheet: source.sheets.find(sheet => summaryPattern.test(sheet.name))?.name ?? '', row: 1 });
    // Existing phase custom data preserves evidence without dumping JSON into
    // the user-facing project description. The original binary also goes to GED.
    phases[0].metadata = { ...phases[0].metadata, planningWorkbook: source, planningMapping: mapping };
    // Stakeholder kind follows the referential semantics of the name and the tasks it is responsible for.
    const rules = (mapping.actorClassification ?? []).map(rule => ({ ...rule, name: new RegExp(rule.namePattern, 'i'), task: rule.taskPattern ? new RegExp(rule.taskPattern, 'i') : undefined }));
    const classify = (actor: { name: string; tasks: string[] }) => rules.find(rule => rule.name.test(actor.name) && (!rule.task || actor.tasks.some(title => rule.task!.test(title)))) ?? { entityType: 'organization' as const, communityType: undefined };
    const reference = input.reference.trim();
    const organizations: Array<{ id: string; name: string; type: string }> = [];
    const stakeholders = [...actors.entries()].map(([key, actor]) => {
      const rule = classify(actor);
      const base = { externalRef: `${reference}:SH:${key}`, stakeholderEntityType: rule.entityType, role: actor.roles.has('responsable') ? 'responsable' : 'associe', roleDescription: actor.name, isPrimary: false };
      if (rule.entityType === 'supplier') return { ...base, supplierId: `SUP-${key}` };
      if (rule.entityType === 'employee') return { ...base, employeeId: `EMP-${key}` };
      if (rule.entityType === 'community') return { ...base, communityType: rule.communityType ?? 'communautes_locales' };
      organizations.push({ id: `ORG-${key}`, name: actor.name, type: 'autre' });
      return { ...base, organizationId: `ORG-${key}` };
    });
    const project: PlanningWorkbookPreviewDTO['project'] = { ...td.project, stakeholders, ...({ organizations } as object), title: input.title.trim(), externalRef: input.reference.trim(), projectReference: input.reference.trim(), startDate: input.startDate, currency: input.currency, budget: input.budget, referentialCode: input.referentialCode, phases, description: source.narrative ?? '', metadata: { planningSource: source, mapping }, ...(td.interventionZone ? { interventionZones: [td.interventionZone] } : {}) };
    return { project, source, rows, summary, warnings };
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
    let options: ReferentialOption[] = [];
    try {
      options = getAllReferentials().map((ref) => ({
        value: ref.code,
        label: this.resolveLabel(ref.name, language) || ref.code,
      }));
    } catch {
      options = [];
    }
    // Workbook import profiles (e.g. World Bank PTBA) are referentials of the same selector.
    const profiles = IMPORT_PROFILES
      .filter(profile => profile.kind === 'hierarchical_workbook' && !options.some(option => option.value === profile.code))
      .map(profile => ({ value: profile.code, label: profile.label[language] }));
    return [...options, ...profiles];
  }

  /** Import profile applied for the referential chosen in the existing template block. */
  resolveImportProfile(referentialCode: string): { code: string; formats: readonly ImportFileFormat[]; kind: 'dataset' | 'hierarchical_workbook' } {
    const profile = IMPORT_PROFILES.find(item => item.code === referentialCode) ?? getImportProfile('CUSTOM_STANDARD');
    return { code: profile.code, formats: profile.formats, kind: profile.kind };
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
      location: 'Nouakchott',
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