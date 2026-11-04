import { resourceFamilyOf } from '@/application/services/boq/BoqResourcePropagationService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import type { IProjectWorkbenchRepository } from '@/domain/repositories/IProjectWorkbenchRepository';
import type { ProjectOperationDTO, ProjectCalendarEventDTO, CalendarPeriod, SaveProjectOperationDTO, SaveInfrastructureDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import type { Geometry } from 'geojson';
import type { SpatialZoneDTO, InfrastructureRealizationDTO, SaveAssetTypeDTO, ImportFeatureItemDTO, SaveInfraStructureDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import { getProjectService } from './ProjectService';
import { format, isValid, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DecompteService, getDecompteService } from './DecompteService';
import { ProjectFinancialsService } from './ProjectFinancialsService';
import { ProjectMetricsOrchestrator } from './ProjectMetricsOrchestrator';
import { getReferentialItemService } from './ReferentialItemService';
import { getProjectResourceAggregatorService } from './ProjectResourceAggregatorService';
import type { ReferentialItemDTO } from '@/dtos/entities/ReferentialItemDTO';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
export type OperationViolation = 'label' | 'date' | 'quantity' | 'unit' | 'amount' | 'currency';

/** Erreur métier typée : le champ fautif est traduit par l'écran (workbench.invalid_<champ>). */
export class OperationValidationError extends Error {
  constructor(public readonly field: OperationViolation) {
    super(`workbench.invalid_${field}`);
    this.name = 'OperationValidationError';
  }
}

export class ProjectWorkbenchService {
  constructor(private readonly repository: IProjectWorkbenchRepository = RepositoryFactory.getProjectWorkbenchRepository()) {}
  projects() { return this.repository.projects(); }
  async load(projectId: string) {
    const authorized = (await this.projects()).find(project => project.id === projectId);
    if (!authorized) throw new Error('Project access denied');
    const [project, operations] = await Promise.all([getProjectService().getProjectWithDetails(projectId), this.repository.operations(projectId)]);
    if (!project) throw new Error('Project not found');
    const events = ProjectWorkbenchService.events(project);
    for (const entry of operations) events.push({ id: entry.id, title: entry.label, kind: entry.kind, dateKind: 'recorded', date: entry.occurredOn, phaseId: entry.phaseId, href: `/projects/calendar?projectId=${projectId}&view=${entry.kind}&date=${entry.occurredOn}` });
    return { project, operations, events, canManage: authorized.canManage };
  }
  static events(project: ProjectDetailDTO): ProjectCalendarEventDTO[] {
    const events: ProjectCalendarEventDTO[] = [];
    const add = (id: string, title: string, kind: ProjectCalendarEventDTO['kind'], href: string, dates: Partial<Record<ProjectCalendarEventDTO['dateKind'], string>>, phaseId?: string) => {
      const entries = Object.entries(dates).filter(([, date]) => date && isValid(parseISO(date)));
      if (!entries.length) events.push({ id: `${kind}:${id}:undated`, entityId: id, title, kind, href, dateKind: 'scheduled', phaseId });
      for (const [dateKind, date] of entries) events.push({ id: `${kind}:${id}:${dateKind}`, entityId: id, title, kind, href, dateKind: dateKind as ProjectCalendarEventDTO['dateKind'], date: date ? format(parseISO(date), 'yyyy-MM-dd') : undefined, phaseId });
    };
    for (const phase of project.phases || []) add(phase.id, phase.name, 'phase', `/projects/${project.id}/phases/${phase.id}`, { start: phase.startDate, end: phase.endDate }, phase.id);
    for (const task of project.tasks || []) if (!task.projectId || task.projectId === project.id) add(task.id, task.title, 'task', `/tasks/${task.id}`, { start: task.startDate, end: task.endDate, due: task.dueDate, actual: task.completedAt }, task.phaseId);
    for (const inspection of project.inspections || []) if (!inspection.projectId || inspection.projectId === project.id) add(inspection.id, inspection.title, 'inspection', `/inspections/${inspection.id}`, { scheduled: inspection.scheduledDate, actual: inspection.actualDate }, inspection.phaseId);
    for (const payment of project.payments || []) if (payment.projectId === project.id) add(payment.id, payment.contractorName, 'payment', `/payments/${payment.id}`, { payment: payment.paymentDate || payment.date }, payment.phaseId);
    return events;
  }
  static inPeriod(events: ProjectCalendarEventDTO[], date: string, period: CalendarPeriod) {
    const value = parseISO(date); if (!isValid(value)) return [];
    const start = period === 'day' ? startOfDay(value) : period === 'month' ? startOfMonth(value) : startOfYear(value);
    const end = period === 'day' ? endOfDay(value) : period === 'month' ? endOfMonth(value) : endOfYear(value);
    return events.filter(event => { if (!event.date) return false; const d = parseISO(event.date); return d >= start && d <= end; }).sort((a,b) => (a.date || '').localeCompare(b.date || ''));
  }
  async saveOperation(input: SaveProjectOperationDTO) {
    const violation = ProjectWorkbenchService.validateOperation(input);
    if (violation) throw new OperationValidationError(violation);
    return this.repository.saveOperation(input);
  }
  deleteOperation(projectId: string, id: string) { return this.repository.deleteOperation(projectId, id); }
  transitionOperation(projectId: string, id: string, status: 'validated' | 'cancelled') { return this.repository.transitionOperation(projectId,id,status); }
  async finance(projectId: string) {
    if (!(await this.projects()).some(project => project.id === projectId)) throw new Error('Project access denied');
    const [project, collections, scope, operations] = await Promise.all([
      getProjectService().getProjectWithDetails(projectId),
      Promise.all((['dqe','supplier_bid','invoice'] as const).map(source => RepositoryFactory.getBoqRepository().list({source,projectId}))),
      getDecompteService().getProjectFinancials(projectId),
      this.repository.operations(projectId),
    ]);
    if (!project) throw new Error('Project not found');
    const lines = [...new Map(collections.flat().map((line,index) => [line.id ?? `draft:${index}`,line])).values()];
    const financials = ProjectFinancialsService.build({scope:'project',entityId:projectId,currency:project.currency,declaredBudget:project.budget ?? 0,lines,decomptes:scope.decomptes,payments:scope.payments});
    const metrics = ProjectMetricsOrchestrator.compute({project,phases:project.phases,financials});
    const resources=getProjectResourceAggregatorService().aggregate({projectId,phases:project.phases.map(phase=>({...phase})),boqLines:lines.filter(line=>line.source==='dqe').map(line=>({...line})),consumptions:operations.filter(entry=>entry.kind==='consumption').map(entry=>({...entry}))});
    const reconciliation = DecompteService.reconcile(scope.decomptes, scope.payments);
    const revenueReconciliation = ProjectWorkbenchService.reconcileRevenue(lines.filter(line => line.source === 'invoice'), operations);
    return {lines,decomptes:scope.decomptes,payments:scope.payments,financials,metrics,resources,reconciliation,revenueReconciliation,allocatedResources:project.resources ?? []};
  }
  /** Customer invoices vs validated revenue receipts linked by sourceLineId; supplier payments never count as revenue. */
  static reconcileRevenue(invoices: import('@/dtos/boq/BoqLineDTO').BoqLineDTO[], operations: import('@/dtos/entities/ProjectWorkbenchDTO').ProjectOperationDTO[]) {
    const receipts = [...new Map(operations.filter(op => op.kind === 'revenue' && op.status === 'validated').map(op => [op.id, op])).values()];
    const lines = invoices.filter(line => line.id).map(invoice => {
      const invoicedAmount = Number(invoice.totalHt ?? invoice.quantity * (invoice.unitPrice ?? 0)) || 0;
      const receivedAmount = receipts.filter(op => op.sourceLineId === invoice.id).reduce((sum, op) => sum + op.amount, 0);
      const remainingAmount = Math.max(0, invoicedAmount - receivedAmount);
      const state = receivedAmount <= 0 ? 'unpaid' : remainingAmount > 0 ? 'partial' : 'settled';
      return { invoiceId: invoice.id as string, designation: invoice.designation, invoicedAmount, receivedAmount, remainingAmount, state: state as 'settled' | 'partial' | 'unpaid' };
    });
    const ids = new Set(lines.map(line => line.invoiceId));
    const unallocated = receipts.filter(op => !op.sourceLineId || !ids.has(op.sourceLineId));
    return { lines, unallocatedReceipts: unallocated, unallocatedAmount: unallocated.reduce((sum, op) => sum + op.amount, 0) };
  }
  operationContexts(projectId: string) { return getReferentialItemService().list('operation_context',projectId); }
  /** Presentation projection of server-owned context metadata, never a replacement for authorization. */
  /** Pré-remplit une opération depuis la ligne DQE choisie : seuls date, montant constaté et quantité réelle restent à saisir. */
  static prefillFromLine(line: BoqLineDTO | undefined, form: SaveProjectOperationDTO): Partial<SaveProjectOperationDTO> {
    if (!line) return { sourceLineId: undefined };
    return {
      sourceLineId: line.id,
      phaseId: line.phaseId ?? form.phaseId,
      taskId: line.taskId ?? undefined,
      unit: line.unit ?? form.unit,
      label: line.designation || form.label,
      resourceFamily: form.kind === 'consumption' ? resourceFamilyOf(line) : form.resourceFamily,
    };
  }

  /**
   * Quantité DQE restante pour une ligne : quantité de la ligne moins les opérations
   * du même type déjà saisies (annulées et opération en cours d'édition exclues).
   * Sert d'alerte ; le dépassement est signalé, jamais corrigé automatiquement.
   */
  static remainingLineQuantity(line: BoqLineDTO | undefined, operations: readonly ProjectOperationDTO[], kind: ProjectOperationDTO['kind'], excludeId?: string): number | null {
    if (!line?.id) return null;
    const planned = Number(line.quantity);
    if (!Number.isFinite(planned)) return null;
    const used = operations
      .filter(op => op.sourceLineId === line.id && op.kind === kind && op.status !== 'cancelled' && op.id !== excludeId)
      .reduce((sum, op) => sum + (Number(op.quantity) || 0), 0);
    return planned - used;
  }

  /** Règles d'enregistrement d'une opération ; renvoie le premier champ invalide. */
  static validateOperation(input: SaveProjectOperationDTO): OperationViolation | null {
    if (!input.label.trim()) return 'label';
    if (!isValid(parseISO(input.occurredOn))) return 'date';
    if (!Number.isFinite(input.quantity) || input.quantity < 0) return 'quantity';
    if (!input.unit.trim()) return 'unit';
    if (!Number.isFinite(input.amount) || input.amount < 0) return 'amount';
    if (!input.currency.trim()) return 'currency';
    return null;
  }

  /** Opérations dont le cumul (même type, hors annulées) dépasse la quantité de leur ligne DQE. */
  static overrunOperationIds(lines: readonly BoqLineDTO[], operations: readonly ProjectOperationDTO[]): Set<string> {
    const byId = new Map(lines.filter(line => line.id).map(line => [line.id as string, line]));
    const totals = new Map<string, number>();
    const result = new Set<string>();
    const ordered = [...operations].filter(op => op.sourceLineId && op.status !== 'cancelled').sort((a, b) => a.occurredOn.localeCompare(b.occurredOn));
    for (const op of ordered) {
      const line = byId.get(op.sourceLineId as string);
      const planned = Number(line?.quantity);
      if (!line || !Number.isFinite(planned)) continue;
      const key = `${op.kind}:${op.sourceLineId}`;
      const total = (totals.get(key) ?? 0) + (Number(op.quantity) || 0);
      totals.set(key, total);
      if (total > planned) result.add(op.id);
    }
    return result;
  }

  static eligibleOperationLines(lines: readonly BoqLineDTO[], context: ReferentialItemDTO | undefined, input: Pick<SaveProjectOperationDTO, 'kind' | 'phaseId'>): BoqLineDTO[] {
    if (!context?.isActive) return [];
    const policy = context.metadata;
    if (Array.isArray(policy.kinds) && !policy.kinds.includes(input.kind)) return [];
    return lines.filter(line => Boolean(line.id)
      && (!input.phaseId || !line.phaseId || line.phaseId === input.phaseId)
      && (!Array.isArray(policy.sources) || policy.sources.includes(line.source))
      && (!Array.isArray(policy.documentTypes) || policy.documentTypes.includes(line.documentType ?? line.dqeType))
      && (!Array.isArray(policy.resourceFamilies) || policy.resourceFamilies.includes(line.resourceType)));
  }
  static operationTotals(entries: import('@/dtos/entities/ProjectWorkbenchDTO').ProjectOperationDTO[], currency: string) {
    const totals = new Map<string,number>();
    for (const entry of entries) {
      if(entry.status !== 'validated' || entry.currency !== currency || entry.kind !== 'consumption') continue;
      const key = `${entry.resourceFamily ?? ''}:${entry.unit}`;
      totals.set(key,(totals.get(key) ?? 0) + entry.quantity);
    }
    return [...totals].map(([key,quantity]) => ({family:key.split(':')[0],unit:key.slice(key.indexOf(':')+1),quantity}));
  }
  async deleteCalendarEntry(projectId: string, kind: ProjectCalendarEventDTO['kind'], id: string) {
    const data = await this.load(projectId);
    if (!data.canManage || !data.events.some(event => event.kind === kind && event.entityId === id)) throw new Error('Project access denied');
    if (kind === 'task') { const { getTaskAssignmentService } = await import('./TaskAssignmentService'); await getTaskAssignmentService().delete(id); }
    else if (kind === 'phase') { const { getPhaseService } = await import('./PhaseService'); await getPhaseService().deletePhase(id); }
    else if (kind === 'inspection') { const { getInspectionService } = await import('./InspectionService'); await getInspectionService().deleteInspection(id); }
    else if (kind === 'payment') { const { getPaymentService } = await import('./PaymentService'); await getPaymentService().deletePayment(id); }
    else throw new Error('Unsupported calendar entry');
  }
  domains() { return this.repository.domains(); }
  assetTypes(domain?: string) { return this.repository.assetTypes(domain); }
  saveAssetType(input: SaveAssetTypeDTO) {
    if (!/^[a-z0-9_]+$/.test(input.code)) throw new Error('Asset type code must use lowercase letters, digits and underscores');
    if (!input.domainCode.trim() || !input.labelFr.trim()) throw new Error('Domain and label are required');
    return this.repository.saveAssetType({ ...input, labelFr: input.labelFr.trim() });
  }
  assets(projectId: string) { return this.repository.assets(projectId); }
  saveAsset(input: SaveInfrastructureDTO) { if (!input.name.trim()) throw new Error('Infrastructure name is required'); if (!input.assetTypeCode) throw new Error('Asset type is required'); return this.repository.saveAsset(input); }
  importAssets(projectId: string, items: ImportFeatureItemDTO[]) {
    if (!items.length) throw new Error('GeoJSON contains no feature');
    if (items.length > 5000) throw new Error('Too many features (max 5000)');
    return this.repository.importAssets(projectId, items);
  }
  deleteAsset(projectId: string, id: string) { return this.repository.deleteAsset(projectId, id); }
  structures(projectId: string) { return this.repository.structures(projectId); }
  saveStructure(input: SaveInfraStructureDTO) { if (!input.structureType.trim()) throw new Error('Structure type is required'); return this.repository.saveStructure(input); }
  deleteStructure(projectId: string, id: string) { return this.repository.deleteStructure(projectId, id); }
  analyze(projectId: string, geometry: SpatialZoneDTO, buffer: number) { if (!Number.isFinite(buffer) || buffer < 0 || buffer > 100000) throw new Error('Invalid buffer'); return this.repository.analyze(projectId, geometry, buffer); }
  saveRealization(input: InfrastructureRealizationDTO) { if (input.realization === 'completed' && (!input.inspectionId || !input.completedOn)) throw new Error('Completion requires project inspection and date'); return this.repository.saveRealization(input); }
}
const service = new ProjectWorkbenchService();
export const getProjectWorkbenchService = () => service;