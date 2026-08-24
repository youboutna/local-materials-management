/**
 * ProjectConsultantService
 *
 * Service métier (TypeScript pur) de désignation du rôle « consultant » sur une
 * partie prenante projet (employé, organisation ou fournisseur).
 * Aucun accès Supabase direct : uniquement via IStakeholderRepository.
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import type { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import type { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import type { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import type { IOrganizationRepository } from '@/domain/repositories/IOrganizationRepository';
import type {
  ConsultantCandidateDTO,
  ProjectConsultantDTO,
} from '@/dtos/entities/ProjectConsultantDTO';
import {
  CONSULTANT_DESIGNATION_REFERENTIAL,
  isConsultantBusinessCode,
} from '@/config/referentials/consultant-designation.referential';

export class ProjectConsultantService {
  constructor(
    private readonly stakeholderRepository: IProjectStakeholderRepository,
    private readonly employeeRepository: IEmployeeRepository,
    private readonly supplierRepository: ISupplierRepository,
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  /** Parties prenantes du projet, avec indicateur consultant. */
  async getProjectStakeholders(projectId: string): Promise<ProjectConsultantDTO[]> {
    if (!projectId) return [];
    const list = await this.stakeholderRepository.findByProjectId(projectId);
    const [employees, suppliers, organizations] = await Promise.all([
      this.employeeRepository.findAll(),
      this.supplierRepository.findAll(),
      this.organizationRepository.findAll(),
    ]);
    const employeeById = new Map(employees.map((item) => [item.id, item]));
    const supplierById = new Map(suppliers.map((item) => [item.id, item]));
    const organizationById = new Map(organizations.map((item) => [item.id, item]));
    return list.filter((s) => s.isActive).map((s) => {
      const employee = s.employeeId ? employeeById.get(s.employeeId) : undefined;
      const supplier = s.supplierId ? supplierById.get(s.supplierId) : undefined;
      const organization = s.organizationId ? organizationById.get(s.organizationId) : undefined;
      const businessRole = String(s.stakeholderType ?? '');
      return {
        stakeholderId: s.id,
        projectId,
        name: employee?.fullName || supplier?.name || organization?.name || s.externalName || s.roleDescription || 'Partie prenante',
        businessRole,
        entityType: String(s.stakeholderEntityType ?? ''),
        employeeId: s.employeeId,
        supplierId: s.supplierId,
        organizationId: s.organizationId,
        isConsultant: isConsultantBusinessCode(businessRole),
      };
    });
  }

  /** Catalogue dédupliqué : parties prenantes existantes + référentiels globaux. */
  async getEligibleCandidates(projectId: string): Promise<ConsultantCandidateDTO[]> {
    if (!projectId) return [];
    const [stakeholders, employees, suppliers, organizations] = await Promise.all([
      this.getProjectStakeholders(projectId),
      this.employeeRepository.findActive(),
      this.supplierRepository.findActive(),
      this.organizationRepository.findAll(),
    ]);
    const candidates: ConsultantCandidateDTO[] = [];
    const linkedEmployees = new Set(stakeholders.map((s) => s.employeeId).filter(Boolean));
    const linkedSuppliers = new Set(stakeholders.map((s) => s.supplierId).filter(Boolean));
    const linkedOrganizations = new Set(stakeholders.map((s) => s.organizationId).filter(Boolean));

    stakeholders.filter((s) => !s.isConsultant).forEach((s) => candidates.push({
      key: `stakeholder:${s.stakeholderId}`,
      sourceId: s.stakeholderId,
      stakeholderId: s.stakeholderId,
      kind: 'stakeholder',
      name: s.name,
      detail: s.businessRole || s.entityType,
      isAlreadyStakeholder: true,
    }));
    employees.filter((e) => !linkedEmployees.has(e.id)).forEach((e) => candidates.push({
      key: `employee:${e.id}`,
      sourceId: e.id,
      kind: 'employee',
      name: e.fullName,
      detail: e.position || String(e.role || ''),
      email: e.email || undefined,
      isAlreadyStakeholder: false,
    }));
    suppliers.filter((s) => !linkedSuppliers.has(s.id)).forEach((s) => candidates.push({
      key: `supplier:${s.id}`,
      sourceId: s.id,
      kind: 'supplier',
      name: s.name,
      detail: s.category || undefined,
      email: s.email || undefined,
      isAlreadyStakeholder: false,
    }));
    organizations.filter((o) => o.isActive && !linkedOrganizations.has(o.id)).forEach((o) => candidates.push({
      key: `organization:${o.id}`,
      sourceId: o.id,
      kind: 'organization',
      name: o.name,
      detail: o.orgType || o.code,
      email: o.email,
      isAlreadyStakeholder: false,
    }));
    return candidates.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  /** Consultants actuellement désignés sur un projet. */
  async getProjectConsultants(projectId: string): Promise<ProjectConsultantDTO[]> {
    const all = await this.getProjectStakeholders(projectId);
    return all.filter((s) => s.isConsultant);
  }

  /** Désigne une partie prenante comme consultant du projet. */
  async designateConsultant(projectId: string, candidate: ConsultantCandidateDTO): Promise<void> {
    if (!projectId || !candidate?.sourceId) {
      throw new Error('Le projet et le candidat sont requis');
    }

    if (CONSULTANT_DESIGNATION_REFERENTIAL.singleConsultantPerProject) {
      const current = await this.getProjectConsultants(projectId);
      await Promise.all(
        current
          .filter((c) => c.stakeholderId !== candidate.stakeholderId)
          .map((c) => this.stakeholderRepository.update(c.stakeholderId, {
            stakeholderType: CONSULTANT_DESIGNATION_REFERENTIAL.fallbackCode,
          })),
      );
    }

    if (candidate.stakeholderId) {
      const existing = await this.stakeholderRepository.findById(candidate.stakeholderId);
      if (!existing || existing.projectId !== projectId) throw new Error('Partie prenante introuvable dans ce projet');
      await this.stakeholderRepository.update(candidate.stakeholderId, {
        stakeholderType: CONSULTANT_DESIGNATION_REFERENTIAL.canonicalCode,
      });
      return;
    }

    await this.stakeholderRepository.create({
      projectId,
      stakeholderType: CONSULTANT_DESIGNATION_REFERENTIAL.canonicalCode,
      stakeholderEntityType: candidate.kind === 'employee' ? 'employee' : candidate.kind === 'supplier' ? 'supplier' : 'external',
      employeeId: candidate.kind === 'employee' ? candidate.sourceId : null,
      supplierId: candidate.kind === 'supplier' ? candidate.sourceId : null,
      organizationId: candidate.kind === 'organization' ? candidate.sourceId : null,
      externalName: candidate.name,
      externalEmail: candidate.email || null,
      roleDescription: 'consultant',
      isActive: true,
    });
  }

  /** Retire le rôle consultant d'une partie prenante. */
  async revokeConsultant(stakeholderId: string): Promise<void> {
    if (!stakeholderId) throw new Error('stakeholderId est requis');
    await this.stakeholderRepository.update(stakeholderId, {
      stakeholderType: CONSULTANT_DESIGNATION_REFERENTIAL.fallbackCode,
    });
  }
}

let instance: ProjectConsultantService | null = null;
export function getProjectConsultantService(): ProjectConsultantService {
  if (!instance) {
    instance = new ProjectConsultantService(
      RepositoryFactory.getProjectStakeholderRepository(),
      RepositoryFactory.getEmployeeRepository(),
      RepositoryFactory.getSupplierRepository(),
      RepositoryFactory.getOrganizationRepository(),
    );
  }
  return instance;
}

export default ProjectConsultantService;
