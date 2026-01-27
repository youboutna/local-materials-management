/**
 * Phase Domain Entity
 * Represents a construction phase with business logic
 * Based on project_phases Supabase table
 * Following hexagonal architecture - direct entity relationships
 */

import { Material } from './Material';
import { Supplier } from './Supplier';
import { Milestone } from './Milestone';
import { Inspection } from './Inspection';
import { Document } from './Document';
import { Employee } from './Employee';

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed';
export type PhaseType = 'preparation' | 'execution' | 'completion' | 'validation';

export interface PhaseStep {
  id: string;
  name: string;
  description: string;
  status: PhaseStatus;
  progress: number;
  orderIndex: number;
  tasks: PhaseTask[];
  estimatedDurationDays?: number;
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
  startDate?: Date;
  endDate?: Date;
  inspections?: Inspection[];
  documents?: Document[];
}

export interface PhaseTask {
  id: string;
  name: string;
  description: string;
  status: PhaseStatus;
  progress: number;
  orderIndex: number;
  assignedTo?: Employee[];
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
  estimatedDurationDays?: number;
  actualDurationDays?: number;
  startDate?: Date;
  endDate?: Date;
  dependencies?: PhaseTask[];
  materials?: Material[];
  documents?: Document[];
  inspections?: Inspection[];
}

export interface PhaseResources {
  employees: Employee[];
  contractors: Supplier[];
  totalRequired: number;
  totalAssigned: number;
  skills: string[];
  dailyCost: number;
}

export class Phase {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly phaseName: string,
    public readonly description: string | null,
    public readonly status: PhaseStatus,
    public readonly progress: number | null,
    public readonly orderIndex: number | null,
    public readonly startDate: Date | null,
    public readonly endDate: Date | null,
    public readonly estimatedCost: number | null,
    public readonly actualCost: number | null,
    public readonly estimatedDuration: number | null,
    public readonly constructionPhase: string | null,
    public readonly constructionStage: string | null,
    public readonly phaseType: PhaseType,
    public readonly location: string | null,
    public readonly customPhaseData: Record<string, unknown> | null,
    public readonly dependencies: Phase[], // Direct entity relationship
    public readonly milestones: Milestone[], // Direct entity relationship
    public readonly materials: Material[], // Direct entity relationship
    public readonly suppliers: Supplier[], // Direct entity relationship
    public readonly humanResources: PhaseResources | null,
    public readonly steps: PhaseStep[], // Direct entity relationship
    public readonly notes: string | null,
    public readonly weight: number | null,
    public readonly createdBy: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  // ============= Business Logic =============

  isActive(): boolean {
    return this.status === 'in_progress';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isBlocked(): boolean {
    return this.status === 'blocked';
  }

  canStart(): boolean {
    return this.status === 'pending';
  }

  isCritical(): boolean {
    return this.status === 'blocked' || this.status === 'delayed';
  }

  hasSteps(): boolean {
    return this.steps.length > 0;
  }

  getCompletedStepsCount(): number {
    return this.steps.filter(s => s.status === 'completed').length;
  }

  getStepsProgress(): number {
    if (this.steps.length === 0) return this.progress;
    return (this.getCompletedStepsCount() / this.steps.length) * 100;
  }

  getBudgetVariance(): number {
    return (this.estimatedCost || 0) - (this.actualCost || 0);
  }

  isBudgetOverrun(): boolean {
    if (this.actualCost === null || this.estimatedCost === null) {
      return false;
    }
    // Explicit non-null assertion for TypeScript
    return this.actualCost! > this.estimatedCost!;
  }

  getDaysRemaining(): number {
    if (!this.endDate) return 0;
    const now = new Date();
    const diffTime = this.endDate!.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  requiresInspection(): boolean {
    return this.steps.some(step => 
      step.requiresInspection || 
      step.tasks.some(task => task.requiresInspection)
    );
  }

  requiresEngineerApproval(): boolean {
    return this.steps.some(step => 
      step.requiresEngineerApproval || 
      step.tasks.some(task => task.requiresEngineerApproval)
    );
  }

  // ============= Factory Methods =============

  static create(data: Partial<Phase>): Phase {
    return new Phase(
      data.id || crypto.randomUUID(),
      data.projectId || '',
      data.phaseName || data.name || '',
      data.description || null,
      data.status || 'pending',
      data.progress || 0,
      data.orderIndex || 0,
      data.startDate || null,
      data.endDate || null,
      data.estimatedCost || null,
      data.actualCost || null,
      data.estimatedDuration || null,
      data.constructionPhase || null,
      data.constructionStage || null,
      data.phaseType || 'execution',
      data.location || null,
      data.customPhaseData || null,
      data.dependencies || [],
      data.milestones || [],
      data.materials || [],
      data.suppliers || [],
      data.humanResources || null,
      data.steps || [],
      data.notes || null,
      data.weight || null,
      data.createdBy || null,
      data.createdAt || new Date().toISOString(),
      data.updatedAt || new Date().toISOString()
    );
  }

  // ============= Immutable Updates =============

  withStatus(status: PhaseStatus): Phase {
    return new Phase(
      this.id,
      this.projectId,
      this.phaseName,
      this.description,
      status,
      this.progress,
      this.orderIndex,
      this.startDate,
      this.endDate,
      this.estimatedCost,
      this.actualCost,
      this.estimatedDuration,
      this.constructionPhase,
      this.constructionStage,
      this.phaseType,
      this.location,
      this.customPhaseData,
      this.dependencies,
      this.milestones,
      this.materials,
      this.suppliers,
      this.humanResources,
      this.steps,
      this.notes,
      this.weight,
      this.createdBy,
      this.createdAt,
      this.updatedAt
    );
  }

  withProgress(progress: number): Phase {
    return new Phase(
      this.id,
      this.projectId,
      this.phaseName,
      this.description,
      this.status,
      Math.max(0, Math.min(100, progress)),
      this.orderIndex,
      this.startDate,
      this.endDate,
      this.estimatedCost,
      this.actualCost,
      this.estimatedDuration,
      this.constructionPhase,
      this.constructionStage,
      this.phaseType,
      this.location,
      this.customPhaseData,
      this.dependencies,
      this.milestones,
      this.materials,
      this.suppliers,
      this.humanResources,
      this.steps,
      this.notes,
      this.weight,
      this.createdBy,
      this.createdAt,
      this.updatedAt
    );
  }

  // ============= Serialization =============

  toJSON() {
    return {
      id: this.id,
      projectId: this.projectId,
      phaseName: this.phaseName,
      description: this.description,
      status: this.status,
      progress: this.progress,
      orderIndex: this.orderIndex,
      startDate: this.startDate?.toISOString() || null,
      endDate: this.endDate?.toISOString() || null,
      estimatedCost: this.estimatedCost,
      actualCost: this.actualCost,
      estimatedDuration: this.estimatedDuration,
      constructionPhase: this.constructionPhase,
      constructionStage: this.constructionStage,
      phaseType: this.phaseType,
      location: this.location,
      customPhaseData: this.customPhaseData,
      dependencies: this.dependencies,
      milestones: this.milestones,
      materials: this.materials,
      suppliers: this.suppliers,
      humanResources: this.humanResources,
      steps: this.steps,
      notes: this.notes,
      weight: this.weight,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
