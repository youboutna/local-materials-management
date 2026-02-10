/**
 * Phase Domain Entity
 * Represents a construction phase with business logic
 * Following hexagonal architecture principles
 * Based on project_phases Supabase table
 */

import { Material } from './Material';
import { Supplier } from './Supplier';
import { Employee } from './Employee';
import { Milestone } from './Milestone';
import { Inspection } from './Inspection';
import { Document } from './Document';

// Types locaux pour éviter les dépendances cycliques
export interface PhaseStep {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  estimated_duration_days?: number;
  actual_duration_days?: number;
  start_date?: string;
  end_date?: string;
  order_index: number;
  tasks: PhaseTask[];
}

export interface PhaseTask {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  estimated_duration_days?: number;
  actual_duration_days?: number;
  start_date?: string;
  end_date?: string;
  assigned_to?: string[];
  dependencies?: string[];
  weight?: number;
  order_index: number;
}

// Types depuis les DTOs pour centralisation
export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed' | 'not_started';
export type PhaseType = 'preparation' | 'execution' | 'completion' | 'validation' | 
  'foundation' | 'structural' | 'excavation' | 'demolition' | 'finishing' | 
  'electrical' | 'plumbing' | 'hvac' | 'roofing' | 'exterior' | 'interior' | 'landscaping';
export type PhasePriority = 'low' | 'medium' | 'high' | 'urgent';

// Types construction depuis les DTOs pour éviter la redéfinition
export type ConstructionPhase = 'pre_construction' | 'site_preparation' | 'foundation' | 'framing' | 'structural_work' | 'finishing' | 'post_construction' | 'handover';
export type ConstructionStage = 'planning_design' | 'permits_approvals' | 'site_clearing' | 'excavation' | 'foundation_work' | 'structural_framing' | 'roofing' | 'electrical_plumbing' | 'interior_finishing' | 'exterior_finishing' | 'final_inspection' | 'handover_complete';

export interface PhaseResources {
  employees: Employee[];
  contractors: Supplier[];
  totalRequired: number;
  totalAssigned: number;
  skills: string[];
  dailyCost: number;
}

export interface IPhase {
  // Core identification
  readonly id: string;
  readonly projectId: string;
  readonly phaseName: string;
  readonly description: string | null;
  
  // Classification
  readonly status: string; // From Supabase: string (not enum)
  readonly progress: number | null;
  readonly orderIndex: number | null;
  readonly phaseType: string; // From Supabase: phase_type
  
  // Timeline
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly estimatedDuration: number | null;
  readonly actualDuration: number | null;
  
  // Financial
  readonly estimatedCost: number | null;
  readonly actualCost: number | null;
  
  // Construction fields (from Supabase)
  readonly constructionPhase: string | null;
  readonly constructionStage: string | null;
  
  // Dependencies and milestones
  readonly dependencies: string[] | null; // From Supabase: Json | null
  readonly milestones: string[] | null; // From Supabase: Json | null
  
  // Resources
  readonly humanResources: {
    employees: Employee[];
    contractors: Supplier[];
    totalRequired: number;
    totalAssigned: number;
    skills: string[];
    dailyCost: number;
  } | null; // Json Supabase: Json | null
  readonly materials: Material[] | null; // From Supabase: Json | null
  readonly suppliers: Supplier[] | null; // From Supabase: Json | null
  readonly location: string | null;
  
  // Additional fields (from Supabase)
  readonly customPhaseData: Record<string, unknown> | null;
  readonly notes: string | null;
  readonly weight: number | null;
  readonly createdBy: string | null;
  
