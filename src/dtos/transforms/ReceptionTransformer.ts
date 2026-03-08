/**
 * Reception Transformer - Hexagonal Architecture
 * Handles conversion between Reception entities and DTOs
 */

import { 
  ReceptionDTO, 
  ReceptionType, 
  ReceptionStatus,
  ReceptionDocumentDTO,
  ReceptionInspectionDTO,
  ReceptionFindingDTO,
  ReceptionDecisionDTO,
  ReceptionConditionDTO,
  ReceptionParticipantDTO,
  ReceptionValidationDTO,
  ReceptionWorkflowDTO
} from '@/dtos/entities/ReceptionDTO';

// Entity interfaces (would be in domain/entities)
export interface Reception {
  id: string;
  projectId: string;
  phaseId?: string;
  type: ReceptionType;
  status: ReceptionStatus;
  scheduledDate: Date;
  actualDate?: Date;
  receptionCommittee: string[];
  chairmanId: string;
  chairmanName: string;
  participants: ReceptionParticipant[];
  documents: ReceptionDocument[];
  inspections: ReceptionInspection[];
  findings: ReceptionFinding[];
  decisions: ReceptionDecision[];
  conditions: ReceptionCondition[];
  provisionalValidUntil?: Date;
  definitiveApprovalDate?: Date;
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceptionDocument {
  id: string;
  projectId: string;
  phaseId?: string;
  title: string;
  description: string;
  type: 'certificate' | 'report' | 'photo' | 'plan' | 'other';
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
  isRequired: boolean;
  isSubmitted: boolean;
  validationStatus: 'pending' | 'approved' | 'rejected';
  validationNotes?: string;
}

export interface ReceptionInspection {
  id: string;
  projectId: string;
  phaseId?: string;
  title: string;
  description: string;
  inspectionType: 'provisional' | 'definitive';
  scheduledDate: Date;
  actualDate?: Date;
  inspectorId: string;
  inspectorName: string;
  status: 'scheduled' | 'completed' | 'approved' | 'rejected';
  findings: ReceptionFinding[];
  recommendations: string[];
  nextInspectionDate?: Date;
  requiresFollowUp: boolean;
}

export interface ReceptionFinding {
  id: string;
  category: 'conformity' | 'defect' | 'safety' | 'quality' | 'documentation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  photoUrls?: string[];
  resolutionRequired: boolean;
  resolutionDeadline?: Date;
  resolutionStatus: 'pending' | 'in_progress' | 'resolved';
  assignedTo?: string;
}

export interface ReceptionDecision {
  id: string;
  type: 'approval' | 'conditional_approval' | 'rejection' | 'deferment';
  description: string;
  conditions?: string[];
  validUntil?: Date;
  decidedBy: string;
  decidedAt: Date;
}

export interface ReceptionCondition {
  id: string;
  description: string;
  category: 'corrective' | 'preventive' | 'documentation' | 'payment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: Date;
  responsibleParty: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedAt?: Date;
}

export interface ReceptionParticipant {
  id: string;
  name: string;
  role: string;
  organization: string;
  signature?: string;
  signatureDate?: Date;
  hasApproved: boolean;
}

export class ReceptionTransformer {
  // =================== ENTITY TO DTO ===================

