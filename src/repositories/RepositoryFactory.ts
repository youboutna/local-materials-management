/**
 * Repository Factory
 * Creates repository instances based on configuration
 * Allows easy switching between adapters (Supabase, Java API, Prisma, etc.)
 */

import { IMilestoneRepository } from './interfaces/IMilestoneRepository';
import { IProjectRepository, IPhaseRepository, IHierarchyRepository } from '@/domain/repositories';

export type DataSourceType = 'supabase' | 'java_api' | 'prisma' |'localStorage'| 'postgis';

// Default data source - can be changed via configuration
let currentDataSource: DataSourceType = 'localStorage'; // Changer à 'supabase' pour la production

export function setDataSource(source: DataSourceType): void {
  currentDataSource = source;
}

export function getDataSource(): DataSourceType {
  return currentDataSource;
}

// ============= Singleton Instances =============
let milestoneRepositoryInstance: IMilestoneRepository | null = null;
let projectRepositoryInstance: IProjectRepository | null = null;
let phaseRepositoryInstance: IPhaseRepository | null = null;
let hierarchyRepositoryInstance: IHierarchyRepository | null = null;

// Additional repository instances for all domains
let materialRepositoryInstance: any = null;
let paymentRepositoryInstance: any = null;
let inspectionRepositoryInstance: any = null;
let employeeRepositoryInstance: any = null;
let authRepositoryInstance: any = null;
let taskRepositoryInstance: any = null;
let alertRepositoryInstance: any = null;
let documentRepositoryInstance: any = null;
let supplierRepositoryInstance: any = null;
let quantityTakeoffRepositoryInstance: any = null;
let notificationRepositoryInstance: any = null;

// ============= Lazy Imports for Adapters =============

let SupabaseMilestoneAdapter: any = null;
let SupabaseProjectAdapter: any = null;
let SupabasePhaseAdapter: any = null;
let SupabaseHierarchyAdapter: any = null;
let SupabaseMaterialAdapter: any = null;
let SupabasePaymentAdapter: any = null;
let SupabaseInspectionAdapter: any = null;
let SupabaseEmployeeAdapter: any = null;
let SupabaseAuthAdapter: any = null;
let SupabaseTaskAdapter: any = null;
let SupabaseAlertAdapter: any = null;
let SupabaseDocumentAdapter: any = null;
let SupabaseSupplierAdapter: any = null;
let SupabaseQuantityTakeoffAdapter: any = null;
let SupabaseNotificationAdapter: any = null;

let LocalStorageMilestoneAdapter: any = null;
let LocalStorageProjectAdapter: any = null;
let LocalStoragePhaseAdapter: any = null;
let LocalStorageHierarchyAdapter: any = null;
let LocalStorageMaterialAdapter: any = null;
let LocalStoragePaymentAdapter: any = null;
let LocalStorageInspectionAdapter: any = null;
let LocalStorageEmployeeAdapter: any = null;
let LocalStorageAuthAdapter: any = null;
let LocalStorageTaskAdapter: any = null;
let LocalStorageAlertAdapter: any = null;
let LocalStorageDocumentAdapter: any = null;
let LocalStorageSupplierAdapter: any = null;
let LocalStorageQuantityTakeoffAdapter: any = null;
let LocalStorageNotificationAdapter: any = null;