  // Metadata
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class Phase implements IPhase {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly phaseName: string,
    public readonly description: string | null,
    public readonly status: string, // From Supabase: string (not enum)
    public readonly progress: number | null,
    public readonly orderIndex: number | null,
    public readonly phaseType: string, // From Supabase: phase_type
    public readonly startDate: string | null,
    public readonly endDate: string | null,
    public readonly estimatedDuration: number | null,
    public readonly actualDuration: number | null,
    public readonly estimatedCost: number | null,
    public readonly actualCost: number | null,
    public readonly constructionPhase: string | null, // From Supabase
    public readonly constructionStage: string | null, // From Supabase
    public readonly dependencies: string[] | null, // From Supabase: Json | null
    public readonly milestones: string[] | null, // From Supabase: Json | null
    public readonly humanResources: {
      employees: Employee[];
      contractors: Supplier[];
      totalRequired: number;
      totalAssigned: number;
      skills: string[];
      dailyCost: number;
    } | null, // From Supabase: Json | null
    public readonly materials: Material[] | null, // From Supabase: Json | null
    public readonly suppliers: Supplier[] | null, // From Supabase: Json | null
    public readonly location: string | null,
    public readonly customPhaseData: Record<string, unknown> | null,
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

  // Construction-specific business logic
  canStartConstruction(): boolean {
    return this.status === 'not_started' && (this.materials ? this.materials.length > 0 : false);
  }

  canCompleteConstruction(): boolean {
    return (this.progress || 0) >= 100 && (this.materials ? this.materials.length > 0 : false);
  }

  updateConstructionProgress(newProgress: number): Phase {
    if (newProgress < 0 || newProgress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    
    let newStatus = this.status;
    if (newProgress >= 100) {
      newStatus = 'completed';
    } else if (newProgress > 0) {
      newStatus = 'in_progress';
    }
    
    return this.withStatus(newStatus).withProgress(newProgress);
  }

  calculateActualCost(): number {
    const materialsCost = this.materials?.reduce((total, material) => 
      total + (material.pricePerUnit * material.availableQuantity), 0) || 0;
    
    const humanResourcesCost = this.humanResources ? 
      this.humanResources.employees.reduce((total, employee) => 
        total + (employee.salary || 0), 0) : 0;
    
    return materialsCost + humanResourcesCost;
  }

  isOverBudget(): boolean {
    return this.estimatedCost ? (this.actualCost || 0) > this.estimatedCost : false;
  }

  getDurationVariance(): number {
    return this.actualDuration ? this.actualDuration - (this.estimatedDuration || 0) : 0;
  }

  // Note: hasSteps() and getCompletedStepsCount() removed as 'steps' no longer exists in interface
  // Steps are now handled as separate entities with their own lifecycle

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
    const diffTime = new Date(this.endDate).getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Note: requiresInspection() and requiresEngineerApproval() removed as 'steps' no longer exists
  // These methods would need to be implemented at the service level with proper data access

  // ============= Validation Methods =============

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.phaseName || this.phaseName.trim().length === 0) {
      errors.push('Phase name is required');
    }
    
    if (this.estimatedDuration !== null && this.estimatedDuration <= 0) {
      errors.push('Estimated duration must be greater than 0');
    }
    
    if (this.progress !== null && (this.progress < 0 || this.progress > 100)) {
      errors.push('Progress must be between 0 and 100');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ============= Factory Methods =============

  static create(data: Partial<Phase> & { name?: string }): Phase {
    return new Phase(
      data.id || crypto.randomUUID(),
      data.projectId || '',
      data.phaseName || data.name || '',
      data.description || null,
      data.status || 'pending',
      data.progress ?? 0,
      data.orderIndex ?? 0,
      data.phaseType || '',
      data.startDate || null,
      data.endDate || null,
      data.estimatedDuration || null,
      data.actualDuration || null,
      data.estimatedCost || null,
      data.actualCost || null,
      data.constructionPhase || null,
      data.constructionStage || null,
      data.dependencies || null,
      data.milestones || null,
      data.humanResources || null,
      data.materials || null,
      data.suppliers || null,
      data.location || null,
      data.customPhaseData || null,
      data.notes || null,
      data.weight || null,
      data.createdBy || null,
      data.createdAt || new Date().toISOString(),
      data.updatedAt || new Date().toISOString()
    );
  }

  // ============= Immutable Updates =============

  withStatus(status: string): Phase {
    return new Phase(
      this.id,
      this.projectId,
      this.phaseName,
      this.description,
      status,
      this.progress,
      this.orderIndex,
      this.phaseType,
      this.startDate,
      this.endDate,
      this.estimatedDuration,
      this.actualDuration,
      this.estimatedCost,
      this.actualCost,
      this.constructionPhase,
      this.constructionStage,
      this.dependencies,
      this.milestones,
      this.humanResources,
      this.materials,
      this.suppliers,
      this.location,
      this.customPhaseData,
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
      this.phaseType,
      this.startDate,
      this.endDate,
      this.estimatedDuration,
      this.actualDuration,
      this.estimatedCost,
      this.actualCost,
      this.constructionPhase,
      this.constructionStage,
      this.dependencies,
      this.milestones,
      this.humanResources,
      this.materials,
      this.suppliers,
      this.location,
      this.customPhaseData,
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
      phaseType: this.phaseType,
      startDate: this.startDate,
      endDate: this.endDate,
      estimatedDuration: this.estimatedDuration,
      actualDuration: this.actualDuration,
      estimatedCost: this.estimatedCost,
      actualCost: this.actualCost,
      constructionPhase: this.constructionPhase,
      constructionStage: this.constructionStage,
      dependencies: this.dependencies,
      milestones: this.milestones,
      humanResources: this.humanResources,
      materials: this.materials,
      suppliers: this.suppliers,
      location: this.location,
      customPhaseData: this.customPhaseData,
      notes: this.notes,
      weight: this.weight,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
