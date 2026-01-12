/**
 * Repository Factory - Hexagonal Architecture
 * Centralized factory for creating repository implementations
 * Provides dependency injection and adapter instantiation
 */

import { 
  IProjectRepository, 
  IPhaseRepository, 
  IHierarchyRepository,
  IInspectionRepository,
  IPaymentRepository,
  ITaskRepository,
  IMaterialRepository,
  IEmployeeRepository,
  IRiskRepository,
  ITenderRepository,
  ISupplierRepository,
  IDocumentRepository
} from '@/domain/repositories';

import {
  SupabaseProjectAdapter,
  SupabasePhaseAdapter,
  SupabaseHierarchyAdapter,
  SupabaseInspectionAdapter,
  SupabasePaymentAdapter,
  SupabaseTaskAdapter,
  SupabaseMaterialAdapter,
  SupabaseEmployeeAdapter,
  SupabaseRiskAdapter,
  SupabaseTenderAdapter,
  SupabaseSupplierAdapter,
  SupabaseDocumentAdapter
} from './adapters';

/**
 * Singleton instances for repositories
 * Ensures single instance per repository type
 */
let projectRepository: IProjectRepository | null = null;
let phaseRepository: IPhaseRepository | null = null;
let hierarchyRepository: IHierarchyRepository | null = null;
let inspectionRepository: IInspectionRepository | null = null;
let paymentRepository: IPaymentRepository | null = null;
let taskRepository: ITaskRepository | null = null;
let materialRepository: IMaterialRepository | null = null;
let employeeRepository: IEmployeeRepository | null = null;
let riskRepository: IRiskRepository | null = null;
let tenderRepository: ITenderRepository | null = null;
let supplierRepository: ISupplierRepository | null = null;
let documentRepository: IDocumentRepository | null = null;

/**
 * Repository Factory
 * Creates and manages repository instances
 */
export class RepositoryFactory {
  /**
   * Get Project Repository instance
   */
  static getProjectRepository(): IProjectRepository {
    if (!projectRepository) {
      projectRepository = new SupabaseProjectAdapter();
    }
    return projectRepository;
  }

  /**
   * Get Phase Repository instance
   */
  static getPhaseRepository(): IPhaseRepository {
    if (!phaseRepository) {
      phaseRepository = new SupabasePhaseAdapter();
    }
    return phaseRepository;
  }

  /**
   * Get Hierarchy Repository instance
   */
  static getHierarchyRepository(): IHierarchyRepository {
    if (!hierarchyRepository) {
      hierarchyRepository = new SupabaseHierarchyAdapter();
    }
    return hierarchyRepository;
  }

  /**
   * Get Inspection Repository instance
   */
  static getInspectionRepository(): IInspectionRepository {
    if (!inspectionRepository) {
      inspectionRepository = new SupabaseInspectionAdapter();
    }
    return inspectionRepository;
  }

  /**
   * Get Payment Repository instance
   */
  static getPaymentRepository(): IPaymentRepository {
    if (!paymentRepository) {
      paymentRepository = new SupabasePaymentAdapter();
    }
    return paymentRepository;
  }

  /**
   * Get Task Repository instance
   */
  static getTaskRepository(): ITaskRepository {
    if (!taskRepository) {
      taskRepository = new SupabaseTaskAdapter();
    }
    return taskRepository;
  }

  /**
   * Get Material Repository instance
   */
  static getMaterialRepository(): IMaterialRepository {
    if (!materialRepository) {
      materialRepository = new SupabaseMaterialAdapter();
    }
    return materialRepository;
  }

  /**
   * Get Employee Repository instance
   */
  static getEmployeeRepository(): IEmployeeRepository {
    if (!employeeRepository) {
      employeeRepository = new SupabaseEmployeeAdapter();
    }
    return employeeRepository;
  }

  /**
   * Get Risk Repository instance
   */
  static getRiskRepository(): IRiskRepository {
    if (!riskRepository) {
      riskRepository = new SupabaseRiskAdapter();
    }
    return riskRepository;
  }

  /**
   * Get Tender Repository instance
   */
  static getTenderRepository(): ITenderRepository {
    if (!tenderRepository) {
      tenderRepository = new SupabaseTenderAdapter();
    }
    return tenderRepository;
  }

  /**
   * Get Supplier Repository instance
   */
  static getSupplierRepository(): ISupplierRepository {
    if (!supplierRepository) {
      supplierRepository = new SupabaseSupplierAdapter();
    }
    return supplierRepository;
  }

  /**
   * Get Document Repository instance
   */
  static getDocumentRepository(): IDocumentRepository {
    if (!documentRepository) {
      documentRepository = new SupabaseDocumentAdapter();
    }
    return documentRepository;
  }

  /**
   * Reset all repository instances
   * Useful for testing or when switching environments
   */
  static resetAll(): void {
    projectRepository = null;
    phaseRepository = null;
    hierarchyRepository = null;
    inspectionRepository = null;
    paymentRepository = null;
    taskRepository = null;
    materialRepository = null;
    employeeRepository = null;
    riskRepository = null;
    tenderRepository = null;
    supplierRepository = null;
    documentRepository = null;
  }
}

/**
 * Export convenience functions for direct access
 */
export const getProjectRepository = () => RepositoryFactory.getProjectRepository();
export const getPhaseRepository = () => RepositoryFactory.getPhaseRepository();
export const getHierarchyRepository = () => RepositoryFactory.getHierarchyRepository();
export const getInspectionRepository = () => RepositoryFactory.getInspectionRepository();
export const getPaymentRepository = () => RepositoryFactory.getPaymentRepository();
export const getTaskRepository = () => RepositoryFactory.getTaskRepository();
export const getMaterialRepository = () => RepositoryFactory.getMaterialRepository();
export const getEmployeeRepository = () => RepositoryFactory.getEmployeeRepository();
export const getRiskRepository = () => RepositoryFactory.getRiskRepository();
export const getTenderRepository = () => RepositoryFactory.getTenderRepository();
export const getSupplierRepository = () => RepositoryFactory.getSupplierRepository();
export const getDocumentRepository = () => RepositoryFactory.getDocumentRepository();