function importSupabaseAdapters() {
  if (!SupabaseMilestoneAdapter) {
    SupabaseMilestoneAdapter = require('./adapters/SupabaseMilestoneAdapter').SupabaseMilestoneAdapter;
  }
  if (!SupabaseProjectAdapter) {
    const infrastructure = require('@/infrastructure');
    SupabaseProjectAdapter = infrastructure.SupabaseProjectAdapter || 
                            (infrastructure.default && infrastructure.default.SupabaseProjectAdapter);
  }
  if (!SupabasePhaseAdapter) {
    const infrastructure = require('@/infrastructure');
    SupabasePhaseAdapter = infrastructure.SupabasePhaseAdapter || 
                          (infrastructure.default && infrastructure.default.SupabasePhaseAdapter);
  }
  if (!SupabaseHierarchyAdapter) {
    const infrastructure = require('@/infrastructure');
    SupabaseHierarchyAdapter = infrastructure.SupabaseHierarchyAdapter || 
                              (infrastructure.default && infrastructure.default.SupabaseHierarchyAdapter);
  }
  
  // Additional adapters for all domains
  if (!SupabaseMaterialAdapter) {
    const infrastructure = require('@/infrastructure');
    SupabaseMaterialAdapter = infrastructure.SupabaseMaterialAdapter || 
                            (infrastructure.default && infrastructure.default.SupabaseMaterialAdapter);
  }
  if (!SupabasePaymentAdapter) {
    const infrastructure = require('@/infrastructure');
    SupabasePaymentAdapter = infrastructure.SupabasePaymentAdapter || 
                            (infrastructure.default && infrastructure.default.SupabasePaymentAdapter);
  }
  if (!SupabaseInspectionAdapter) {
    const infrastructure = require('@/infrastructure');
    SupabaseInspectionAdapter = infrastructure.SupabaseInspectionAdapter || 
                              (infrastructure.default && infrastructure.default.SupabaseInspectionAdapter);
  }
  if (!SupabaseEmployeeAdapter) {
    const infrastructure = require('@/infrastructure');
    SupabaseEmployeeAdapter = infrastructure.SupabaseEmployeeAdapter || 
                            (infrastructure.default && infrastructure.default.SupabaseEmployeeAdapter);
  }
  if (!SupabaseAuthAdapter) {
    const infrastructure = require('@/infrastructure');
    SupabaseAuthAdapter = infrastructure.SupabaseAuthAdapter || 
                        (infrastructure.default && infrastructure.default.SupabaseAuthAdapter);
  }
  if (!SupabaseTaskAdapter) {
    const infrastructure = require('@/infrastructure/supabase/adapters/SupabaseTaskAdapter');
    SupabaseTaskAdapter = infrastructure.SupabaseTaskAdapter || 
                         (infrastructure.default && infrastructure.default.SupabaseTaskAdapter);
  }
  if (!SupabaseAlertAdapter) {
    const infrastructure = require('@/infrastructure');
    SupabaseAlertAdapter = infrastructure.SupabaseAlertAdapter || 
                         (infrastructure.default && infrastructure.default.SupabaseAlertAdapter);
  }
  if (!SupabaseDocumentAdapter) {
    SupabaseDocumentAdapter = require('./adapters/SupabaseDocumentAdapter').SupabaseDocumentAdapter;
  }
  if (!SupabaseSupplierAdapter) {
    const SupplierAdapter = require('./adapters/SupabaseSupplierAdapter').SupabaseSupplierAdapter || 
                            (require('./adapters/SupabaseSupplierAdapter').default && require('./adapters/SupabaseSupplierAdapter').default.SupabaseSupplierAdapter);
    SupabaseSupplierAdapter = SupplierAdapter;
  }
  if (!SupabaseQuantityTakeoffAdapter) {
    const adapter = require('@/infrastructure/supabase/adapters/SupabaseQuantityTakeoffAdapter');
    SupabaseQuantityTakeoffAdapter = adapter.SupabaseQuantityTakeoffAdapter || 
                              (adapter.default && adapter.default.SupabaseQuantityTakeoffAdapter);
  }
  if (!SupabaseNotificationAdapter) {
    const adapter = require('./adapters/SupabaseNotificationAdapter');
    SupabaseNotificationAdapter = adapter.SupabaseNotificationAdapter || 
                              (adapter.default && adapter.default.SupabaseNotificationAdapter);
  }
}

