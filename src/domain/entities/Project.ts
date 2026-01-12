/**
 * Project Domain Entity
 * Contains business logic and validation rules
 */

export type ProjectStatus = 'en attente' | 'en cours' | 'terminé' | 'en retard' | 'suspendu';

export interface ProjectCoordinates {
  latitude: number;
  longitude: number;
}

export class Project {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly status: ProjectStatus,
    public readonly progress: number,
    public readonly budget: number,
    public readonly startDate: Date | null,
    public readonly endDate: Date | null,
    public readonly location?: string,
    public readonly coordinates?: ProjectCoordinates,
    public readonly teamSize?: number,
    public readonly thumbnail?: string,
    public readonly financingSource?: string,
    public readonly mainContractor?: string
  ) {}

  // ============= Business Logic =============

  isActive(): boolean {
    return this.status === 'en cours';
  }

  isCompleted(): boolean {
    return this.status === 'terminé';
  }

  isOverdue(): boolean {
    if (!this.endDate) return false;
    return new Date() > this.endDate && !this.isCompleted();
  }

  isOnSchedule(): boolean {
    if (!this.startDate || !this.endDate) return true;
    
    const now = new Date();
    const totalDuration = this.endDate.getTime() - this.startDate.getTime();
    const elapsed = now.getTime() - this.startDate.getTime();
    const expectedProgress = (elapsed / totalDuration) * 100;
    
    // Allow 10% variance
    return this.progress >= expectedProgress - 10;
  }

  getDaysRemaining(): number {
    if (!this.endDate) return 0;
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getProgressStatus(): 'on-track' | 'at-risk' | 'behind' | 'completed' {
    if (this.isCompleted()) return 'completed';
    if (this.isOverdue()) return 'behind';
    if (this.isOnSchedule()) return 'on-track';
    return 'at-risk';
  }

  getBudgetUtilization(actualCost: number): number {
    if (this.budget <= 0) return 0;
    return (actualCost / this.budget) * 100;
  }

  // ============= Factory Methods =============

  static create(data: Partial<Project>): Project {
    return new Project(
      data.id || crypto.randomUUID(),
      data.title || '',
      data.description || '',
      data.status || 'en attente',
      data.progress || 0,
      data.budget || 0,
      data.startDate || null,
      data.endDate || null,
      data.location,
      data.coordinates,
      data.teamSize,
      data.thumbnail,
      data.financingSource,
      data.mainContractor
    );
  }

  // ============= Serialization =============

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      progress: this.progress,
      budget: this.budget,
      startDate: this.startDate?.toISOString() || null,
      endDate: this.endDate?.toISOString() || null,
      location: this.location,
      coordinates: this.coordinates,
      teamSize: this.teamSize,
      thumbnail: this.thumbnail,
      financingSource: this.financingSource,
      mainContractor: this.mainContractor,
    };
  }
}
