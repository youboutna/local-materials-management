/**
 * Compliance Validation Rules and Business Logic
 * Following Rule #1: Pure domain entities with business logic
 */

import { ComplianceItem } from './Compliance';
import { ComplianceType, ComplianceStatus, CompliancePriority, ComplianceLevel, ComplianceRiskLevel } from '@/dtos/entities/ComplianceDTO';

export interface ComplianceValidationRule {
  id: string;
  name: string;
  description: string;
  type: ComplianceType;
  required: boolean;
  validator: (item: ComplianceItem) => boolean;
  errorMessage: string;
}

export interface ComplianceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

export interface ComplianceBusinessRule {
  id: string;
  name: string;
  condition: (item: ComplianceItem) => boolean;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Compliance Validation Engine
 * Centralized validation logic for compliance items
 */
export class ComplianceValidationEngine {
  private static readonly VALIDATION_RULES: ComplianceValidationRule[] = [
    {
      id: 'title-required',
      name: 'Title Required',
      description: 'Compliance item must have a title',
      type: 'regulatory' as ComplianceType,
      required: true,
      validator: (item) => !!(item.title && item.title.trim().length > 0),
      errorMessage: 'Title is required and cannot be empty'
    },
    {
      id: 'description-required',
      name: 'Description Required',
      description: 'Compliance item must have a description',
      type: 'regulatory' as ComplianceType,
      required: true,
      validator: (item) => !!(item.description && item.description.trim().length > 10),
      errorMessage: 'Description must be at least 10 characters long'
    },
    {
      id: 'responsible-required',
      name: 'Responsible Person Required',
      description: 'Compliance item must have a responsible person assigned',
      type: 'regulatory' as ComplianceType,
      required: true,
      validator: (item) => !!(item.responsible && item.responsible.trim().length > 0),
      errorMessage: 'Responsible person is required'
    },
    {
      id: 'deadline-future',
      name: 'Future Deadline',
      description: 'Deadline must be in the future',
      type: 'regulatory' as ComplianceType,
      required: false,
      validator: (item) => {
        if (!item.deadline) return true;
        const deadline = new Date(item.deadline);
        const now = new Date();
        return deadline > now;
      },
      errorMessage: 'Deadline must be in the future'
    },
    {
      id: 'priority-level',
      name: 'Priority Level Check',
      description: 'Critical items must have high priority',
      type: 'regulatory' as ComplianceType,
      required: false,
      validator: (item) => {
        if (item.riskLevel === 'critical' && ['low', 'medium'].includes(item.priority)) {
          return false;
        }
        return true;
      },
      errorMessage: 'Critical risk items must have high or critical priority'
    }
  ];

  private static readonly BUSINESS_RULES: ComplianceBusinessRule[] = [
    {
      id: 'auto-approval-low-risk',
      name: 'Auto-approve Low Risk',
      condition: (item) => item.riskLevel === 'low' && item.status === 'pending',
      action: 'Auto-approve low risk compliance items',
      priority: 'medium'
    },
    {
      id: 'require-approval-high-risk',
      name: 'Require Approval High Risk',
      condition: (item) => item.riskLevel === 'high' && item.status === 'pending',
      action: 'High risk items require manual approval',
      priority: 'high'
    },
    {
      id: 'escalate-overdue',
      name: 'Escalate Overdue',
      condition: (item) => {
        if (!item.deadline) return false;
        const deadline = new Date(item.deadline);
        const now = new Date();
        const daysOverdue = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
        return daysOverdue > 7 && ['pending', 'in_progress'].includes(item.status);
      },
      action: 'Escalate overdue items to management',
      priority: 'high'
    },
    {
      id: 'require-documents-critical',
      name: 'Require Documents for Critical',
      condition: (item) => 
        ['regulatory', 'financial', 'environmental'].includes(item.type) && 
        item.riskLevel === 'critical' &&
        (!(item as any).documents || (item as any).documents.length === 0),
      action: 'Critical compliance items require supporting documents',
      priority: 'high'
    }
  ];

  /**
   * Validate compliance item against all applicable rules
   */
  static validate(item: ComplianceItem): ComplianceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Get applicable rules based on type
    const applicableRules = this.VALIDATION_RULES.filter(
      rule => rule.type === item.type || rule.type === 'regulatory'
    );

    // Apply validation rules
    for (const rule of applicableRules) {
      if (rule.required && !rule.validator(item)) {
        errors.push(rule.errorMessage);
        score -= 20; // Deduct points for errors
      } else if (!rule.validator(item)) {
        warnings.push(rule.errorMessage);
        score -= 10; // Deduct points for warnings
      }
    }

    // Type-specific validations
    if (item.type === 'insurance' && !item.deadline) {
      warnings.push('Insurance compliance items should have a renewal deadline');
      score -= 5;
    }

