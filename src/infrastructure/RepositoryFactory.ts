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
import { DEV_MODE, IS_LOCAL_BYPASS } from '@/config/constants';

// ================================================================
// 1. TYPES
// ================================================================

export type AuthProviderKind = 'supabase' | 'gotrue' | 'keycloak' | 'local';
export type DataProviderKind = 'supabase' | 'postgrest' | 'local';
export type StorageProviderKind = 'supabase' | 's3' | 'minio' | 'local';

// ================================================================
// 2. IMPORTS – INTERFACES (PORTS)
// ================================================================

import type { IStorageProvider } from '@/domain/interfaces/IStorageProvider';
import type { IAlertRepository } from '@/domain/repositories/IAlertRepository';
import type { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import type { IUserRoleRepository } from '@/domain/repositories/IUserRoleRepository';  // ✅ NOUVEAU
import type { IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';
import type { IBoqDocumentHeaderRepository } from '@/domain/repositories/IBoqDocumentHeaderRepository';
import type { IComplianceRepository } from '@/domain/repositories/IComplianceRepository';
import type { IContactMessageRepository } from '@/domain/repositories/IContactMessageRepository';
import type { IDecompteRepository } from '@/domain/repositories/IDecompteRepository';
import type { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import type { IDocumentValidationLogRepository } from '@/domain/repositories/IDocumentValidationLogRepository';
import type { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import type { IEscalationThresholdRepository } from '@/domain/repositories/IEscalationThresholdRepository';
import type { IHierarchyRepository } from '@/domain/repositories/IHierarchyRepository';
import type { IInspectionExecutionRepository } from '@/domain/repositories/IInspectionExecutionRepository';
import type { IInspectionPaymentValidationRepository } from '@/domain/repositories/IInspectionPaymentValidationRepository';
import type { IInspectionPermissionRepository } from '@/domain/repositories/IInspectionPermissionRepository';
import type { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import type { IInspectionSchedulingRepository } from '@/domain/repositories/IInspectionSchedulingRepository';
import type { IInsuranceRepository } from '@/domain/repositories/IInsuranceRepository';
import type { ILoadDataRepository } from '@/domain/repositories/ILoadDataRepository';
import type { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import type { IMilestoneRepository } from '@/domain/repositories/IMilestoneRepository';
import type { IMonitoringRepository } from '@/domain/repositories/IMonitoringRepository';
import type { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import type { IOAuthProviderRepository } from '@/domain/repositories/IOAuthProviderRepository';
import type { IOrganizationHierarchyRepository } from '@/domain/repositories/IOrganizationHierarchyRepository';
import type { IOrganizationRepository } from '@/domain/repositories/IOrganizationRepository';
import type { IParsedInvoiceRepository } from '@/domain/repositories/IParsedInvoiceRepository';
import type { IPaymentBlockingRepository } from '@/domain/repositories/IPaymentBlockingRepository';
import type { IPaymentBlockRepository } from '@/domain/repositories/IPaymentBlockRepository';
import type { IPaymentControlActionRepository } from '@/domain/repositories/IPaymentControlActionRepository';
import type { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import type { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import type { IProjectBudgetLinkRepository } from '@/domain/repositories/IProjectBudgetLinkRepository';
import type { IProjectFormRepository } from '@/domain/repositories/IProjectFormRepository';
import type { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import type { IProjectResourceRepository } from '@/domain/repositories/IProjectResourceRepository';
import type { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import type { IProjectStrategyLinkRepository } from '@/domain/repositories/IProjectStrategyLinkRepository';
import type { IPVGeneratorRepository } from '@/domain/repositories/IPVGeneratorRepository';
import type { IQuantityTakeoffRepository } from '@/domain/repositories/IQuantityTakeoffRepository';
import type { IRealtimeRepository } from '@/domain/repositories/IRealtimeRepository';
import type { IReportDataTransformerRepository } from '@/domain/repositories/IReportDataTransformerRepository';
import type { IReportingRepository } from '@/domain/repositories/IReportingRepository';
import type { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import type { IRiskTaskRelationRepository } from '@/domain/repositories/IRiskTaskRelationRepository';
import type { IStakeholderRepository } from '@/domain/repositories/IStakeholderRepository';
import type { IStorageRepository } from '@/domain/repositories/IStorageRepository';
import type { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import type { ISystemSettingsRepository } from '@/domain/repositories/ISystemSettingsRepository';
import type { ITaskAssignmentRepository } from '@/domain/repositories/ITaskAssignmentRepository';
import type { ITaskDependencyRepository } from '@/domain/repositories/ITaskDependencyRepository';
import type { ITenderDocumentRepository } from '@/domain/repositories/ITenderDocumentRepository';
import type { ITenderEstimateRepository } from '@/domain/repositories/ITenderEstimateRepository';
import type { ITenderRepository } from '@/domain/repositories/ITenderRepository';
import type { ITenderSharingRepository } from '@/domain/repositories/ITenderSharingRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import type { IWorkspaceRepository } from '@/domain/repositories/IWorkspaceRepository';
import type { ILocationRepository } from '@/domain/repositories/LocationRepository';
import type { IPhaseEmployeeRepository } from '@/domain/repositories/IPhaseEmployeeRepository';
import type { IPhaseMaterialRepository } from '@/domain/repositories/IPhaseMaterialRepository';

// ================================================================
// 3. IMPORTS – SUPABASE ADAPTERS
// ================================================================

import { SupabaseAlertAdapter } from '@/infrastructure/adapters/supabase/SupabaseAlertAdapter';
import { SupabaseAuthAdapter } from '@/infrastructure/adapters/supabase/SupabaseAuthAdapter';
import { SupabaseComplianceAdapter } from '@/infrastructure/adapters/supabase/SupabaseComplianceAdapter';
import { SupabaseContactMessageAdapter } from '@/infrastructure/adapters/supabase/SupabaseContactMessageAdapter';
import { SupabaseDecompteAdapter } from '@/infrastructure/adapters/supabase/SupabaseDecompteAdapter';
import { SupabaseDocumentAdapter } from '@/infrastructure/adapters/supabase/SupabaseDocumentAdapter';
import { SupabaseEmployeeAdapter } from '@/infrastructure/adapters/supabase/SupabaseEmployeeAdapter';
import { SupabaseHierarchyAdapter } from '@/infrastructure/adapters/supabase/SupabaseHierarchyAdapter';
import { SupabaseInspectionAdapter } from '@/infrastructure/adapters/supabase/SupabaseInspectionAdapter';
import { SupabaseInspectionExecutionAdapter } from '@/infrastructure/adapters/supabase/SupabaseInspectionExecutionAdapter';
import { SupabaseInspectionPaymentValidationAdapter } from '@/infrastructure/adapters/supabase/SupabaseInspectionPaymentValidationAdapter';
import { SupabaseInspectionPermissionAdapter } from '@/infrastructure/adapters/supabase/SupabaseInspectionPermissionAdapter';
import { SupabaseInsuranceAdapter } from '@/infrastructure/adapters/supabase/SupabaseInsuranceAdapter';
import { SupabaseLoadDataAdapter } from '@/infrastructure/adapters/supabase/SupabaseLoadDataAdapter';
import { SupabaseMaterialAdapter } from '@/infrastructure/adapters/supabase/SupabaseMaterialAdapter';
import { SupabaseMilestoneAdapter } from '@/infrastructure/adapters/supabase/SupabaseMilestoneAdapter';
import { SupabaseMonitoringAdapter } from '@/infrastructure/adapters/supabase/SupabaseMonitoringAdapter';
import { SupabaseNotificationAdapter } from '@/infrastructure/adapters/supabase/SupabaseNotificationAdapter';
import { SupabaseParsedInvoiceAdapter } from '@/infrastructure/adapters/supabase/SupabaseParsedInvoiceAdapter';
import { SupabasePaymentAdapter } from '@/infrastructure/adapters/supabase/SupabasePaymentAdapter';
import { SupabasePaymentBlockAdapter } from '@/infrastructure/adapters/supabase/SupabasePaymentBlockAdapter';
import { SupabasePaymentControlActionAdapter } from '@/infrastructure/adapters/supabase/SupabasePaymentControlActionAdapter';
import { SupabasePhaseAdapter } from '@/infrastructure/adapters/supabase/SupabasePhaseAdapter';
import { SupabasePhaseEmployeeAdapter } from '@/infrastructure/adapters/supabase/SupabasePhaseEmployeeAdapter';
import { SupabasePhaseMaterialAdapter } from '@/infrastructure/adapters/supabase/SupabasePhaseMaterialAdapter';
import { SupabaseProjectAdapter } from '@/infrastructure/adapters/supabase/SupabaseProjectAdapter';
import { SupabaseProjectBudgetLinkAdapter } from '@/infrastructure/adapters/supabase/SupabaseProjectBudgetLinkAdapter';
import { SupabaseProjectFormAdapter } from '@/infrastructure/adapters/supabase/SupabaseProjectFormAdapter';
import { SupabaseProjectStakeholderAdapter } from '@/infrastructure/adapters/supabase/SupabaseProjectStakeholderAdapter';
import { SupabaseProjectStrategyLinkAdapter } from '@/infrastructure/adapters/supabase/SupabaseProjectStrategyLinkAdapter';
import { SupabaseQuantityTakeoffAdapter } from '@/infrastructure/adapters/supabase/SupabaseQuantityTakeoffAdapter';
import { SupabaseReportDataTransformerAdapter } from '@/infrastructure/adapters/supabase/SupabaseReportDataTransformerAdapter';
import { SupabaseReportingAdapter } from '@/infrastructure/adapters/supabase/SupabaseReportingAdapter';
import { SupabaseRiskAdapter } from '@/infrastructure/adapters/supabase/SupabaseRiskAdapter';
import { SupabaseRiskTaskRelationAdapter } from '@/infrastructure/adapters/supabase/SupabaseRiskTaskRelationAdapter';
import { SupabaseStakeholderAdapter } from '@/infrastructure/adapters/supabase/SupabaseStakeholderAdapter';
import { SupabaseSupplierAdapter } from '@/infrastructure/adapters/supabase/SupabaseSupplierAdapter';
import { SupabaseTenderAdapter } from '@/infrastructure/adapters/supabase/SupabaseTenderAdapter';
import { SupabaseTenderDocumentAdapter } from '@/infrastructure/adapters/supabase/SupabaseTenderDocumentAdapter';
import { SupabaseTenderSharingAdapter } from '@/infrastructure/adapters/supabase/SupabaseTenderSharingAdapter';
import { SupabaseUserRepositoryAdapter } from '@/infrastructure/adapters/supabase/SupabaseUserRepositoryAdapter';
import { SupabaseUserRoleAdapter } from '@/infrastructure/adapters/supabase/SupabaseUserRoleAdapter';  // ✅ NOUVEAU
import { SupabaseWorkspaceAdapter } from '@/infrastructure/adapters/supabase/SupabaseWorkspaceAdapter';

import { BankGuaranteeAdapter } from '@/infrastructure/adapters/supabase/BankGuaranteeAdapter';
import { InspectionSchedulingAdapter } from '@/infrastructure/adapters/supabase/InspectionSchedulingAdapter';
import { LocationRepository } from '@/infrastructure/adapters/supabase/LocationRepository';
import { PaymentBlockingAdapter } from '@/infrastructure/adapters/supabase/PaymentBlockingAdapter';
import { PVGeneratorAdapter } from '@/infrastructure/adapters/supabase/PVGeneratorAdapter';
import { SupabaseOAuthProviderAdapter } from '@/infrastructure/adapters/supabase/SupabaseOAuthProviderAdapter';
import { SupabaseRealtimeAdapter } from '@/infrastructure/adapters/supabase/SupabaseRealtimeAdapter';
import { SupabaseStorageAdapter } from '@/infrastructure/adapters/supabase/SupabaseStorageAdapter';
import { TaskAssignmentAdapter } from '@/infrastructure/adapters/supabase/TaskAssignmentAdapter';
import { TenderEstimateAdapter } from '@/infrastructure/adapters/supabase/TenderEstimateAdapter';

import { NotificationGatewayAdapter, notificationGatewayAdapter } from '@/infrastructure/adapters/supabase/NotificationGatewayAdapter';
import { SupabaseOrganizationAdapter } from '@/infrastructure/adapters/supabase/SupabaseOrganizationAdapter';
import { SupabaseOrganizationHierarchyAdapter } from '@/infrastructure/adapters/supabase/SupabaseOrganizationHierarchyAdapter';
import { SupabaseEscalationThresholdAdapter } from '@/infrastructure/adapters/supabase/SupabaseEscalationThresholdAdapter';
import { SupabaseProjectResourceAdapter } from '@/infrastructure/adapters/supabase/SupabaseProjectResourceAdapter';
import { SupabaseSystemSettingsAdapter } from '@/infrastructure/adapters/supabase/SupabaseSystemSettingsAdapter';
import { SupabaseTaskDependencyAdapter } from '@/infrastructure/adapters/supabase/SupabaseTaskDependencyAdapter';
import { SupabaseDocumentValidationLogAdapter } from '@/infrastructure/adapters/supabase/SupabaseDocumentValidationLogAdapter';
import { SupabaseBoqDocumentHeaderAdapter } from '@/infrastructure/adapters/supabase/SupabaseBoqDocumentHeaderAdapter';

// ================================================================
// 4. IMPORTS – AUTH ADAPTERS
// ================================================================

import { GoTrueAuthAdapter } from '@/infrastructure/adapters/auth/GoTrueAuthAdapter';
import { KeycloakAuthAdapter } from '@/infrastructure/adapters/auth/KeycloakAuthAdapter';
import { LocalAuthAdapter } from '@/infrastructure/adapters/local/LocalAuthAdapter';

// ================================================================
// 5. IMPORTS – LOCAL ADAPTERS
// ================================================================

import {
  LocalAlertAdapter,
  LocalNotificationAdapter,
  LocalOAuthProviderAdapter,
  LocalStorageAdapter,
} from '@/infrastructure/adapters/local';

// ================================================================
// 6. IMPORTS – STORAGE ADAPTERS
// ================================================================

import { S3StorageAdapter } from '@/infrastructure/adapters/storage/S3StorageAdapter';
import { StorageProviderToRepositoryAdapter } from '@/infrastructure/adapters/storage/StorageProviderToRepositoryAdapter';

// ================================================================
// 7. IMPORTS – CLIENTS
// ================================================================

import { PostgrestClient } from '@/infrastructure/adapters/postgrest/PostgrestClient';

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
  userRole?: IUserRoleRepository;  // ✅ NOUVEAU
  storage?: IStorageProvider;
  storageRepository?: IStorageRepository;
  notifications?: INotificationRepository;
  oauthProvider?: IOAuthProviderRepository;
  project?: IProjectRepository;
  phase?: IPhaseRepository;
  material?: IMaterialRepository;
  document?: IDocumentRepository;
  documentValidationLog?: IDocumentValidationLogRepository;
  inspection?: IInspectionRepository;
  payment?: IPaymentRepository;
  decompte?: IDecompteRepository;
  tender?: ITenderRepository;
  user?: IUserRepository;
  employee?: IEmployeeRepository;
  risk?: IRiskRepository;
  riskTaskRelation?: IRiskTaskRelationRepository;
  supplier?: ISupplierRepository;
  hierarchy?: IHierarchyRepository;
  organization?: IOrganizationRepository;
  organizationHierarchy?: IOrganizationHierarchyRepository;
  inspectionScheduling?: IInspectionSchedulingRepository;
  quantityTakeoff?: IQuantityTakeoffRepository;
  phaseMaterial?: IPhaseMaterialRepository;
  phaseEmployee?: IPhaseEmployeeRepository;
  projectResource?: IProjectResourceRepository;
  taskDependency?: ITaskDependencyRepository;
  systemSettings?: ISystemSettingsRepository;
  escalationThreshold?: IEscalationThresholdRepository;
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
  compliance?: IComplianceRepository;
  monitoring?: IMonitoringRepository;
  workspace?: IWorkspaceRepository;
  alert?: IAlertRepository;
  tenderSharing?: ITenderSharingRepository;
  projectStrategyLink?: IProjectStrategyLinkRepository;
  projectBudgetLink?: IProjectBudgetLinkRepository;
  paymentBlocking?: IPaymentBlockingRepository;
  paymentBlock?: IPaymentBlockRepository;
  paymentControlAction?: IPaymentControlActionRepository;
  taskAssignment?: ITaskAssignmentRepository;
  realtime?: IRealtimeRepository;
  boqDocumentHeader?: IBoqDocumentHeaderRepository;
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

  // ---------- USER ROLE ---------- ✅ NOUVEAU
  /**
   * Repository dédié à la gestion des rôles utilisateur (public.user_roles)
   * Séparé de getAuthRepository() (qui ne gère que l'auth)
   * Séparé de getUserRepository() (qui gère public.profiles)
   */
  static getUserRoleRepository(): IUserRoleRepository {
    if (registry.userRole) return registry.userRole;

    const dataKind = resolveData();
    if (dataKind === 'local' || IS_LOCAL_BYPASS) {
      // TODO: Créer LocalUserRoleAdapter si nécessaire
      // Fallback sur Supabase pour le moment
      registry.userRole = new SupabaseUserRoleAdapter();
    } else {
      registry.userRole = new SupabaseUserRoleAdapter();
    }
    return registry.userRole;
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

  // ---------- DOCUMENT VALIDATION LOGS ----------
  static getDocumentValidationLogRepository(): IDocumentValidationLogRepository {
    if (!registry.documentValidationLog) {
      registry.documentValidationLog = new SupabaseDocumentValidationLogAdapter();
    }
    return registry.documentValidationLog;
  }

  // ---------- ALERT ----------
  static getAlertRepository(): IAlertRepository {
    if (registry.alert) return registry.alert;

    const dataKind = resolveData();
    if (dataKind === 'local' || IS_LOCAL_BYPASS) {
      registry.alert = new LocalAlertAdapter();
    } else {
      registry.alert = new SupabaseAlertAdapter();
    }
    return registry.alert;
  }

  // ---------- NOTIFICATIONS ----------
  static getNotificationRepository(): INotificationRepository {
    if (registry.notifications) return registry.notifications;

    const dataKind = resolveData();
    if (dataKind === 'local' || IS_LOCAL_BYPASS) {
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
    if (dataKind === 'local' || IS_LOCAL_BYPASS) {
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

  // ================================================================
  // CORE REPOSITORIES
  // ================================================================

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

  static getOrganizationRepository(): IOrganizationRepository {
    if (registry.organization) return registry.organization;
    registry.organization = new SupabaseOrganizationAdapter();
    return registry.organization;
  }

  static getOrganizationHierarchyRepository(): IOrganizationHierarchyRepository {
    if (registry.organizationHierarchy) return registry.organizationHierarchy;
    registry.organizationHierarchy = new SupabaseOrganizationHierarchyAdapter();
    return registry.organizationHierarchy;
  }

  // ---------- TASK ASSIGNMENT ----------
  static getTaskAssignmentRepository(): ITaskAssignmentRepository {
    if (registry.taskAssignment) return registry.taskAssignment;
    registry.taskAssignment = new TaskAssignmentAdapter();
    return registry.taskAssignment;
  }

  static getUnifiedTaskAssignmentRepository(): ITaskAssignmentRepository {
    return RepositoryFactory.getTaskAssignmentRepository();
  }

  static getTaskRepository(): ITaskAssignmentRepository {
    return RepositoryFactory.getTaskAssignmentRepository();
  }

  static getMaterialRepository(): IMaterialRepository {
    if (registry.material) return registry.material;
    registry.material = new SupabaseMaterialAdapter();
    return registry.material;
  }

  static getNotificationGateway(): NotificationGatewayAdapter {
    return notificationGatewayAdapter;
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

  static getDecompteRepository(): IDecompteRepository {
    if (registry.decompte) return registry.decompte;
    registry.decompte = new SupabaseDecompteAdapter();
    return registry.decompte;
  }

  static getTenderRepository(): ITenderRepository {
    if (registry.tender) return registry.tender;
    registry.tender = new SupabaseTenderAdapter();
    return registry.tender;
  }

  static getUserRepository(): IUserRepository {
    if (registry.user) return registry.user;
    registry.user = new SupabaseUserRepositoryAdapter();
    return registry.user as IUserRepository;
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

  static getRiskTaskRelationRepository(): IRiskTaskRelationRepository {
    if (!registry.riskTaskRelation) {
      registry.riskTaskRelation = new SupabaseRiskTaskRelationAdapter();
    }
    return registry.riskTaskRelation;
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

  // ================================================================
  // INSPECTION & QUALITY
  // ================================================================

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

  // ================================================================
  // TENDER & PROCUREMENT
  // ================================================================

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

  // ================================================================
  // FINANCIAL
  // ================================================================

  static getPaymentBlockingRepository(): IPaymentBlockingRepository {
    if (registry.paymentBlocking) return registry.paymentBlocking;
    registry.paymentBlocking = new PaymentBlockingAdapter();
    return registry.paymentBlocking;
  }

  static getPaymentBlockRepository(): IPaymentBlockRepository {
    if (registry.paymentBlock) return registry.paymentBlock;
    registry.paymentBlock = new SupabasePaymentBlockAdapter();
    return registry.paymentBlock;
  }

  static getPaymentControlActionRepository(): IPaymentControlActionRepository {
    if (registry.paymentControlAction) return registry.paymentControlAction;
    registry.paymentControlAction = new SupabasePaymentControlActionAdapter();
    return registry.paymentControlAction;
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

  // ================================================================
  // REPORTS & ANALYTICS
  // ================================================================

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
    registry.projectForm = new SupabaseProjectFormAdapter() as unknown as IProjectFormRepository;
    return registry.projectForm;
  }

  static getLoadDataRepository(): ILoadDataRepository {
    if (registry.loadData) return registry.loadData;
    registry.loadData = new SupabaseLoadDataAdapter();
    return registry.loadData;
  }

  static getProjectResourceRepository(): IProjectResourceRepository {
    if (registry.projectResource) return registry.projectResource;
    registry.projectResource = new SupabaseProjectResourceAdapter();
    return registry.projectResource;
  }

  static getTaskDependencyRepository(): ITaskDependencyRepository {
    if (registry.taskDependency) return registry.taskDependency;
    registry.taskDependency = new SupabaseTaskDependencyAdapter();
    return registry.taskDependency;
  }

  static getSystemSettingsRepository(): ISystemSettingsRepository {
    if (registry.systemSettings) return registry.systemSettings;
    registry.systemSettings = new SupabaseSystemSettingsAdapter();
    return registry.systemSettings;
  }

  static getEscalationThresholdRepository(): IEscalationThresholdRepository {
    if (registry.escalationThreshold) return registry.escalationThreshold;
    registry.escalationThreshold = new SupabaseEscalationThresholdAdapter();
    return registry.escalationThreshold;
  }

  static getQuantityTakeoffRepository(): IQuantityTakeoffRepository {
    if (registry.quantityTakeoff) return registry.quantityTakeoff;
    registry.quantityTakeoff = new SupabaseQuantityTakeoffAdapter();
    return registry.quantityTakeoff;
  }

  static getPhaseEmployeeRepository(): IPhaseEmployeeRepository {
    if (registry.phaseEmployee) return registry.phaseEmployee;
    registry.phaseEmployee = new SupabasePhaseEmployeeAdapter();
    return registry.phaseEmployee;
  }

  static getPhaseMaterialRepository(): IPhaseMaterialRepository {
    if (registry.phaseMaterial) return registry.phaseMaterial;
    registry.phaseMaterial = new SupabasePhaseMaterialAdapter();
    return registry.phaseMaterial;
  }

  // ================================================================
  // HR & STAKEHOLDERS
  // ================================================================

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

  // ================================================================
  // COMPLIANCE & MONITORING
  // ================================================================

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

  // ================================================================
  // WORKSPACE & LOCATION
  // ================================================================

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

  // ================================================================
  // STRATEGY & BUDGET LINKS
  // ================================================================

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

  // ================================================================
  // MONITORING
  // ================================================================

  static getMonitoringRepository(): IMonitoringRepository {
    if (registry.monitoring) return registry.monitoring;
    registry.monitoring = new SupabaseMonitoringAdapter();
    return registry.monitoring;
  }

  // ================================================================
  // REALTIME
  // ================================================================

  static getRealtimeRepository(): IRealtimeRepository {
    if (registry.realtime) return registry.realtime;
    registry.realtime = new SupabaseRealtimeAdapter();
    return registry.realtime;
  }

  // ================================================================
  // BOQ DOCUMENT HEADER
  // ================================================================

  static getBoqDocumentHeaderRepository(): IBoqDocumentHeaderRepository {
    if (registry.boqDocumentHeader) return registry.boqDocumentHeader;
    registry.boqDocumentHeader = new SupabaseBoqDocumentHeaderAdapter();
    return registry.boqDocumentHeader;
  }

  // ================================================================
  // UTILITAIRES
  // ================================================================

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