/**
 * Transformer: StakeholderTransformer
 * Convertit entre Stakeholder Entity et StakeholderDTO
 * Uses `any` casts for cross-layer enum mismatches (domain vs DTO)
 */

import { Stakeholder, StakeholderOrganization, StakeholderType, StakeholderRole, StakeholderContact } from '@/domain/entities/Stakeholder';
import { 
  StakeholderDTO, 
  CreateStakeholderDTO,
  UpdateStakeholderDTO,
  StakeholderResponseDTO,
  CreateStakeholderRequestDTO,
  UpdateStakeholderRequestDTO
} from '@/dtos/entities/StakeholderDTO';

export class StakeholderTransformer {
  static manyToDTO(stakeholders: Stakeholder[]): StakeholderDTO[] {
    return stakeholders.map(stakeholder => this.toDTO(stakeholder));
  }

  static manyFromDTO(dtos: StakeholderDTO[]): Stakeholder[] {
    return dtos.map(dto => this.fromDatabaseRow(dto as any));
  }

  // Entity → DTO
  static toDTO(entity: Stakeholder | any): StakeholderDTO {
    return {
      id: entity.id,
      name: entity.contact?.name || entity.name || '',
      email: entity.contact?.email || entity.email || undefined,
      phone: entity.contact?.phone || entity.phone || undefined,
      stakeholderType: (entity.type || 'external') as any,
      entityType: 'person' as any,
      projectId: entity.projectId,
      role: (entity.role || 'stakeholder') as any,
      organizationId: entity.organizationId ?? undefined,
      employeeId: entity.employeeId ?? undefined,
      isPrimary: entity.isPrimary ?? false,
      isInternal: entity.isInternal ?? false,
      contact: entity.contact ? { ...entity.contact } : undefined,
      organization: entity.organization?.name ?? undefined,
      responsibilities: entity.responsibilities ? [...entity.responsibilities] : undefined,
      accessLevel: entity.accessLevel === 'full' ? 'admin' : (entity.accessLevel ?? undefined) as any,
      startDate: entity.startDate ?? undefined,
      endDate: entity.endDate ?? undefined,
      hourlyRate: entity.hourlyRate ?? undefined,
      contractType: entity.contractType ?? undefined,
      notes: entity.notes ?? undefined,
      isActive: entity.isActive ?? true,
      createdAt: entity.createdAt || new Date().toISOString(),
      updatedAt: entity.updatedAt || new Date().toISOString()
    };
  }

  // Entity → ResponseDTO (avec propriétés calculées)
  static toResponseDTO(entity: Stakeholder): StakeholderResponseDTO {
    const base = this.toDTO(entity);
    return {
      ...base,
      displayName: entity.getDisplayName(),
      fullTitle: entity.getFullTitle(),
      isEmployee: entity.isEmployee(),
      isExternal: entity.isExternal(),
      isSupplier: entity.isSupplier(),
      isInspector: entity.isInspector(),
      isManager: entity.isManager(),
      canRead: entity.canRead(),
      canWrite: entity.canWrite(),
      canAdmin: entity.canAdmin(),
      hasFullAccess: entity.hasFullAccess(),
      isActiveInProject: entity.isActiveInProject()
    };
  }

