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
  IDocumentRepository,
  IQuantityTakeoffRepository,
  IInspectionExecutionRepository,
  IInspectionPaymentValidationRepository,
  ILoadDataRepository,
  IReportingRepository,
  IReportDataTransformerRepository,
  IProjectFormRepository,
  IUserRepository,
  IPVGeneratorRepository,
  IBankGuaranteeRepository,
  IInspectionSchedulingRepository,
  IInsuranceRepository,
  IAuthRepository,
  IStorageRepository,
  INotificationRepository
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
  InspectionPermissionAdapter,
  SupabaseAuthAdapter,
  SupabaseStorageAdapter,
  SupabaseNotificationAdapter,
  SupabaseInsuranceAdapter
} from './adapters';

/**
 * Singleton instances for repositories
 * Ensures single instance per repository type
 */
let projectRepository: IProjectRepository | null = null;
let phaseRepository: IPhaseRepository | null = null;
let hierarchyRepository: IHierarchyRepository | null = null;
let inspectionSchedulingRepository: IInspectionSchedulingRepository | null = null;
let inspectionRepository: IInspectionRepository | null = null;
let paymentRepository: IPaymentRepository | null = null;
let taskRepository: ITaskRepository | null = null;
let materialRepository: IMaterialRepository | null = null;
let employeeRepository: IEmployeeRepository | null = null;
let riskRepository: IRiskRepository | null = null;
let tenderRepository: ITenderRepository | null = null;
let supplierRepository: ISupplierRepository | null = null;
let documentRepository: IDocumentRepository | null = null;
let quantityTakeoffRepository: IQuantityTakeoffRepository | null = null;
let inspectionExecutionRepository: IInspectionExecutionRepository | null = null;
let inspectionPaymentValidationRepository: IInspectionPaymentValidationRepository | null = null;
let reportDataTransformerRepository: IReportDataTransformerRepository | null = null;
let loadDataRepository: ILoadDataRepository | null = null;
let reportingRepository: IReportingRepository | null = null;
let projectFormRepository: IProjectFormRepository | null = null;
let userRepository: IUserRepository | null = null;
let pvGeneratorRepository: IPVGeneratorRepository | null = null;
let bankGuaranteeRepository: IBankGuaranteeRepository | null = null;
let insuranceRepository: IInsuranceRepository | null = null;
let authRepository: IAuthRepository | null = null;
let storageRepository: IStorageRepository | null = null;
let notificationRepository: INotificationRepository | null = null;

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
   * Get Inspection Scheduling Repository instance
   */
  static getInspectionSchedulingRepository(): IInspectionSchedulingRepository {
    if (!inspectionSchedulingRepository) {
      inspectionSchedulingRepository = new InspectionSchedulingAdapter();
    }
    return inspectionSchedulingRepository;
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
   * Get Inspection Repository instance
   */
  static getInspectionRepository(): IInspectionRepository {
    if (!inspectionRepository) {
      inspectionRepository = new SupabaseInspectionAdapter();
    }
    return inspectionRepository;
  }

  /**
   * Get Insurance Repository instance
   */
  static getInsuranceRepository(): IInsuranceRepository {
    if (!insuranceRepository) {
      insuranceRepository = new SupabaseInsuranceAdapter();
    }
    return insuranceRepository;
  }

  /**
   * Get Reporting Repository instance
   */
  static getReportingRepository(): IReportingRepository {
    if (!reportingRepository) {
      reportingRepository = new SupabaseReportingAdapter();
    }
    return reportingRepository;
  }

  /**
   * Get Report Data Transformer Repository instance
   */
  static getReportDataTransformerRepository(): IReportDataTransformerRepository {
    if (!reportDataTransformerRepository) {
      reportDataTransformerRepository = new SupabaseReportDataTransformerAdapter();
    }
    return reportDataTransformerRepository;
  }

  /**
   * Get Project Form Repository instance
   */
  static getProjectFormRepository(): IProjectFormRepository {
    if (!projectFormRepository) {
      projectFormRepository = new SupabaseProjectFormAdapter();
    }
    return projectFormRepository;
  }

  /**
   * Get User Repository instance
   */
  static getUserRepository(): IUserRepository {
    if (!userRepository) {
      userRepository = new SupabaseUserAdapter();
    }
    return userRepository;
  }

  /**
   * Get Auth Repository instance
   */
  static getAuthRepository(): IAuthRepository {
    if (!authRepository) {
      authRepository = new SupabaseAuthAdapter();
    }
    return authRepository;
  }

  /**
   * Get Storage Repository instance
   */
  static getStorageRepository(): IStorageRepository {
    if (!storageRepository) {
      storageRepository = new SupabaseStorageAdapter();
    }
    return storageRepository;
  }

  /**
   * Get Notification Repository instance
   */
  static getNotificationRepository(): INotificationRepository {
    if (!notificationRepository) {
      notificationRepository = new SupabaseNotificationAdapter();
    }
    return notificationRepository;
  }
}
