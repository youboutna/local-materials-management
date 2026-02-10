/**
 * Compliance Domain Entities
 * Pure business objects with no external dependencies
 */

import {
  ComplianceType,
  ComplianceStatus,
  CompliancePriority,
  ComplianceLevel,
  ComplianceRiskLevel
} from '@/dtos/entities/ComplianceDTO';

export class ComplianceItem {
  constructor(
    public readonly id: string,
    public readonly type: ComplianceType,
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly status: ComplianceStatus,
    public readonly priority: CompliancePriority,
    public readonly deadline: string | undefined,
    public readonly responsible: string,
    public readonly projectId: string,
    public readonly bankGuaranteeId: string | undefined,
    public readonly createdBy: string,
    public readonly updatedBy: string | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly category: string,
    public readonly subcategory: string | undefined,
    public readonly complianceLevel: ComplianceLevel,
    public readonly lastReviewed: string,
    public readonly nextReview: string,
    public readonly externalReferences: string[],
    public readonly riskLevel: ComplianceRiskLevel,
    public readonly mitigationRequired: boolean,
    public readonly mitigationPlan: string | undefined
  ) {}

  // Business logic methods
  public isOverdue(): boolean {
    if (!this.deadline) return false;
    return new Date(this.deadline) < new Date() && this.status !== 'approved';
  }

  public isCritical(): boolean {
    return this.priority === 'critical' || this.riskLevel === 'critical';
  }

  public requiresAction(): boolean {
    return this.status === 'requires_action' || this.mitigationRequired;
  }

  public canTransitionTo(newStatus: ComplianceStatus): boolean {
    const validTransitions: Record<ComplianceStatus, ComplianceStatus[]> = {
      'pending': ['in_progress', 'rejected', 'approved'],
      'in_progress': ['approved', 'rejected', 'requires_action'],
      'approved': ['in_progress'], // Can be reopened for review
      'rejected': ['pending', 'in_progress'], // Can be resubmitted
      'requires_action': ['in_progress', 'approved', 'rejected']
    };

    return validTransitions[this.status]?.includes(newStatus) || false;
  }

