/**
 * Performance Monitoring Service - Hexagonal Architecture
 * Business logic for monitoring system and database performance
 * 
 * Note: This service uses direct Supabase queries for performance metrics
 * as there is no dedicated performance_metrics table in the schema.
 * Metrics are computed from existing tables (projects, inspections, payments).
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { supabase } from '@/integrations/supabase/client';

// DTOs for performance monitoring
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

// Thresholds for health checks
const THRESHOLDS = {
  pendingInspections: { warning: 10, critical: 20 },
  pendingPayments: { warning: 5, critical: 10 },
  activeProjects: { warning: 50, critical: 100 }
};

export class PerformanceMonitoringService {
  /**
   * Get database performance metrics from real data
   */
  async getDatabaseMetrics(): Promise<DatabaseMetricsDTO> {
    try {
      const startTime = Date.now();

      // Query real data from database
      const [projectsResult, inspectionsResult, paymentsResult] = await Promise.all([
        supabase.from('projects').select('id, status', { count: 'exact' }),
        supabase.from('inspections').select('id, status', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('supplier_payment_requests').select('id, status', { count: 'exact' }).eq('status', 'pending')
      ]);

      const queryTime = Date.now() - startTime;

      // Count active projects
      const activeProjects = projectsResult.data?.filter(p => 
        p.status === 'en cours' || p.status === 'active' || p.status === 'in_progress'
      ).length || 0;

      return {
        connections: 1, // Single connection per client
        maxConnections: 100, // Supabase default
        queryTime,
        slowQueries: queryTime > 500 ? 1 : 0,
        activeProjects,
        pendingInspections: inspectionsResult.count || 0,
        pendingPayments: paymentsResult.count || 0
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
      const startTime = Date.now();
      const database = await this.getDatabaseMetrics();
      const responseTime = Date.now() - startTime;

      return {
        database,
        timestamp: new Date().toISOString(),
        responseTime,
        errorRate: 0 // Would need error tracking to compute
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
      
      return (
        metrics.queryTime < 1000 &&
        metrics.pendingInspections < THRESHOLDS.pendingInspections.critical &&
        metrics.pendingPayments < THRESHOLDS.pendingPayments.critical
      );
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
      
      // Critical conditions
      if (
        metrics.queryTime > 2000 ||
        metrics.pendingInspections >= THRESHOLDS.pendingInspections.critical ||
        metrics.pendingPayments >= THRESHOLDS.pendingPayments.critical
      ) {
        return 'critical';
      }
      
      // Warning conditions
      if (
        metrics.queryTime > 1000 ||
        metrics.pendingInspections >= THRESHOLDS.pendingInspections.warning ||
        metrics.pendingPayments >= THRESHOLDS.pendingPayments.warning
      ) {
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
   * Note: Returns computed metrics at different time intervals
   */
  async getHistoricalMetrics(hours: number = 24): Promise<PerformanceMetricsDTO[]> {
    try {
      if (hours < 1 || hours > 168) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Hours must be between 1 and 168 (1 week)');
      }

      // Get current metrics as baseline
      const currentMetrics = await this.getPerformanceMetrics();
      
      // For historical data, we would need a metrics storage table
      // For now, return current snapshot
      return [currentMetrics];
    } catch (error) {
      console.error('PerformanceMonitoringService.getHistoricalMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get historical metrics');
    }
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<PerformanceSummaryDTO> {
    try {
      const [currentMetrics, healthStatus, isHealthy] = await Promise.all([
        this.getPerformanceMetrics(),
        this.getDatabaseHealthStatus(),
        this.isDatabaseHealthy()
      ]);

      return {
        current: currentMetrics,
        healthStatus,
        isHealthy,
        trend: 'stable' // Would need historical data for trend analysis
      };
    } catch (error) {
      console.error('PerformanceMonitoringService.getPerformanceSummary failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get performance summary');
    }
  }

  /**
   * Get performance alerts based on current metrics
   */
  async getPerformanceAlerts(): Promise<PerformanceAlertDTO[]> {
    try {
      const metrics = await this.getDatabaseMetrics();
      const alerts: PerformanceAlertDTO[] = [];

      // Query time alerts
      if (metrics.queryTime > 2000) {
        alerts.push({
          type: 'critical',
          message: 'Database response time is critically slow',
          metric: 'queryTime',
          value: metrics.queryTime,
          threshold: 2000
        });
      } else if (metrics.queryTime > 1000) {
        alerts.push({
          type: 'warning',
          message: 'Database response time is slow',
          metric: 'queryTime',
          value: metrics.queryTime,
          threshold: 1000
        });
      }

      // Pending inspections alerts
      if (metrics.pendingInspections >= THRESHOLDS.pendingInspections.critical) {
        alerts.push({
          type: 'critical',
          message: 'High number of pending inspections',
          metric: 'pendingInspections',
          value: metrics.pendingInspections,
          threshold: THRESHOLDS.pendingInspections.critical
        });
      } else if (metrics.pendingInspections >= THRESHOLDS.pendingInspections.warning) {
        alerts.push({
          type: 'warning',
          message: 'Pending inspections increasing',
          metric: 'pendingInspections',
          value: metrics.pendingInspections,
          threshold: THRESHOLDS.pendingInspections.warning
        });
      }

      // Pending payments alerts
      if (metrics.pendingPayments >= THRESHOLDS.pendingPayments.critical) {
        alerts.push({
          type: 'critical',
          message: 'High number of pending payment requests',
          metric: 'pendingPayments',
          value: metrics.pendingPayments,
          threshold: THRESHOLDS.pendingPayments.critical
        });
      } else if (metrics.pendingPayments >= THRESHOLDS.pendingPayments.warning) {
        alerts.push({
          type: 'warning',
          message: 'Pending payments increasing',
          metric: 'pendingPayments',
          value: metrics.pendingPayments,
          threshold: THRESHOLDS.pendingPayments.warning
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
