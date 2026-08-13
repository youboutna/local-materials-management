/**
 * Compliance Transformer
 * Handles bidirectional mapping between layers following hexagonal architecture
 */

import {
  ComplianceItemDTO,
  ComplianceDocumentDTO,
  ComplianceNoteDTO,
  ComplianceAuditEntryDTO,
  CreateComplianceRequestDTO,
  UpdateComplianceRequestDTO,
  CreateComplianceDocumentRequestDTO,
  CreateComplianceNoteRequestDTO
} from '@/dtos/entities/ComplianceDTO';
import { ComplianceItem, ComplianceDocument, ComplianceNote, ComplianceAuditEntry } from '@/domain/entities/Compliance';

// Database row types (from Supabase types)
interface DatabaseComplianceRow {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline?: string | null;
  responsible: string;
  project_id: string;
  bank_guarantee_id?: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string;
  updated_by?: string | null;
}

interface DatabaseComplianceDocumentRow {
  id: string;
  compliance_item_id: string;
  document_id: string;
  category: string;
  subcategory?: string | null;
  is_required: boolean | null;
  uploaded_by?: string | null;
  created_at: string | null;
}

interface DatabaseComplianceNoteRow {
  id: string;
  compliance_item_id: string;
  note: string;
  created_by: string;
  created_at: string | null;
}

interface DatabaseComplianceAuditRow {
  id: string;
  compliance_item_id: string;
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_by: string;
  changed_at: string | null;
}

export class ComplianceTransformer {
  // Entity ↔ DTO mappings
  static toDTO(entity: ComplianceItem): ComplianceItemDTO {
    return {
      id: entity.id,
      type: entity.type,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      priority: entity.priority,
      deadline: entity.deadline,
      responsible: entity.responsible,
      projectId: entity.projectId,
      bankGuaranteeId: entity.bankGuaranteeId,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      category: entity.category,
      subcategory: entity.subcategory,
      complianceLevel: entity.complianceLevel,
      lastReviewed: entity.lastReviewed,
      nextReview: entity.nextReview,
      externalReferences: entity.externalReferences,
      riskLevel: entity.riskLevel,
      mitigationRequired: entity.mitigationRequired,
      mitigationPlan: entity.mitigationPlan,
      // Legacy snake_case aliases
      project_id: entity.projectId,
      bank_guarantee_id: entity.bankGuaranteeId,
      created_by: entity.createdBy,
      updated_by: entity.updatedBy,
      compliance_level: entity.complianceLevel,
      last_reviewed: entity.lastReviewed,
      next_review: entity.nextReview,
      external_references: entity.externalReferences,
      risk_level: entity.riskLevel,
      mitigation_required: entity.mitigationRequired,
      mitigation_plan: entity.mitigationPlan
    };
  }

  static fromDTO(dto: ComplianceItemDTO): ComplianceItem {
    return new ComplianceItem(
      dto.id,
      dto.type,
      dto.title,
      dto.description,
      dto.status,
      dto.priority,
      dto.deadline,
      dto.responsible,
      dto.projectId,
      dto.bankGuaranteeId,
      dto.createdBy,
      dto.updatedBy,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
      dto.category,
      dto.subcategory,
      dto.complianceLevel,
      dto.lastReviewed,
      dto.nextReview,
      dto.externalReferences,
      dto.riskLevel,
      dto.mitigationRequired,
      dto.mitigationPlan
    );
  }

