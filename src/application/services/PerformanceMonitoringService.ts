/**
 * Performance Monitoring Service - Hexagonal Architecture
 * Business logic for monitoring system and database performance
 * 
 * Note: This service should use Repository pattern instead of direct Supabase calls
 * TODO: Replace direct Supabase calls with RepositoryFactory pattern
 */

import { NotificationService } from '@/application/services/NotificationService';
import {
    DatabaseMetricsDTO,
    PerformanceAlertDTO,
    PerformanceMetricsDTO,
    PerformanceSummaryDTO
} from '@/dtos/entities/PerformanceMetricsDTO';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Event-driven interfaces for performance monitoring
export interface EventPerformanceMetrics {
  overallScore: number;
  taskCompletionRate: number;
  budgetEfficiency: number;
  qualityMetrics: Record<string, number>;
  timelineAdherence: number;
  resourceUtilization: number;
  dataSources: string[];
}

export interface EventPerformanceAlert {
  type: 'low_performance' | 'budget_overrun' | 'timeline_delay' | 'quality_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
  message: string;
  threshold: number;
  currentValue: number;
  recommendation: string;
}

export interface PerformanceMonitoringRecord {
  id: string;
  projectId: string;
  employeeId?: string;
  dateRange: string;
  performanceScore: number;
  taskCompletionRate: number;
  budgetEfficiency: number;
  qualityMetrics: Record<string, number>;
  timelineAdherence: number;
  resourceUtilization: number;
  calculatedAt: string;
  dataSources: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
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
  private notificationService: NotificationService;
  
