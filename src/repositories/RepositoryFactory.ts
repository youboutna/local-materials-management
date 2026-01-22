/**
 * Repository Factory - Wrapper Centralisé
 * Wrapper qui délègue au nouveau RepositoryFactory hexagonal
 * Maintient la compatibilité avec les imports existants
 */

import { RepositoryFactory as InfraRepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
  
  // Ajout des méthodes manquantes avec des implémentations temporaires
  getPerformanceMonitoringRepository: () => {
    // Implémentation temporaire - à remplacer par le vrai adapter
    return {
      getDatabaseMetrics: async () => ({
        connections: 10,
        maxConnections: 100,
        queryTime: 50,
        slowQueries: 0
      }),
      getPerformanceMetrics: async () => {
        const database = await {
          connections: 10,
          maxConnections: 100,
          queryTime: 50,
          slowQueries: 0
        };
        return {
          database,
          timestamp: new Date()
        };
      },
      checkDatabaseHealth: async (metrics: any) => {
        return metrics.queryTime < 1000 && metrics.slowQueries === 0;
      },
      getDatabaseHealthStatus: async (metrics: any) => {
        if (metrics.queryTime > 2000 || metrics.slowQueries > 5) {
          return 'critical';
        }
        if (metrics.queryTime > 1000 || metrics.connections > 80) {
          return 'warning';
        }
        return 'healthy';
      },
      getHistoricalMetrics: async (hours: number) => [],
      storeMetrics: async (metrics: any) => {
        console.log('Storing metrics:', metrics);
      }
    };
  },
  
  getTenderEstimateRepository: () => {
    // Implémentation temporaire - à remplacer par le vrai adapter
    return {
      create: async (estimate: any) => ({ ...estimate, id: 'temp-' + Date.now(), createdAt: new Date(), updatedAt: new Date() }),
      findById: async (id: string) => null,
      findByTenderId: async (tenderId: string) => [],
      findByProjectId: async (projectId: string) => [],
      findBySubmittedBy: async (userId: string) => [],
      findAll: async () => [],
      update: async (id: string, updates: any) => ({ ...updates, id, updatedAt: new Date() }),
      delete: async (id: string) => console.log('Deleting estimate:', id),
      createItem: async (item: any) => ({ ...item, id: 'temp-' + Date.now(), createdAt: new Date(), updatedAt: new Date() }),
      findItemsByEstimateId: async (estimateId: string) => [],
      updateItem: async (id: string, updates: any) => ({ ...updates, id, updatedAt: new Date() }),
      deleteItem: async (id: string) => console.log('Deleting estimate item:', id),
      getEstimateStats: async (tenderId: string) => ({
        totalEstimates: 0,
        totalAmount: 0,
        averageAmount: 0,
        byStatus: {}
      })
    };
  }
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
export type DataSourceType = 'supabase' | 'java_api' | 'prisma' |'localStorage'| 'postgis';

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
  return 'localStorage';
}

// Export par défaut pour compatibilité
export default RepositoryFactory;