    if (item.type === 'bank_guarantee' && (!item.amount || item.amount <= 0)) {
      errors.push('Bank guarantee amount must be greater than 0');
      score -= 30;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Get applicable business rules for a compliance item
   */
  static getApplicableRules(item: ComplianceItem): ComplianceBusinessRule[] {
    return this.BUSINESS_RULES.filter(rule => rule.condition(item));
  }

  /**
   * Check if compliance item requires approval
   */
  static requiresApproval(item: ComplianceItem): boolean {
    const approvalRules = this.getApplicableRules(item).filter(
      rule => rule.action.includes('approval') || rule.action.includes('manual')
    );
    return approvalRules.length > 0;
  }

  /**
   * Check if compliance item should be escalated
   */
  static shouldEscalate(item: ComplianceItem): boolean {
    const escalationRules = this.getApplicableRules(item).filter(
      rule => rule.action.includes('escalate')
    );
    return escalationRules.length > 0;
  }

  /**
   * Get next suggested status based on business rules
   */
  static getNextSuggestedStatus(item: ComplianceItem): ComplianceStatus {
    if (this.requiresApproval(item)) {
      return 'pending';
    }

    if (this.shouldEscalate(item)) {
      return 'in_progress';
    }

    if (item.riskLevel === 'low' && item.status === 'pending') {
      return 'approved'; // Auto-approve low risk
    }

    return item.status; // Keep current status
  }

  /**
   * Calculate compliance score based on various factors
   */
  static calculateComplianceScore(item: ComplianceItem): number {
    let score = 50; // Base score

    // Risk level impact
    const riskScores = {
      low: 20,
      medium: 0,
      high: -20,
      critical: -40
    };
    score += riskScores[item.riskLevel] || 0;

    // Status impact
    const statusScores = {
      pending: -10,
      in_progress: 0,
      approved: 15,
      rejected: -25
    };
    score += statusScores[item.status] || 0;

    // Priority impact
    const priorityScores = {
      low: 5,
      medium: 0,
      high: -5,
      critical: -10
    };
    score += priorityScores[item.priority] || 0;

    // Deadline proximity impact
    if (item.deadline) {
      const deadline = new Date(item.deadline);
      const now = new Date();
      const daysUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline < 0) {
        score -= Math.min(30, Math.abs(daysUntilDeadline)); // Overdue penalty
      } else if (daysUntilDeadline <= 7) {
        score -= 10; // Urgent penalty
      } else if (daysUntilDeadline <= 30) {
        score += 5; // Good planning bonus
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get compliance level recommendation
   */
  static getComplianceLevelRecommendation(item: ComplianceItem): ComplianceLevel {
    const score = this.calculateComplianceScore(item);
    
    if (score >= 90) return 'full';
    if (score >= 75) return 'substantial';
    if (score >= 50) return 'partial';
    return 'minimal';
  }

  /**
   * Generate compliance checklist based on type
   */
  static generateChecklist(item: ComplianceItem): string[] {
    const baseChecklist = [
      'Title and description documented',
      'Responsible person assigned',
      'Risk level assessed',
      'Deadline established'
    ];

    const typeSpecificChecklist = {
      regulatory: [
        'Regulatory requirements identified',
        'Compliance framework referenced',
        'Legal review completed',
        'Regulatory approvals obtained'
      ],
      insurance: [
        'Insurance policy verified',
        'Coverage amount confirmed',
        'Renewal date tracked',
        'Claims history reviewed'
      ],
      bank_guarantee: [
        'Guarantee amount confirmed',
        'Bank approval obtained',
        'Guarantee terms documented',
        'Expiration date monitored'
      ],
      technical: [
        'Technical standards identified',
        'Implementation plan documented',
        'Testing requirements defined',
        'Technical review completed'
      ],
      environmental: [
        'Environmental impact assessed',
        'Mitigation measures planned',
        'Environmental permits obtained',
        'Compliance monitoring established'
      ]
    };

    return [
      ...baseChecklist,
      ...(typeSpecificChecklist[item.type] || [])
    ];
  }

  /**
   * Get validation rules for a specific type
   */
  static getRulesByType(type?: ComplianceType): ComplianceValidationRule[] {
    if (!type) return this.VALIDATION_RULES;
    return this.VALIDATION_RULES.filter(rule => rule.type === type);
  }

  /**
   * Get business rules by priority
   */
  static getBusinessRulesByPriority(priority?: 'high' | 'medium' | 'low'): ComplianceBusinessRule[] {
    if (!priority) return this.BUSINESS_RULES;
    return this.BUSINESS_RULES.filter(rule => rule.priority === priority);
  }
}
