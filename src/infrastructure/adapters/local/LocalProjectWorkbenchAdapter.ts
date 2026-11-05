/**
 * LocalProjectWorkbenchAdapter — fournisseur de données local de l'espace projet
 * (calendrier, consommations, dépenses, recettes), utilisé quand VITE_DATA_PROVIDER=local.
 *
 * Données de démonstration fictives, stockées dans le navigateur ; aucune donnée client.
 * Le SIG utilise un inventaire navigateur séparé, sans données client intégrées.
 */
import type { IProjectWorkbenchRepository } from '@/domain/repositories/IProjectWorkbenchRepository';
import type { IWorkbenchContextSource } from '@/domain/repositories/IWorkbenchContextSource';
import type {
  WorkbenchProjectDTO, ProjectOperationDTO, SaveProjectOperationDTO, InfrastructureAssetDTO, InfrastructureAnalysisDTO,
  AssetTypeDTO, InfraDomainDTO, ImportResultDTO, InfraStructureDTO,
} from '@/dtos/entities/ProjectWorkbenchDTO';
import type { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import { PhaseType, PhasePriority, type PhaseDTO } from '@/dtos/entities/PhaseDTO';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqSource } from '@/domain/entities/boq/BoqLine';
import type { DecomptePaymentDTO, DecompteRecordDTO } from '@/dtos/entities/DecompteRecordDTO';
import type { ReferentialItemDTO } from '@/dtos/entities/ReferentialItemDTO';
import { LocalInfrastructureStore } from './LocalInfrastructureStore';
import type { IProjectWorkbenchRepository as WorkbenchPort } from '@/domain/repositories/IProjectWorkbenchRepository';

const OPERATIONS_KEY = 'hadratech.local.workbench.operations';
export const LOCAL_DEMO_PROJECT_ID = '00000000-0000-4000-8000-00000000d001';
const PHASE_ID = '00000000-0000-4000-8000-00000000d101';

const now = () => new Date().toISOString();

const DEMO_PHASE = {
  id: PHASE_ID, projectId: LOCAL_DEMO_PROJECT_ID, name: 'Phase de démonstration', type: PhaseType.STRUCTURAL, status: 'in_progress',
  priority: PhasePriority.MEDIUM, progress: 0, startDate: '2026-01-01', endDate: '2026-12-31', createdAt: now(), updatedAt: now(),
} satisfies PhaseDTO;

const demoLine = (id: string, designation: string, unit: string, quantity: number, unitPrice: number, resourceType: BoqLineDTO['resourceType']): BoqLineDTO => ({
  id, source: 'dqe', contextId: LOCAL_DEMO_PROJECT_ID, phaseId: PHASE_ID,
  designation, unit, quantity, unitPrice, totalHt: quantity * unitPrice, resourceType, status: 'validated',
} as BoqLineDTO);

const DEMO_LINES: BoqLineDTO[] = [
  demoLine('00000000-0000-4000-8000-00000000d201', 'Matériau de démonstration', 'm3', 100, 1000, 'material'),
  demoLine('00000000-0000-4000-8000-00000000d202', 'Main d’œuvre de démonstration', 'j', 20, 5000, 'labor'),
];

const context = (code: string, labelFr: string, labelEn: string, labelAr: string, metadata: Record<string, unknown>): ReferentialItemDTO => ({
  id: `local-context-${code}`, domain: 'operation_context', code, labelFr, labelEn, labelAr, parentCode: null, orderIndex: 0,
  isCustom: false, isActive: true, projectId: null, metadata, createdAt: null, updatedAt: null,
} as ReferentialItemDTO);

/** Contextes alignés sur le référentiel serveur operation_context. */
const OPERATION_CONTEXTS: ReferentialItemDTO[] = [
  context('unreconciled', 'À rapprocher', 'Unreconciled', 'غير مطابق', { allowValidation: false }),
  context('purchase', 'Achat / expression de besoin', 'Purchase / requirement', 'شراء / طلب احتياج', { kinds: ['consumption'], requiresLine: true, matchSourceUnit: true, limitSourceQuantity: true }),
  context('labor', 'Travail effectué', 'Work performed', 'العمل المنجز', { kinds: ['consumption'], family: 'human' }),
  context('equipment_usage', 'Utilisation d’équipement', 'Equipment usage', 'استخدام المعدات', { kinds: ['consumption'], family: 'equipment' }),
  context('invoice_link', 'Facture / décompte existant', 'Existing invoice / progress invoice', 'فاتورة / كشف موجود', { kinds: ['expense'], requiresLine: true }),
];

function demoProject(): ProjectDetailDTO {
  return {
    id: LOCAL_DEMO_PROJECT_ID, title: 'Projet de démonstration (local)', description: 'Données fictives du mode local',
    status: 'in_progress', progress: 0, location: '', startDate: '2026-01-01', budget: 250000, currency: 'MRU', teamSize: 0,
    createdAt: now(), updatedAt: now(),
    phases: [DEMO_PHASE], plannedPhases: [DEMO_PHASE], tasks: [], risks: [], milestones: [], constructionMilestones: [], payments: [], expenses: [],
    materials: [], stakeholders: [], alerts: [], inspections: [], tenders: [], insurancePolicies: [], insuranceCertificates: [], resources: [],
  } as unknown as ProjectDetailDTO;
}

