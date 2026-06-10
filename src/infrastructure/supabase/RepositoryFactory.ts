/**
 * Repository Factory - Hexagonal Architecture
 * Centralized factory for creating repository implementations
 * Provides dependency injection and adapter instantiation
 * 
 * Features:
 * - Singleton pattern for performance
 * - Lazy loading for memory efficiency
 * - Type-safe repository instantiation
 * - Centralized adapter management
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
  IDocumentRepository,
  IQuantityTakeoffRepository,
  IInspectionExecutionRepository,
  IInspectionPaymentValidationRepository,
  ILoadDataRepository,
  IReportingRepository,
  ITenderSubmissionRepository,
  IReportDataTransformerRepository,
  IProjectFormRepository,
  ITenderSharingRepository,
  IUserRepository,
  IPVGeneratorRepository,
  IBankGuaranteeRepository,
  IInsuranceRepository,
  IAuthRepository,
  IStorageRepository,
  INotificationRepository,
  IParsedInvoiceRepository,
  IInspectionPermissionRepository,
  ITenderDocumentRepository,
  IAlertRepository,
  IMilestoneRepository,
  ITaskAssignmentRepository,
  IWorkspaceRepository,
  IProjectAlertRepository,
  ITenderEstimateRepository,
  IPaymentBlockingRepository,
  IComplianceRepository,
  IInspectionSchedulingRepository,
  IProjectStakeholderRepository,
  IMissionExpenseRepository,
  IContactMessageRepository,
} from '@/domain/repositories';
import type { IProjectStrategyLinkRepository } from '@/domain/repositories/IProjectStrategyLinkRepository';
import type { IProjectBudgetLinkRepository } from '@/domain/repositories/IProjectBudgetLinkRepository';

import { ILocationRepository } from '@/domain/repositories/LocationRepository';

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
  SupabaseDocumentAdapter,
  SupabaseQuantityTakeoffAdapter,
  SupabaseInspectionExecutionAdapter,
  SupabaseInspectionPaymentValidationAdapter,
  SupabaseLoadDataAdapter,
  SupabaseReportingAdapter,
  SupabaseReportDataTransformerAdapter,
  SupabaseProjectFormAdapter,
  SupabaseUserAdapter,
  PVGeneratorAdapter,
  BankGuaranteeAdapter,
  InspectionSchedulingAdapter,
  SupabaseAuthAdapter,
  SupabaseStorageAdapter,
  SupabaseNotificationAdapter,
  SupabaseInsuranceAdapter,
  SupabaseParsedInvoiceAdapter,
  SupabaseInspectionPermissionAdapter,
  SupabaseContactMessageAdapter,
} from './adapters';
import { SupabaseMissionExpenseAdapter } from './adapters/SupabaseMissionExpenseAdapter';
import {
  SupabaseTenderDocumentAdapter,
  TenderEstimateAdapter,
  PaymentBlockingAdapter,
  TaskAssignmentAdapter,
  SupabaseMilestoneAdapter,
  SupabaseProjectStakeholderAdapter,
  SupabaseComplianceAdapter,
  SupabaseMonitoringAdapter,
  SupabaseStakeholderAdapter
} from './adapters';
import { SupabaseTenderSharingAdapter } from '../adapters/SupabaseTenderSharingAdapter';
import { IMonitoringRepository } from '@/domain/repositories/IMonitoringRepository';
import { IStakeholderRepository } from '@/domain/repositories/IStakeholderRepository';
import { SupabaseWorkspaceAdapter } from './adapters/SupabaseWorkspaceAdapter';

import { LocationRepository } from './adapters/LocationRepository';
import { SupabaseProjectStrategyLinkAdapter } from './adapters/SupabaseProjectStrategyLinkAdapter';
import { SupabaseProjectBudgetLinkAdapter } from './adapters/SupabaseProjectBudgetLinkAdapter';

/**
 * Repository Registry - Enhanced Singleton Management
 * Type-safe registry with lazy loading and memory optimization
 */