  // Entity ↔ Database mappings
  static fromSupabase(row: DatabaseComplianceRow): ComplianceItem {
    const createdAt = row.created_at ?? new Date().toISOString();
    const updatedAt = row.updated_at ?? createdAt;
    return new ComplianceItem(
      row.id,
      row.type as 'regulatory' | 'insurance' | 'bank_guarantee' | 'technical' | 'environmental' | 'health_safety' | 'quality' | 'financial' | 'data_protection' | 'labor_law' | 'procurement',
      row.title,
      row.description ?? undefined,
      row.status as 'pending' | 'in_progress' | 'approved' | 'rejected' | 'requires_action',
      row.priority as 'low' | 'medium' | 'high' | 'critical',
      row.deadline ?? undefined,
      row.responsible,
      row.project_id,
      row.bank_guarantee_id ?? undefined,
      row.created_by,
      row.updated_by ?? undefined,
      new Date(createdAt),
      new Date(updatedAt),
      this.getCategoryFromType(row.type),
      undefined, // subcategory
      'partial', // complianceLevel
      createdAt.split('T')[0], // lastReviewed
      ComplianceItem.calculateNextReview(row.type as 'regulatory' | 'insurance' | 'bank_guarantee' | 'technical' | 'environmental' | 'health_safety' | 'quality' | 'financial' | 'data_protection' | 'labor_law' | 'procurement'), // nextReview
      [], // externalReferences
      'medium', // riskLevel
      false, // mitigationRequired
      undefined // mitigationPlan
    );
  }

  static toSupabase(entity: ComplianceItem): DatabaseComplianceRow {
    return {
      id: entity.id,
      type: entity.type,
      title: entity.title,
      description: entity.description || '',
      status: entity.status,
      priority: entity.priority,
      deadline: entity.deadline,
      responsible: entity.responsible,
      project_id: entity.projectId,
      bank_guarantee_id: entity.bankGuaranteeId,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
      created_by: entity.createdBy,
      updated_by: entity.updatedBy
    };
  }

  // Request DTO ↔ Entity mappings
  static fromCreateRequest(request: CreateComplianceRequestDTO): ComplianceItem {
    const now = new Date();
    return new ComplianceItem(
      '', // id - will be generated
      request.type,
      request.title,
      request.description,
      request.status || 'pending',
      request.priority || 'medium',
      request.deadline,
      request.responsible,
      request.projectId,
      request.bankGuaranteeId,
      request.createdBy,
      undefined, // updatedBy
      now, // createdAt
      now, // updatedAt
      request.category || this.getCategoryFromType(request.type),
      request.subcategory,
      request.complianceLevel || 'partial',
      request.lastReviewed || now.toISOString().split('T')[0],
      request.nextReview || ComplianceItem.calculateNextReview(request.type),
      request.externalReferences || [],
      request.riskLevel || 'medium',
      request.mitigationRequired || false,
      request.mitigationPlan
    );
  }

  static toCreateRequest(entity: ComplianceItem): CreateComplianceRequestDTO {
    return {
      type: entity.type,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      priority: entity.priority,
      deadline: entity.deadline,
      responsible: entity.responsible,
      projectId: entity.projectId,
      bankGuaranteeId: entity.bankGuaranteeId,
      category: entity.category,
      subcategory: entity.subcategory,
      complianceLevel: entity.complianceLevel,
      lastReviewed: entity.lastReviewed,
      nextReview: entity.nextReview,
      externalReferences: entity.externalReferences,
      riskLevel: entity.riskLevel,
      mitigationRequired: entity.mitigationRequired,
      mitigationPlan: entity.mitigationPlan,
      createdBy: entity.createdBy
    };
  }

  // Document mappings
  static documentToDTO(entity: ComplianceDocument): ComplianceDocumentDTO {
    return {
      id: entity.id,
      complianceItemId: entity.complianceItemId,
      documentId: entity.documentId,
      category: entity.category,
      subcategory: entity.subcategory,
      isRequired: entity.isRequired,
      uploadedBy: entity.uploadedBy,
      fileUrl: entity.fileUrl,
      uploadedAt: entity.uploadedAt.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      // Legacy snake_case aliases
      compliance_item_id: entity.complianceItemId,
      document_id: entity.documentId,
      is_required: entity.isRequired,
      uploaded_by: entity.uploadedBy,
      file_url: entity.fileUrl,
      uploaded_at: entity.uploadedAt.toISOString()
    };
  }

