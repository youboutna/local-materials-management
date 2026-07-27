// src/infrastructure/RepositoryFactory.ts
/**
 * Unified RepositoryFactory
 * Single switch for auth / data / storage providers.
 *
 * Env vars:
 *   VITE_AUTH_PROVIDER    supabase | gotrue | keycloak | local
 *   VITE_DATA_PROVIDER    supabase | postgrest | local
 *   VITE_STORAGE_PROVIDER supabase | s3 | minio | local
 */

import { getAppConfig } from '@/config/app';
import { validateProviders } from '@/config/app-validate';
import { DEV_MODE } from '@/config/constants';

// ================================================================
// 1. TYPES
// ================================================================

export type AuthProviderKind = 'supabase' | 'gotrue' | 'keycloak' | 'local';
export type DataProviderKind = 'supabase' | 'postgrest' | 'local';
export type StorageProviderKind = 'supabase' | 's3' | 'minio' | 'local';

// ================================================================
// 2. IMPORTS – SUPABASE ADAPTERS
// ================================================================

import {
  SupabaseAlertAdapter,
  SupabaseAuthAdapter,
  SupabaseComplianceAdapter,
  SupabaseContactMessageAdapter,
  SupabaseDocumentAdapter,
  SupabaseEmployeeAdapter,
  SupabaseHierarchyAdapter,
  SupabaseInspectionAdapter,
  SupabaseInspectionExecutionAdapter,
  SupabaseInspectionPaymentValidationAdapter,
  SupabaseInspectionPermissionAdapter,
  SupabaseInsuranceAdapter,
  SupabaseLoadDataAdapter,
  SupabaseMaterialAdapter,
  SupabaseMilestoneAdapter,
  SupabaseMissionExpenseAdapter,
  SupabaseMonitoringAdapter,
  SupabaseNotificationAdapter,
  SupabaseParsedInvoiceAdapter,
  SupabasePaymentAdapter,
  SupabasePhaseAdapter,
  SupabaseProjectAdapter,
  SupabaseProjectBudgetLinkAdapter,
  SupabaseProjectFormAdapter,
  SupabaseProjectStakeholderAdapter,
  SupabaseProjectStrategyLinkAdapter,
  SupabaseQuantityTakeoffAdapter,
  SupabaseReportDataTransformerAdapter,
  SupabaseReportingAdapter,
  SupabaseRiskAdapter,
  SupabaseStakeholderAdapter,
  SupabaseSupplierAdapter,
  SupabaseTaskAdapter,
  SupabaseTenderAdapter,
  SupabaseTenderDocumentAdapter,
  SupabaseTenderSharingAdapter,
  SupabaseUserAdapter,
  SupabaseWorkspaceAdapter,
} from '@/infrastructure/supabase/adapters';

import { BankGuaranteeAdapter, InspectionSchedulingAdapter, LocationRepository, PaymentBlockingAdapter, PVGeneratorAdapter, TaskAssignmentAdapter, TenderEstimateAdapter } from '@/infrastructure/supabase/adapters';
import { SupabaseOAuthProviderAdapter } from '@/infrastructure/supabase/adapters/SupabaseOAuthProviderAdapter';
import { SupabaseStorageAdapter } from '@/infrastructure/supabase/adapters/SupabaseStorageAdapter';

// ================================================================
// 3. IMPORTS – AUTH ADAPTERS
// ================================================================

import { GoTrueAuthAdapter } from '@/infrastructure/adapters/auth/GoTrueAuthAdapter';
import { KeycloakAuthAdapter } from '@/infrastructure/adapters/auth/KeycloakAuthAdapter';
import { LocalAuthAdapter } from '@/infrastructure/local/LocalAuthAdapter';

// ================================================================
// 4. IMPORTS – LOCAL ADAPTERS (mocks)
// ================================================================

import {
  LocalNotificationAdapter,
  LocalOAuthProviderAdapter,
  LocalStorageAdapter,
} from '@/infrastructure/adapters/local';

// ================================================================
// 5. IMPORTS – STORAGE ADAPTERS
// ================================================================

import { S3StorageAdapter } from '@/infrastructure/adapters/storage/S3StorageAdapter';

