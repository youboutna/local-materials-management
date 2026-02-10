/**
 * Compliance Service
 * Orchestrates compliance business logic using hexagonal architecture
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ComplianceItemDTO,
  ComplianceDocumentDTO,
  ComplianceNoteDTO,
  ComplianceAuditEntryDTO,
  ComplianceStatisticsDTO,
  ComplianceFilterDTO,
  ComplianceAlertDTO,
  CreateComplianceRequestDTO,
  UpdateComplianceRequestDTO,
  CreateComplianceDocumentRequestDTO,
  CreateComplianceNoteRequestDTO
} from '@/dtos/entities/ComplianceDTO';
import { ComplianceItem, ComplianceDocument, ComplianceNote, ComplianceAuditEntry } from '@/domain/entities/Compliance';
import { IComplianceRepository } from '@/domain/repositories/IComplianceRepository';
import { ComplianceTransformer } from '@/dtos/transforms/ComplianceTransformer';

export class ComplianceService {
  constructor(private complianceRepository: IComplianceRepository) {}

  // Main compliance operations
  async getComplianceByProject(projectId: string): Promise<ComplianceItemDTO[]> {
    const entities = await this.complianceRepository.findByProject(projectId);
    return entities.map(entity => ComplianceTransformer.toDTO(entity));
  }

  async getComplianceById(id: string): Promise<ComplianceItemDTO | null> {
    const entity = await this.complianceRepository.findById(id);
    return entity ? ComplianceTransformer.toDTO(entity) : null;
  }

  async createComplianceItem(data: CreateComplianceRequestDTO): Promise<ComplianceItemDTO> {
    // Validate business rules
    this.validateComplianceData(data);

    // Create domain entity
    const entity = ComplianceItem.create({
      id: uuidv4(),
      ...data
    });

    // Save to repository
    const savedEntity = await this.complianceRepository.save(entity);

    // Create audit entry
    await this.createAuditEntry(savedEntity.id, 'created', null, 'created', data.createdBy);

    // Return DTO
    return ComplianceTransformer.toDTO(savedEntity);
  }

  async updateComplianceItem(id: string, updates: UpdateComplianceRequestDTO): Promise<ComplianceItemDTO> {
    // Get existing entity
    const existingEntity = await this.complianceRepository.findById(id);
    if (!existingEntity) {
      throw new Error(`Compliance item with id ${id} not found`);
    }

    // Validate transition
    if (updates.status && !existingEntity.canTransitionTo(updates.status)) {
      throw new Error(`Cannot transition from ${existingEntity.status} to ${updates.status}`);
    }

    // Update entity
    const updatedEntity = existingEntity.update(updates);
    const savedEntity = await this.complianceRepository.update(id, updatedEntity);

    // Create audit entries for changed fields
    await this.createAuditEntriesForChanges(existingEntity, savedEntity, updates.updatedBy!);

    return ComplianceTransformer.toDTO(savedEntity);
  }

  async deleteComplianceItem(id: string): Promise<void> {
    const entity = await this.complianceRepository.findById(id);
    if (!entity) {
      throw new Error(`Compliance item with id ${id} not found`);
    }

    await this.complianceRepository.delete(id);
  }

  // Document operations
  async getComplianceDocuments(complianceItemId: string): Promise<ComplianceDocumentDTO[]> {
    const documents = await this.complianceRepository.findDocumentsByComplianceItem(complianceItemId);
    return documents.map(doc => ComplianceTransformer.documentToDTO(doc));
  }

  async addComplianceDocument(data: CreateComplianceDocumentRequestDTO): Promise<ComplianceDocumentDTO> {
    const document = ComplianceDocument.create({
      id: uuidv4(),
      ...data
    });

    const savedDocument = await this.complianceRepository.saveDocument(document);
    return ComplianceTransformer.documentToDTO(savedDocument);
  }

  // Note operations
  async getComplianceNotes(complianceItemId: string): Promise<ComplianceNoteDTO[]> {
    const notes = await this.complianceRepository.findNotesByComplianceItem(complianceItemId);
    return notes.map(note => ComplianceTransformer.noteToDTO(note));
  }

  async addComplianceNote(data: CreateComplianceNoteRequestDTO): Promise<ComplianceNoteDTO> {
    const note = ComplianceNote.create({
      id: uuidv4(),
      ...data
    });

    const savedNote = await this.complianceRepository.saveNote(note);
    return ComplianceTransformer.noteToDTO(savedNote);
  }

  // Statistics and analytics
  async getComplianceStatistics(projectId: string): Promise<ComplianceStatisticsDTO> {
    const items = await this.complianceRepository.findByProject(projectId);
    
    const totalItems = items.length;
    const approvedItems = items.filter(item => item.status === 'approved').length;
    const pendingItems = items.filter(item => item.status === 'pending').length;
    const inProgressItems = items.filter(item => item.status === 'in_progress').length;
    const rejectedItems = items.filter(item => item.status === 'rejected').length;
    const criticalItems = items.filter(item => item.priority === 'critical').length;
    const overdueItems = items.filter(item => item.isOverdue()).length;

    const overallComplianceScore = totalItems > 0 
      ? Math.round(items.reduce((sum, item) => sum + item.getComplianceScore(), 0) / totalItems)
      : 0;

    // Group by type
    const itemsByType = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by status
    const itemsByStatus = items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by priority
    const itemsByPriority = items.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems,
      approvedItems,
      pendingItems,
      inProgressItems,
      rejectedItems,
      criticalItems,
      overdueItems,
      overallComplianceScore,
      itemsByType,
      itemsByStatus,
      itemsByPriority
    };
  }

  async getComplianceAlerts(projectId: string): Promise<ComplianceAlertDTO[]> {
    const items = await this.complianceRepository.findByProject(projectId);
    const alerts: ComplianceAlertDTO[] = [];

    items.forEach(item => {
      const riskAssessment = item.getRiskAssessment();

      // Overdue alert
      if (item.isOverdue()) {
        alerts.push({
          id: uuidv4(),
          complianceItemId: item.id,
          type: 'overdue',
          severity: 'critical',
          message: `Compliance item "${item.title}" is overdue`,
          projectId,
          responsible: item.responsible,
          createdAt: new Date().toISOString()
        });
      }

      // Critical priority alert
      if (item.priority === 'critical' && item.status !== 'approved') {
        alerts.push({
          id: uuidv4(),
          complianceItemId: item.id,
          type: 'critical_priority',
          severity: 'high',
          message: `Critical priority compliance item "${item.title}" needs attention`,
          projectId,
          responsible: item.responsible,
          createdAt: new Date().toISOString()
        });
      }

      // Risk level alert
      if (riskAssessment.level === 'high' || riskAssessment.level === 'critical') {
        alerts.push({
          id: uuidv4(),
          complianceItemId: item.id,
          type: 'risk_level',
          severity: riskAssessment.level,
          message: `High risk compliance item "${item.title}": ${riskAssessment.factors.join(', ')}`,
          projectId,
          responsible: item.responsible,
          createdAt: new Date().toISOString()
        });
      }

      // Mitigation required alert
      if (item.mitigationRequired && !item.mitigationPlan) {
        alerts.push({
          id: uuidv4(),
          complianceItemId: item.id,
          type: 'mitigation_required',
          severity: 'high',
          message: `Mitigation plan required for compliance item "${item.title}"`,
          projectId,
          responsible: item.responsible,
          createdAt: new Date().toISOString()
        });
      }
    });

    return alerts;
  }

  // Filtered search
  async searchCompliance(filter: ComplianceFilterDTO): Promise<ComplianceItemDTO[]> {
    const entities = await this.complianceRepository.findByFilter(filter);
    return entities.map(entity => ComplianceTransformer.toDTO(entity));
  }

  // Private helper methods
  private validateComplianceData(data: CreateComplianceRequestDTO): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    if (!data.responsible || data.responsible.trim().length === 0) {
      throw new Error('Responsible person is required');
    }

    if (!data.projectId) {
      throw new Error('Project ID is required');
    }

    if (data.deadline && new Date(data.deadline) < new Date()) {
      throw new Error('Deadline cannot be in the past');
    }
  }

  private async createAuditEntry(
    complianceItemId: string,
    fieldName: string,
    oldValue: string | null,
    newValue: string | null,
    changedBy: string
  ): Promise<void> {
    const auditEntry = ComplianceAuditEntry.create({
      id: uuidv4(),
      complianceItemId,
      fieldName,
      oldValue,
      newValue,
      changedBy
    });

    await this.complianceRepository.saveAuditEntry(auditEntry);
  }

  private async createAuditEntriesForChanges(
    oldEntity: ComplianceItem,
    newEntity: ComplianceItem,
    changedBy: string
  ): Promise<void> {
    const fieldsToCheck = [
      { name: 'status', old: oldEntity.status, new: newEntity.status },
      { name: 'priority', old: oldEntity.priority, new: newEntity.priority },
      { name: 'deadline', old: oldEntity.deadline, new: newEntity.deadline },
      { name: 'responsible', old: oldEntity.responsible, new: newEntity.responsible },
      { name: 'mitigationPlan', old: oldEntity.mitigationPlan, new: newEntity.mitigationPlan }
    ];

    for (const field of fieldsToCheck) {
      if (field.old !== field.new) {
        await this.createAuditEntry(
          newEntity.id,
          field.name,
          field.old?.toString() || null,
          field.new?.toString() || null,
          changedBy
        );
      }
    }
  }
}