  static toDTO(entity: Reception): ReceptionDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      phaseId: entity.phaseId,
      type: entity.type,
      status: entity.status,
      scheduledDate: entity.scheduledDate.toISOString(),
      actualDate: entity.actualDate?.toISOString(),
      receptionCommittee: entity.receptionCommittee,
      chairmanId: entity.chairmanId,
      chairmanName: entity.chairmanName,
      participants: entity.participants.map(p => this.participantToDTO(p)),
      documents: entity.documents.map(d => this.documentToDTO(d)),
      inspections: entity.inspections.map(i => this.inspectionToDTO(i)),
      findings: entity.findings.map(f => this.findingToDTO(f)),
      decisions: entity.decisions.map(d => this.decisionToDTO(d)),
      conditions: entity.conditions.map(c => this.conditionToDTO(c)),
      provisionalValidUntil: entity.provisionalValidUntil?.toISOString(),
      definitiveApprovalDate: entity.definitiveApprovalDate?.toISOString(),
      notes: entity.notes,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  static documentToDTO(entity: ReceptionDocument): ReceptionDocumentDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      phaseId: entity.phaseId,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      fileUrl: entity.fileUrl,
      fileName: entity.fileName,
      fileSize: entity.fileSize,
      mimeType: entity.mimeType,
      uploadedAt: entity.uploadedAt.toISOString(),
      uploadedBy: entity.uploadedBy,
      isRequired: entity.isRequired,
      isSubmitted: entity.isSubmitted,
      validationStatus: entity.validationStatus,
      validationNotes: entity.validationNotes,
      createdAt: entity.uploadedAt.toISOString(),
      updatedAt: entity.uploadedAt.toISOString()
    };
  }

  static inspectionToDTO(entity: ReceptionInspection): ReceptionInspectionDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      phaseId: entity.phaseId,
      title: entity.title,
      description: entity.description,
      inspectionType: entity.inspectionType,
      scheduledDate: entity.scheduledDate.toISOString(),
      actualDate: entity.actualDate?.toISOString(),
      inspectorId: entity.inspectorId,
      inspectorName: entity.inspectorName,
      status: entity.status,
      findings: entity.findings.map(f => this.findingToDTO(f)),
      recommendations: entity.recommendations,
      nextInspectionDate: entity.nextInspectionDate?.toISOString(),
      requiresFollowUp: entity.requiresFollowUp
    };
  }

  static findingToDTO(entity: ReceptionFinding): ReceptionFindingDTO {
    return {
      id: entity.id,
      category: entity.category,
      severity: entity.severity,
      description: entity.description,
      location: entity.location,
      photoUrls: entity.photoUrls,
      resolutionRequired: entity.resolutionRequired,
      resolutionDeadline: entity.resolutionDeadline?.toISOString(),
      resolutionStatus: entity.resolutionStatus,
      assignedTo: entity.assignedTo
    };
  }

  static decisionToDTO(entity: ReceptionDecision): ReceptionDecisionDTO {
    return {
      id: entity.id,
      type: entity.type,
      description: entity.description,
      conditions: entity.conditions,
      validUntil: entity.validUntil?.toISOString(),
      decidedBy: entity.decidedBy,
      decidedAt: entity.decidedAt.toISOString()
    };
  }

  static conditionToDTO(entity: ReceptionCondition): ReceptionConditionDTO {
    return {
      id: entity.id,
      description: entity.description,
      category: entity.category,
      priority: entity.priority,
      deadline: entity.deadline?.toISOString(),
      responsibleParty: entity.responsibleParty,
      status: entity.status,
      completedAt: entity.completedAt?.toISOString()
    };
  }

  static participantToDTO(entity: ReceptionParticipant): ReceptionParticipantDTO {
    return {
      id: entity.id,
      name: entity.name,
      role: entity.role,
      organization: entity.organization,
      signature: entity.signature,
      signatureDate: entity.signatureDate?.toISOString(),
      hasApproved: entity.hasApproved
    };
  }

  // =================== DTO TO ENTITY ===================

  static toEntity(dto: ReceptionDTO): Reception {
    return {
      id: dto.id,
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      type: dto.type,
      status: dto.status,
      scheduledDate: new Date(dto.scheduledDate),
      actualDate: dto.actualDate ? new Date(dto.actualDate) : undefined,
      receptionCommittee: dto.receptionCommittee,
      chairmanId: dto.chairmanId,
      chairmanName: dto.chairmanName,
      participants: dto.participants.map(p => this.participantToEntity(p)),
      documents: dto.documents.map(d => this.documentToEntity(d)),
      inspections: dto.inspections.map(i => this.inspectionToEntity(i)),
      findings: dto.findings.map(f => this.findingToEntity(f)),
      decisions: dto.decisions.map(d => this.decisionToEntity(d)),
      conditions: dto.conditions.map(c => this.conditionToEntity(c)),
      provisionalValidUntil: dto.provisionalValidUntil ? new Date(dto.provisionalValidUntil) : undefined,
      definitiveApprovalDate: dto.definitiveApprovalDate ? new Date(dto.definitiveApprovalDate) : undefined,
      notes: dto.notes,
      createdBy: dto.createdBy,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    };
  }

  static documentToEntity(dto: ReceptionDocumentDTO): ReceptionDocument {
    return {
      id: dto.id,
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      uploadedAt: new Date(dto.uploadedAt),
      uploadedBy: dto.uploadedBy,
      isRequired: dto.isRequired,
      isSubmitted: dto.isSubmitted,
      validationStatus: dto.validationStatus,
      validationNotes: dto.validationNotes
    };
  }

  static inspectionToEntity(dto: ReceptionInspectionDTO): ReceptionInspection {
    return {
      id: dto.id,
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      title: dto.title,
      description: dto.description,
      inspectionType: dto.inspectionType,
      scheduledDate: new Date(dto.scheduledDate),
      actualDate: dto.actualDate ? new Date(dto.actualDate) : undefined,
      inspectorId: dto.inspectorId,
      inspectorName: dto.inspectorName,
      status: dto.status,
      findings: dto.findings.map(f => this.findingToEntity(f)),
      recommendations: dto.recommendations,
      nextInspectionDate: dto.nextInspectionDate ? new Date(dto.nextInspectionDate) : undefined,
      requiresFollowUp: dto.requiresFollowUp
    };
  }

  static findingToEntity(dto: ReceptionFindingDTO): ReceptionFinding {
    return {
      id: dto.id,
      category: dto.category,
      severity: dto.severity,
      description: dto.description,
      location: dto.location,
      photoUrls: dto.photoUrls,
      resolutionRequired: dto.resolutionRequired,
      resolutionDeadline: dto.resolutionDeadline ? new Date(dto.resolutionDeadline) : undefined,
      resolutionStatus: dto.resolutionStatus,
      assignedTo: dto.assignedTo
    };
  }

  static decisionToEntity(dto: ReceptionDecisionDTO): ReceptionDecision {
    return {
      id: dto.id,
      type: dto.type,
      description: dto.description,
      conditions: dto.conditions,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      decidedBy: dto.decidedBy,
      decidedAt: new Date(dto.decidedAt)
    };
  }

  static conditionToEntity(dto: ReceptionConditionDTO): ReceptionCondition {
    return {
      id: dto.id,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      responsibleParty: dto.responsibleParty,
      status: dto.status,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined
    };
  }

  static participantToEntity(dto: ReceptionParticipantDTO): ReceptionParticipant {
    return {
      id: dto.id,
      name: dto.name,
      role: dto.role,
      organization: dto.organization,
      signature: dto.signature,
      signatureDate: dto.signatureDate ? new Date(dto.signatureDate) : undefined,
      hasApproved: dto.hasApproved
    };
  }

  // =================== VALIDATION ===================

  static validateDTO(dto: Partial<ReceptionDTO>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dto.projectId) errors.push('Project ID is required');
    if (!dto.type) errors.push('Reception type is required');
    if (!dto.status) errors.push('Reception status is required');
    if (!dto.scheduledDate) errors.push('Scheduled date is required');
    if (!dto.chairmanId) errors.push('Chairman ID is required');
    if (!dto.receptionCommittee || dto.receptionCommittee.length === 0) {
      errors.push('Reception committee is required');
    }

    // Validate date format
    if (dto.scheduledDate && isNaN(Date.parse(dto.scheduledDate))) {
      errors.push('Invalid scheduled date format');
    }

    if (dto.actualDate && isNaN(Date.parse(dto.actualDate))) {
      errors.push('Invalid actual date format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // =================== FACTORY METHODS ===================

  static createProvisionalReception(data: {
    projectId: string;
    phaseId?: string;
    scheduledDate: string;
    committee: string[];
    chairmanId: string;
    chairmanName: string;
    notes: string;
    createdBy: string;
  }): Omit<ReceptionDTO, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      projectId: data.projectId,
      phaseId: data.phaseId,
      type: ReceptionType.PROVISIONAL,
      status: ReceptionStatus.PENDING,
      scheduledDate: data.scheduledDate,
      receptionCommittee: data.committee,
      chairmanId: data.chairmanId,
      chairmanName: data.chairmanName,
      participants: data.committee.map((member, index) => ({
        id: `participant-${Date.now()}-${index}`,
        name: member,
        role: 'committee_member',
        organization: 'organization',
        hasApproved: false
      })),
      documents: [],
      inspections: [],
      findings: [],
      decisions: [],
      conditions: [],
      notes: data.notes,
      createdBy: data.createdBy
    };
  }

  static createDefinitiveReception(data: {
    projectId: string;
    phaseId?: string;
    scheduledDate: string;
    committee: string[];
    chairmanId: string;
    chairmanName: string;
    notes: string;
    createdBy: string;
  }): Omit<ReceptionDTO, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      projectId: data.projectId,
      phaseId: data.phaseId,
      type: ReceptionType.DEFINITIVE,
      status: ReceptionStatus.PENDING,
      scheduledDate: data.scheduledDate,
      receptionCommittee: data.committee,
      chairmanId: data.chairmanId,
      chairmanName: data.chairmanName,
      participants: data.committee.map((member, index) => ({
        id: `participant-${Date.now()}-${index}`,
        name: member,
        role: 'committee_member',
        organization: 'organization',
        hasApproved: false
      })),
      documents: [],
      inspections: [],
      findings: [],
      decisions: [],
      conditions: [],
      notes: data.notes,
      createdBy: data.createdBy
    };
  }
}