  // CreateStakeholderRequestDTO → Entity (legacy compat)
  static fromCreateDTOToEntity(dto: CreateStakeholderRequestDTO | CreateStakeholderDTO | any): Stakeholder {
    const id = `stakeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const contact: StakeholderContact = {
      name: dto.contact?.name || dto.name || '',
      email: dto.contact?.email || dto.email || '',
      phone: dto.contact?.phone || dto.phone || undefined,
      position: dto.contact?.position || dto.position || undefined
    };

    const organization: StakeholderOrganization | null = dto.organizationId ? {
      id: dto.organizationId,
      name: dto.organization || '',
      type: (dto.type || 'external') as StakeholderType,
    } : null;

    return new Stakeholder(
      id,
      dto.projectId || '',
      (dto.type || dto.stakeholderType || 'external') as StakeholderType,
      (dto.role || 'stakeholder') as StakeholderRole,
      dto.organizationId || null,
      dto.employeeId || null,
      dto.isPrimary ?? false,
      dto.isInternal ?? dto.employeeId != null,
      contact,
      organization,
      dto.responsibilities || [],
      dto.accessLevel || 'read',
      dto.startDate || null,
      dto.endDate || null,
      dto.hourlyRate || null,
      dto.contractType || null,
      dto.notes || null,
      dto.isActive ?? true,
      now,
      now
    );
  }

  // UpdateStakeholderRequestDTO → partial Entity
  static fromUpdateDTOToEntity(dto: UpdateStakeholderRequestDTO | UpdateStakeholderDTO | any): Partial<Stakeholder> {
    const partial: Partial<Stakeholder> = {};

    if (dto.role !== undefined) (partial as any)._role = dto.role;
    if (dto.organization !== undefined || dto.organizationId !== undefined) {
      (partial as any)._organizationId = dto.organizationId || dto.organization;
    }
    if (dto.employeeId !== undefined) (partial as any)._employeeId = dto.employeeId;
    if (dto.isPrimary !== undefined) (partial as any)._isPrimary = dto.isPrimary;
    if (dto.contact !== undefined) (partial as any)._contact = dto.contact;
    if (dto.responsibilities !== undefined) (partial as any)._responsibilities = dto.responsibilities;
    if (dto.accessLevel !== undefined) (partial as any)._accessLevel = dto.accessLevel;
    if (dto.startDate !== undefined) (partial as any)._startDate = dto.startDate;
    if (dto.endDate !== undefined) (partial as any)._endDate = dto.endDate;
    if (dto.hourlyRate !== undefined) (partial as any)._hourlyRate = dto.hourlyRate;
    if (dto.contractType !== undefined) (partial as any)._contractType = dto.contractType;
    if (dto.notes !== undefined) (partial as any)._notes = dto.notes;
    if (dto.isActive !== undefined) (partial as any)._isActive = dto.isActive;

    return partial;
  }

  // Database Row → Entity
  static fromDatabaseRow(row: any): Stakeholder {
    const contact: StakeholderContact = {
      name: row.contact_name || row.contactName || row.contact?.name || row.name || '',
      email: row.contact_email || row.contactEmail || row.contact?.email || row.email || '',
      phone: row.contact_phone || row.contactPhone || row.contact?.phone || row.phone || undefined,
      position: row.contact_position || row.contactPosition || row.contact?.position || row.position || undefined
    };

    const organization: StakeholderOrganization | null = row.organization_id || row.organizationId ? {
      id: row.organization_id || row.organizationId,
      name: row.organization_name || row.organizationName || row.organization || '',
      type: (row.organization_type || row.organizationType || '') as StakeholderType,
    } : null;

    return new Stakeholder(
      row.id,
      row.project_id || row.projectId,
      (row.type || row.stakeholderType || '') as StakeholderType,
      (row.role || '') as StakeholderRole,
      row.organization_id || row.organizationId || null,
      row.employee_id || row.employeeId || null,
      Boolean(row.is_primary || row.isPrimary),
      Boolean(row.is_internal || row.isInternal),
      contact,
      organization,
      row.responsibilities || [],
      row.access_level || row.accessLevel || 'read',
      row.start_date || row.startDate || null,
      row.end_date || row.endDate || null,
      row.hourly_rate || row.hourlyRate || null,
      row.contract_type || row.contractType || null,
      row.notes || null,
      Boolean(row.is_active ?? row.isActive ?? true),
      row.created_at || row.createdAt,
      row.updated_at || row.updatedAt
    );
  }

  // Entity → Database Row
  static toDatabaseRow(entity: Stakeholder): any {
    return {
      id: entity.id,
      project_id: entity.projectId,
      type: entity.type,
      role: entity.role,
      organization_id: entity.organizationId,
      employee_id: entity.employeeId,
      is_primary: entity.isPrimary,
      is_internal: entity.isInternal,
      contact_name: entity.contact.name,
      contact_email: entity.contact.email,
      contact_phone: entity.contact.phone || null,
      contact_position: entity.contact.position || null,
      organization_name: entity.organization?.name || null,
      organization_type: entity.organization?.type || null,
      responsibilities: entity.responsibilities,
      access_level: entity.accessLevel,
      start_date: entity.startDate,
      end_date: entity.endDate,
      hourly_rate: entity.hourlyRate,
      contract_type: entity.contractType,
      notes: entity.notes,
      is_active: entity.isActive,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  // Validation
  static validateCreateDTO(dto: CreateStakeholderRequestDTO | CreateStakeholderDTO | any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!dto.name || (dto.name as string).trim() === '') errors.push('Le nom est requis');
    if (!dto.role || (dto.role as string).trim() === '') errors.push('Le rôle est requis');
    return { isValid: errors.length === 0, errors };
  }

  static validateUpdateDTO(dto: UpdateStakeholderRequestDTO | UpdateStakeholderDTO | any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (dto.name !== undefined && (dto.name as string).trim() === '') errors.push('Le nom ne peut pas être vide');
    return { isValid: errors.length === 0, errors };
  }
}
