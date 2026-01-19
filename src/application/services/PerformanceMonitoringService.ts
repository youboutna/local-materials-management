import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { IPerformanceMonitoringRepository } from '@/domain/repositories/IPerformanceMonitoringRepository';
import { DatabaseMetrics, PerformanceMetrics } from '@/domain/entities/PerformanceMonitoring';
import { DatabaseMetricsDTO, PerformanceMetricsDTO } from '@/dtos/transforms/shared';
import { PerformanceMonitoringDomainTransformer } from '@/dtos/transforms/PerformanceMonitoringDomainTransformer';

export class PerformanceMonitoringService {
  private performanceRepository: IPerformanceMonitoringRepository;
  private performanceTransformer: PerformanceMonitoringDomainTransformer;

  constructor() {
    this.performanceRepository = RepositoryFactory.getPerformanceMonitoringRepository();
    this.performanceTransformer = new PerformanceMonitoringDomainTransformer();
  }

  /**
   * Get database performance metrics
   * Measures query response time and connection stats
   */
  async getDatabaseMetrics(): Promise<DatabaseMetricsDTO> {
    try {
      const metrics = await this.performanceRepository.getDatabaseMetrics();
      return {
        connections: metrics.connections,
        maxConnections: metrics.maxConnections,
        queryTime: metrics.queryTime,
        slowQueries: metrics.slowQueries
      };
    } catch (error) {
      console.error('Error getting database metrics:', error);
      throw new Error(`Failed to get database metrics: ${error.message}`);
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetricsDTO> {
    try {
      const metrics = await this.performanceRepository.getPerformanceMetrics();
      return this.performanceTransformer.toDTO(metrics);
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw new Error(`Failed to get performance metrics: ${error.message}`);
    }
  }

  /**
   * Check if database is healthy based on metrics
   */
  async isDatabaseHealthy(): Promise<boolean> {
    try {
      const metrics = await this.performanceRepository.getDatabaseMetrics();
      return await this.performanceRepository.checkDatabaseHealth(metrics);
    } catch (error) {
      console.error('Error checking database health:', error);
      throw new Error(`Failed to check database health: ${error.message}`);
    }
  }

  /**
   * Get database health status
   */
  async getDatabaseHealthStatus(): Promise<'healthy' | 'warning' | 'critical'> {
    try {
      const metrics = await this.performanceRepository.getDatabaseMetrics();
      return await this.performanceRepository.getDatabaseHealthStatus(metrics);
    } catch (error) {
      console.error('Error getting database health status:', error);
      throw new Error(`Failed to get database health status: ${error.message}`);
    }
  }

  /**
   * Get historical performance metrics
   * @param hours Number of hours of historical data
   * @returns Array of historical metrics
   */
  async getHistoricalMetrics(hours: number = 24): Promise<PerformanceMetricsDTO[]> {
    try {
      const historicalMetrics = await this.performanceRepository.getHistoricalMetrics(hours);
      return historicalMetrics.map(metric => this.performanceTransformer.toDTO(metric));
    } catch (error) {
      console.error('Error getting historical metrics:', error);
      throw new Error(`Failed to get historical metrics: ${error.message}`);
    }
  }

  /**
   * Store performance metrics
   * @param metrics Performance metrics to store
   */
  async storeMetrics(metrics: PerformanceMetricsDTO): Promise<void> {
    try {
      const entity = this.performanceTransformer.fromDTO(metrics);
      await this.performanceRepository.storeMetrics(entity);
    } catch (error) {
      console.error('Error storing metrics:', error);
      throw new Error(`Failed to store metrics: ${error.message}`);
    }
  }

  /**
   * Get performance summary
   * @returns Performance summary object
   */
  async getPerformanceSummary(): Promise<{
    current: PerformanceMetricsDTO;
    healthStatus: 'healthy' | 'warning' | 'critical';
    isHealthy: boolean;
    trend: 'improving' | 'stable' | 'degrading';
  }> {
    try {
      const [currentMetrics, healthStatus, isHealthy, historical] = await Promise.all([
        this.getPerformanceMetrics(),
        this.getDatabaseHealthStatus(),
        this.isDatabaseHealthy(),
        this.getHistoricalMetrics(2) // Last 2 hours for trend analysis
      ]);

      // Simple trend analysis
      let trend: 'improving' | 'stable' | 'degrading' = 'stable';
      if (historical.length >= 2) {
        const recent = historical.slice(-2);
        const avgQueryTimeChange = recent[1].database.queryTime - recent[0].database.queryTime;
        if (avgQueryTimeChange > 100) {
          trend = 'degrading';
        } else if (avgQueryTimeChange < -100) {
          trend = 'improving';
        }
      }

      return {
        current: currentMetrics,
        healthStatus,
        isHealthy,
        trend
      };
    } catch (error) {
      console.error('Error getting performance summary:', error);
      throw new Error(`Failed to get performance summary: ${error.message}`);
    }
  }

  /**
   * Get performance alerts
   * @returns Array of performance alerts
   */
  async getPerformanceAlerts(): Promise<Array<{
    type: 'warning' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }>> {
    try {
      const metrics = await this.getDatabaseMetrics();
      const alerts = [];

      // Query time alerts
      if (metrics.queryTime > 2000) {
        alerts.push({
          type: 'critical',
          message: 'Database query time is critically slow',
          metric: 'queryTime',
          value: metrics.queryTime,
          threshold: 2000
        });
      } else if (metrics.queryTime > 1000) {
        alerts.push({
          type: 'warning',
          message: 'Database query time is slow',
          metric: 'queryTime',
          value: metrics.queryTime,
          threshold: 1000
        });
      }

      // Connection alerts
      const connectionUsage = (metrics.connections / metrics.maxConnections) * 100;
      if (connectionUsage > 90) {
        alerts.push({
          type: 'critical',
          message: 'Database connection usage is critically high',
          metric: 'connections',
          value: connectionUsage,
          threshold: 90
        });
      } else if (connectionUsage > 80) {
        alerts.push({
          type: 'warning',
          message: 'Database connection usage is high',
          metric: 'connections',
          value: connectionUsage,
          threshold: 80
        });
      }

      // Slow queries alerts
      if (metrics.slowQueries > 10) {
        alerts.push({
          type: 'critical',
          message: 'High number of slow queries detected',
          metric: 'slowQueries',
          value: metrics.slowQueries,
          threshold: 10
        });
      } else if (metrics.slowQueries > 5) {
        alerts.push({
          type: 'warning',
          message: 'Slow queries detected',
          metric: 'slowQueries',
          value: metrics.slowQueries,
          threshold: 5
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error getting performance alerts:', error);
      throw new Error(`Failed to get performance alerts: ${error.message}`);
    }
  }

  /**
   * Validate performance metrics data
   * @param data The metrics data to validate
   * @returns Validation result
   */
  validateMetricsData(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    return this.performanceTransformer.validate(data);
  }
}