interface RepositoryRegistry {
  projectRepository?: IProjectRepository;
  hierarchyRepository?: IHierarchyRepository;
  documentRepository?: IDocumentRepository;
  phaseRepository?: IPhaseRepository;
  inspectionSchedulingRepository?: IInspectionSchedulingRepository;
  inspectionRepository?: IInspectionRepository;
  paymentRepository?: IPaymentRepository;
  taskRepository?: ITaskRepository;
  materialRepository?: IMaterialRepository;
  employeeRepository?: IEmployeeRepository;
  riskRepository?: IRiskRepository;
  tenderRepository?: ITenderRepository;
  tenderSubmissionRepository?: ITenderSubmissionRepository;
  tenderSharingRepository?: ITenderSharingRepository;
  tenderEstimateRepository?: ITenderEstimateRepository;
  paymentBlockingRepository?: IPaymentBlockingRepository;
  stakeholderRepository?: IStakeholderRepository;
  userRepository?: IUserRepository;
  pvGeneratorRepository?: IPVGeneratorRepository;
  bankGuaranteeRepository?: IBankGuaranteeRepository;
  insuranceRepository?: IInsuranceRepository;
  authRepository?: IAuthRepository;
  storageRepository?: IStorageRepository;
  notificationRepository?: INotificationRepository;
  parsedInvoiceRepository?: IParsedInvoiceRepository;
  tenderDocumentRepository?: ITenderDocumentRepository;
  inspectionPermissionRepository?: IInspectionPermissionRepository;
  alertRepository?: IAlertRepository;
  milestoneRepository?: IMilestoneRepository;
  complianceRepository?: IComplianceRepository;
  monitoringRepository?: IMonitoringRepository;
  workspaceRepository?: IWorkspaceRepository;
  supplierRepository?: ISupplierRepository;
  taskAssignmentRepository?: ITaskAssignmentRepository;
  reportDataTransformerRepository?: IReportDataTransformerRepository;
  projectFormRepository?: IProjectFormRepository;
  quantityTakeoffRepository?: IQuantityTakeoffRepository;
  inspectionExecutionRepository?: IInspectionExecutionRepository;
  inspectionPaymentValidationRepository?: IInspectionPaymentValidationRepository;
  loadDataRepository?: ILoadDataRepository;
  reportingRepository?: IReportingRepository;
  projectStakeholderRepository?: IProjectStakeholderRepository;
  locationRepository?: ILocationRepository;
  missionExpenseRepository?: IMissionExpenseRepository;
  contactMessageRepository?: IContactMessageRepository;
  projectStrategyLinkRepository?: IProjectStrategyLinkRepository;
  projectBudgetLinkRepository?: IProjectBudgetLinkRepository;
}

/**
 * Global repository registry with lazy initialization
 */
const repositoryRegistry: RepositoryRegistry = {};

/**
 * Current data source for repositories
 */
let currentDataSource: 'supabase' | 'java_api' | 'prisma' | 'localStorage' | 'postgis' = 'supabase';

/**
 * Repository Factory - Enhanced Hexagonal Architecture
 * 
 * Provides:
 * - Lazy loading of repositories
 * - Type-safe instantiation
 * - Memory optimization
 * - Centralized dependency injection
 * 
 * Usage:
 * ```typescript
 * const projectRepo = RepositoryFactory.getProjectRepository();
 * const authRepo = RepositoryFactory.getAuthRepository();
 * ```
 */
export class RepositoryFactory {
  /**
   * Reset all repositories (useful for testing)
   */
  static reset(): void {
    Object.keys(repositoryRegistry).forEach(key => {
      delete repositoryRegistry[key as keyof RepositoryRegistry];
    });
  }

  /**
   * Get all active repositories (useful for debugging)
   */
  static getActiveRepositories(): string[] {
    return Object.keys(repositoryRegistry);
  }