function importLocalStorageAdapters() {
  if (!LocalStorageMilestoneAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageMilestoneAdapter = LocalStorageRepositoryFactory.getMilestoneRepository;
  }
  if (!LocalStorageProjectAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageProjectAdapter = LocalStorageRepositoryFactory.getProjectRepository;
  }
  if (!LocalStoragePhaseAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStoragePhaseAdapter = LocalStorageRepositoryFactory.getPhaseRepository;
  }
  if (!LocalStorageHierarchyAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageHierarchyAdapter = LocalStorageRepositoryFactory.getHierarchyRepository;
  }
  
  // Additional adapters for all domains
  if (!LocalStorageMaterialAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageMaterialAdapter = LocalStorageRepositoryFactory.getMaterialRepository;
  }
  if (!LocalStoragePaymentAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStoragePaymentAdapter = LocalStorageRepositoryFactory.getPaymentRepository;
  }
  if (!LocalStorageInspectionAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageInspectionAdapter = LocalStorageRepositoryFactory.getInspectionRepository;
  }
  if (!LocalStorageEmployeeAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageEmployeeAdapter = LocalStorageRepositoryFactory.getEmployeeRepository;
  }
  if (!LocalStorageAuthAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageAuthAdapter = LocalStorageRepositoryFactory.getAuthRepository;
  }
  if (!LocalStorageTaskAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageTaskAdapter = LocalStorageRepositoryFactory.getTaskRepository;
  }
  if (!LocalStorageAlertAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageAlertAdapter = LocalStorageRepositoryFactory.getAlertRepository;
  }
  if (!LocalStorageDocumentAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageDocumentAdapter = LocalStorageRepositoryFactory.getDocumentRepository;
  }
  if (!LocalStorageSupplierAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageSupplierAdapter = LocalStorageRepositoryFactory.getSupplierRepository;
  }
  if (!LocalStorageQuantityTakeoffAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageQuantityTakeoffAdapter = LocalStorageRepositoryFactory.getQuantityTakeoffRepository;
  }
  if (!LocalStorageNotificationAdapter) {
    const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
    LocalStorageNotificationAdapter = LocalStorageRepositoryFactory.getNotificationRepository;
  }
}

// ============= Factory Methods =============

export function getMilestoneRepository(): IMilestoneRepository {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageMilestoneAdapter();
    case 'supabase':
    default:
      importSupabaseAdapters();
      return new SupabaseMilestoneAdapter();
  }
}

export function getProjectRepository(): IProjectRepository {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageProjectAdapter();
    case 'supabase':
    default:
      importSupabaseAdapters();
      return new SupabaseProjectAdapter();
  }
}

export function getPhaseRepository(): IPhaseRepository {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStoragePhaseAdapter();
    case 'supabase':
    default:
      importSupabaseAdapters();
      return new SupabasePhaseAdapter();
  }
}

export function getHierarchyRepository(): IHierarchyRepository {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageHierarchyAdapter();
    case 'supabase':
    default:
      importSupabaseAdapters();
      return new SupabaseHierarchyAdapter();
  }
}

// Additional repository getters for all domains
export function getMaterialRepository(): any {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageMaterialAdapter();
    case 'supabase':
    default:
      importSupabaseAdapters();
      return new SupabaseMaterialAdapter();
  }
}

export function getPaymentRepository(): any {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStoragePaymentAdapter();
    case 'supabase':
    default:
      importSupabaseAdapters();
      return new SupabasePaymentAdapter();
  }
}

export function getInspectionRepository(): any {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageInspectionAdapter();
    case 'supabase':
    default:
      importSupabaseAdapters();
      return new SupabaseInspectionAdapter();
  }
}

export function getEmployeeRepository(): any {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageEmployeeAdapter();
    case 'supabase':
    default:
      importSupabaseAdapters();
      return new SupabaseEmployeeAdapter();
  }
}

export function getAuthRepository(): any {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageAuthAdapter();
    case 'supabase':
    default:
      importSupabaseAdapters();
      return new SupabaseAuthAdapter();
  }
}

export function getTaskRepository(): any {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageTaskAdapter();
    case 'supabase':
    default:
      importSupabaseAdapters();
      return new SupabaseTaskAdapter();
  }
}