// ================================================================
// 6. IMPORTS – CLIENTS
// ================================================================

import { PostgrestClient } from '@/infrastructure/postgrest/PostgrestClient';

// ================================================================
// 7. IMPORTS – INTERFACES
// ================================================================

import { IStorageProvider } from '@/domain/interfaces/IStorageProvider';
import { IStorageRepository } from '@/domain/repositories/IStorageRepository';
import { StorageProviderToRepositoryAdapter } from '@/infrastructure/adapters/storage/StorageProviderToRepositoryAdapter';
import { IAlertRepository } from '@/domain/repositories/IAlertRepository';
import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import { IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';
import { IComplianceRepository } from '@/domain/repositories/IComplianceRepository';
import { IContactMessageRepository } from '@/domain/repositories/IContactMessageRepository';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import { IHierarchyRepository } from '@/domain/repositories/IHierarchyRepository';
import { IInspectionExecutionRepository } from '@/domain/repositories/IInspectionExecutionRepository';
import { IInspectionPaymentValidationRepository } from '@/domain/repositories/IInspectionPaymentValidationRepository';
import { IInspectionPermissionRepository } from '@/domain/repositories/IInspectionPermissionRepository';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { IInspectionSchedulingRepository } from '@/domain/repositories/IInspectionSchedulingRepository';
import { IInsuranceRepository } from '@/domain/repositories/IInsuranceRepository';
import { ILoadDataRepository } from '@/domain/repositories/ILoadDataRepository';
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { IMilestoneRepository } from '@/domain/repositories/IMilestoneRepository';
import { IMissionExpenseRepository } from '@/domain/repositories/IMissionExpenseRepository';
import { IMonitoringRepository } from '@/domain/repositories/IMonitoringRepository';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { IOAuthProviderRepository } from '@/domain/repositories/IOAuthProviderRepository';
import { IParsedInvoiceRepository } from '@/domain/repositories/IParsedInvoiceRepository';
import { IPaymentBlockingRepository } from '@/domain/repositories/IPaymentBlockingRepository';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { IProjectBudgetLinkRepository } from '@/domain/repositories/IProjectBudgetLinkRepository';
import { IProjectFormRepository } from '@/domain/repositories/IProjectFormRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import { IProjectStrategyLinkRepository } from '@/domain/repositories/IProjectStrategyLinkRepository';
import { IPVGeneratorRepository } from '@/domain/repositories/IPVGeneratorRepository';
import { IQuantityTakeoffRepository } from '@/domain/repositories/IQuantityTakeoffRepository';
import { IReportDataTransformerRepository } from '@/domain/repositories/IReportDataTransformerRepository';
import { IReportingRepository } from '@/domain/repositories/IReportingRepository';
import { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import { IStakeholderRepository } from '@/domain/repositories/IStakeholderRepository';
import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { ITaskAssignmentRepository } from '@/domain/repositories/ITaskAssignmentRepository';
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { ITenderDocumentRepository } from '@/domain/repositories/ITenderDocumentRepository';
import { ITenderEstimateRepository } from '@/domain/repositories/ITenderEstimateRepository';
import { ITenderRepository } from '@/domain/repositories/ITenderRepository';
import { ITenderSharingRepository } from '@/domain/repositories/ITenderSharingRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IWorkspaceRepository } from '@/domain/repositories/IWorkspaceRepository';
import { ILocationRepository } from '@/domain/repositories/LocationRepository';

// ================================================================
// 8. RESOLVE FUNCTIONS
// ================================================================

function resolveAuth(): AuthProviderKind {
  const config = getAppConfig();
  return config.auth.provider as AuthProviderKind;
}

function resolveData(): DataProviderKind {
  const config = getAppConfig();
  return config.database.provider as DataProviderKind;
}

function resolveStorage(): StorageProviderKind {
  const config = getAppConfig();
  return config.storage.provider as StorageProviderKind;
}

// ================================================================
// 9. REGISTRY (lazy loading)
// ================================================================

interface RepositoryRegistry {
  auth?: IAuthRepository;
  storage?: IStorageProvider;
  storageRepository?: IStorageRepository;
  notifications?: INotificationRepository;
  oauthProvider?: IOAuthProviderRepository;
  project?: IProjectRepository;
  phase?: IPhaseRepository;
  task?: ITaskRepository;
  material?: IMaterialRepository;
  document?: IDocumentRepository;
  inspection?: IInspectionRepository;
  payment?: IPaymentRepository;
  tender?: ITenderRepository;
  user?: IUserRepository;
  employee?: IEmployeeRepository;
  risk?: IRiskRepository;
  supplier?: ISupplierRepository;
  hierarchy?: IHierarchyRepository;
  inspectionScheduling?: IInspectionSchedulingRepository;
  quantityTakeoff?: IQuantityTakeoffRepository;
  inspectionExecution?: IInspectionExecutionRepository;
  inspectionPaymentValidation?: IInspectionPaymentValidationRepository;
  loadData?: ILoadDataRepository;
  bankGuarantee?: IBankGuaranteeRepository;
  pvGenerator?: IPVGeneratorRepository;
  insurance?: IInsuranceRepository;
  reporting?: IReportingRepository;
  reportDataTransformer?: IReportDataTransformerRepository;
  projectForm?: IProjectFormRepository;
  parsedInvoice?: IParsedInvoiceRepository;
  inspectionPermission?: IInspectionPermissionRepository;
  tenderDocument?: ITenderDocumentRepository;
  milestone?: IMilestoneRepository;
  tenderEstimate?: ITenderEstimateRepository;
  contactMessage?: IContactMessageRepository;
  location?: ILocationRepository;
  projectStakeholder?: IProjectStakeholderRepository;
  stakeholder?: IStakeholderRepository;
  missionExpense?: IMissionExpenseRepository;
  compliance?: IComplianceRepository;
  monitoring?: IMonitoringRepository;
  workspace?: IWorkspaceRepository;
  alert?: IAlertRepository;
  tenderSharing?: ITenderSharingRepository;
  projectStrategyLink?: IProjectStrategyLinkRepository;
  projectBudgetLink?: IProjectBudgetLinkRepository;
  paymentBlocking?: IPaymentBlockingRepository;
  taskAssignment?: ITaskAssignmentRepository;
}

const registry: RepositoryRegistry = {};

// ================================================================
// 10. REPOSITORY FACTORY
// ================================================================

export class RepositoryFactory {
  private static postgrestClient?: PostgrestClient;

  // ---------- AUTH ----------
  static getAuthRepository(): IAuthRepository {
    if (registry.auth) return registry.auth;

    const authKind = resolveAuth();
    switch (authKind) {
      case 'local':
        registry.auth = new LocalAuthAdapter();
        break;
      case 'gotrue':
        registry.auth = new GoTrueAuthAdapter(
          import.meta.env.VITE_GOTRUE_URL || '',
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        );
        break;
      case 'keycloak':
        registry.auth = new KeycloakAuthAdapter({
          url: import.meta.env.VITE_KEYCLOAK_URL || '',
          realm: import.meta.env.VITE_KEYCLOAK_REALM || '',
          clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || '',
        });
        break;
      case 'supabase':
      default:
        registry.auth = new SupabaseAuthAdapter();
        break;
    }
    return registry.auth;
  }

  // ---------- STORAGE ----------
  static getStorageProvider(): IStorageProvider {
    if (registry.storage) return registry.storage;

    const storageKind = resolveStorage();
    switch (storageKind) {
      case 'local':
        registry.storage = new LocalStorageAdapter();
        break;
      case 's3':
      case 'minio':
        registry.storage = new S3StorageAdapter({
          endpoint: import.meta.env.VITE_STORAGE_ENDPOINT || '',
          bucket: import.meta.env.VITE_STORAGE_BUCKET || 'documents',
          region: import.meta.env.VITE_STORAGE_REGION,
        });
        break;
      case 'supabase':
      default:
        registry.storage = new SupabaseStorageAdapter();
        break;
    }
    return registry.storage;
  }

  static getStorageRepository(): IStorageRepository {
    if (!registry.storageRepository) {
      registry.storageRepository = new StorageProviderToRepositoryAdapter(
        this.getStorageProvider()
      );
    }
    return registry.storageRepository;
  }


  // ---------- NOTIFICATIONS ----------
  static getNotificationRepository(): INotificationRepository {
    if (registry.notifications) return registry.notifications;

    const dataKind = resolveData();
    if (dataKind === 'local' || DEV_MODE) {
      registry.notifications = new LocalNotificationAdapter();
    } else {
      registry.notifications = new SupabaseNotificationAdapter();
    }
    return registry.notifications;
  }

  // ---------- OAUTH PROVIDER ----------
  static getOAuthProviderRepository(): IOAuthProviderRepository {
    if (registry.oauthProvider) return registry.oauthProvider;

    const dataKind = resolveData();
    if (dataKind === 'local' || DEV_MODE) {
      registry.oauthProvider = new LocalOAuthProviderAdapter();
    } else {
      registry.oauthProvider = new SupabaseOAuthProviderAdapter();
    }
    return registry.oauthProvider;
  }

  // ---------- POSTGREST CLIENT ----------
  static getPostgrestClient(): PostgrestClient {
    if (this.postgrestClient) return this.postgrestClient;

    this.postgrestClient = new PostgrestClient({
      baseUrl: import.meta.env.VITE_POSTGREST_URL || '',
      apiKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      defaultSchema: import.meta.env.VITE_BTP_SCHEMA || 'public',
      getToken: () => {
        const session =
          localStorage.getItem('gotrue_session') ||
          localStorage.getItem('keycloak_session') ||
          localStorage.getItem('dev_session');
        if (!session) return null;
        try {
          return JSON.parse(session)?.access_token ?? null;
        } catch {
          return null;
        }
      },
    });
    return this.postgrestClient;
  }

  // ---------- CORE REPOSITORIES ----------
  static getProjectRepository(): IProjectRepository {
    if (registry.project) return registry.project;
    registry.project = new SupabaseProjectAdapter();
    return registry.project;
  }

  static getPhaseRepository(): IPhaseRepository {
    if (registry.phase) return registry.phase;
    registry.phase = new SupabasePhaseAdapter();
    return registry.phase;
  }

  static getTaskRepository(): ITaskRepository {
    if (registry.task) return registry.task;
    registry.task = new SupabaseTaskAdapter();
    return registry.task;
  }

  static getMaterialRepository(): IMaterialRepository {
    if (registry.material) return registry.material;
    registry.material = new SupabaseMaterialAdapter();
    return registry.material;
  }

  static getDocumentRepository(): IDocumentRepository {
    if (registry.document) return registry.document;
    registry.document = new SupabaseDocumentAdapter();
    return registry.document;
  }

  static getInspectionRepository(): IInspectionRepository {
    if (registry.inspection) return registry.inspection;
    registry.inspection = new SupabaseInspectionAdapter();
    return registry.inspection;
  }

  static getPaymentRepository(): IPaymentRepository {
    if (registry.payment) return registry.payment;
    registry.payment = new SupabasePaymentAdapter();
    return registry.payment;
  }

  static getTenderRepository(): ITenderRepository {
    if (registry.tender) return registry.tender;
    registry.tender = new SupabaseTenderAdapter();
    return registry.tender;
  }

  static getUserRepository(): IUserRepository {
    if (registry.user) return registry.user;
    registry.user = new SupabaseUserAdapter();
    return registry.user;
  }

  static getEmployeeRepository(): IEmployeeRepository {
    if (registry.employee) return registry.employee;
    registry.employee = new SupabaseEmployeeAdapter();
    return registry.employee;
  }

  static getRiskRepository(): IRiskRepository {
    if (registry.risk) return registry.risk;
    registry.risk = new SupabaseRiskAdapter();
    return registry.risk;
  }

  static getSupplierRepository(): ISupplierRepository {
    if (registry.supplier) return registry.supplier;
    registry.supplier = new SupabaseSupplierAdapter();
    return registry.supplier;
  }

  static getHierarchyRepository(): IHierarchyRepository {
    if (registry.hierarchy) return registry.hierarchy;
    registry.hierarchy = new SupabaseHierarchyAdapter();
    return registry.hierarchy;
  }

  // ---------- INSPECTION & QUALITY ----------
  static getInspectionSchedulingRepository(): IInspectionSchedulingRepository {
    if (registry.inspectionScheduling) return registry.inspectionScheduling;
    registry.inspectionScheduling = new InspectionSchedulingAdapter();
    return registry.inspectionScheduling;
  }

  static getInspectionExecutionRepository(): IInspectionExecutionRepository {
    if (registry.inspectionExecution) return registry.inspectionExecution;
    registry.inspectionExecution = new SupabaseInspectionExecutionAdapter();
    return registry.inspectionExecution;
  }

  static getInspectionPaymentValidationRepository(): IInspectionPaymentValidationRepository {
    if (registry.inspectionPaymentValidation) return registry.inspectionPaymentValidation;
    registry.inspectionPaymentValidation = new SupabaseInspectionPaymentValidationAdapter();
    return registry.inspectionPaymentValidation;
  }

  static getInspectionPermissionRepository(): IInspectionPermissionRepository {
    if (registry.inspectionPermission) return registry.inspectionPermission;
    registry.inspectionPermission = new SupabaseInspectionPermissionAdapter();
    return registry.inspectionPermission;
  }

  // ---------- TENDER & PROCUREMENT ----------
  static getTenderEstimateRepository(): ITenderEstimateRepository {
    if (registry.tenderEstimate) return registry.tenderEstimate;
    registry.tenderEstimate = new TenderEstimateAdapter();
    return registry.tenderEstimate;
  }

  static getTenderDocumentRepository(): ITenderDocumentRepository {
    if (registry.tenderDocument) return registry.tenderDocument;
    registry.tenderDocument = new SupabaseTenderDocumentAdapter();
    return registry.tenderDocument;
  }

  static getTenderSharingRepository(): ITenderSharingRepository {
    if (registry.tenderSharing) return registry.tenderSharing;
    registry.tenderSharing = new SupabaseTenderSharingAdapter();
    return registry.tenderSharing;
  }

  // ---------- FINANCIAL ----------
  static getPaymentBlockingRepository(): IPaymentBlockingRepository {
    if (registry.paymentBlocking) return registry.paymentBlocking;
    registry.paymentBlocking = new PaymentBlockingAdapter();
    return registry.paymentBlocking;
  }

  static getBankGuaranteeRepository(): IBankGuaranteeRepository {
    if (registry.bankGuarantee) return registry.bankGuarantee;
    registry.bankGuarantee = new BankGuaranteeAdapter();
    return registry.bankGuarantee;
  }

  static getPVGeneratorRepository(): IPVGeneratorRepository {
    if (registry.pvGenerator) return registry.pvGenerator;
    registry.pvGenerator = new PVGeneratorAdapter();
    return registry.pvGenerator;
  }

  static getInsuranceRepository(): IInsuranceRepository {
    if (registry.insurance) return registry.insurance;
    registry.insurance = new SupabaseInsuranceAdapter();
    return registry.insurance;
  }

  static getParsedInvoiceRepository(): IParsedInvoiceRepository {
    if (registry.parsedInvoice) return registry.parsedInvoice;
    registry.parsedInvoice = new SupabaseParsedInvoiceAdapter();
    return registry.parsedInvoice;
  }

  // ---------- REPORTS & ANALYTICS ----------
  static getReportingRepository(): IReportingRepository {
    if (registry.reporting) return registry.reporting;
    registry.reporting = new SupabaseReportingAdapter();
    return registry.reporting;
  }

  static getReportDataTransformerRepository(): IReportDataTransformerRepository {
    if (registry.reportDataTransformer) return registry.reportDataTransformer;
    registry.reportDataTransformer = new SupabaseReportDataTransformerAdapter();
    return registry.reportDataTransformer;
  }

  static getProjectFormRepository(): IProjectFormRepository {
    if (registry.projectForm) return registry.projectForm;
    registry.projectForm = new SupabaseProjectFormAdapter();
    return registry.projectForm;
  }

  static getLoadDataRepository(): ILoadDataRepository {
    if (registry.loadData) return registry.loadData;
    registry.loadData = new SupabaseLoadDataAdapter();
    return registry.loadData;
  }

  static getQuantityTakeoffRepository(): IQuantityTakeoffRepository {
    if (registry.quantityTakeoff) return registry.quantityTakeoff;
    registry.quantityTakeoff = new SupabaseQuantityTakeoffAdapter();
    return registry.quantityTakeoff;
  }

  // ---------- HR & STAKEHOLDERS ----------
  static getProjectStakeholderRepository(): IProjectStakeholderRepository {
    if (registry.projectStakeholder) return registry.projectStakeholder;
    registry.projectStakeholder = new SupabaseProjectStakeholderAdapter();
    return registry.projectStakeholder;
  }

  static getStakeholderRepository(): IStakeholderRepository {
    if (registry.stakeholder) return registry.stakeholder;
    registry.stakeholder = new SupabaseStakeholderAdapter();
    return registry.stakeholder;
  }

  static getMissionExpenseRepository(): IMissionExpenseRepository {
    if (registry.missionExpense) return registry.missionExpense;
    registry.missionExpense = new SupabaseMissionExpenseAdapter();
    return registry.missionExpense;
  }

  // ---------- ALERTS & COMPLIANCE ----------
  static getAlertRepository(): IAlertRepository {
    if (registry.alert) return registry.alert;
    registry.alert = new SupabaseAlertAdapter();
    return registry.alert;
  }

  static getComplianceRepository(): IComplianceRepository {
    if (registry.compliance) return registry.compliance;
    registry.compliance = new SupabaseComplianceAdapter();
    return registry.compliance;
  }

  static getMilestoneRepository(): IMilestoneRepository {
    if (registry.milestone) return registry.milestone;
    registry.milestone = new SupabaseMilestoneAdapter();
    return registry.milestone;
  }

  static getTaskAssignmentRepository(): ITaskAssignmentRepository {
    if (registry.taskAssignment) return registry.taskAssignment;
    registry.taskAssignment = new TaskAssignmentAdapter();
    return registry.taskAssignment;
  }

  // ---------- WORKSPACE & LOCATION ----------
  static getWorkspaceRepository(): IWorkspaceRepository {
    if (registry.workspace) return registry.workspace;
    registry.workspace = new SupabaseWorkspaceAdapter();
    return registry.workspace;
  }

  static getLocationRepository(): ILocationRepository {
    if (registry.location) return registry.location;
    registry.location = new LocationRepository();
    return registry.location;
  }

  static getContactMessageRepository(): IContactMessageRepository {
    if (registry.contactMessage) return registry.contactMessage;
    registry.contactMessage = new SupabaseContactMessageAdapter();
    return registry.contactMessage;
  }

  // ---------- STRATEGY & BUDGET LINKS ----------
  static getProjectStrategyLinkRepository(): IProjectStrategyLinkRepository {
    if (registry.projectStrategyLink) return registry.projectStrategyLink;
    registry.projectStrategyLink = new SupabaseProjectStrategyLinkAdapter();
    return registry.projectStrategyLink;
  }

  static getProjectBudgetLinkRepository(): IProjectBudgetLinkRepository {
    if (registry.projectBudgetLink) return registry.projectBudgetLink;
    registry.projectBudgetLink = new SupabaseProjectBudgetLinkAdapter();
    return registry.projectBudgetLink;
  }

  // ---------- MONITORING ----------
  static getMonitoringRepository(): IMonitoringRepository {
    if (registry.monitoring) return registry.monitoring;
    registry.monitoring = new SupabaseMonitoringAdapter();
    return registry.monitoring;
  }

  // ---------- UTILITAIRES ----------
  static reset(): void {
    Object.keys(registry).forEach((key) => {
      delete registry[key as keyof RepositoryRegistry];
    });
    this.postgrestClient = undefined;
  }

  static getDataKind(): DataProviderKind {
    return resolveData();
  }

  static getAuthKind(): AuthProviderKind {
    return resolveAuth();
  }

  static getStorageKind(): StorageProviderKind {
    return resolveStorage();
  }

  static init(): void {
    const errors = validateProviders({
      auth: resolveAuth(),
      data: resolveData(),
      storage: resolveStorage(),
    });
    if (errors.length) {
      throw new Error(errors.join(' / '));
    }
  }
}