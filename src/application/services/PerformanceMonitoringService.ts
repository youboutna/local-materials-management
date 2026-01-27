/**
 * Performance Monitoring Service - Hexagonal Architecture
 * Business logic for monitoring system and database performance
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// For now, using any repository as placeholder since performance monitoring repository doesn't exist
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';

export interface DatabaseMetricsDTO {
  connections: number;
  maxConnections: number;
  queryTime: number;
  slowQueries: number;
}

export interface PerformanceMetricsDTO {
  database: DatabaseMetricsDTO;
  timestamp: string;
  cpu?: number;
  memory?: number;
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

export interface MetricsValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PerformanceMonitoringService {
  constructor(
    private repository: IProjectRepository = RepositoryFactory.getProjectRepository() // Using project repository as placeholder
  ) {}
  /**
   * Get database performance metrics
   * Returns mock metrics for demo purposes
   */
  async getDatabaseMetrics(): Promise<DatabaseMetricsDTO> {
    try {
      // For now, return mock data as performance monitoring repository is not available
      // TODO: Implement proper database metrics retrieval when repository is available
      console.warn('PerformanceMonitoringService.getDatabaseMetrics: Performance monitoring repository not available');
      
      return {
        connections: Math.floor(Math.random() * 50) + 10,
        maxConnections: 100,
        queryTime: Math.floor(Math.random() * 500) + 50,
        slowQueries: Math.floor(Math.random() * 5)
      };
    } catch (error) {
      console.error('PerformanceMonitoringService.getDatabaseMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get database metrics');
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetricsDTO> {
    try {
      const database = await this.getDatabaseMetrics();
      return {
        database,
        timestamp: new Date().toISOString(),
        cpu: Math.floor(Math.random() * 80) + 10,
        memory: Math.floor(Math.random() * 70) + 20
      };
    } catch (error) {
      console.error('PerformanceMonitoringService.getPerformanceMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get performance metrics');
    }
  }

  /**
   * Check if database is healthy based on metrics
   */
  async isDatabaseHealthy(): Promise<boolean> {
    try {
      const metrics = await this.getDatabaseMetrics();
      const connectionUsage = (metrics.connections / metrics.maxConnections) * 100;
      return connectionUsage < 80 && metrics.queryTime < 1000 && metrics.slowQueries < 5;
    } catch (error) {
      console.error('PerformanceMonitoringService.isDatabaseHealthy failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to check database health');
    }
  }

  /**
   * Get database health status
   */
  async getDatabaseHealthStatus(): Promise<'healthy' | 'warning' | 'critical'> {
    try {
      const metrics = await this.getDatabaseMetrics();
      const connectionUsage = (metrics.connections / metrics.maxConnections) * 100;
      
      if (connectionUsage > 90 || metrics.queryTime > 2000 || metrics.slowQueries > 10) {
        return 'critical';
      }
      if (connectionUsage > 70 || metrics.queryTime > 1000 || metrics.slowQueries > 5) {
        return 'warning';
      }
      return 'healthy';
    } catch (error) {
      console.error('PerformanceMonitoringService.getDatabaseHealthStatus failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get database health status');
    }
  }

  /**
   * Get historical performance metrics
   */
  async getHistoricalMetrics(hours: number = 24): Promise<PerformanceMetricsDTO[]> {
    try {
      if (hours < 1 || hours > 168) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Hours must be between 1 and 168 (1 week)');
      }

      // For now, return mock data as performance monitoring repository is not available
      // TODO: Implement proper historical metrics retrieval when repository is available
      console.warn('PerformanceMonitoringService.getHistoricalMetrics: Performance monitoring repository not available');
      
      // Generate mock historical data
      const mockHistory: PerformanceMetricsDTO[] = [];
      const now = Date.now();
      for (let i = hours; i >= 0; i--) {
        mockHistory.push({
          database: {
            connections: Math.floor(Math.random() * 50) + 10,
            maxConnections: 100,
            queryTime: Math.floor(Math.random() * 500) + 50,
            slowQueries: Math.floor(Math.random() * 5)
          },
          timestamp: new Date(now - i * 3600000).toISOString(),
          cpu: Math.floor(Math.random() * 80) + 10,
          memory: Math.floor(Math.random() * 70) + 20
        });
      }
      return mockHistory;
    } catch (error) {
      console.error('PerformanceMonitoringService.getHistoricalMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get historical metrics');
    }
  }

  /**
   * Store performance metrics
   */
  async storeMetrics(metrics: PerformanceMetricsDTO): Promise<void> {
    try {
      if (!metrics || !metrics.database || !metrics.timestamp) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid metrics data: database and timestamp are required');
      }

      // For now, simulate storage as performance monitoring repository is not available
      // TODO: Implement proper metrics storage when repository is available
      console.warn('PerformanceMonitoringService.storeMetrics: Performance monitoring repository not available');
      console.log(`Storing metrics for timestamp: ${metrics.timestamp}`);
    } catch (error) {
      console.error('PerformanceMonitoringService.storeMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to store metrics');
    }
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<PerformanceSummaryDTO> {
    try {
      const [currentMetrics, healthStatus, isHealthy, historical] = await Promise.all([
        this.getPerformanceMetrics(),
        this.getDatabaseHealthStatus(),
        this.isDatabaseHealthy(),
        this.getHistoricalMetrics(2)
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
      console.error('PerformanceMonitoringService.getPerformanceSummary failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get performance summary');
    }
  }

  /**
   * Get performance alerts
   */
  async getPerformanceAlerts(): Promise<PerformanceAlertDTO[]> {
    try {
      const metrics = await this.getDatabaseMetrics();
      const alerts: PerformanceAlertDTO[] = [];

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
      console.error('PerformanceMonitoringService.getPerformanceAlerts failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get performance alerts');
    }
  }

  /**
   * Validate performance metrics data
   */
  validateMetricsData(data: unknown): MetricsValidationResult {
    const errors: string[] = [];
    
    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Invalid data format'] };
    }

    const metrics = data as Record<string, unknown>;
    
    if (!metrics.database || typeof metrics.database !== 'object') {
      errors.push('Missing or invalid database metrics');
    }

    if (!metrics.timestamp || typeof metrics.timestamp !== 'string') {
      errors.push('Missing or invalid timestamp');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
