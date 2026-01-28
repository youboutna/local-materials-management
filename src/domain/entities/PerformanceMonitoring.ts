export interface DatabaseMetrics {
  connections: number;
  maxConnections: number;
  queryTime: number;
  slowQueries: number;
}

export interface PerformanceMetrics {
  database: DatabaseMetrics;
  timestamp: Date;
}

// Note: TenderEstimate et TenderEstimateItem sont maintenant des entités domaine complètes
// Voir src/domain/entities/TenderEstimate.ts pour l'implémentation complète
