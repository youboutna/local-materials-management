import { IProjectRepository, ProjectWithRelatedData, ProjectSummary } from '@/domain/repositories/IProjectRepository';
import { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import { IComplianceRepository } from '@/domain/repositories/IComplianceRepository';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import { IReceptionRepository } from '@/domain/repositories/IReceptionRepository';
import { Project } from '@/domain/entities/Project';
import { Risk, RiskStatus, RiskLevel } from '@/domain/entities/Risk';
import { ComplianceItem } from '@/domain/entities/Compliance';
import { Inspection } from '@/domain/entities/Inspection';
import { Document } from '@/domain/entities/Document';
import { Employee } from '@/domain/entities/Employee';
import { ReceptionDTO } from '@/dtos/entities/ReceptionDTO';

export class InMemoryProjectRepository implements IProjectRepository {
  private projects = new Map<string, Project>();

  async findById(id: string): Promise<Project | null> {
    return this.projects.get(id) || null;
  }

  async findAll(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async create(project: Partial<Project>): Promise<Project> {
    const id = project.id || `project-${Date.now()}`;
    const newProject = { ...project, id } as any;
    this.projects.set(id, newProject);
    return newProject;
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const existing = this.projects.get(id);
    if (!existing) throw new Error('Project not found');
    const updated = { ...existing, ...updates } as any;
    this.projects.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.projects.delete(id);
  }

  async findForBreadcrumb(id: string) {
    const p = this.projects.get(id);
    return p ? { id: p.id, title: p.title } : null;
  }

  async findActiveProjects() { return []; }
  async findOverdueProjects() { return []; }
  async findWithRelatedData(id: string): Promise<ProjectWithRelatedData> {
    const project = await this.findById(id);
    return {
      project: project || null,
      phases: [], tasks: [], risks: [], inspections: [], payments: [],
      documents: [], bankGuarantees: [], insuranceCertificates: []
    };
  }
  async findSummary(id: string): Promise<ProjectSummary | null> {
    const p = this.projects.get(id);
    if (!p) return null;
    return {
      id: p.id, title: p.title, status: p.status, progress: p.progress,
      phasesCount: 0, tasksCount: 0, inspectionsCount: 0, paymentsCount: 0
    };
  }
  async updateProgress() {}
  async synchronizeProgress() { return 0; }
  async assignOrganizationToAll() { return 0; }
}

export class InMemoryRiskRepository implements IRiskRepository {
  private risks = new Map<string, Risk>();

  async findById(id: string) { return this.risks.get(id) || null; }
  async findAll() { return Array.from(this.risks.values()); }
  async save(risk: Risk) { this.risks.set(risk.id, risk); }
  async update(id: string, data: Partial<Risk>) {
    const existing = this.risks.get(id);
    if (existing) {
       Object.assign(existing, data);
    }
  }
  async delete(id: string) { this.risks.delete(id); }
  async findByProjectId(projectId: string) {
    return Array.from(this.risks.values()).filter(r => r.projectId === projectId);
  }
  async findByStatus(status: RiskStatus) {
    return Array.from(this.risks.values()).filter(r => r.status === status);
  }
  async findByLevel(level: RiskLevel) {
    return Array.from(this.risks.values()).filter(r => r.getRiskLevel() === level);
  }
  async findActive() { return Array.from(this.risks.values()).filter(r => r.status !== 'resolved'); }
  async findCritical() { return Array.from(this.risks.values()).filter(r => r.getRiskLevel() === 'critical'); }
  async countByStatus() { return {} as any; }
  async countByLevel() { return {} as any; }
  async getAverageRiskScore() { return 0; }
  async getHighestRisks(projectId: string) {
    return this.findByProjectId(projectId);
  }
  async getUnmitigatedRisks() { return []; }
}

export class InMemoryComplianceRepository implements IComplianceRepository {
  private items = new Map<string, ComplianceItem>();

  async findById(id: string) { return this.items.get(id) || null; }
  async findByProject(projectId: string) {
    return Array.from(this.items.values()).filter(i => i.projectId === projectId);
  }
  async findByFilter(filter: any) {
    return Array.from(this.items.values()).filter(i => 
      (!filter.projectId || i.projectId === filter.projectId)
    );
  }
  async save(entity: ComplianceItem) { this.items.set(entity.id, entity); return entity; }
  async update(id: string, entity: ComplianceItem) { this.items.set(id, entity); return entity; }
  async delete(id: string) { this.items.delete(id); }

  async findDocumentsByComplianceItem() { return []; }
  async saveDocument(d: any) { return d; }
  async updateDocument(id: string, d: any) { return d; }
  async deleteDocument() {}
  async findNotesByComplianceItem() { return []; }
  async saveNote(n: any) { return n; }
  async updateNote(id: string, n: any) { return n; }
  async deleteNote() {}
  async saveAuditEntry(a: any) { return a; }
  async findAuditByComplianceItem() { return []; }
  async getComplianceStatistics() {
    return {
      totalItems: 0, approvedItems: 0, pendingItems: 0,
      inProgressItems: 0, rejectedItems: 0, criticalItems: 0, overdueItems: 0
    };
  }
}

export class InMemoryInspectionRepository implements IInspectionRepository {
  private inspections = new Map<string, Inspection>();

  async findById(id: string) { return this.inspections.get(id) || null; }
  async findAll() { return Array.from(this.inspections.values()); }
  async save(inspection: Inspection) { this.inspections.set(inspection.id, inspection); }
  async create(data: any) {
    const id = data.id || `insp-${Date.now()}`;
    const inspection = { ...data, id } as any;
    this.inspections.set(id, inspection);
    return inspection;
  }
  async update(id: string, data: any) {
    const existing = this.inspections.get(id);
    if (existing) Object.assign(existing, data);
  }
  async delete(id: string) { this.inspections.delete(id); }
  async findByProjectId(projectId: string) {
    return Array.from(this.inspections.values()).filter(i => i.projectId === projectId);
  }
  async findByPhaseId() { return []; }
  async findByStepId() { return []; }
  async findByStatus() { return []; }
  async findByInspector() { return []; }
  async findScheduledBetween() { return []; }
  async findUpcoming() { return []; }
  async findOverdue() { return []; }
  async countByStatus() { return {} as any; }
  async getAverageCompletionTime() { return 0; }
  async addDocument() {}
  async findDocumentsByInspectionId() { return []; }
  async getChecklistTemplate() { return []; }
}

export class InMemoryDocumentRepository implements IDocumentRepository {
  private docs = new Map<string, Document>();

  async findById(id: string) { return this.docs.get(id) || null; }
  async findAll() { return Array.from(this.docs.values()); }
  async save(doc: Document) { this.docs.set(doc.id, doc); return doc; }
  async update(id: string, data: any) {
    const existing = this.docs.get(id);
    if (existing) Object.assign(existing, data);
  }
  async delete(id: string) { this.docs.delete(id); }
  async findByProjectId(projectId: string) {
    return Array.from(this.docs.values()).filter(d => d.projectId === projectId);
  }
  async findByPhaseId() { return []; }
  async findByInspectionId() { return []; }
  async findByPaymentId() { return []; }
  async findBySupplierId() { return []; }
  async findByType() { return []; }
  async findByStatus() { return []; }
  async findByTag() { return []; }
  async findByTags() { return []; }
  async getByTags() { return []; }
  async search() { return []; }
  async findOverdue() { return []; }
  async findDueSoon() { return []; }
  async findSharedWithSuppliers() { return []; }
  async findInternalOnly() { return []; }
  async countByType() { return {} as any; }
  async countByStatus() { return {} as any; }
  async getTotalSize() { return 0; }
  async findRawByFilters() { return []; }
  async insertRaw() {}
}

export class InMemoryEmployeeRepository implements IEmployeeRepository {
  private employees = new Map<string, Employee>();

  async findById(id: string) { return this.employees.get(id) || null; }
  async findByEmployeeId(id: string) { 
    return Array.from(this.employees.values()).find(e => e.employeeId === id) || null;
  }
  async findByUserId(id: string) { 
    return Array.from(this.employees.values()).find(e => e.userId === id) || null;
  }
  async findAll() { return Array.from(this.employees.values()); }
  async save(e: Employee) { this.employees.set(e.id, e); }
  async update(id: string, data: any) {
    const existing = this.employees.get(id);
    if (existing) Object.assign(existing, data);
  }
  async delete(id: string) { this.employees.delete(id); }
  async findByRole() { return []; }
  async findByDepartment() { return []; }
  async findActive() { return Array.from(this.employees.values()).filter(e => e.isActive); }
  async findByManager() { return []; }
  async findBySuperior() { return []; }
  async search() { return []; }
  async findInspectors() { return []; }
  async findProjectManagers() { return []; }
  async findApprovers() { return []; }
  async getDirectReports() { return []; }
  async getTeamHierarchy() { return []; }
}

export class InMemoryValidationRepository {
  private results = new Map<string, any[]>();
  async create(data: any) {
    const list = this.results.get(data.projectId) || [];
    list.push(data.validationResult);
    this.results.set(data.projectId, list);
  }
  async findByProjectId(projectId: string) {
    return this.results.get(projectId) || [];
  }
}

/**
 * Fake in-memory des réceptions (provisoires/définitives) — évite tout appel Supabase
 * dans les tests d'intégration de validation.
 */
export class InMemoryReceptionRepository implements IReceptionRepository {
  private receptions = new Map<string, ReceptionDTO>();
  private documents = new Map<string, any[]>();
  private seq = 0;

  private nextId(): string {
    this.seq += 1;
    return `reception-${this.seq}`;
  }

  async create(reception: Omit<ReceptionDTO, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReceptionDTO> {
    const now = new Date().toISOString();
    const created = { ...reception, id: this.nextId(), createdAt: now, updatedAt: now } as ReceptionDTO;
    this.receptions.set(created.id, created);
    return created;
  }

  async findById(id: string): Promise<ReceptionDTO | null> {
    return this.receptions.get(id) ?? null;
  }

  async findByProjectId(projectId: string): Promise<ReceptionDTO[]> {
    return [...this.receptions.values()].filter((r) => r.projectId === projectId);
  }

  async update(id: string, updates: Partial<ReceptionDTO>): Promise<ReceptionDTO> {
    const existing = this.receptions.get(id);
    if (!existing) throw new Error(`Reception ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() } as ReceptionDTO;
    this.receptions.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.receptions.delete(id);
  }

  async findByType(projectId: string, type: 'provisional' | 'definitive'): Promise<ReceptionDTO[]> {
    return (await this.findByProjectId(projectId)).filter((r) => r.type === type);
  }

  async findByStatus(status: string): Promise<ReceptionDTO[]> {
    return [...this.receptions.values()].filter((r) => r.status === status);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<ReceptionDTO[]> {
    return [...this.receptions.values()].filter((r) => {
      const d = (r as any).receptionDate ?? (r as any).plannedDate;
      return !!d && d >= startDate && d <= endDate;
    });
  }

  async findByChairman(chairmanId: string): Promise<ReceptionDTO[]> {
    return [...this.receptions.values()].filter((r) => (r as any).chairmanId === chairmanId);
  }

  async createBatch(receptions: Omit<ReceptionDTO, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<ReceptionDTO[]> {
    return Promise.all(receptions.map((r) => this.create(r)));
  }

  async updateBatch(updates: Array<{ id: string; data: Partial<ReceptionDTO> }>): Promise<ReceptionDTO[]> {
    return Promise.all(updates.map((u) => this.update(u.id, u.data)));
  }

  async search(criteria: {
    projectId?: string;
    type?: 'provisional' | 'definitive';
    status?: string;
    dateRange?: { start: string; end: string };
    chairmanId?: string;
  }): Promise<ReceptionDTO[]> {
    return [...this.receptions.values()].filter((r) => {
      if (criteria.projectId && r.projectId !== criteria.projectId) return false;
      if (criteria.type && r.type !== criteria.type) return false;
      if (criteria.status && r.status !== criteria.status) return false;
      if (criteria.chairmanId && (r as any).chairmanId !== criteria.chairmanId) return false;
      return true;
    });
  }

  async validateReception(id: string): Promise<boolean> {
    return this.receptions.has(id);
  }

  async getReceptionWorkflow(projectId: string): Promise<any> {
    const all = await this.findByProjectId(projectId);
    const provisional = all.filter((r) => r.type === 'provisional');
    const definitive = all.filter((r) => r.type === 'definitive');
    return {
      provisional: provisional[0] ?? null,
      definitive: definitive[0] ?? null,
      canCreateDefinitive: provisional.some((r) => r.status === 'approved'),
      receptions: all,
    };
  }

  async addDocument(receptionId: string, document: any): Promise<void> {
    const list = this.documents.get(receptionId) ?? [];
    list.push(document);
    this.documents.set(receptionId, list);
  }

  async removeDocument(receptionId: string, documentId: string): Promise<void> {
    const list = (this.documents.get(receptionId) ?? []).filter((d) => d?.id !== documentId);
    this.documents.set(receptionId, list);
  }

  async getDocuments(receptionId: string): Promise<any[]> {
    return this.documents.get(receptionId) ?? [];
  }

  async updateCommittee(receptionId: string, committee: string[]): Promise<void> {
    await this.update(receptionId, { committee } as Partial<ReceptionDTO>);
  }

  async addCommitteeMember(receptionId: string, member: any): Promise<void> {
    const existing = (this.receptions.get(receptionId) as any)?.committee ?? [];
    await this.update(receptionId, { committee: [...existing, member] } as Partial<ReceptionDTO>);
  }

  async removeCommitteeMember(receptionId: string, memberId: string): Promise<void> {
    const existing = (this.receptions.get(receptionId) as any)?.committee ?? [];
    await this.update(receptionId, {
      committee: existing.filter((m: any) => (typeof m === 'string' ? m !== memberId : m?.id !== memberId)),
    } as Partial<ReceptionDTO>);
  }

  async addFinding(receptionId: string, finding: any): Promise<void> {
    const existing = (this.receptions.get(receptionId) as any)?.findings ?? [];
    await this.update(receptionId, { findings: [...existing, finding] } as Partial<ReceptionDTO>);
  }

  async updateFinding(receptionId: string, findingId: string, finding: any): Promise<void> {
    const existing = (this.receptions.get(receptionId) as any)?.findings ?? [];
    await this.update(receptionId, {
      findings: existing.map((f: any) => (f?.id === findingId ? { ...f, ...finding } : f)),
    } as Partial<ReceptionDTO>);
  }

  async addDecision(receptionId: string, decision: any): Promise<void> {
    const existing = (this.receptions.get(receptionId) as any)?.decisions ?? [];
    await this.update(receptionId, { decisions: [...existing, decision] } as Partial<ReceptionDTO>);
  }

  async getReceptionStats(projectId: string) {
    const all = await this.findByProjectId(projectId);
    return {
      total: all.length,
      provisional: all.filter((r) => r.type === 'provisional').length,
      definitive: all.filter((r) => r.type === 'definitive').length,
      approved: all.filter((r) => r.status === 'approved').length,
      pending: all.filter((r) => r.status === 'pending').length,
      rejected: all.filter((r) => r.status === 'rejected').length,
    };
  }

  async getReceptionTimeline(projectId: string) {
    const all = await this.findByProjectId(projectId);
    return all.map((r) => ({
      date: ((r as any).receptionDate ?? (r as any).plannedDate ?? r.createdAt) as string,
      type: r.type as 'provisional' | 'definitive',
      status: String(r.status),
      description: `Réception ${r.type}`,
    }));
  }
}
