/**
 * Performance Metrics Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

export interface PerformanceMetricsDTO {
  database: DatabaseMetricsDTO;
  timestamp: string;
  responseTime?: number;
  errorRate?: number;
  http?: {
    status: 'active' | 'warning' | 'critical';
    responseTime: number;ricsDTO;
  healthStatus: 'healthy' | 'warning' | 'critical';
  isHealthy: boolean;
  trend: 'improving' | 'stable' | 'degrading';
}