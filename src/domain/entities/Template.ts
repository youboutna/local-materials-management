/**
 * Template Domain Entity
 * Pure business logic for project templates with code-based lookup
 * Following hexagonal architecture principles
 */

import { UserRole } from './UserRole';

import { MultiLanguageLabel } from '@/config/referentials';

// ✅ Rule #4: Domain entities can have complex objects and collections
interface ProjectPhaseData {
  code: string;
  name?: string;
  status?: string;
}

export interface TemplateMetadata {
  requiresEngineeringConsultant: boolean;
  requiresDonorApproval: boolean;
  requiresMinistryApproval: boolean;
  paymentWorkflow: 'standard' | 'simplified' | 'custom';
  procurementTypes: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ProjectTemplate {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: MultiLanguageLabel,
    public readonly description: MultiLanguageLabel,
    public readonly phases: TemplatePhase[],
    public readonly metadata: TemplateMetadata
  ) {}

  // ✅ Business logic methods
  getPhaseByCode(phaseCode: string): TemplatePhase | undefined {
    return this.phases.find(phase => phase.code === phaseCode);
  }

  getTotalEstimatedDuration(): number {
    return this.phases.reduce((total, phase) => 
      total + phase.getEstimatedDuration(), 0
    );
  }

  validateProjectStructure(projectData: Record<string, unknown>): ValidationResult {
    const validation: ValidationResult = { isValid: true, errors: [], warnings: [] };
    
    // Validate required phases
    this.phases.forEach(phase => {
      const phases = projectData.phases as ProjectPhaseData[] || [];
      if (phase.isRequired && !phases.some((p: ProjectPhaseData) => p.code === phase.code)) {
        validation.isValid = false;
        validation.errors.push(`Required phase ${phase.code} is missing`);
      }
    });

    // Validate engineering consultant requirement
    if (this.metadata.requiresEngineeringConsultant && !projectData.engineering_consultant) {
      validation.isValid = false;
      validation.errors.push('Engineering consultant required for this template');
    }

    // Validate donor approval requirement
    if (this.metadata.requiresDonorApproval && !projectData.donor_organization) {
      validation.warnings.push('Donor approval may be required for this template');
    }

    return validation;
  }

  getMilestones(): TemplateMilestone[] {
    return this.phases.flatMap(phase => phase.getMilestones());
  }

  getRequiredDocuments(): string[] {
    const documents = new Set<string>();
    this.phases.forEach(phase => {
      phase.steps.forEach(step => {
        step.requiredDocuments?.forEach(doc => documents.add(doc));
      });
    });
    return Array.from(documents);
  }

  getRequiredRoles(): UserRole[] {
    const roles = new Set<UserRole>();
    this.phases.forEach(phase => {
      phase.steps.forEach(step => {
        step.requiredRoles?.forEach(role => roles.add(role));
      });
    });
    return Array.from(roles);
  }

  canBeUsedByUser(userRole: UserRole): boolean {
    const requiredRoles = this.getRequiredRoles();
    return requiredRoles.length === 0 || requiredRoles.includes(userRole);
  }
}

export class TemplatePhase {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly label: MultiLanguageLabel,
    public readonly steps: TemplateStep[],
    public readonly order: number,
    public readonly isRequired: boolean = true,
    public readonly description?: MultiLanguageLabel,
    public readonly dependencies?: string[] // Phase dependencies
  ) {}

  getEstimatedDuration(): number {
    return this.steps.reduce((total, step) => 
      total + step.getEstimatedDuration(), 0
    );
  }

  getStepByCode(stepCode: string): TemplateStep | undefined {
    return this.steps.find(step => step.code === stepCode);
  }

  getMilestones(): TemplateMilestone[] {
    return this.steps.flatMap(step => step.getMilestones());
  }

  canStart(previousPhases: TemplatePhase[]): boolean {
    if (!this.dependencies) return true;
    
    return this.dependencies.every(depCode => 
      previousPhases.some(phase => phase.code === depCode)
    );
  }

  hasInspections(): boolean {
    return this.steps.some(step => step.requiresInspection());
  }

  hasEngineerApprovals(): boolean {
    return this.steps.some(step => step.requiresEngineerApproval());
  }

  getComplexity(): 'low' | 'medium' | 'high' {
    const totalDuration = this.getEstimatedDuration();
    const inspectionCount = this.steps.filter(step => step.requiresInspection()).length;
    
    if (totalDuration <= 30 && inspectionCount <= 2) return 'low';
    if (totalDuration <= 90 && inspectionCount <= 5) return 'medium';
    return 'high';
  }
}