  /**
   * Check if a repository is initialized
   */
  static hasRepository<T extends keyof RepositoryRegistry>(name: T): boolean {
    return repositoryRegistry[name] !== undefined;
  }
  /**
   * Get Project Repository instance
   * Lazy loaded for memory efficiency
   */
  static getProjectRepository(): IProjectRepository {
    if (!repositoryRegistry.projectRepository) {
      repositoryRegistry.projectRepository = new SupabaseProjectAdapter();
    }
    return repositoryRegistry.projectRepository;
  }

  /**
   * Get Phase Repository instance
   * Lazy loaded for memory efficiency
   */
  static getPhaseRepository(): IPhaseRepository {
    if (!repositoryRegistry.phaseRepository) {
      repositoryRegistry.phaseRepository = new SupabasePhaseAdapter();
    }
    return repositoryRegistry.phaseRepository;
  }

  /**
   * Get Hierarchy Repository instance
   * Lazy loaded for memory efficiency
   */
  static getHierarchyRepository(): IHierarchyRepository {
    if (!repositoryRegistry.hierarchyRepository) {
      repositoryRegistry.hierarchyRepository = new SupabaseHierarchyAdapter();
    }
    return repositoryRegistry.hierarchyRepository!;
  }

  /**
   * Get Inspection Scheduling Repository instance
   * Lazy loaded for memory efficiency
   */
  static getInspectionSchedulingRepository(): IInspectionSchedulingRepository {
    if (!repositoryRegistry.inspectionSchedulingRepository) {
      repositoryRegistry.inspectionSchedulingRepository = new InspectionSchedulingAdapter();
    }
    return repositoryRegistry.inspectionSchedulingRepository;
  }

  /**
   * Get Task Repository instance
   * Lazy loaded for memory efficiency
   */
  static getTaskRepository(): ITaskRepository {
    if (!repositoryRegistry.taskRepository) {
      repositoryRegistry.taskRepository = new SupabaseTaskAdapter();
    }
    return repositoryRegistry.taskRepository;
  }

  /**
   * Get Material Repository instance
   * Lazy loaded for memory efficiency
   */
  static getMaterialRepository(): IMaterialRepository {
    if (!repositoryRegistry.materialRepository) {
      repositoryRegistry.materialRepository = new SupabaseMaterialAdapter();
    }
    return repositoryRegistry.materialRepository;
  }

  /**
   * Get Employee Repository instance
   * Lazy loaded for memory efficiency
   */
  static getEmployeeRepository(): IEmployeeRepository {
    if (!repositoryRegistry.employeeRepository) {
      repositoryRegistry.employeeRepository = new SupabaseEmployeeAdapter();
    }
    return repositoryRegistry.employeeRepository;
  }

  /**
   * Get Risk Repository instance
   * Lazy loaded for memory efficiency
   */
  static getRiskRepository(): IRiskRepository {
    if (!repositoryRegistry.riskRepository) {
      repositoryRegistry.riskRepository = new SupabaseRiskAdapter();
    }
    return repositoryRegistry.riskRepository;
  }

  /**
   * Get Inspection Repository instance
   * Lazy loaded for memory efficiency
   */
  static getInspectionRepository(): IInspectionRepository {
    if (!repositoryRegistry.inspectionRepository) {
      repositoryRegistry.inspectionRepository = new SupabaseInspectionAdapter();
    }
    return repositoryRegistry.inspectionRepository!;
  }

  /**
   * Get Payment Repository instance
   * Lazy loaded for memory efficiency
   */
  static getPaymentRepository(): IPaymentRepository {
    if (!repositoryRegistry.paymentRepository) {
      repositoryRegistry.paymentRepository = new SupabasePaymentAdapter();
    }
    return repositoryRegistry.paymentRepository;
  }

