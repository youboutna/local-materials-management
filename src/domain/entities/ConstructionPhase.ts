/**
 * Construction Phase Domain Entity
 * Represents a construction phase with business logic
 * Following hexagonal architecture principles
 */

import { Material } from './Material';
import { Employee } from './Employee';
import { Supplier } from './Supplier';
import { Milestone } from './Milestone';
import { PhaseStepDTO, PhaseTaskDTO } from '@/types/phase-dto';

export type ConstructionPhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'blocked';

export interface ConstructionPhaseEntity {
  // Core identification
  readonly id: string;
  readonly projectId: string;
  
  // Basic information
  name: string;
  description?: string;
  type: string; // ConstructionPhase type from DTO
  stage?: string; // ConstructionStage from DTO
  
  // Status and progress
  status: ConstructionPhaseStatus;
  progress: number; // 0-100
  
  // Timeline
  startDate?: Date;
  endDate?: Date;
  estimatedDuration: number; // in days
  actualDuration?: number; // in days
  
  // Financial
  budget?: number;
  actualCost?: number;
  
  // Resources
  materials: Material[];
  humanResources: Employee[];
  suppliers: Supplier[];
  location?: string;
  notes?: string;
  
  // Relationships
  milestones?: Milestone[];
  steps?: PhaseStepDTO[]; // Steps from referential with nested tasks
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export class ConstructionPhase {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public name: string,
    public estimatedDuration: number,
    public status: ConstructionPhaseStatus = 'not_started',
    public description?: string,
    public type?: string,
    public stage?: string,
    public progress: number = 0,
    public startDate?: Date,
    public endDate?: Date,
    public actualDuration?: number,
    public budget?: number,
    public actualCost?: number,
    public materials: Material[] = [],
    public humanResources: Employee[] = [],
    public suppliers: Supplier[] = [],
    public location?: string,
    public notes?: string,
    public milestones: Milestone[] = [],
    public steps: PhaseStepDTO[] = [], // Steps from referential with nested tasks
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  // Business logic methods
  canStart(): boolean {
    return this.status === 'not_started' && this.materials.length > 0;
  }

  canComplete(): boolean {
    return this.progress >= 100 && this.materials.length > 0;
  }

  updateProgress(newProgress: number): void {
    if (newProgress < 0 || newProgress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    this.progress = newProgress;
    this.status = newProgress >= 100 ? 'completed' : 'in_progress';
    this.updatedAt = new Date();
  }

  addMaterial(material: Material): void {
    if (!this.materials.find(m => m.id === material.id)) {
      this.materials.push(material);
      this.updatedAt = new Date();
    }
  }

  removeMaterial(materialId: string): void {
    this.materials = this.materials.filter(m => m.id !== materialId);
    this.updatedAt = new Date();
  }

  assignEmployee(employee: Employee): void {
    if (!this.humanResources.find(e => e.id === employee.id)) {
      this.humanResources.push(employee);
      this.updatedAt = new Date();
    }
  }

  calculateActualCost(): number {
    return this.materials.reduce((total, material) => total + (material.unitCost * material.quantity), 0) +
           this.humanResources.reduce((total, employee) => total + (employee.dailyRate * this.estimatedDuration), 0);
  }

  isOverBudget(): boolean {
    return this.budget ? this.actualCost > this.budget : false;
  }

  getDurationVariance(): number {
    return this.actualDuration ? this.actualDuration - this.estimatedDuration : 0;
  }

  // Validation methods
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Phase name is required');
    }
    
    if (this.estimatedDuration <= 0) {
      errors.push('Estimated duration must be greater than 0');
    }
    
    if (this.progress < 0 || this.progress > 100) {
      errors.push('Progress must be between 0 and 100');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Static factory methods
  static fromDTO(dto: any): ConstructionPhase {
    return new ConstructionPhase(
      dto.id,
      dto.projectId,
      dto.name,
      dto.estimatedDuration || 30,
      dto.status || 'not_started',
      dto.description,
      dto.type,
      dto.stage,
      dto.progress || 0,
      dto.startDate ? new Date(dto.startDate) : undefined,
      dto.endDate ? new Date(dto.endDate) : undefined,
      dto.actualDuration,
      dto.budget,
      dto.actualCost,
      dto.materials || [],
      dto.humanResources || [],
      dto.suppliers || [],
      dto.location,
      dto.notes,
      dto.milestones || [],
      dto.steps || [], // Steps from referential
      dto.createdAt ? new Date(dto.createdAt) : new Date(),
      dto.updatedAt ? new Date(dto.updatedAt) : new Date()
    );
  }

  toDTO(): any {
    return {
      id: this.id,
      projectId: this.projectId,
      name: this.name,
      description: this.description,
      type: this.type,
      stage: this.stage,
      status: this.status,
      progress: this.progress,
      startDate: this.startDate?.toISOString(),
      endDate: this.endDate?.toISOString(),
      estimatedDuration: this.estimatedDuration,
      actualDuration: this.actualDuration,
      budget: this.budget,
      actualCost: this.actualCost,
      materials: this.materials,
      humanResources: this.humanResources,
      suppliers: this.suppliers,
      location: this.location,
      notes: this.notes,
      milestones: this.milestones,
      steps: this.steps, // Include steps from referential
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}
