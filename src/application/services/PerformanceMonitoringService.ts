/**
 * Performance Monitoring Service
 * Uses in-memory storage as the performance monitoring repository doesn't exist
 */

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

// In-memory metrics store
const metricsHistory: PerformanceMetricsDTO[] = [];

export class PerformanceMonitoringService {
  /**
   * Get database performance metrics
   * Returns mock metrics for demo purposes
   */
  async getDatabaseMetrics(): Promise<DatabaseMetricsDTO> {
    try {
      // Return mock metrics
      return {
        connections: Math.floor(Math.random() * 50) + 10,
        maxConnections: 100,
        queryTime: Math.floor(Math.random() * 500) + 50,
        slowQueries: Math.floor(Math.random() * 5)
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting database metrics:', error);
      throw new Error(`Failed to get database metrics: ${message}`);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting performance metrics:', error);
      throw new Error(`Failed to get performance metrics: ${message}`);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error checking database health:', error);
      throw new Error(`Failed to check database health: ${message}`);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting database health status:', error);
      throw new Error(`Failed to get database health status: ${message}`);
    }
  }

  /**
   * Get historical performance metrics
   */
  async getHistoricalMetrics(hours: number = 24): Promise<PerformanceMetricsDTO[]> {
    try {
      // Return from in-memory history or generate mock data
      if (metricsHistory.length === 0) {
        // Generate mock historical data
        const now = Date.now();
        for (let i = hours; i >= 0; i--) {
          metricsHistory.push({
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
      }
      return metricsHistory.slice(-hours);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting historical metrics:', error);
      throw new Error(`Failed to get historical metrics: ${message}`);
    }
  }

  /**
   * Store performance metrics
   */
  async storeMetrics(metrics: PerformanceMetricsDTO): Promise<void> {
    try {
      metricsHistory.push(metrics);
      // Keep only last 168 hours (1 week)
      if (metricsHistory.length > 168) {
        metricsHistory.shift();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error storing metrics:', error);
      throw new Error(`Failed to store metrics: ${message}`);
    }
  }

  /**
   * Get performance summary
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting performance summary:', error);
      throw new Error(`Failed to get performance summary: ${message}`);
    }
  }

  /**
   * Get performance alerts
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
      const alerts: Array<{
        type: 'warning' | 'critical';
        message: string;
        metric: string;
        value: number;
        threshold: number;
      }> = [];

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting performance alerts:', error);
      throw new Error(`Failed to get performance alerts: ${message}`);
    }
  }

  /**
   * Validate performance metrics data
   */
  validateMetricsData(data: unknown): {
    isValid: boolean;
    errors: string[];
  } {
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