  static documentFromDTO(dto: ComplianceDocumentDTO): ComplianceDocument {
    return new ComplianceDocument(
      dto.id,
      dto.complianceItemId,
      dto.documentId,
      dto.category,
      dto.subcategory,
      dto.isRequired,
      dto.uploadedBy,
      dto.fileUrl,
      new Date(dto.uploadedAt),
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }

  static documentFromSupabase(row: DatabaseComplianceDocumentRow): ComplianceDocument {
    const createdAt = row.created_at ?? new Date().toISOString();
    return new ComplianceDocument(
      row.id,
      row.compliance_item_id,
      row.document_id,
      row.category,
      row.subcategory ?? undefined,
      row.is_required ?? false,
      row.uploaded_by ?? undefined,
      undefined, // file_url: colonne absente du schéma compliance_documents
      new Date(createdAt), // uploaded_at: colonne absente, on utilise created_at
      new Date(createdAt),
      new Date(createdAt) // Use created_at as updated_at since it's not available in DB row
    );
  }

  static documentFromCreateRequest(request: CreateComplianceDocumentRequestDTO): ComplianceDocument {
    const now = new Date();
    return new ComplianceDocument(
      '', // id - will be generated
      request.complianceItemId,
      request.documentId,
      request.category,
      request.subcategory,
      request.isRequired || false,
      request.uploadedBy,
      request.fileUrl,
      now, // uploadedAt
      now, // createdAt
      now  // updatedAt
    );
  }

  // Note mappings
  static noteToDTO(entity: ComplianceNote): ComplianceNoteDTO {
    return {
      id: entity.id,
      complianceItemId: entity.complianceItemId,
      note: entity.note,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      // Legacy snake_case aliases
      compliance_item_id: entity.complianceItemId,
      created_by: entity.createdBy,
      created_at: entity.createdAt.toISOString()
    };
  }

  static noteFromDTO(dto: ComplianceNoteDTO): ComplianceNote {
    return new ComplianceNote(
      dto.id,
      dto.complianceItemId,
      dto.note,
      dto.createdBy,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }

  static noteFromSupabase(row: DatabaseComplianceNoteRow): ComplianceNote {
    const createdAt = row.created_at ?? new Date().toISOString();
    return new ComplianceNote(
      row.id,
      row.compliance_item_id,
      row.note,
      row.created_by,
      new Date(createdAt),
      new Date(createdAt)
    );
  }

  static noteFromCreateRequest(request: CreateComplianceNoteRequestDTO): ComplianceNote {
    const now = new Date();
    return new ComplianceNote(
      '', // id - will be generated
      request.complianceItemId,
      request.note,
      request.createdBy,
      now, // createdAt
      now  // updatedAt
    );
  }

  // Audit entry mappings
  static auditToDTO(entity: ComplianceAuditEntry): ComplianceAuditEntryDTO {
    return {
      id: entity.id,
      complianceItemId: entity.complianceItemId,
      fieldName: entity.fieldName,
      oldValue: entity.oldValue,
      newValue: entity.newValue,
      changedBy: entity.changedBy,
      changedAt: entity.changedAt.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      // Legacy snake_case aliases
      compliance_item_id: entity.complianceItemId,
      field_name: entity.fieldName,
      old_value: entity.oldValue,
      new_value: entity.newValue,
      changed_by: entity.changedBy,
      changed_at: entity.changedAt.toISOString()
    };
  }

  static auditFromSupabase(row: DatabaseComplianceAuditRow): ComplianceAuditEntry {
    const changedAt = row.changed_at ?? new Date().toISOString();
    return new ComplianceAuditEntry(
      row.id,
      row.compliance_item_id,
      row.field_name,
      row.old_value ?? undefined,
      row.new_value ?? undefined,
      row.changed_by,
      new Date(changedAt),
      new Date(changedAt),
      new Date(changedAt)
    );
  }

  // Helper methods
  private static getCategoryFromType(type: string): string {
    const categoryMap: Record<string, string> = {
      'regulatory': 'Réglementaire',
      'insurance': 'Assurance',
      'bank_guarantee': 'Garantie Bancaire',
      'technical': 'Technique',
      'environmental': 'Environnemental',
      'health_safety': 'Santé et Sécurité',
      'quality': 'Qualité',
      'financial': 'Financier',
      'data_protection': 'Protection des Données',
      'labor_law': 'Droit du Travail',
      'procurement': 'Approvisionnement'
    };
    return categoryMap[type] || type;
  }
}
