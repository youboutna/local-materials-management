import { DatabaseMetrics, PerformanceMetrics } from '@/domain/entities/PerformanceMonitoring';

export interface IPerformanceMonitoringRepository {
  /**
   * Get current database performance metrics
   * @returns Database metrics
   */
  getDatabaseMetrics(): Promise<DatabaseMetrics>;

  /**
   * Get comprehensive performance metrics
   * @returns Performance metrics with timestamp
   */
  getPerformanceMetrics(): Promise<PerformanceMetrics>;

  /**
   * Check database health based on metrics
   * @param metrics Database metrics
   * @returns Health status
   */
  checkDatabaseHealth(metrics: DatabaseMetrics): Promise<boolean>;

  /**
   * Get database health status
   * @param metrics Database metrics
   * @returns Health status level
   */
  getDatabaseHealthStatus(metrics: DatabaseMetrics): Promise<'healthy' | 'warning' | 'critical'>;

  /**
   * Get historical performance metrics
   * @param hours Number of hours of historical data
   * @returns Array of historical metrics
   */
  getHistoricalMetrics(hours: number): Promise<PerformanceMetrics[]>;

  /**
   * Store performance metrics
   * @param metrics Performance metrics to store
   */
  storeMetrics(metrics: PerformanceMetrics): Promise<void>;
}