  /**
   * Get Document Repository instance
   * Lazy loaded for memory efficiency
   */
  static getDocumentRepository(): IDocumentRepository {
    if (!repositoryRegistry.documentRepository) {
      repositoryRegistry.documentRepository = new SupabaseDocumentAdapter();
    }
    return repositoryRegistry.documentRepository!;
  }

  /**
   * Get Quantity Takeoff Repository instance
   * Lazy loaded for memory efficiency
   */
  static getQuantityTakeoffRepository(): IQuantityTakeoffRepository {
    if (!repositoryRegistry.quantityTakeoffRepository) {
      repositoryRegistry.quantityTakeoffRepository = new SupabaseQuantityTakeoffAdapter();
    }
    return repositoryRegistry.quantityTakeoffRepository;
  }

  /**
   * Get Inspection Execution Repository instance
   * Lazy loaded for memory efficiency
   */
  static getInspectionExecutionRepository(): IInspectionExecutionRepository {
    if (!repositoryRegistry.inspectionExecutionRepository) {
      repositoryRegistry.inspectionExecutionRepository = new SupabaseInspectionExecutionAdapter();
    }
    return repositoryRegistry.inspectionExecutionRepository;
  }

  /**
   * Get Inspection Payment Validation Repository instance
   * Lazy loaded for memory efficiency
   */
  static getInspectionPaymentValidationRepository(): IInspectionPaymentValidationRepository {
    if (!repositoryRegistry.inspectionPaymentValidationRepository) {
      repositoryRegistry.inspectionPaymentValidationRepository = new SupabaseInspectionPaymentValidationAdapter();
    }
    return repositoryRegistry.inspectionPaymentValidationRepository;
  }

  /**
   * Get Load Data Repository instance
   * Lazy loaded for memory efficiency
   */
  static getLoadDataRepository(): ILoadDataRepository {
    if (!repositoryRegistry.loadDataRepository) {
      repositoryRegistry.loadDataRepository = new SupabaseLoadDataAdapter();
    }
    return repositoryRegistry.loadDataRepository;
  }

  /**
   * Get Bank Guarantee Repository instance
   * Lazy loaded for memory efficiency
   */
  static getBankGuaranteeRepository(): IBankGuaranteeRepository {
    if (!repositoryRegistry.bankGuaranteeRepository) {
      repositoryRegistry.bankGuaranteeRepository = new BankGuaranteeAdapter();
    }
    return repositoryRegistry.bankGuaranteeRepository;
  }

  /**
   * Get PV Generator Repository instance
   * Lazy loaded for memory efficiency
   */
  static getPVGeneratorRepository(): IPVGeneratorRepository {
    if (!repositoryRegistry.pvGeneratorRepository) {
      repositoryRegistry.pvGeneratorRepository = new PVGeneratorAdapter();
    }
    return repositoryRegistry.pvGeneratorRepository;
  }

  /**
   * Get Insurance Repository instance
   * Lazy loaded for memory efficiency
   */
  static getInsuranceRepository(): IInsuranceRepository {
    if (!repositoryRegistry.insuranceRepository) {
      repositoryRegistry.insuranceRepository = new SupabaseInsuranceAdapter();
    }
    return repositoryRegistry.insuranceRepository;
  }

  /**
   * Get Reporting Repository instance
   * Lazy loaded for memory efficiency
   */
  static getReportingRepository(): IReportingRepository {
    if (!repositoryRegistry.reportingRepository) {
      repositoryRegistry.reportingRepository = new SupabaseReportingAdapter();
    }
    return repositoryRegistry.reportingRepository;
  }

  /**
   * Get Report Data Transformer Repository instance
   * Lazy loaded for memory efficiency
   */
  static getReportDataTransformerRepository(): IReportDataTransformerRepository {
    if (!repositoryRegistry.reportDataTransformerRepository) {
      repositoryRegistry.reportDataTransformerRepository = new SupabaseReportDataTransformerAdapter();
    }
    return repositoryRegistry.reportDataTransformerRepository;
  }

