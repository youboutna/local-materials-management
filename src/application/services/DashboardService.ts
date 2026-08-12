/**
 * Dashboard Service - Hexagonal Architecture
 * Aggregates data from multiple services for dashboard display
 * Clean separation between domain logic and infrastructure
 * 
 * ✅ Utilise les DTOs pour les données
 * ✅ Injection de dépendances via constructeur
 * ✅ Gestion des erreurs avec AppError
 * ✅ Orchestration de services hexagonaux
 */

import { InspectionStatus } from '@/domain/entities/Inspection';
import { Alert } from '@/domain/entities/Alert';
import {
  DashboardStats,
  MonitoringConfiguration,
  MonitoringMetrics
} from '@/dtos/entities/DashboardDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { DocumentService } from './DocumentService';
import { EmployeeService } from './EmployeeService';
import { InspectionService } from './InspectionService';
import { MaterialService } from './MaterialService';
import { PaymentRequestService } from './PaymentRequestService';
import { ProjectService } from './ProjectService';
import { SupplierService } from './SupplierService';
import { getPaymentRequestService } from '@/application/services/PaymentRequestService';
import { getProjectService } from '@/application/services/ProjectService';
import { getSupplierService } from '@/application/services/SupplierService';
import { getMaterialService } from '@/application/services/MaterialService';

// ============================================================================
// ERROR CLASS
// ============================================================================

export class DashboardServiceError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'DashboardServiceError';
  }
}

// ============================================================================
// SERVICE
// ============================================================================

export class DashboardService {
  private projectService: ProjectService;
  private employeeService: EmployeeService;
  private materialService: MaterialService;
  private documentService: DocumentService;
  private paymentService: PaymentRequestService;
  private inspectionService: InspectionService;
  private supplierService: SupplierService;

