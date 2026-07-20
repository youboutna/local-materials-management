/**
 
 file : src/repositories/RepositoryFactory.ts
 * Repository Factory - Wrapper Centralisé
 * Wrapper qui délègue au nouveau RepositoryFactory hexagonal
 * Maintient la compatibilité avec les imports existants
 */

import { RepositoryFactory as InfraRepositoryFactory } from "@/infrastructure/supabase/RepositoryFactory";

// Wrapper principal qui délègue au nouveau RepositoryFactory
export const RepositoryFactory = {
  // Délégation de toutes les méthodes du nouveau RepositoryFactory
  getProjectRepository: InfraRepositoryFactory.getProjectRepository,
  getPhaseRepository: InfraRepositoryFactory.getPhaseRepository,
  getHierarchyRepository: InfraRepositoryFactory.getHierarchyRepository,
  getInspectionSchedulingRepository: InfraRepositoryFactory.getInspectionSchedulingRepository,
  getInspectionRepository: InfraRepositoryFactory.getInspectionRepository,
  getPaymentRepository: InfraRepositoryFactory.getPaymentRepository,
  getTaskRepository: InfraRepositoryFactory.getTaskRepository,
  getMaterialRepository: InfraRepositoryFactory.getMaterialRepository,
  getEmployeeRepository: InfraRepositoryFactory.getEmployeeRepository,
  getRiskRepository: InfraRepositoryFactory.getRiskRepository,
  getTenderRepository: InfraRepositoryFactory.getTenderRepository,
  getSupplierRepository: InfraRepositoryFactory.getSupplierRepository,
  getDocumentRepository: InfraRepositoryFactory.getDocumentRepository,
  getQuantityTakeoffRepository: InfraRepositoryFactory.getQuantityTakeoffRepository,
  getInspectionExecutionRepository: InfraRepositoryFactory.getInspectionExecutionRepository,
  getInspectionPaymentValidationRepository: InfraRepositoryFactory.getInspectionPaymentValidationRepository,
  getLoadDataRepository: InfraRepositoryFactory.getLoadDataRepository,
  getBankGuaranteeRepository: InfraRepositoryFactory.getBankGuaranteeRepository,
  getPVGeneratorRepository: InfraRepositoryFactory.getPVGeneratorRepository,
  getInsuranceRepository: InfraRepositoryFactory.getInsuranceRepository,
  getReportingRepository: InfraRepositoryFactory.getReportingRepository,
  getReportDataTransformerRepository: InfraRepositoryFactory.getReportDataTransformerRepository,
  getProjectFormRepository: InfraRepositoryFactory.getProjectFormRepository,
  getUserRepository: InfraRepositoryFactory.getUserRepository,
  getAuthRepository: InfraRepositoryFactory.getAuthRepository,
  getStorageRepository: InfraRepositoryFactory.getStorageRepository,
  getParsedInvoiceRepository: InfraRepositoryFactory.getParsedInvoiceRepository,
  getNotificationRepository: InfraRepositoryFactory.getNotificationRepository,
  getInspectionPermissionRepository: InfraRepositoryFactory.getInspectionPermissionRepository,
  getTenderDocumentRepository: InfraRepositoryFactory.getTenderDocumentRepository,
  getMilestoneRepository: InfraRepositoryFactory.getMilestoneRepository,

  // Délégation au vrai adapter Supabase (l'ancienne implémentation mock
  // ne persistait rien — cause directe du bug "Failed to save tender").
  getTenderEstimateRepository: InfraRepositoryFactory.getTenderEstimateRepository,

  // Performance monitoring : pas encore d'adapter dédié côté infra,
  // on garde un fallback inerte qui retourne des métriques nulles plutôt
  // que des valeurs inventées. À remplacer par un vrai
  // SupabasePerformanceAdapter dès qu'on persiste les métriques.
  getPerformanceMonitoringRepository: () => ({
    getDatabaseMetrics: async () => ({ connections: 0, maxConnections: 100, queryTime: 0, slowQueries: 0 }),
    getPerformanceMetrics: async () => ({
      database: { connections: 0, maxConnections: 100, queryTime: 0, slowQueries: 0 },
      timestamp: new Date(),
    }),
    checkDatabaseHealth: async (metrics: any) => metrics.queryTime < 1000 && metrics.slowQueries === 0,
    getDatabaseHealthStatus: async (metrics: any) => {
      if (metrics.queryTime > 2000 || metrics.slowQueries > 5) return "critical";
      if (metrics.queryTime > 1000 || metrics.connections > 80) return "warning";
      return "healthy";
    },
    getHistoricalMetrics: async () => [],
    storeMetrics: async () => {},
  }),

  // Contact Message Repository
  getContactMessageRepository: InfraRepositoryFactory.getContactMessageRepository,

  // Location Repository
  getLocationRepository: InfraRepositoryFactory.getLocationRepository,
};

// Maintenir les exports individuels pour compatibilité
export const getProjectRepository = InfraRepositoryFactory.getProjectRepository;
export const getPhaseRepository = InfraRepositoryFactory.getPhaseRepository;
export const getHierarchyRepository = InfraRepositoryFactory.getHierarchyRepository;
export const getInspectionRepository = InfraRepositoryFactory.getInspectionRepository;
export const getPaymentRepository = InfraRepositoryFactory.getPaymentRepository;
export const getTaskRepository = InfraRepositoryFactory.getTaskRepository;
export const getMaterialRepository = InfraRepositoryFactory.getMaterialRepository;
export const getEmployeeRepository = InfraRepositoryFactory.getEmployeeRepository;
export const getRiskRepository = InfraRepositoryFactory.getRiskRepository;
export const getTenderRepository = InfraRepositoryFactory.getTenderRepository;
export const getSupplierRepository = InfraRepositoryFactory.getSupplierRepository;
export const getDocumentRepository = InfraRepositoryFactory.getDocumentRepository;
export const getQuantityTakeoffRepository = InfraRepositoryFactory.getQuantityTakeoffRepository;
export const getInspectionExecutionRepository = InfraRepositoryFactory.getInspectionExecutionRepository;
export const getInspectionPaymentValidationRepository = InfraRepositoryFactory.getInspectionPaymentValidationRepository;
export const getLoadDataRepository = InfraRepositoryFactory.getLoadDataRepository;
export const getReportingRepository = InfraRepositoryFactory.getReportingRepository;
export const getReportDataTransformerRepository = InfraRepositoryFactory.getReportDataTransformerRepository;
export const getProjectFormRepository = InfraRepositoryFactory.getProjectFormRepository;
export const getUserRepository = InfraRepositoryFactory.getUserRepository;

// Types exportés pour compatibilité
export type DataSourceType = "supabase" | "java_api" | "prisma" | "localStorage" | "postgis";

// Fonctions utilitaires exportées pour compatibilité
export function setDataSource(source: DataSourceType): void {
  if (InfraRepositoryFactory.setDataSource) {
    InfraRepositoryFactory.setDataSource(source);
  }
}

export function getDataSource(): DataSourceType {
  if (InfraRepositoryFactory.getDataSource) {
    return InfraRepositoryFactory.getDataSource();
  }
  return "localStorage";
}

// Export par défaut pour compatibilité
export default RepositoryFactory;