export class TemplateStep {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly label: MultiLanguageLabel,
    public readonly tasks: TemplateTask[],
    public readonly order: number,
    public readonly requiredDocuments?: string[],
    public readonly requiredRoles?: UserRole[]
  ) {}

  getEstimatedDuration(): number {
    return this.tasks.reduce((total, task) => 
      total + (task.estimatedDurationDays || 0), 0
    );
  }

  getTaskByCode(taskCode: string): TemplateTask | undefined {
    return this.tasks.find(task => task.code === taskCode);
  }

  getMilestones(): TemplateMilestone[] {
    return this.tasks.flatMap(task => task.getMilestones());
  }

  requiresInspection(): boolean {
    return this.tasks.some(task => task.requiresInspection);
  }

  requiresEngineerApproval(): boolean {
    return this.tasks.some(task => task.requiresEngineerApproval);
  }

  canBeCompletedBy(role: UserRole): boolean {
    if (this.requiredRoles && !this.requiredRoles.includes(role)) {
      return false;
    }
    return this.tasks.every(task => task.canBeCompletedBy(role));
  }

  getCriticalPath(): TemplateTask[] {
    return this.tasks.filter(task => task.isCritical);
  }

  getDeliverables(): string[] {
    const deliverables = new Set<string>();
    this.tasks.forEach(task => {
      task.deliverables?.forEach(deliverable => deliverables.add(deliverable));
    });
    return Array.from(deliverables);
  }
}

export class TemplateTask {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly label: MultiLanguageLabel,
    public readonly description?: MultiLanguageLabel,
    public readonly estimatedDurationDays?: number,
    public readonly requiresInspection: boolean = false,
    public readonly requiresEngineerApproval: boolean = false,
    public readonly milestones?: TemplateMilestone[],
    public readonly deliverables?: string[],
    public readonly isCritical: boolean = false,
    public readonly dependencies?: string[] // Task dependencies
  ) {}

  getMilestones(): TemplateMilestone[] {
    return this.milestones || [];
  }

  canBeCompletedBy(role: UserRole): boolean {
    if (this.requiresEngineerApproval && role.level < UserRole.engineeringConsultant().level) {
      return false;
    }
    return true;
  }

  getComplexity(): 'low' | 'medium' | 'high' {
    const duration = this.estimatedDurationDays || 0;
    if (duration <= 7) return 'low';
    if (duration <= 21) return 'medium';
    return 'high';
  }

  canStart(previousTasks: TemplateTask[]): boolean {
    if (!this.dependencies) return true;
    
    return this.dependencies.every(depCode => 
      previousTasks.some(task => task.code === depCode)
    );
  }

  getRiskLevel(): 'low' | 'medium' | 'high' {
    let risk = 0;
    
    if (this.requiresInspection) risk += 1;
    if (this.requiresEngineerApproval) risk += 1;
    if (this.isCritical) risk += 1;
    if ((this.estimatedDurationDays || 0) > 30) risk += 1;
    
    if (risk <= 1) return 'low';
    if (risk <= 2) return 'medium';
    return 'high';
  }
}

export class TemplateMilestone {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly label: MultiLanguageLabel,
    public readonly description?: MultiLanguageLabel,
    public readonly isRequired: boolean = true,
    public readonly percentage?: number,
    public readonly deliverables?: string[]
  ) {}

  isCompleted(projectProgress: number): boolean {
    if (!this.percentage) return false;
    return projectProgress >= this.percentage;
  }

  getProgressStatus(projectProgress: number): 'pending' | 'in-progress' | 'completed' {
    if (!this.percentage) return 'pending';
    
    if (projectProgress >= this.percentage) return 'completed';
    if (projectProgress >= this.percentage * 0.8) return 'in-progress';
    return 'pending';
  }

  getRemainingProgress(projectProgress: number): number {
    if (!this.percentage) return 0;
    return Math.max(0, this.percentage - projectProgress);
  }
}