  constructor(
    projectService?: ProjectService,
    employeeService?: EmployeeService,
    materialService?: MaterialService,
    documentService?: DocumentService,
    paymentService?: PaymentRequestService,
    inspectionService?: InspectionService,
    supplierService?: SupplierService
  ) {
    // ✅ Injection via constructeur avec fallback via RepositoryFactory
    this.projectService = projectService || getProjectService();
    this.employeeService = employeeService || new EmployeeService(RepositoryFactory.getEmployeeRepository());
    this.materialService = materialService || getMaterialService();
    this.documentService = documentService || new DocumentService(RepositoryFactory.getDocumentRepository());
    this.paymentService = paymentService || getPaymentRequestService();
    this.inspectionService = inspectionService || new InspectionService(RepositoryFactory.getInspectionRepository());
    this.supplierService = supplierService || getSupplierService();
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  /**
   * Factory method with default repository configuration
   */
  static default(): DashboardService {
    return new DashboardService(
      getProjectService(),
      new EmployeeService(RepositoryFactory.getEmployeeRepository()),
      getMaterialService(),
      new DocumentService(RepositoryFactory.getDocumentRepository()),
      getPaymentRequestService(),
      new InspectionService(RepositoryFactory.getInspectionRepository()),
      getSupplierService()
    );
  }

  // ============================================================================
  // DASHBOARD STATISTICS
  // ============================================================================

  /**
   * Get complete dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('DashboardService: Starting to fetch stats...');
      
      // Get data from all services with error handling
      const [projects, employees, materials, documents, payments, inspections, suppliers] = await Promise.allSettled([
        this.projectService.getAllProjects(),
        this.employeeService.getAllEmployees(),
        this.materialService.getAllMaterials(),
        this.documentService.getAllDocuments(),
        this.paymentService.getAllPaymentRequests(),
        this.inspectionService.getAllInspections(),
        this.supplierService.getAllSuppliers()
      ]);

      // Extract results or fallback to empty arrays
      const projectsData = projects.status === 'fulfilled' ? projects.value : [];
      const employeesData = employees.status === 'fulfilled' ? employees.value : [];
      const materialsData = materials.status === 'fulfilled' ? materials.value : [];
      const documentsData = documents.status === 'fulfilled' ? documents.value : [];
      const paymentsData = payments.status === 'fulfilled' ? payments.value : [];
      const inspectionsData = inspections.status === 'fulfilled' ? inspections.value : [];
      const suppliersData = suppliers.status === 'fulfilled' ? suppliers.value : [];

      console.log('DashboardService: Data fetched:', {
        projects: projectsData.length,
        employees: employeesData.length,
        materials: materialsData.length,
        documents: documentsData.length,
        payments: paymentsData.length,
        inspections: inspectionsData.length,
        suppliers: suppliersData.length
      });

      // Calculate basic statistics
      const stats = this.calculateStats(
        projectsData,
        employeesData,
        materialsData,
        documentsData,
        paymentsData,
        inspectionsData,
        suppliersData
      );

      return stats;
    } catch (error) {
      throw new DashboardServiceError(
        'Failed to fetch dashboard statistics',
        ErrorCode.INTERNAL_ERROR,
        error
      );
    }
  }

  // ============================================================================
  // PROJECT STATISTICS
  // ============================================================================

  /**
   * Get project-specific statistics
   */
  async getProjectStats(projectId: string): Promise<Partial<DashboardStats>> {
    try {
      if (!projectId) {
        throw new DashboardServiceError(
          'Project ID is required',
          ErrorCode.VALIDATION_ERROR
        );
      }

      const project = await this.projectService.getProjectById(projectId);
      if (!project) {
        throw new DashboardServiceError(
          'Project not found',
          ErrorCode.NOT_FOUND
        );
      }

      const documents = await this.documentService.getProjectDocuments(projectId);
      const payments = await this.paymentService.getPaymentRequestsByProject(projectId);
      const inspections = await this.inspectionService.getInspectionsByProject(projectId);

      return {
        totalDocuments: documents.length,
        totalPayments: payments.length,
        totalInspections: inspections.length,
      };
    } catch (error) {
      if (error instanceof DashboardServiceError) throw error;
      throw new DashboardServiceError(
        'Failed to fetch project statistics',
        ErrorCode.INTERNAL_ERROR,
        error
      );
    }
  }

  // ============================================================================
  // AUTOMATED MONITORING
  // ============================================================================

  /**
   * Automated monitoring cycle - reduces manual intervention
   */
  async runAutomatedMonitoring(config?: MonitoringConfiguration): Promise<{
    metrics: MonitoringMetrics;
    alerts: Alert[];
    automatedActions: string[];
    manualActionsRequired: string[];
  }> {
    try {
      const defaultConfig: MonitoringConfiguration = {
        autoAcknowledgeLevel: 'medium',
        autoEscalationEnabled: true,
        autoNotificationEnabled: true,
        autoReportGeneration: true,
        checkIntervals: {
          insurance: 24,
          delays: 24,
          inspections: 24,
          financial: 24,
        }
      };

      const monitoringConfig = config || defaultConfig;
      
      const stats = await this.getDashboardStats();
      
      // Generate alerts based on project health
      const alerts = this.generateAlerts(stats);
      const automatedActions: string[] = [];
      const manualActionsRequired: string[] = [];

      // Auto-acknowledge low severity alerts
      if (monitoringConfig.autoAcknowledgeLevel !== 'none') {
        const autoAcknowledgeSeverity = monitoringConfig.autoAcknowledgeLevel;
        alerts.forEach(alert => {
          if (alert.severity === 'low' || 
              (autoAcknowledgeSeverity === 'medium' && alert.severity === 'medium')) {
            alert.status = 'acknowledged';
            alert.acknowledgedAt = new Date().toISOString();
            automatedActions.push(`Auto-acknowledged ${alert.type} alert`);
          }
        });
      }

      const metrics: MonitoringMetrics = {
        projectHealth: this.calculateProjectHealth(stats),
        automationRate: this.calculateAutomationRate(alerts),
        manualInterventionsRequired: alerts.filter(a => a.severity === 'critical').length,
        alertsResolved: alerts.filter(a => a.status === 'resolved').length,
        alertsPending: alerts.filter(a => a.status === 'pending').length
      };

      return {
        metrics,
        alerts,
        automatedActions,
        manualActionsRequired
      };
    } catch (error) {
      throw new DashboardServiceError(
        'Failed to run automated monitoring',
        ErrorCode.INTERNAL_ERROR,
        error
      );
    }
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfiguration(): MonitoringConfiguration {
    return {
      autoAcknowledgeLevel: 'medium',
      autoEscalationEnabled: true,
      autoNotificationEnabled: true,
      autoReportGeneration: true,
      checkIntervals: {
        insurance: 24,
        delays: 24,
        inspections: 24,
        financial: 24,
      }
    };
  }

  // ============================================================================
  // PRIVATE CALCULATION METHODS
  // ============================================================================

  /**
   * Calculate dashboard statistics
   */
  private calculateStats(
    projectsData: any[],
    employeesData: any[],
    materialsData: any[],
    documentsData: any[],
    paymentsData: any[],
    inspectionsData: any[],
    suppliersData: any[]
  ): DashboardStats {
    const normalizeStatus = this.normalizeStatus.bind(this);
    
    // Basic counts
    const totalProjects = projectsData.length;
    const activeProjects = projectsData.filter(p => normalizeStatus(p.status) === 'active').length;
    const totalBudget = projectsData.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalEmployees = employeesData.length;
    const totalMaterials = materialsData.length;
    const totalSuppliers = suppliersData.length;
    const totalDocuments = documentsData.length;
    const totalPayments = paymentsData.length;
    const totalInspections = inspectionsData.length;

    // Status distribution
    const statusColors: Record<string, string> = {
      'active': '#3b82f6',
      'completed': '#10b981',
      'pending': '#f59e0b',
      'cancelled': '#ef4444'
    };

    const statusDistribution = [
      { name: 'active', value: activeProjects, color: statusColors['active'] },
      { name: 'completed', value: projectsData.filter(p => normalizeStatus(p.status) === 'completed').length, color: statusColors['completed'] },
      { name: 'pending', value: projectsData.filter(p => normalizeStatus(p.status) === 'pending').length, color: statusColors['pending'] },
      { name: 'cancelled', value: projectsData.filter(p => normalizeStatus(p.status) === 'cancelled').length, color: statusColors['cancelled'] },
    ];

    // Health distribution
    const healthDistribution = [
      { name: 'Excellent', value: projectsData.filter(p => (p.progress || 0) >= 90).length, color: '#10b981' },
      { name: 'Bon', value: projectsData.filter(p => (p.progress || 0) >= 70 && (p.progress || 0) < 90).length, color: '#3b82f6' },
      { name: 'Moyen', value: projectsData.filter(p => (p.progress || 0) >= 50 && (p.progress || 0) < 70).length, color: '#f59e0b' },
      { name: 'Faible', value: projectsData.filter(p => (p.progress || 0) < 50).length, color: '#ef4444' },
    ];

    // Location distribution
    const locationDistribution = this.calculateLocationDistribution(projectsData);

    // Financial metrics
    const totalExpenses = paymentsData
      .filter(p => p.status === 'approved' || p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

    // Performance metrics
    const averageProjectHealth = projectsData.length > 0 
      ? projectsData.reduce((sum, p) => sum + (p.progress || 0), 0) / projectsData.length 
      : 0;

    // Risk metrics
    const highRiskProjects = projectsData.filter(p => (p.progress || 0) < 30).length;
    const overduePayments = this.calculateOverduePayments(paymentsData);
    const criticalInspections = this.calculateCriticalInspections(inspectionsData);

    return {
      activeProjects,
      totalProjects,
      totalBudget,
      totalEmployees,
      totalMaterials,
      totalSuppliers,
      totalDocuments,
      totalPayments,
      totalInspections,
      statusDistribution,
      locationDistribution,
      healthDistribution,
      performanceMetrics: {
        averageProjectHealth,
        averageMaterialEfficiency: materialsData.length > 0 ? materialsData.reduce((sum, m) => sum + (m.quantity || 0), 0) / materialsData.length : 0,
        averagePaymentEfficiency: paymentsData.length > 0 ? paymentsData.filter(p => p.status === 'paid').length / paymentsData.length * 100 : 0,
        averageInspectionCompliance: inspectionsData.length > 0 ? inspectionsData.filter(i => i.status === InspectionStatus.Approved || i.status === 'approved').length / inspectionsData.length * 100 : 0,
        averageEmployeeProductivity: employeesData.length > 0 ? employeesData.filter(e => String(e.role) === 'project_manager').length / employeesData.length * 100 : 0,
        averageSupplierReliability: suppliersData.length > 0 ? suppliersData.filter(s => s.isActive).length / suppliersData.length * 100 : 0,
        averageDocumentCompliance: documentsData.length > 0 ? documentsData.filter(d => d.status === 'approved').length / documentsData.length * 100 : 0,
      },
      financialMetrics: {
        totalRevenue: totalBudget,
        totalExpenses,
        profitMargin: totalBudget > 0 ? ((totalBudget - totalExpenses) / totalBudget) * 100 : 0,
        cashFlow: paymentsData.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) - paymentsData.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
        budgetUtilization,
      },
      riskMetrics: {
        highRiskProjects,
        highRiskMaterials: materialsData.filter(m => (m.quantity || 0) <= 5).length,
        overduePayments,
        criticalInspections,
        overloadedEmployees: employeesData.filter(e => String(e.role) === 'project_manager').length,
        unreliableSuppliers: suppliersData.filter(s => !s.isActive).length,
        expiredDocuments: documentsData.filter(d => d.status === 'expired').length,
      },
    };
  }

  /**
   * Normalize project status
   */
  private normalizeStatus(status: unknown): 'active' | 'completed' | 'pending' | 'cancelled' | 'other' {
    const value = String(status ?? '').toLowerCase();
    const activeStatuses = ['en cours', 'in_progress', 'en_cours', 'en_cours_v2', 'en_construction', 'en_construction_v2'];
    const completedStatuses = ['termine', 'terminé', 'completed', 'termine_v2', 'completed_v2'];
    const pendingStatuses = ['en attente', 'pending', 'planifie', 'planifié', 'planifie_v2', 'draft', 'planned'];
    const cancelledStatuses = ['annule', 'annulé', 'cancelled', 'annule_v2', 'cancelled_v2'];
    
    if (activeStatuses.includes(value)) return 'active';
    if (completedStatuses.includes(value)) return 'completed';
    if (pendingStatuses.includes(value)) return 'pending';
    if (cancelledStatuses.includes(value)) return 'cancelled';
    return 'other';
  }

  /**
   * Calculate location distribution
   */
  private calculateLocationDistribution(projectsData: any[]): Array<{ name: string; value: number; color: string }> {
    const normalizeLocation = (location: string): string => {
      if (!location || location === 'Non spécifié') return 'Non spécifié';
      
      const lowerLocation = location.toLowerCase().trim();
      if (lowerLocation.includes('mauritanie')) return 'Mauritanie';
      if (lowerLocation.includes('nouakchott')) return 'Nouakchott';
      return location;
    };

    const locationCounts = projectsData.reduce((acc, project) => {
      const rawLocation = project.location || 'Non spécifié';
      const location = normalizeLocation(rawLocation);
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    
    return Object.entries(locationCounts)
      .map(([name, value], index) => ({
        name,
        value: Number(value),
        color: locationColors[index % locationColors.length]
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Calculate overdue payments
   */
  private calculateOverduePayments(paymentsData: any[]): number {
    return paymentsData.filter(p => {
      const paymentDate = new Date(p.createdAt || p.requestedAt || new Date());
      const daysOverdue = Math.floor((Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
      return p.status === 'pending' && daysOverdue > 30;
    }).length;
  }

  /**
   * Calculate critical inspections
   */
  private calculateCriticalInspections(inspectionsData: any[]): number {
    return inspectionsData.filter(i => {
      const inspectionDate = new Date(i.date || i.scheduledDate || new Date());
      const daysSinceInspection = Math.floor((Date.now() - inspectionDate.getTime()) / (1000 * 60 * 60 * 24));
      const status = i.status || 'scheduled';
      return status !== 'completed' && status !== 'approved' && status !== 'passed' && daysSinceInspection > 7;
    }).length;
  }

  /**
   * Generate alerts based on statistics
   */
  private generateAlerts(stats: DashboardStats): Alert[] {
    const alerts: Alert[] = [];
    let alertId = 0;

    // High-risk projects
    if (stats.riskMetrics.highRiskProjects > 0) {
      alerts.push({
        id: `alert-${Date.now()}-${alertId++}`,
        type: 'quality',
        severity: 'high',
        title: 'High Risk Projects Detected',
        message: `${stats.riskMetrics.highRiskProjects} projects require immediate attention`,
        createdAt: new Date().toISOString(),
        status: 'pending',
        actions: ['Review project risk assessment', 'Implement mitigation strategies']
      });
    }

    // Overdue payments
    if (stats.riskMetrics.overduePayments > 0) {
      alerts.push({
        id: `alert-${Date.now()}-${alertId++}`,
        type: 'financial',
        severity: 'critical',
        title: 'Overdue Payments',
        message: `${stats.riskMetrics.overduePayments} payments are overdue`,
        createdAt: new Date().toISOString(),
        status: 'pending',
        actions: ['Contact suppliers', 'Update payment schedules']
      });
    }

    // Critical inspections
    if (stats.riskMetrics.criticalInspections > 0) {
      alerts.push({
        id: `alert-${Date.now()}-${alertId++}`,
        type: 'inspection',
        severity: 'high',
        title: 'Critical Inspections Overdue',
        message: `${stats.riskMetrics.criticalInspections} inspections require immediate attention`,
        createdAt: new Date().toISOString(),
        status: 'pending',
        actions: ['Schedule inspections', 'Review inspection reports']
      });
    }

    return alerts;
  }

  /**
   * Calculate project health
   */
  private calculateProjectHealth(stats: DashboardStats): 'excellent' | 'good' | 'warning' | 'critical' {
    const riskScore = stats.riskMetrics.highRiskProjects + 
                      stats.riskMetrics.criticalInspections + 
                      stats.riskMetrics.overduePayments;
    
    if (riskScore === 0) return 'excellent';
    if (riskScore <= 2) return 'good';
    if (riskScore <= 5) return 'warning';
    return 'critical';
  }

  /**
   * Calculate automation rate
   */
  private calculateAutomationRate(alerts: Alert[]): number {
    if (alerts.length === 0) return 100;
    const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged' || a.status === 'resolved').length;
    return Math.round((acknowledgedAlerts / alerts.length) * 100);
  }
}

let dashboardServiceInstance: DashboardService | null = null;
export function getDashboardService(): DashboardService {
  if (!dashboardServiceInstance) {
    dashboardServiceInstance = new DashboardService();
  }
  return dashboardServiceInstance;
}