  public getDaysUntilDeadline(): number {
    if (!this.deadline) return Infinity;
    const deadline = new Date(this.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getComplianceScore(): number {
    const statusScores: Record<ComplianceStatus, number> = {
      'approved': 100,
      'in_progress': 60,
      'pending': 30,
      'requires_action': 20,
      'rejected': 0
    };

    const priorityMultiplier: Record<CompliancePriority, number> = {
      'critical': 1.5,
      'high': 1.3,
      'medium': 1.0,
      'low': 0.8
    };

    const baseScore = statusScores[this.status] || 0;
    return Math.min(100, baseScore * priorityMultiplier[this.priority]);
  }

  public getRiskAssessment(): {
    level: ComplianceRiskLevel;
    factors: string[];
    recommendations: string[];
  } {
    const factors: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: ComplianceRiskLevel = 'low';

    // Check deadline risk
    if (this.isOverdue()) {
      factors.push('Item is overdue');
      recommendations.push('Immediate attention required');
      riskLevel = 'critical';
    } else if (this.getDaysUntilDeadline() < 7) {
      factors.push('Deadline approaching within 7 days');
      recommendations.push('Accelerate completion');
      riskLevel = this.getHigherRiskLevel(riskLevel, 'medium');
    }

    // Check priority risk
    if (this.priority === 'critical') {
      factors.push('Critical priority item');
      recommendations.push('Escalate to management');
      riskLevel = this.getHigherRiskLevel(riskLevel, 'high');
    }

    // Check status risk
    if (this.status === 'rejected') {
      factors.push('Item has been rejected');
      recommendations.push('Review and resubmit');
      riskLevel = this.getHigherRiskLevel(riskLevel, 'medium');
    }

    // Check mitigation risk
    if (this.mitigationRequired && !this.mitigationPlan) {
      factors.push('Mitigation required but no plan defined');
      recommendations.push('Define mitigation plan immediately');
      riskLevel = this.getHigherRiskLevel(riskLevel, 'high');
    }

    return { level: riskLevel, factors, recommendations };
  }

  private getHigherRiskLevel(
    current: ComplianceRiskLevel,
    newLevel: ComplianceRiskLevel
  ): ComplianceRiskLevel {
    const levels: Record<ComplianceRiskLevel, number> = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };

    return levels[newLevel] > levels[current] ? newLevel : current;
  }

  public static create(data: {
    id: string;
    type: ComplianceType;
    title: string;
    description?: string;
    status: ComplianceStatus;
    priority: CompliancePriority;
    deadline?: string;
    responsible: string;
    projectId: string;
    bankGuaranteeId?: string;
    createdBy: string;
    category: string;
    subcategory?: string;
    complianceLevel?: ComplianceLevel;
    lastReviewed?: string;
    nextReview?: string;
    externalReferences?: string[];
    riskLevel?: ComplianceRiskLevel;
    mitigationRequired?: boolean;
    mitigationPlan?: string;
  }): ComplianceItem {
    const now = new Date();
    return new ComplianceItem(
      data.id,
      data.type,
      data.title,
      data.description,
      data.status,
      data.priority,
      data.deadline,
      data.responsible,
      data.projectId,
      data.bankGuaranteeId,
      data.createdBy,
      undefined, // updatedBy
      now, // createdAt
      now, // updatedAt
      data.category,
      data.subcategory,
      data.complianceLevel || 'partial',
      data.lastReviewed || now.toISOString().split('T')[0],
      data.nextReview || ComplianceItem.calculateNextReview(data.type),
      data.externalReferences || [],
      data.riskLevel || 'medium',
      data.mitigationRequired || false,
      data.mitigationPlan
    );
  }

  public static calculateNextReview(type: ComplianceType): string {
    const now = new Date();
    const frequencies: Record<ComplianceType, number> = {
      'regulatory': 365, // 1 year
      'insurance': 365,
      'bank_guarantee': 180, // 6 months
      'technical': 90, // 3 months
      'environmental': 180,
      'health_safety': 90,
      'quality': 90,
      'financial': 90,
      'data_protection': 180,
      'labor_law': 365,
      'procurement': 180
    };
    
    const days = frequencies[type] || 365;
    const nextReview = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return nextReview.toISOString().split('T')[0];
  }

  public update(updates: Partial<ComplianceItem>): ComplianceItem {
    return new ComplianceItem(
      updates.id ?? this.id,
      updates.type ?? this.type,
      updates.title ?? this.title,
      updates.description ?? this.description,
      updates.status ?? this.status,
      updates.priority ?? this.priority,
      updates.deadline ?? this.deadline,
      updates.responsible ?? this.responsible,
      updates.projectId ?? this.projectId,
      updates.bankGuaranteeId ?? this.bankGuaranteeId,
      updates.createdBy ?? this.createdBy,
      updates.updatedBy ?? this.updatedBy,
      updates.createdAt ?? this.createdAt,
      new Date(), // Always update updatedAt
      updates.category ?? this.category,
      updates.subcategory ?? this.subcategory,
      updates.complianceLevel ?? this.complianceLevel,
      updates.lastReviewed ?? this.lastReviewed,
      updates.nextReview ?? this.nextReview,
      updates.externalReferences ?? this.externalReferences,
      updates.riskLevel ?? this.riskLevel,
      updates.mitigationRequired ?? this.mitigationRequired,
      updates.mitigationPlan ?? this.mitigationPlan
    );
  }
}

export class ComplianceDocument {
  constructor(
    public readonly id: string,
    public readonly complianceItemId: string,
    public readonly documentId: string,
    public readonly category: string,
    public readonly subcategory: string | undefined,
    public readonly isRequired: boolean,
    public readonly uploadedBy: string | undefined,
    public readonly fileUrl: string | undefined,
    public readonly uploadedAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  public static create(data: {
    id: string;
    complianceItemId: string;
    documentId: string;
    category: string;
    subcategory?: string;
    isRequired?: boolean;
    uploadedBy?: string;
    fileUrl?: string;
  }): ComplianceDocument {
    const now = new Date();
    return new ComplianceDocument(
      data.id,
      data.complianceItemId,
      data.documentId,
      data.category,
      data.subcategory,
      data.isRequired || false,
      data.uploadedBy,
      data.fileUrl,
      now, // uploadedAt
      now, // createdAt
      now  // updatedAt
    );
  }
}

export class ComplianceNote {
  constructor(
    public readonly id: string,
    public readonly complianceItemId: string,
    public readonly note: string,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  public static create(data: {
    id: string;
    complianceItemId: string;
    note: string;
    createdBy: string;
  }): ComplianceNote {
    const now = new Date();
    return new ComplianceNote(
      data.id,
      data.complianceItemId,
      data.note,
      data.createdBy,
      now, // createdAt
      now  // updatedAt
    );
  }
}

export class ComplianceAuditEntry {
  constructor(
    public readonly id: string,
    public readonly complianceItemId: string,
    public readonly fieldName: string,
    public readonly oldValue: string | undefined,
    public readonly newValue: string | undefined,
    public readonly changedBy: string,
    public readonly changedAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  public static create(data: {
    id: string;
    complianceItemId: string;
    fieldName: string;
    oldValue?: string;
    newValue?: string;
    changedBy: string;
  }): ComplianceAuditEntry {
    const now = new Date();
    return new ComplianceAuditEntry(
      data.id,
      data.complianceItemId,
      data.fieldName,
      data.oldValue,
      data.newValue,
      data.changedBy,
      now, // changedAt
      now, // createdAt
      now  // updatedAt
    );
  }
}