export class LocalProjectWorkbenchAdapter implements IProjectWorkbenchRepository, IWorkbenchContextSource {
  private readonly infrastructure: LocalInfrastructureStore;
  constructor(private readonly store: Pick<Storage, 'getItem' | 'setItem'> = globalThis.localStorage) {
    this.infrastructure = new LocalInfrastructureStore(store);
  }

  private read(): ProjectOperationDTO[] {
    try { return JSON.parse(this.store.getItem(OPERATIONS_KEY) || '[]') as ProjectOperationDTO[]; } catch { return []; }
  }
  private write(list: ProjectOperationDTO[]) { this.store.setItem(OPERATIONS_KEY, JSON.stringify(list)); }

  async projects(): Promise<WorkbenchProjectDTO[]> {
    const imported = JSON.parse(this.store.getItem('hadratech.local.workbench.projects') || '[]') as ProjectDetailDTO[];
    return [{ id: LOCAL_DEMO_PROJECT_ID, title: 'Projet de démonstration (local)', reference: 'DEMO-LOCAL', canManage: true }, ...imported.map(p => ({ id: p.id, title: p.title, canManage: true }))];
  }
  async operations(projectId: string) { return this.read().filter(op => op.projectId === projectId); }
  async saveOperation(input: SaveProjectOperationDTO): Promise<ProjectOperationDTO> {
    const list = this.read();
    const existing = input.id ? list.find(op => op.id === input.id) : list.find(op => op.requestKey && op.requestKey === input.requestKey);
    if (existing && existing.status && existing.status !== 'draft') throw new Error('Opération finalisée : modification impossible');
    const saved: ProjectOperationDTO = { ...existing, ...input, id: existing?.id ?? crypto.randomUUID(), status: existing?.status ?? 'draft' } as ProjectOperationDTO;
    this.write(existing ? list.map(op => (op.id === saved.id ? saved : op)) : [...list, saved]);
    return saved;
  }
  async deleteOperation(projectId: string, id: string) {
    const list = this.read();
    const target = list.find(op => op.id === id && op.projectId === projectId);
    if (!target) throw new Error('Opération introuvable');
    if (target.status && target.status !== 'draft') throw new Error('Opération finalisée : suppression impossible');
    this.write(list.filter(op => op.id !== id));
  }
  async transitionOperation(projectId: string, id: string, status: 'validated' | 'cancelled') {
    const list = this.read();
    if (!list.some(op => op.id === id && op.projectId === projectId)) throw new Error('Opération introuvable');
    this.write(list.map(op => (op.id === id ? { ...op, status } : op)));
  }

  // Contexte (port IWorkbenchContextSource)
  async projectDetail(projectId: string) {
    if (projectId === LOCAL_DEMO_PROJECT_ID) return demoProject();
    const imported = JSON.parse(this.store.getItem('hadratech.local.workbench.projects') || '[]') as ProjectDetailDTO[];
    return imported.find(p => p.id === projectId) || null;
  }
  async boqLines(projectId: string, source: BoqSource) { return DEMO_LINES.filter(line => line.contextId === projectId && line.source === source); }
  async decomptes(): Promise<{ decomptes: DecompteRecordDTO[]; payments: DecomptePaymentDTO[] }> { return { decomptes: [], payments: [] }; }
  async operationContexts() { return OPERATION_CONTEXTS; }

  // SIG : même port, inventaire strictement local au navigateur.
  domains: WorkbenchPort['domains'] = () => this.infrastructure.domains();
  assetTypes: WorkbenchPort['assetTypes'] = domain => this.infrastructure.assetTypes(domain);
  saveAssetType: WorkbenchPort['saveAssetType'] = input => this.infrastructure.saveAssetType(input);
  assets: WorkbenchPort['assets'] = projectId => this.infrastructure.assets(projectId);
  saveAsset: WorkbenchPort['saveAsset'] = input => this.infrastructure.saveAsset(input);
  importAssets: WorkbenchPort['importAssets'] = (projectId, items) => this.infrastructure.importAssets(projectId, items);
  deleteAsset: WorkbenchPort['deleteAsset'] = (projectId, id) => this.infrastructure.deleteAsset(projectId, id);
  structures: WorkbenchPort['structures'] = projectId => this.infrastructure.structures(projectId);
  saveStructure: WorkbenchPort['saveStructure'] = input => this.infrastructure.saveStructure(input);
  deleteStructure: WorkbenchPort['deleteStructure'] = (projectId, id) => this.infrastructure.deleteStructure(projectId, id);
  analyze: WorkbenchPort['analyze'] = () => this.infrastructure.analyze();
  saveRealization: WorkbenchPort['saveRealization'] = input => this.infrastructure.saveRealization(input);
}
