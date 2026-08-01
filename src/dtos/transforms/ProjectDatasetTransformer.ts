/**
 * ProjectDatasetTransformer
 *
 * Convertit un dataset brut « HADRATECH-GPI » (type `PROJECTS_IMPORT`, ex:
 * `src/data/json_project.json`) en `ProjectImportDataset` normalisé
 * (camelCase) consommable par `ProjectImportExportService.importDataset`.
 *
 * Règle #1 (flèche sacrée) : la normalisation reste dans la couche Transformer,
 * le service ne fait que de l'orchestration. Aucun accès Supabase ici.
 *
 * Le dataset brut est hiérarchique :
 *   { organizations[], suppliers[], projects[{ budget, timeline, procurement,
 *     phases[{ milestones[], tasks[], dqeLines[] }], dqeLines[], stakeholders[] }],
 *     budgetReferences{ code: { ce, cp, donor, financeType, ... } } }
 *
 * Les identifiants externes (`ORG-…`, `SUP-…`, `PRJ-…`) ne sont PAS des UUID :
 * ils sont conservés en `externalRef` et référencés dans les stakeholders, la
 * résolution vers des UUID relevant de la couche service/adapter.
 */

import type {
  ProjectImportDataset,
  ProjectImportMilestone,
  ProjectImportPhase,
  ProjectImportRow,
  ProjectImportStakeholder,
  ProjectImportTask,
} from '@/application/services/ProjectImportExportService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';

