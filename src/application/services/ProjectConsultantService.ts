/**
 * ProjectConsultantService
 *
 * Service métier (TypeScript pur) de désignation du rôle « consultant » sur une
 * partie prenante projet (employé, organisation ou fournisseur).
 * Aucun accès Supabase direct : uniquement via IStakeholderRepository.
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import {
  IStakeholderRepository,
  StakeholderAssignment,
} from '@/domain/repositories/IStakeholderRepository';
import {
  CONSULTANT_DESIGNATION_REFERENTIAL,
  isConsultantBusinessCode,
} from '@/config/referentials/consultant-designation.referential';

export interface ProjectConsultantDTO {
  stakeholderId: string;
  projectId: string;
  name: string;
  businessRole: string;
  entityType: string;
  employeeId?: string | null;
  supplierId?: string | null;
  isConsultant: boolean;
}

export class ProjectConsultantService {
  constructor(private readonly stakeholderRepository: IStakeholderRepository) {}

  /** Parties prenantes du projet, avec indicateur consultant. */
  async getProjectStakeholders(projectId: string): Promise<ProjectConsultantDTO[]> {
    if (!projectId) return [];
    const list = await this.stakeholderRepository.findByProjectId(projectId);
    return list.map((s) => {
      const raw = s as unknown as Record<string, any>;
      const businessRole = String(raw.role ?? raw.type ?? '');
      return {
        stakeholderId: s.id,
        projectId,
        name: raw.contact?.name || raw.externalName || raw.name || 'Partie prenante',
        businessRole,
        entityType: String(raw.stakeholderType ?? raw.entityType ?? ''),
        employeeId: raw.employeeId ?? null,
        supplierId: raw.supplierId ?? raw.organizationId ?? null,
        isConsultant: isConsultantBusinessCode(businessRole),
      };
    });
  }

  /** Consultants actuellement désignés sur un projet. */
  async getProjectConsultants(projectId: string): Promise<ProjectConsultantDTO[]> {
    const all = await this.getProjectStakeholders(projectId);
    return all.filter((s) => s.isConsultant);
  }

  /** Désigne une partie prenante comme consultant du projet. */
  async designateConsultant(projectId: string, stakeholderId: string): Promise<void> {
    if (!projectId || !stakeholderId) {
      throw new Error('projectId et stakeholderId sont requis');
    }
    if (!this.stakeholderRepository.setBusinessRole) {
      throw new Error("Le repository ne supporte pas la mise à jour du rôle métier");
    }

    if (CONSULTANT_DESIGNATION_REFERENTIAL.singleConsultantPerProject) {
      const current = await this.getProjectConsultants(projectId);
      await Promise.all(
        current
          .filter((c) => c.stakeholderId !== stakeholderId)
          .map((c) =>
            this.stakeholderRepository.setBusinessRole!(
              c.stakeholderId,
              CONSULTANT_DESIGNATION_REFERENTIAL.fallbackCode,
            ),
          ),
      );
    }

    await this.stakeholderRepository.setBusinessRole(
      stakeholderId,
      CONSULTANT_DESIGNATION_REFERENTIAL.canonicalCode,
    );
  }

  /** Retire le rôle consultant d'une partie prenante. */
  async revokeConsultant(stakeholderId: string): Promise<void> {
    if (!stakeholderId) throw new Error('stakeholderId est requis');
    if (!this.stakeholderRepository.setBusinessRole) {
      throw new Error("Le repository ne supporte pas la mise à jour du rôle métier");
    }
    await this.stakeholderRepository.setBusinessRole(
      stakeholderId,
      CONSULTANT_DESIGNATION_REFERENTIAL.fallbackCode,
    );
  }

  /** Toutes les affectations consultant (tous projets). */
  async getConsultantAssignments(): Promise<StakeholderAssignment[]> {
    if (!this.stakeholderRepository.findAssignmentsByBusinessRoles) return [];
    return this.stakeholderRepository.findAssignmentsByBusinessRoles([
      ...CONSULTANT_DESIGNATION_REFERENTIAL.consultantCodes,
    ]);
  }

  /**
   * Projets sur lesquels une entité (employé, fournisseur, partie prenante)
   * est désignée consultant.
   */
  async getConsultantProjectIds(entityId: string): Promise<string[]> {
    if (!entityId) return [];
    const assignments = await this.getConsultantAssignments();
    const ids = assignments
      .filter(
        (a) => a.employeeId === entityId || a.supplierId === entityId || a.id === entityId,
      )
      .map((a) => a.projectId)
      .filter(Boolean);
    return Array.from(new Set(ids));
  }
}

let instance: ProjectConsultantService | null = null;
export function getProjectConsultantService(): ProjectConsultantService {
  if (!instance) {
    instance = new ProjectConsultantService(RepositoryFactory.getStakeholderRepository());
  }
  return instance;
}

export default ProjectConsultantService;
