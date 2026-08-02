/**
 * Project Repository Interface
 * Defines contract for project data access
 * Can be implemented by Supabase, Java API, Prisma, PostGIS adapters
 */

import { Project } from '../entities/Project';

export interface ProjectSummary {
  id: string;
  title: string;
  status: string;
  progress: number;
  phasesCount: number;
  tasksCount: number;
  inspectionsCount: number;
  paymentsCount: number;
}

export interface ProjectWithRelatedData {
  project: Project | null;
  phases: any[];
  tasks: any[];
  risks: any[];
  inspections: any[];
  payments: any[];
  documents: any[];
  bankGuarantees: any[];
  insuranceCertificates: any[];
  /** Sous-objets additionnels hydratés pour le détail / l'édition */
  milestones?: any[];
  stakeholders?: any[];
  resources?: any[];
  contacts?: any[];
  materials?: any[];
}


export interface IProjectRepository {
  // ============= CRUD Operations =============
  
  /**
   * Find project by ID
   */
  findById(id: string): Promise<Project | null>;

  /**
   * Find all projects
   */
  findAll(): Promise<Project[]>;

  /**
   * Create new project
   */
  create(project: Partial<Project>): Promise<Project>;

  /**
   * Update existing project
   */
  update(id: string, updates: Partial<Project>): Promise<Project>;

  assignOrganizationToAll(organizationId: string): Promise<number>;

  /**
   * Delete project
   */
  delete(id: string): Promise<void>;

  // ============= Specialized Queries =============

  /**
   * Find project with minimal data for breadcrumb
   */
  findForBreadcrumb(id: string): Promise<{ id: string; title: string } | null>;

  /**
   * Find active projects
   */
  findActiveProjects(): Promise<Project[]>;

  /**
   * Find overdue projects
   */
  findOverdueProjects(): Promise<Project[]>;

  /**
   * Get project with all related data
   */
  findWithRelatedData(id: string): Promise<ProjectWithRelatedData>;

  /**
   * Get project summary (counts only)
   */
  findSummary(id: string): Promise<ProjectSummary | null>;

  // ============= Progress Management =============

  /**
   * Update project progress
   */
  updateProgress(id: string, progress: number): Promise<void>;

  /**
   * Synchronize project progress from phases/tasks
   */
  synchronizeProgress(id: string): Promise<number>;
}