export function getAlertRepository(): any {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageAlertAdapter();
    case 'supabase':
    default:
      importSupabaseAdapters();
      return new SupabaseAlertAdapter();
  }
}

export function getDocumentRepository(): any {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageDocumentAdapter();
    case 'supabase':
    default:
      const { SupabaseDocumentAdapter } = require('./adapters/SupabaseDocumentAdapter');
      return new SupabaseDocumentAdapter();
  }
}

export function getSupplierRepository(): any {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageSupplierAdapter();
    case 'supabase':
    default:
      const { SupabaseSupplierAdapter } = require('./adapters/SupabaseSupplierAdapter');
      return new SupabaseSupplierAdapter();
  }
}

export function getQuantityTakeoffRepository(): any {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageQuantityTakeoffAdapter();
    case 'supabase':
    default:
      const { SupabaseQuantityTakeoffAdapter } = require('@/infrastructure/supabase/adapters/SupabaseQuantityTakeoffAdapter');
      return new SupabaseQuantityTakeoffAdapter();
  }
}

export function getNotificationRepository(): any {
  switch (currentDataSource) {
    case 'localStorage':
      importLocalStorageAdapters();
      return LocalStorageNotificationAdapter();
    case 'supabase':
    default:
      const { SupabaseNotificationAdapter } = require('./adapters/SupabaseNotificationAdapter');
      return new SupabaseNotificationAdapter();
  }
}

// ============= Singleton Getters =============

export function getMilestoneRepositorySingleton(): IMilestoneRepository {
  if (!milestoneRepositoryInstance) {
    milestoneRepositoryInstance = getMilestoneRepository();
  }
  return milestoneRepositoryInstance;
}

export function getProjectRepositorySingleton(): IProjectRepository {
  if (!projectRepositoryInstance) {
    projectRepositoryInstance = getProjectRepository();
  }
  return projectRepositoryInstance;
}

export function getPhaseRepositorySingleton(): IPhaseRepository {
  if (!phaseRepositoryInstance) {
    phaseRepositoryInstance = getPhaseRepository();
  }
  return phaseRepositoryInstance;
}

export function getHierarchyRepositorySingleton(): IHierarchyRepository {
  if (!hierarchyRepositoryInstance) {
    hierarchyRepositoryInstance = getHierarchyRepository();
  }
  return hierarchyRepositoryInstance;
}

// Additional singleton getters for all domains
export function getMaterialRepositorySingleton(): any {
  if (!materialRepositoryInstance) {
    materialRepositoryInstance = getMaterialRepository();
  }
  return materialRepositoryInstance;
}

export function getPaymentRepositorySingleton(): any {
  if (!paymentRepositoryInstance) {
    paymentRepositoryInstance = getPaymentRepository();
  }
  return paymentRepositoryInstance;
}

export function getInspectionRepositorySingleton(): any {
  if (!inspectionRepositoryInstance) {
    inspectionRepositoryInstance = getInspectionRepository();
  }
  return inspectionRepositoryInstance;
}

export function getEmployeeRepositorySingleton(): any {
  if (!employeeRepositoryInstance) {
    employeeRepositoryInstance = getEmployeeRepository();
  }
  return employeeRepositoryInstance;
}

export function getAuthRepositorySingleton(): any {
  if (!authRepositoryInstance) {
    authRepositoryInstance = getAuthRepository();
  }
  return authRepositoryInstance;
}

export function getTaskRepositorySingleton(): any {
  if (!taskRepositoryInstance) {
    taskRepositoryInstance = getTaskRepository();
  }
  return taskRepositoryInstance;
}

export function getAlertRepositorySingleton(): any {
  if (!alertRepositoryInstance) {
    alertRepositoryInstance = getAlertRepository();
  }
  return alertRepositoryInstance;
}

export function getDocumentRepositorySingleton(): any {
  if (!documentRepositoryInstance) {
    documentRepositoryInstance = getDocumentRepository();
  }
  return documentRepositoryInstance;
}

