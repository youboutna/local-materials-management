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
