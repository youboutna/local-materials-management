/**
 * Interface for Construction Phase Repository
 * Following hexagonal architecture principles
 */

import { ConstructionPhase } from '@/domain/entities/Phase';

export interface IConstructionPhaseRepository {
  // CRUD operations
  create(phase: Omit<ConstructionPhase, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConstructionPhase>;
  findById(id: string): Promise<ConstructionPhase | null>;
  findAll(): Promise<ConstructionPhase[]>;
  update(id: string, updates: Partial<ConstructionPhase>): Promise<ConstructionPhase>;
  delete(id: string): Promise<void>;
  
  // Project-specific operations
  findByProjectId(projectId: string): Promise<ConstructionPhase[]>;
  
  // Construction-specific operations
  findByType(type: string): Promise<ConstructionPhase[]>;
  findByStage(stage: string): Promise<ConstructionPhase[]>;
  findActivePhases(): Promise<ConstructionPhase[]>;
  findCompletedPhases(): Promise<ConstructionPhase[]>;
  
  // Progress and status operations
  updateProgress(id: string, progress: number): Promise<ConstructionPhase>;
  updateStatus(id: string, status: string): Promise<ConstructionPhase>;
  
  // Search and filtering
  search(criteria: {
    projectId?: string;
    type?: string;
    stage?: string;
    status?: string;
  }): Promise<ConstructionPhase[]>;
  
  // Analytics and reporting
  getProgressSummary(projectId: string): Promise<{
    totalPhases: number;
    completedPhases: number;
    inProgressPhases: number;
    averageProgress: number;
  }>;
  
  // Validation
  exists(id: string): Promise<boolean>;
  validatePhase(phase: ConstructionPhase): Promise<boolean>;
}