export function getSupplierRepositorySingleton(): any {
  if (!supplierRepositoryInstance) {
    supplierRepositoryInstance = getSupplierRepository();
  }
  return supplierRepositoryInstance;
}

export function resetRepositoryInstances(): void {
  milestoneRepositoryInstance = null;
  projectRepositoryInstance = null;
  phaseRepositoryInstance = null;
  hierarchyRepositoryInstance = null;
  
  // Reset additional repository instances
  materialRepositoryInstance = null;
  paymentRepositoryInstance = null;
  inspectionRepositoryInstance = null;
  employeeRepositoryInstance = null;
  authRepositoryInstance = null;
  taskRepositoryInstance = null;
  alertRepositoryInstance = null;
  documentRepositoryInstance = null;
  supplierRepositoryInstance = null;
  
  // Reset lazy imports if needed
  SupabaseMilestoneAdapter = null;
  SupabaseProjectAdapter = null;
  SupabasePhaseAdapter = null;
  SupabaseHierarchyAdapter = null;
  SupabaseMaterialAdapter = null;
  SupabasePaymentAdapter = null;
  SupabaseInspectionAdapter = null;
  SupabaseEmployeeAdapter = null;
  SupabaseAuthAdapter = null;
  SupabaseTaskAdapter = null;
  SupabaseAlertAdapter = null;
  SupabaseDocumentAdapter = null;
  SupabaseSupplierAdapter = null;
  LocalStorageMilestoneAdapter = null;
  LocalStorageProjectAdapter = null;
  LocalStoragePhaseAdapter = null;
  LocalStorageHierarchyAdapter = null;
  LocalStorageMaterialAdapter = null;
  LocalStoragePaymentAdapter = null;
  LocalStorageInspectionAdapter = null;
  LocalStorageEmployeeAdapter = null;
  LocalStorageAuthAdapter = null;
  LocalStorageTaskAdapter = null;
  LocalStorageAlertAdapter = null;
  LocalStorageDocumentAdapter = null;
  LocalStorageSupplierAdapter = null;
}

// ============= Additional Repository Getters =============

// Pour le ReportDataTransformerService
export function getReportDataTransformerRepository(): any {
  switch (currentDataSource) {
    case 'localStorage':
      const { LocalStorageRepositoryFactory } = require('@/infrastructure/localStorage/LocalStorageRepositoryFactory');
      return LocalStorageRepositoryFactory.getReportDataTransformerRepository();
    case 'supabase':
    default:
      // Import différé pour éviter les dépendances circulaires
      const { SupabaseReportDataTransformerAdapter } = require('./adapters/SupabaseReportDataTransformerAdapter');
      return new SupabaseReportDataTransformerAdapter();
  }
}

// ============= Exports for backward compatibility =============
export const RepositoryFactory = {
  getMilestoneRepository,
  getProjectRepository,
  getPhaseRepository,
  getHierarchyRepository,
  getMilestoneRepositorySingleton,
  getProjectRepositorySingleton,
  getPhaseRepositorySingleton,
  getHierarchyRepositorySingleton,
  getReportDataTransformerRepository,
  getMaterialRepository,
  getPaymentRepository,
  getInspectionRepository,
  getEmployeeRepository,
  getAuthRepository,
  getTaskRepository,
  getAlertRepository,
  getDocumentRepository,
  getSupplierRepository,
  getQuantityTakeoffRepository,
  getNotificationRepository,
  getMaterialRepositorySingleton,
  getPaymentRepositorySingleton,
  getInspectionRepositorySingleton,
  getEmployeeRepositorySingleton,
  getAuthRepositorySingleton,
  getTaskRepositorySingleton,
  getAlertRepositorySingleton,
  getDocumentRepositorySingleton,
  getSupplierRepositorySingleton,
  setDataSource,
  getDataSource,
  resetRepositoryInstances
};

// Export par défaut pour faciliter les imports
export default RepositoryFactory;