  /**
   * Get Project Form Repository instance
   * Lazy loaded for memory efficiency
   */
  static getProjectFormRepository(): IProjectFormRepository {
    if (!repositoryRegistry.projectFormRepository) {
      repositoryRegistry.projectFormRepository = new SupabaseProjectFormAdapter();
    }
    return repositoryRegistry.projectFormRepository;
  }

  /**
   * Get Tender Repository instance
   * Lazy loaded for memory efficiency
   */
  static getTenderRepository(): ITenderRepository {
    if (!repositoryRegistry.tenderRepository) {
      repositoryRegistry.tenderRepository = new SupabaseTenderAdapter();
    }
    return repositoryRegistry.tenderRepository!;
  }

  /**
   * Get Tender Estimate Repository instance
   * Lazy loaded for memory efficiency
   */
  static getTenderEstimateRepository(): ITenderEstimateRepository {
    if (!repositoryRegistry.tenderEstimateRepository) {
      repositoryRegistry.tenderEstimateRepository = new TenderEstimateAdapter();
    }
    return repositoryRegistry.tenderEstimateRepository;
  }

  /**
   * Get Payment Blocking Repository instance
   * Lazy loaded for memory efficiency
   */
  static getPaymentBlockingRepository(): IPaymentBlockingRepository {
    if (!repositoryRegistry.paymentBlockingRepository) {
      repositoryRegistry.paymentBlockingRepository = new PaymentBlockingAdapter();
    }
    return repositoryRegistry.paymentBlockingRepository;
  }

  /**
   * Get Task Assignment Repository instance
   * Lazy loaded for memory efficiency
   */
  static getTaskAssignmentRepository(): ITaskAssignmentRepository {
    if (!repositoryRegistry.taskAssignmentRepository) {
      repositoryRegistry.taskAssignmentRepository = new TaskAssignmentAdapter();
    }
    return repositoryRegistry.taskAssignmentRepository;
  }

  /**
   * Get Supplier Repository instance
   * Lazy loaded for memory efficiency
   */
  static getSupplierRepository(): ISupplierRepository {
    if (!repositoryRegistry.supplierRepository) {
      repositoryRegistry.supplierRepository = new SupabaseSupplierAdapter();
    }
    return repositoryRegistry.supplierRepository;
  }

  /**
   * Get User Repository instance
   * Lazy loaded for memory efficiency
   */
  static getUserRepository(): IUserRepository {
    if (!repositoryRegistry.userRepository) {
      repositoryRegistry.userRepository = new SupabaseUserAdapter();
    }
    return repositoryRegistry.userRepository!;
  }

  /**
   * Get Auth Repository instance
   * Lazy loaded for memory efficiency
   */
  static getAuthRepository(): IAuthRepository {
    if (!repositoryRegistry.authRepository) {
      repositoryRegistry.authRepository = new SupabaseAuthAdapter();
    }
    return repositoryRegistry.authRepository;
  }

  /**
   * Get Storage Repository instance
   * Lazy loaded for memory efficiency
   */
  static getStorageRepository(): IStorageRepository {
    if (!repositoryRegistry.storageRepository) {
      repositoryRegistry.storageRepository = new SupabaseStorageAdapter();
    }
    return repositoryRegistry.storageRepository!;
  }

  /**
   * Get Parsed Invoice Repository instance
   * Lazy loaded for memory efficiency
   */
  static getParsedInvoiceRepository(): IParsedInvoiceRepository {
    if (!repositoryRegistry.parsedInvoiceRepository) {
      repositoryRegistry.parsedInvoiceRepository = new SupabaseParsedInvoiceAdapter();
    }
    return repositoryRegistry.parsedInvoiceRepository;
  }

