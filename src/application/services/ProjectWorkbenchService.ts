import type { IProjectWorkbenchRepository } from '@/domain/repositories/IProjectWorkbenchRepository';
import type { ProjectCalendarEventDTO, CalendarPeriod, SaveProjectOperationDTO, SaveInfrastructureDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { ProjectDetailDTO } from '@/dtos/entities/ProjectDTO';
import type { Geometry } from 'geojson';
import type { SpatialZoneDTO, InfrastructureRealizationDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import { getProjectService } from './ProjectService';
import { SupabaseProjectWorkbenchAdapter } from '@/infrastructure/adapters/supabase/SupabaseProjectWorkbenchAdapter';
import { format, isValid, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
export class ProjectWorkbenchService {
  constructor(private readonly repository: IProjectWorkbenchRepository = new SupabaseProjectWorkbenchAdapter()) {}
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
    if (!input.label.trim() || !isValid(parseISO(input.occurredOn)) || !Number.isFinite(input.amount) || input.amount < 0 || !Number.isFinite(input.quantity) || input.quantity < 0 || !input.unit.trim() || !input.currency.trim()) throw new Error('Invalid operation');
    return this.repository.saveOperation(input);
  }
  deleteOperation(projectId: string, id: string) { return this.repository.deleteOperation(projectId, id); }
  async deleteCalendarEntry(projectId: string, kind: ProjectCalendarEventDTO['kind'], id: string) {
    const data = await this.load(projectId);
    if (!data.canManage || !data.events.some(event => event.kind === kind && event.entityId === id)) throw new Error('Project access denied');
    if (kind === 'task') { const { getTaskAssignmentService } = await import('./TaskAssignmentService'); await getTaskAssignmentService().delete(id); }
    else if (kind === 'phase') { const { getPhaseService } = await import('./PhaseService'); await getPhaseService().deletePhase(id); }
    else if (kind === 'inspection') { const { getInspectionService } = await import('./InspectionService'); await getInspectionService().deleteInspection(id); }
    else if (kind === 'payment') { const { getPaymentService } = await import('./PaymentService'); await getPaymentService().deletePayment(id); }
    else throw new Error('Unsupported calendar entry');
  }
  assets(projectId: string) { return this.repository.assets(projectId); }
  saveAsset(input: SaveInfrastructureDTO) { if (!input.name.trim()) throw new Error('Infrastructure name is required'); return this.repository.saveAsset(input); }
  deleteAsset(projectId: string, id: string) { return this.repository.deleteAsset(projectId, id); }
  analyze(projectId: string, geometry: SpatialZoneDTO, buffer: number) { if (!Number.isFinite(buffer) || buffer < 0) throw new Error('Invalid buffer'); return this.repository.analyze(projectId, geometry, buffer); }
  saveRealization(input: InfrastructureRealizationDTO) { if (input.realization === 'completed' && (!input.inspectionId || !input.completedOn)) throw new Error('Completion requires project inspection and date'); return this.repository.saveRealization(input); }
}
const service = new ProjectWorkbenchService();
export const getProjectWorkbenchService = () => service;