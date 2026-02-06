/**
 * Performance Metrics Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

export interface DatabaseMetricsDTO {
  connections: number;
  maxConnections: number;
  queryTime: number;
  slowQueries: number;
  activeProjects: number;
  pendingInspections: number;
  pendingPayments: number;
}

export interface PerformanceMetricsDTO {
  database: DatabaseMetricsDTO;
  timestamp: string;
  responseTime?: number;
  errorRate?: number;
  http?: {
    status: 'active' | 'warning' | 'critical';
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
}

export interface PerformanceAlertDTO {
  type: 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
}

export interface PerformanceSummaryDTO {
  current: PerformanceMetricsDTO;
  healthStatus: 'healthy' | 'warning' | 'critical';
  isHealthy: boolean;
  trend: 'improving' | 'stable' | 'degrading';
}
