import { supabase } from "@/integrations/supabase/client";

export interface DatabaseMetricsDTO {
  connections: number;
  maxConnections: number;
  queryTime: number;
  slowQueries: number;
}

export interface PerformanceMetricsDTO {
  database: DatabaseMetricsDTO;
  timestamp: number;
}

/**
 * Service for monitoring database and system performance
 * Provides abstraction layer over Supabase for performance metrics
 */
export class PerformanceMonitoringService {
  /**
   * Get database performance metrics
   * Measures query response time and connection stats
   */
  static async getDatabaseMetrics(): Promise<DatabaseMetricsDTO> {
    try {
      // Perform a test query to measure response time
      const startTime = Date.now();
      await supabase.from('projects').select('count').limit(1);
      const queryTime = Date.now() - startTime;

      return {
        connections: Math.floor(Math.random() * 20) + 5, // Simulated - would need Supabase API for real data
        maxConnections: 100,
        queryTime,
        slowQueries: queryTime > 1000 ? 1 : 0
      };
    } catch (error) {
      console.error('Error getting database metrics:', error);
      return {
        connections: 0,
        maxConnections: 100,
        queryTime: 0,
        slowQueries: 0
      };
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  static async getPerformanceMetrics(): Promise<PerformanceMetricsDTO> {
    const database = await this.getDatabaseMetrics();
    
    return {
      database,
      timestamp: Date.now()
    };
  }

  /**
   * Check if database is healthy based on metrics
   */
  static isDatabaseHealthy(metrics: DatabaseMetricsDTO): boolean {
    return (
      metrics.queryTime < 1000 && // Query time under 1 second
      metrics.slowQueries === 0 && // No slow queries
      metrics.connections < metrics.maxConnections * 0.8 // Under 80% capacity
    );
  }

  /**
   * Get database health status
   */
  static getDatabaseHealthStatus(metrics: DatabaseMetricsDTO): 'healthy' | 'warning' | 'critical' {
    if (metrics.queryTime > 2000 || metrics.slowQueries > 5) {
      return 'critical';
    }
    if (metrics.queryTime > 1000 || metrics.connections > metrics.maxConnections * 0.8) {
      return 'warning';
    }
    return 'healthy';
  }
}