  /**
   * Get Notification Repository instance
   * Lazy loaded for memory efficiency
   */
  static getNotificationRepository(): INotificationRepository {
    if (!repositoryRegistry.notificationRepository) {
      repositoryRegistry.notificationRepository = new SupabaseNotificationAdapter();
    }
    return repositoryRegistry.notificationRepository;
  }

  /**
   * Get Project Stakeholder Repository instance
   * Lazy loaded for memory efficiency
   */
  static getProjectStakeholderRepository(): IProjectStakeholderRepository {
    if (!repositoryRegistry.projectStakeholderRepository) {
      repositoryRegistry.projectStakeholderRepository = new SupabaseProjectStakeholderAdapter();
    }
    return repositoryRegistry.projectStakeholderRepository!;
  }

  /**
   * Get Stakeholder Repository instance
   * Lazy loaded for memory efficiency
   */
  static getStakeholderRepository(): IStakeholderRepository {
    if (!repositoryRegistry.stakeholderRepository) {
      repositoryRegistry.stakeholderRepository = new SupabaseStakeholderAdapter();
    }
    return repositoryRegistry.stakeholderRepository!;
  }

  /**
   * Get Alert Repository instance
   * Lazy loaded for memory efficiency
   */
  static getAlertRepository(): IAlertRepository {
    if (!repositoryRegistry.alertRepository) {
      const { SupabaseAlertAdapter } = require('./adapters/SupabaseAlertAdapter');
      repositoryRegistry.alertRepository = new SupabaseAlertAdapter();
    }
    return repositoryRegistry.alertRepository!;
  }

  /**
   * Get Inspection Permission Repository instance
   * Lazy loaded for memory efficiency
   */
  static getInspectionPermissionRepository(): IInspectionPermissionRepository {
    if (!repositoryRegistry.inspectionPermissionRepository) {
      repositoryRegistry.inspectionPermissionRepository = new SupabaseInspectionPermissionAdapter();
    }
    return repositoryRegistry.inspectionPermissionRepository;
  }

  /**
   * Get Tender Document Repository instance
   * Lazy loaded for memory efficiency
   */
  static getTenderDocumentRepository(): ITenderDocumentRepository {
    if (!repositoryRegistry.tenderDocumentRepository) {
      repositoryRegistry.tenderDocumentRepository = new SupabaseTenderDocumentAdapter();
    }
    return repositoryRegistry.tenderDocumentRepository;
  }

  /**
   * Get Milestone Repository instance
   * Lazy loaded for memory efficiency
   */
  static getMilestoneRepository(): IMilestoneRepository {
    if (!repositoryRegistry.milestoneRepository) {
      repositoryRegistry.milestoneRepository = new SupabaseMilestoneAdapter();
    }
    return repositoryRegistry.milestoneRepository;
  }

  /**
   * Get Compliance Repository instance
   * Lazy loaded for memory efficiency
   */
  static getComplianceRepository(): IComplianceRepository {
    if (!repositoryRegistry.complianceRepository) {
      repositoryRegistry.complianceRepository = new SupabaseComplianceAdapter();
    }
    return repositoryRegistry.complianceRepository;
  }

  /**
   * Set data source for repositories
   * This allows switching between different backend implementations
   */
  static setDataSource(source: 'supabase' | 'java_api' | 'prisma' | 'localStorage' | 'postgis'): void {
    currentDataSource = source;
    // Reset all repositories to force re-instantiation with new data source
    repositoryRegistry.reportDataTransformerRepository = undefined;
    repositoryRegistry.projectFormRepository = undefined;
    repositoryRegistry.tenderRepository = undefined;
    repositoryRegistry.tenderEstimateRepository = undefined;
    repositoryRegistry.paymentBlockingRepository = undefined;
    repositoryRegistry.taskAssignmentRepository = undefined;
    repositoryRegistry.supplierRepository = undefined;
    repositoryRegistry.userRepository = undefined;
    repositoryRegistry.authRepository = undefined;
    repositoryRegistry.storageRepository = undefined;
    repositoryRegistry.parsedInvoiceRepository = undefined;
    repositoryRegistry.notificationRepository = undefined;
    repositoryRegistry.projectStakeholderRepository = undefined;
    repositoryRegistry.stakeholderRepository = undefined;
    repositoryRegistry.alertRepository = undefined;
    repositoryRegistry.inspectionPermissionRepository = undefined;
    repositoryRegistry.tenderDocumentRepository = undefined;
    repositoryRegistry.milestoneRepository = undefined;
    repositoryRegistry.complianceRepository = undefined;
  }