type Raw = Record<string, unknown>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const asRecord = (v: unknown): Raw => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : {});
const asArray = (v: unknown): Raw[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') as Raw[] : []);
const str = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
};
const num = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};
/** Date ISO complète (les dates du dataset sont en `YYYY-MM-DD`). */
const isoDate = (v: unknown): string | undefined => {
  const s = str(v);
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00.000Z`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};
const uuidOrUndefined = (v: unknown): string | undefined => {
  const s = str(v);
  return s && UUID_RE.test(s) ? s : undefined;
};

/** Statuts métier FR du dataset → `ProjectStatus`. */
const PROJECT_STATUS_MAP: Record<string, ProjectStatus> = {
  planifie: ProjectStatus.PLANIFIE,
  planifié: ProjectStatus.PLANIFIE,
  en_cours: ProjectStatus.EN_COURS,
  encours: ProjectStatus.EN_COURS,
  attribue: ProjectStatus.ATTRIBUE,
  attribué: ProjectStatus.ATTRIBUE,
  en_attente: ProjectStatus.EN_ATTENTE,
  termine: ProjectStatus.TERMINE,
  terminé: ProjectStatus.TERMINE,
  acheve: ProjectStatus.TERMINE,
  suspendu: ProjectStatus.SUSPENDU,
  en_retard: ProjectStatus.EN_RETARD,
  annule: ProjectStatus.ANNULE,
  annulé: ProjectStatus.ANNULE,
  brouillon: ProjectStatus.DRAFT,
};

type MilestoneStatus = NonNullable<Parameters<typeof identity>[0]>;
function identity<T>(v: T): T {
  return v;
}

const MILESTONE_STATUS_MAP: Record<string, ProjectImportMilestone['status']> = {
  planifie: 'pending',
  planifié: 'pending',
  en_attente: 'pending',
  en_cours: 'in_progress',
  termine: 'completed',
  terminé: 'completed',
  en_retard: 'delayed',
  annule: 'cancelled',
  annulé: 'cancelled',
};

const TASK_STATUS_MAP: Record<string, string> = {
  planifie: 'todo',
  en_cours: 'in_progress',
  termine: 'completed',
  annule: 'cancelled',
};

const BOQ_STATUS_MAP: Record<string, BoqLineDTO['status']> = {
  planifie: 'draft',
  en_cours: 'draft',
  termine: 'validated',
  valide: 'validated',
  facture: 'invoiced',
  paye: 'paid',
};

const normalizeKey = (v: unknown): string => str(v)?.toLowerCase().replace(/[\s-]+/g, '_') ?? '';

export interface ProjectDatasetMeta {
  version?: string;
  type?: string;
  source?: string;
  exportDate?: string;
  organizations: Array<{ externalRef?: string; name?: string; code?: string; type?: string }>;
  suppliers: Array<{ externalRef?: string; name?: string; type?: string }>;
  budgetReferenceCodes: string[];
}

export class ProjectDatasetTransformer {
  /** Détecte le format hiérarchique « dataset » (vs simple tableau de lignes). */
  static isRawDataset(raw: unknown): boolean {
    const d = asRecord(raw);
    if (!Array.isArray(d.projects) || d.projects.length === 0) return false;
    const first = asRecord(d.projects[0]);
    return (
      'timeline' in first ||
      'procurement' in first ||
      (typeof first.budget === 'object' && first.budget !== null)
    );
  }

  /** Dataset brut → dataset d'import normalisé. */
  static fromRawDataset(raw: unknown): ProjectImportDataset {
    const d = asRecord(raw);
    const budgetReferences = asRecord(d.budgetReferences);
    return {
      projects: asArray(d.projects)
        .map((p) => ProjectDatasetTransformer.fromRawProject(p, budgetReferences))
        .filter((p): p is ProjectImportRow => p !== null),
    };
  }

  /** Métadonnées du dataset (référentiels externes non projet). */
  static extractMeta(raw: unknown): ProjectDatasetMeta {
    const d = asRecord(raw);
    return {
      version: str(d.version),
      type: str(d.type),
      source: str(d.source),
      exportDate: str(d.exportDate),
      organizations: asArray(d.organizations).map((o) => ({
        externalRef: str(o.id),
        name: str(o.name),
        code: str(o.code),
        type: str(o.type),
      })),
      suppliers: asArray(d.suppliers).map((s) => ({
        externalRef: str(s.id),
        name: str(s.name),
        type: str(s.type),
      })),
      budgetReferenceCodes: Object.keys(asRecord(d.budgetReferences)),
    };
  }

  /** Projet brut → `ProjectImportRow`. Retourne `null` si titre manquant. */
  static fromRawProject(raw: Raw, budgetReferences: Raw = {}): ProjectImportRow | null {
    const title = str(raw.title) ?? str(raw.name);
    if (!title) return null;

    const budget = asRecord(raw.budget);
    const timeline = asRecord(raw.timeline);
    const procurement = asRecord(raw.procurement);
    const sources = ProjectDatasetTransformer.mapBudgetSources(budget.sources, budgetReferences);
    const budgetTotal =
      num(budget.total) ??
      num(procurement.amount) ??
      sources.reduce((sum, s) => sum + (num(s.amount) ?? 0), 0);

    const steps = asArray(procurement.steps);
    const stepDate = (...names: string[]): string | undefined => {
      const wanted = names.map(normalizeKey);
      const found = steps.find((s) => wanted.includes(normalizeKey(s.name)));
      return isoDate(found?.date);
    };

    const startDate = isoDate(timeline.startDate) ?? stepDate('démarrage', 'demarrage', 'lancement');
    const endDate = isoDate(timeline.endDate) ?? stepDate('achèvement', 'achevement', 'clôture');

    return {
      title,
      externalRef: str(raw.id) ?? str(raw.reference),
      description: str(raw.description) ?? '',
      status: PROJECT_STATUS_MAP[normalizeKey(raw.status)] ?? ProjectStatus.DRAFT,
      progress: num(raw.progress) ?? ProjectDatasetTransformer.progressFromPhases(raw),
      budget: budgetTotal,
      currency: str(budget.currency) ?? 'MRU',
      startDate,
      endDate,
      location: str(raw.location),
      latitude: num(raw.latitude),
      longitude: num(raw.longitude),
      teamSize: num(raw.teamSize) ?? 0,
      projectType: str(raw.type),
      marketType: str(procurement.type),
      selectionMode: str(procurement.mode),
      financingSource: str(sources[0]?.source as string | undefined),
      attributionDate: stepDate('attribution'),
      launchDate: stepDate('lancement'),
      completionDate: stepDate('achèvement', 'achevement'),
      // Les refs externes (`ORG-…`) ne sont pas des UUID : on ne pousse que des UUID valides.
      organizationId: uuidOrUndefined(raw.organizationId),
      budgetSources: sources,
      phases: ProjectDatasetTransformer.mapPhases(raw),
      stakeholders: ProjectDatasetTransformer.mapStakeholders(raw, procurement),
    };
  }

  // ============ sous-mappings ============

  private static mapBudgetSources(rawSources: unknown, budgetReferences: Raw): Array<Record<string, unknown>> {
    return asArray(rawSources).map((s) => {
      const code = str(s.code);
      const ref = code ? asRecord(budgetReferences[code]) : {};
      return {
        code,
        source: str(s.source),
        amount: num(s.amount) ?? num(ref.cp) ?? num(ref.ce) ?? 0,
        type: str(s.type) ?? str(ref.financeType),
        action: str(ref.action),
        program: str(ref.program),
        donor: str(ref.donor),
        commitmentAuthorization: num(ref.ce),
        paymentCredit: num(ref.cp),
      };
    });
  }

  private static progressFromPhases(raw: Raw): number {
    const done = asArray(raw.phases)
      .flatMap((p) => asArray(p.milestones))
      .filter((m) => MILESTONE_STATUS_MAP[normalizeKey(m.status)] === 'completed')
      .map((m) => num(m.progressPercent) ?? 0);
    return done.length > 0 ? Math.max(...done) : 0;
  }

  private static mapPhases(raw: Raw): ProjectImportPhase[] {
    const projectDqe = asArray(raw.dqeLines);
    return asArray(raw.phases).map((phase, index) => {
      const code = str(phase.code);
      const dqe = asArray(phase.dqeLines);
      // Fallback : lignes DQE au niveau projet rattachées à la 1re phase si aucune phase n'en porte.
      const useProjectDqe =
        dqe.length === 0 && index === 0 && asArray(raw.phases).every((p) => asArray(p.dqeLines).length === 0);
      return {
        name: str(phase.name) ?? code ?? `Phase ${index + 1}`,
        code,
        description: str(phase.description) ?? ProjectDatasetTransformer.responsibleLabel(phase.responsible),
        order: num(phase.order) ?? index + 1,
        durationDays: num(phase.durationDays),
        startDate: isoDate(phase.startDate),
        endDate: isoDate(phase.endDate),
        milestones: ProjectDatasetTransformer.mapMilestones(phase.milestones),
        tasks: ProjectDatasetTransformer.mapTasks(phase.tasks),
        dqeLines: ProjectDatasetTransformer.mapDqeLines(useProjectDqe ? projectDqe : dqe),
      };
    });
  }

  private static responsibleLabel(responsible: unknown): string | undefined {
    const r = asRecord(responsible);
    const parts = [str(r.position), str(r.department)].filter(Boolean);
    return parts.length > 0 ? `Responsable : ${parts.join(' — ')}` : undefined;
  }

  private static mapMilestones(rawMilestones: unknown): ProjectImportMilestone[] {
    return asArray(rawMilestones).map((m) => ({
      title: str(m.title) ?? str(m.name) ?? 'Jalon importé',
      description: str(m.description),
      targetDate: isoDate(m.targetDate ?? m.target_date ?? m.date),
      status: MILESTONE_STATUS_MAP[normalizeKey(m.status)] ?? 'pending',
      progress: num(m.progress) ?? num(m.progressPercent),
    }));
  }

  private static mapTasks(rawTasks: unknown): ProjectImportTask[] {
    return asArray(rawTasks).map((t) => ({
      title: str(t.title) ?? str(t.name) ?? 'Tâche importée',
      description: str(t.description),
      status: TASK_STATUS_MAP[normalizeKey(t.status)] ?? str(t.status),
      priority: str(t.priority),
      dueDate: isoDate(t.dueDate ?? t.due_date ?? t.endDate),
      assignedTo: Array.isArray(t.assignedTo) ? (t.assignedTo as unknown[]).map((a) => String(a)) : undefined,
    }));
  }

  /** Lignes DQE brutes → `BoqLineDTO` partiels (source/contextId injectés par le service). */
  private static mapDqeLines(rawLines: Raw[]): BoqLineDTO[] {
    return rawLines.map((l) => {
      const quantity = num(l.quantity) ?? 0;
      const unitPrice = num(l.unitPrice) ?? 0;
      return {
        source: 'dqe',
        contextId: '',
        designation: str(l.designation) ?? str(l.description) ?? 'Ligne DQE',
        unit: str(l.unit) ?? 'u',
        quantity,
        unitPrice,
        totalHt: num(l.totalPrice) ?? quantity * unitPrice,
        btpCode: str(l.code) ?? null,
        elementType: str(l.category) ?? null,
        note: str(l.note) ?? null,
        sourceType: 'import',
        status: BOQ_STATUS_MAP[normalizeKey(l.status)] ?? 'draft',
      } satisfies BoqLineDTO;
    });
  }

  private static mapStakeholders(raw: Raw, procurement: Raw): ProjectImportStakeholder[] {
    const list = asArray(raw.stakeholders).map<ProjectImportStakeholder>((s) => {
      const role = str(s.role);
      const supplierRef = str(s.supplierId);
      const orgRef = str(s.organizationId);
      return {
        stakeholderType: role ?? 'other',
        stakeholderEntityType: supplierRef ? 'supplier' : 'organization',
        supplierId: uuidOrUndefined(supplierRef),
        externalRef: supplierRef ?? orgRef,
        organizationId: uuidOrUndefined(orgRef),
        roleDescription: role,
        isPrimary: s.isPrimary === true,
      } as ProjectImportStakeholder;
    });

    const attributaireRef = str(procurement.attributaireId);
    if (attributaireRef && !list.some((s) => s.externalRef === attributaireRef)) {
      list.push({
        stakeholderType: 'Attributaire',
        stakeholderEntityType: 'supplier',
        supplierId: uuidOrUndefined(attributaireRef),
        externalRef: attributaireRef,
        roleDescription: str(procurement.attributaireName) ?? 'Attributaire',
        isPrimary: false,
      } as ProjectImportStakeholder);
    }
    return list;
  }
}