  // Event-driven in-memory storage for performance records (like Action system)
  private monitoringRecords: Map<string, PerformanceMonitoringRecord> = new Map();

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Get database performance metrics from real data
   */
  async getDatabaseMetrics(): Promise<DatabaseMetricsDTO> {
    try {
      const startTime = Date.now();

      // Use RepositoryFactory pattern (no direct Supabase)
      const { RepositoryFactory } = await import( '@/infrastructure/RepositoryFactory');
      const projectRepo = RepositoryFactory.getProjectRepository();
      const inspectionRepo = RepositoryFactory.getInspectionRepository();
      const paymentRepo = RepositoryFactory.getPaymentRepository();

      const [projects, inspections, payments] = await Promise.all([
        projectRepo.findAll().catch(() => []),
        inspectionRepo.findAll ? inspectionRepo.findAll().catch(() => []) : Promise.resolve([]),
        (paymentRepo as unknown as { findAll?: () => Promise<unknown[]> }).findAll
          ? (paymentRepo as unknown as { findAll: () => Promise<unknown[]> }).findAll().catch(() => [])
          : Promise.resolve([]),
      ]);

      const queryTime = Date.now() - startTime;
      const isActiveStatus = (s: unknown) => s === 'in_progress' || s === 'active' || s === 'planning';
      const isPendingInsp = (s: unknown) => s === 'pending' || s === 'scheduled';
      const isPendingPay = (s: unknown) => s === 'pending' || s === 'awaiting_approval';

      const activeProjects = (projects as unknown[]).filter(p => isActiveStatus((p as Record<string, unknown>).status)).length;
      const pendingInspections = (inspections as unknown[]).filter(i => isPendingInsp((i as Record<string, unknown>).status)).length;
      const pendingPayments = (payments as unknown[]).filter(p => isPendingPay((p as Record<string, unknown>).status)).length;

      return {
        connections: 1,
        maxConnections: 100,
        queryTime,
        slowQueries: queryTime > 500 ? 1 : 0,
        activeProjects,
        pendingInspections,
        pendingPayments,
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

  /**
   * Calculate event-driven performance metrics from existing data sources
   * Event-driven: queries existing tables to calculate KPIs
   */
  async calculateEventPerformanceMetrics(projectId: string): Promise<EventPerformanceMetrics> {
    const dataSources: string[] = [];
    let overallScore = 0;
    let taskCompletionRate = 0;
    let budgetEfficiency = 0;
    const qualityMetrics: Record<string, number> = {};
    let timelineAdherence = 0;
    let resourceUtilization = 0;

    try {
      // Calculate task completion rate from task_assignments table
      const { data: taskAssignments } = await supabase
        .from('task_assignments')
        .select('status')
        .eq('project_id', projectId);
      
      if (taskAssignments && taskAssignments.length > 0) {
        const completedTasks = taskAssignments.filter(t => t.status === 'completed').length;
        taskCompletionRate = (completedTasks / taskAssignments.length) * 100;
        dataSources.push('task_assignments');
      }

      // Calculate timeline adherence from project_phases table
      const { data: phases } = await supabase
        .from('project_phases')
        .select('start_date, end_date, status')
        .eq('project_id', projectId);
      
      if (phases && phases.length > 0) {
        const onTimePhases = phases.filter((p: any) => {
          if (!p.end_date) return true;
          const endDate = new Date(p.end_date);
          const today = new Date();
          return endDate <= today;
        }).length;
        timelineAdherence = (onTimePhases / phases.length) * 100;
        dataSources.push('project_phases');
      }

      // Calculate budget efficiency from payments and projects tables
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('project_id', projectId);
      
      const { data: project } = await supabase
        .from('projects')
        .select('budget')
        .eq('id', projectId)
        .single();

      if (payments && project) {
        const totalSpent = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const budget = project.budget || 0;
        budgetEfficiency = budget > 0 ? ((budget - totalSpent) / budget) * 100 : 0;
        dataSources.push('payments', 'projects');
      }

      // Calculate quality metrics from inspections table
      const { data: inspections } = await supabase
        .from('inspections')
        .select('status')
        .eq('project_id', projectId);
      
      if (inspections && inspections.length > 0) {
        const passedInspections = inspections.filter(i => i.status === 'approved').length;
        qualityMetrics.inspection_pass_rate = (passedInspections / inspections.length) * 100;
        dataSources.push('inspections');
      }

      // Calculate resource utilization (placeholder for now)
      resourceUtilization = 85; // Default value
      dataSources.push('resource_calculation');

      // Calculate overall score (weighted average)
      const weights = {
        tasks: 0.3,
        budget: 0.25,
        quality: 0.25,
        timeline: 0.2
      };
      
      overallScore = (
        (taskCompletionRate * weights.tasks) +
        (budgetEfficiency * weights.budget) +
        (qualityMetrics.inspection_pass_rate || 0) * weights.quality +
        (timelineAdherence * weights.timeline)
      );

    } catch (error) {
      console.error('Error calculating event performance metrics:', error);
    }

    return {
      overallScore,
      taskCompletionRate,
      budgetEfficiency,
      qualityMetrics,
      timelineAdherence,
      resourceUtilization,
      dataSources
    };
  }

  /**
   * Trigger event-driven performance alerts based on calculated metrics
   * Event-driven: sends notifications when thresholds are breached
   */
  async triggerEventPerformanceAlerts(projectId: string, metrics: EventPerformanceMetrics): Promise<void> {
    const alerts: EventPerformanceAlert[] = [];

    // Low performance alert
    if (metrics.overallScore < 50) {
      alerts.push({
        type: 'low_performance',
        severity: metrics.overallScore < 30 ? 'critical' : 'high',
        projectId,
        message: `Performance global faible: ${metrics.overallScore.toFixed(1)}%`,
        threshold: 50,
        currentValue: metrics.overallScore,
        recommendation: 'Réviser les ressources et la planification du projet'
      });
    }

    // Budget overrun alert
    if (metrics.budgetEfficiency < 0) {
      alerts.push({
        type: 'budget_overrun',
        severity: metrics.budgetEfficiency < -20 ? 'critical' : 'high',
        projectId,
        message: `Dépassement de budget détecté: ${Math.abs(metrics.budgetEfficiency).toFixed(1)}%`,
        threshold: 0,
        currentValue: metrics.budgetEfficiency,
        recommendation: 'Réévaluer le budget et contrôler les dépenses'
      });
    }

    // Timeline delay alert
    if (metrics.timelineAdherence < 70) {
      alerts.push({
        type: 'timeline_delay',
        severity: metrics.timelineAdherence < 50 ? 'critical' : 'medium',
        projectId,
        message: `Retards dans les délais: ${metrics.timelineAdherence.toFixed(1)}% d'adhérence`,
        threshold: 70,
        currentValue: metrics.timelineAdherence,
        recommendation: 'Réviser le planning et allouer des ressources supplémentaires'
      });
    }

    // Quality issue alert
    if (metrics.qualityMetrics.inspection_pass_rate && metrics.qualityMetrics.inspection_pass_rate < 80) {
      alerts.push({
        type: 'quality_issue',
        severity: metrics.qualityMetrics.inspection_pass_rate < 60 ? 'high' : 'medium',
        projectId,
        message: `Problèmes de qualité: ${metrics.qualityMetrics.inspection_pass_rate.toFixed(1)}% de réussite`,
        threshold: 80,
        currentValue: metrics.qualityMetrics.inspection_pass_rate,
        recommendation: 'Mettre en place des mesures de contrôle qualité renforcées'
      });
    }

    // Send notifications for each alert
    for (const alert of alerts) {
      await this.sendEventPerformanceAlert(alert);
    }
  }

  /**
   * Send event-driven performance alert notification
   */
  private async sendEventPerformanceAlert(alert: EventPerformanceAlert): Promise<void> {
    try {
      await this.notificationService.createNotification({
        recipient_id: 'system', // TODO: Get actual recipient based on project
        title: `Alerte Performance - ${alert.type.replace('_', ' ').toUpperCase()}`,
        message: alert.message,
        type: 'system',
        priority: alert.severity === 'critical' ? 'high' : alert.severity as 'low' | 'medium' | 'high',
        metadata: {
          alertType: alert.type,
          projectId: alert.projectId,
          threshold: alert.threshold,
          currentValue: alert.currentValue,
          recommendation: alert.recommendation
        }
      });

      console.log(`🚨 Event performance alert sent: ${alert.type} - ${alert.severity} severity`);
    } catch (error) {
      console.error('Failed to send event performance alert:', error);
    }
  }

  /**
   * Create performance monitoring record
   * Event-driven: calculates KPIs, stores in memory, and triggers alerts
   */
  async createPerformanceMonitoringRecord(
    projectId: string, 
    employeeId?: string, 
    dateRange?: string
  ): Promise<PerformanceMonitoringRecord> {
    try {
      // Calculate performance metrics from existing data sources
      const performanceMetrics = await this.calculateEventPerformanceMetrics(projectId);
      
      // Create performance monitoring record in memory
      const monitoringRecord: PerformanceMonitoringRecord = {
        id: `monitoring-${crypto.randomUUID()}`,
        projectId,
        employeeId: employeeId || 'system',
        dateRange: dateRange || 'current',
        performanceScore: performanceMetrics.overallScore,
        taskCompletionRate: performanceMetrics.taskCompletionRate,
        budgetEfficiency: performanceMetrics.budgetEfficiency,
        qualityMetrics: performanceMetrics.qualityMetrics,
        timelineAdherence: performanceMetrics.timelineAdherence,
        resourceUtilization: performanceMetrics.resourceUtilization,
        calculatedAt: new Date().toISOString(),
        dataSources: performanceMetrics.dataSources,
        metadata: {
          calculationMethod: 'event_driven',
          timestamp: new Date().toISOString(),
          version: '1.0'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in memory (event-driven like Action system)
      this.monitoringRecords.set(monitoringRecord.id, monitoringRecord);

      // Log the monitoring event
      console.log('PerformanceMonitoringService.createRecord:', monitoringRecord);

      // Trigger performance alerts based on calculated metrics
      await this.triggerEventPerformanceAlerts(projectId, performanceMetrics);

      return monitoringRecord;
    } catch (error) {
      console.error('PerformanceMonitoringService.createRecord error:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create performance monitoring record');
    }
  }

  /**
   * Get performance monitoring by project ID (from memory)
   */
  async getPerformanceMonitoringByProject(projectId: string): Promise<PerformanceMonitoringRecord[]> {
    try {
      return Array.from(this.monitoringRecords.values())
        .filter(record => record.projectId === projectId)
        .sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime());
    } catch (error) {
      console.error('PerformanceMonitoringService.getByProject error:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get performance monitoring by project');
    }
  }

  /**
   * Get event-driven performance statistics for a project
   * Event-driven: calculates from current data
   */
  async getEventPerformanceStatistics(projectId: string): Promise<{
    averagePerformance: number;
    totalRecords: number;
    performanceTrend: 'improving' | 'declining' | 'stable';
    lastUpdated: string;
    kpiBreakdown: {
      taskCompletionRate: number;
      budgetEfficiency: number;
      qualityScore: number;
      timelineAdherence: number;
    };
  }> {
    try {
      const projectRecords = Array.from(this.monitoringRecords.values())
        .filter(record => record.projectId === projectId)
        .sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime());

      const totalRecords = projectRecords.length;
      
      if (totalRecords === 0) {
        // Calculate current metrics if no records exist
        const currentMetrics = await this.calculateEventPerformanceMetrics(projectId);
        
        return {
          averagePerformance: currentMetrics.overallScore,
          totalRecords: 0,
          performanceTrend: 'stable',
          lastUpdated: new Date().toISOString(),
          kpiBreakdown: {
            taskCompletionRate: currentMetrics.taskCompletionRate,
            budgetEfficiency: currentMetrics.budgetEfficiency,
            qualityScore: currentMetrics.qualityMetrics.inspection_pass_rate || 0,
            timelineAdherence: currentMetrics.timelineAdherence
          }
        };
      }

      const averagePerformance = projectRecords.reduce((sum, record) => sum + record.performanceScore, 0) / totalRecords;
      
      // Calculate trend based on last 3 records
      let performanceTrend: 'improving' | 'declining' | 'stable' = 'stable';
      if (totalRecords >= 3) {
        const recent = projectRecords.slice(0, 3);
        const firstScore = recent[2]?.performanceScore || 0;
        const lastScore = recent[0]?.performanceScore || 0;
        
        if (lastScore > firstScore + 5) performanceTrend = 'improving';
        else if (lastScore < firstScore - 5) performanceTrend = 'declining';
      }

      const latestRecord = projectRecords[0];
      const kpiBreakdown = {
        taskCompletionRate: latestRecord?.taskCompletionRate || 0,
        budgetEfficiency: latestRecord?.budgetEfficiency || 0,
        qualityScore: latestRecord?.qualityMetrics?.inspection_pass_rate || 0,
        timelineAdherence: latestRecord?.timelineAdherence || 0
      };

      return {
        averagePerformance,
        totalRecords,
        performanceTrend,
        lastUpdated: latestRecord?.calculatedAt || new Date().toISOString(),
        kpiBreakdown
      };
    } catch (error) {
      console.error('PerformanceMonitoringService.getEventPerformanceStatistics error:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get performance statistics');
    }
  }

  /**
   * Get all performance monitoring records (from memory)
   */
  async getAllPerformanceMonitoringRecords(): Promise<PerformanceMonitoringRecord[]> {
    try {
      return Array.from(this.monitoringRecords.values())
        .sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime());
    } catch (error) {
      console.error('PerformanceMonitoringService.getAllRecords error:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all performance monitoring records');
    }
  }

  /**
   * Delete performance monitoring record (from memory)
   */
  async deletePerformanceMonitoringRecord(recordId: string): Promise<boolean> {
    try {
      const deleted = this.monitoringRecords.delete(recordId);
      if (deleted) {
        console.log('PerformanceMonitoringService.deleteRecord:', recordId);
      }
      return deleted;
    } catch (error) {
      console.error('PerformanceMonitoringService.deleteRecord error:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete performance monitoring record');
    }
  }
}