  /**
   * Get the current data source
   */
  static getDataSource(): 'supabase' | 'java_api' | 'prisma' | 'localStorage' | 'postgis' {
    return currentDataSource;
  }

  /**
   * Get Monitoring Repository instance
   * Lazy loaded for memory efficiency
   */
  static getMonitoringRepository(): IMonitoringRepository {
    if (!repositoryRegistry.monitoringRepository) {
      repositoryRegistry.monitoringRepository = new SupabaseMonitoringAdapter();
    }
    return repositoryRegistry.monitoringRepository;
  }

  /**
   * Get Workspace Repository instance
   * Lazy loaded for memory efficiency
   */
  static getWorkspaceRepository(): IWorkspaceRepository {
    if (!repositoryRegistry.workspaceRepository) {
      repositoryRegistry.workspaceRepository = new SupabaseWorkspaceAdapter();
    }
    return repositoryRegistry.workspaceRepository!;
  }


  /**
   * Get Location Repository instance
   * Lazy loaded for memory efficiency
   */
  static getLocationRepository(): ILocationRepository {
    if (!repositoryRegistry.locationRepository) {
      repositoryRegistry.locationRepository = new LocationRepository();
    }
    return repositoryRegistry.locationRepository;
  }

  /**
   * Get Mission Expense Repository instance
   * Lazy loaded for memory efficiency
   */
  static getMissionExpenseRepository(): IMissionExpenseRepository {
    if (!repositoryRegistry.missionExpenseRepository) {
      repositoryRegistry.missionExpenseRepository = new SupabaseMissionExpenseAdapter();
    }
    return repositoryRegistry.missionExpenseRepository;
  }

  /**
   * Get Tender Sharing Repository instance
   * Lazy loaded for memory efficiency
   */
  static getTenderSharingRepository(): ITenderSharingRepository {
    if (!repositoryRegistry.tenderSharingRepository) {
      repositoryRegistry.tenderSharingRepository = new SupabaseTenderSharingAdapter();
    }
    return repositoryRegistry.tenderSharingRepository;
  }

  /**
   * Get Contact Message Repository instance
   * Lazy loaded for memory efficiency
   */
  static getContactMessageRepository(): IContactMessageRepository {
    if (!repositoryRegistry.contactMessageRepository) {
      repositoryRegistry.contactMessageRepository = new SupabaseContactMessageAdapter();
    }
    return repositoryRegistry.contactMessageRepository;
  }

  /**
   * Get Project Strategy Link Repository instance
   * Lazy loaded for memory efficiency
   */
  static getProjectStrategyLinkRepository(): IProjectStrategyLinkRepository {
    if (!repositoryRegistry.projectStrategyLinkRepository) {
      repositoryRegistry.projectStrategyLinkRepository = new SupabaseProjectStrategyLinkAdapter();
    }
    return repositoryRegistry.projectStrategyLinkRepository;
  }

  /**
   * Get Project Budget Link Repository instance
   * Lazy loaded for memory efficiency
   */
  static getProjectBudgetLinkRepository(): IProjectBudgetLinkRepository {
    if (!repositoryRegistry.projectBudgetLinkRepository) {
      repositoryRegistry.projectBudgetLinkRepository = new SupabaseProjectBudgetLinkAdapter();
    }
    return repositoryRegistry.projectBudgetLinkRepository;
  }
}
