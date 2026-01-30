/**
 * Dashboard Service - Hexagonal Architecture
 * Aggregates data from multiple services for dashboard display
 * Clean separation between domain logic and infrastructure
 */

import { ProjectService } from './ProjectService';
import { EmployeeService } from './EmployeeService';
import { MaterialService } from './MaterialService';
import { DocumentService, type DocumentResponseDto } from './DocumentService';
import { PaymentRequestService } from './PaymentRequestService';
import { InspectionService } from './InspectionService';
import { SupplierService } from './SupplierService';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';

// Monitoring interfaces from legacy service
export interface MonitoringConfiguration {
  autoAcknowledgeLevel: 'none' | 'low' | 'medium' | 'high';
  autoEscalationEnabled: boolean;
  autoNotificationEnabled: boolean;
  autoReportGeneration: boolean;
  checkIntervals: {
    insurance: number; // hours
    delays: number; // hours
    inspections: number; // hours
    financial: number; // hours
  };
}

export interface MonitoringMetrics {
  projectHealth: 'excellent' | 'good' | 'warning' | 'critical';
  automationRate: number; // percentage of automated actions
  manualInterventionsRequired: number;
  alertsResolved: number;
  alertsPending: number;
}

export interface Alert {
  id: string;
  type: 'insurance' | 'delay' | 'inspection' | 'financial' | 'quality' | 'safety';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  projectId?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  assignedTo?: string;
  status: 'pending' | 'acknowledged' | 'resolved' | 'escalated';
  actions: string[];
}

export interface DashboardStats {
  activeProjects: number;
  totalProjects: number;
  totalBudget: number;
  totalEmployees: number;
  totalMaterials: number;
  totalSuppliers: number;
  totalDocuments: number;
  totalPayments: number;
  totalInspections: number;
  statusDistribution: { name: string; value: number; color: string }[];
  locationDistribution: { name: string; value: number; color: string }[];
  healthDistribution: { name: string; value: number; color: string }[];
  performanceMetrics: {
    averageProjectHealth: number;
    averageMaterialEfficiency: number;
    averagePaymentEfficiency: number;
    averageInspectionCompliance: number;
    averageEmployeeProductivity: number;
    averageSupplierReliability: number;
    averageDocumentCompliance: number;
  };
  financialMetrics: {
    totalRevenue: number;
    totalExpenses: number;
    profitMargin: number;
    cashFlow: number;
    budgetUtilization: number;
  };
  riskMetrics: {
    highRiskProjects: number;
    highRiskMaterials: number;
    overduePayments: number;
    criticalInspections: number;
    overloadedEmployees: number;
    unreliableSuppliers: number;
    expiredDocuments: number;
  };
}

/**
 * Custom error class for dashboard operations
 */
export class DashboardServiceError extends Error {
  constructor(
    message: string,
    public code: string = 'DASHBOARD_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'DashboardServiceError';
  }
}

/**
 * Dashboard Service - Use Cases Implementation
 */
export class DashboardService {
  private projectService: ProjectService;
  private employeeService: EmployeeService;
  private materialService: MaterialService;
  private documentService: DocumentService;
  private paymentService: PaymentRequestService;
  private inspectionService: InspectionService;
  private supplierService: SupplierService;

  constructor() {
    this.projectService = new ProjectService(RepositoryFactory.getProjectRepository());
    this.employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
    this.materialService = new MaterialService();
    this.documentService = new DocumentService(RepositoryFactory.getDocumentRepository());
    this.paymentService = new PaymentRequestService(RepositoryFactory.getPaymentRepository());
    this.inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());
    this.supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
  }

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
      const activeProjects = projectsData.filter(p => p.status === 'en cours').length;
      const totalProjects = projectsData.length;
      const totalBudget = projectsData.reduce((sum, p) => sum + (p.budget || 0), 0);

      // Status distribution
      const statusColors = {
        'en cours': '#3b82f6',
        'terminé': '#10b981',
        'en attente': '#f59e0b',
        'annulé': '#ef4444'
      };

      const statusDistribution = [
        { name: 'en cours', value: projectsData.filter(p => p.status === 'en cours').length, color: statusColors['en cours'] },
        { name: 'terminé', value: projectsData.filter(p => p.status === 'terminé').length, color: statusColors['terminé'] },
        { name: 'en attente', value: projectsData.filter(p => p.status === 'en attente').length, color: statusColors['en attente'] },
        { name: 'annulé', value: projectsData.filter(p => p.status === 'annulé').length, color: statusColors['annulé'] },
      ];

      // Health distribution based on project progress
      const healthDistribution = [
        { name: 'Excellent', value: projectsData.filter(p => (p.progress || 0) >= 90).length, color: '#10b981' },
        { name: 'Bon', value: projectsData.filter(p => (p.progress || 0) >= 70 && (p.progress || 0) < 90).length, color: '#3b82f6' },
        { name: 'Moyen', value: projectsData.filter(p => (p.progress || 0) >= 50 && (p.progress || 0) < 70).length, color: '#f59e0b' },
        { name: 'Faible', value: projectsData.filter(p => (p.progress || 0) < 50).length, color: '#ef4444' },
      ];

      // Location distribution based on project location
      const locationCounts = projectsData.reduce((acc, project) => {
        const location = project.location || 'Non spécifié';
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const locationColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
      const locationDistribution = Object.entries(locationCounts)
        .map(([name, value], index) => ({
          name,
          value,
          color: locationColors[index % locationColors.length]
        }))
        .sort((a, b) => b.value - a.value); // Sort by count descending

      // Calculate average project health
      const averageProjectHealth = projectsData.length > 0 
        ? projectsData.reduce((sum, p) => sum + (p.progress || 0), 0) / projectsData.length 
        : 0;

      // Budget utilization
      const totalExpenses = paymentsData.filter(p => p.status === 'approved' || p.status === 'processed').reduce((sum, p) => sum + p.amount, 0);
      const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

      // Risk metrics
      const highRiskProjects = projectsData.filter(p => (p.progress || 0) < 30).length;

      return {
        activeProjects,
        totalProjects,
        totalBudget,
        totalEmployees: employeesData.length,
        totalMaterials: materialsData.length,
        totalSuppliers: suppliersData.length,
        totalDocuments: documentsData.length,
        totalPayments: paymentsData.length,
        totalInspections: inspectionsData.length,
        statusDistribution,
        locationDistribution,
        healthDistribution,
        performanceMetrics: {
          averageProjectHealth,
          averageMaterialEfficiency: materialsData.length > 0 ? materialsData.reduce((sum, m) => sum + (m.availableQuantity || 0), 0) / materialsData.length : 0,
          averagePaymentEfficiency: paymentsData.length > 0 ? paymentsData.filter(p => p.status === 'processed').length / paymentsData.length * 100 : 0,
          averageInspectionCompliance: inspectionsData.length > 0 ? inspectionsData.filter(i => i.status === 'completed').length / inspectionsData.length * 100 : 0,
          averageEmployeeProductivity: employeesData.length > 0 ? employeesData.reduce((sum, e) => sum + (String(e.role) === 'project_manager' ? 1 : 0), 0) / employeesData.length * 100 : 0,
          averageSupplierReliability: suppliersData.length > 0 ? suppliersData.filter(s => s.isActive).length / suppliersData.length * 100 : 0,
          averageDocumentCompliance: documentsData.length > 0 ? documentsData.filter(d => d.status === 'validated').length / documentsData.length * 100 : 0,
        },
        financialMetrics: {
          totalRevenue: totalBudget,
          totalExpenses: paymentsData.filter(p => p.status === 'approved' || p.status === 'processed').reduce((sum, p) => sum + p.amount, 0),
          profitMargin: totalBudget > 0 ? ((totalBudget - paymentsData.filter(p => p.status === 'approved' || p.status === 'processed').reduce((sum, p) => sum + p.amount, 0)) / totalBudget) * 100 : 0,
          cashFlow: paymentsData.filter(p => p.status === 'processed').reduce((sum, p) => sum + p.amount, 0) - paymentsData.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
          budgetUtilization,
        },
        riskMetrics: {
          highRiskProjects,
          highRiskMaterials: materialsData.filter(m => m.availableQuantity <= 5).length, // Low stock materials
          overduePayments: paymentsData.filter(p => {
            const paymentDate = new Date(p.requested_date);
            const daysOverdue = Math.floor((Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
            return p.status === 'pending' && daysOverdue > 30;
          }).length,
          criticalInspections: inspectionsData.filter(i => {
            const inspectionDate = new Date(i.date);
            const daysSinceInspection = Math.floor((Date.now() - inspectionDate.getTime()) / (1000 * 60 * 60 * 24));
            return i.status !== 'completed' && daysSinceInspection > 7; // Overdue inspections as critical
          }).length,
          overloadedEmployees: employeesData.filter(e => String(e.role) === 'project_manager').length, // Managers as proxy for workload
          unreliableSuppliers: suppliersData.filter(s => !s.isActive).length,
          expiredDocuments: documentsData.filter(d => {
            if (d.expiryDate) {
              return new Date(d.expiryDate) < new Date();
            }
            return false;
          }).length,
        },
      };
    } catch (error) {
      throw new DashboardServiceError(
        'Failed to fetch dashboard statistics',
        'FETCH_STATS_ERROR',
        error
      );
    }
  }

  /**
   * Get project-specific statistics
   */
  async getProjectStats(projectId: string): Promise<Partial<DashboardStats>> {
    try {
      const project = await this.projectService.getProjectById(projectId);
      if (!project) {
        throw new DashboardServiceError('Project not found', 'PROJECT_NOT_FOUND');
      }

      // Get project-specific data
      const documents = await this.documentService.getProjectDocuments(projectId);
      const payments = await this.paymentService.getPaymentRequestsByProject(projectId);
      const inspections = await this.inspectionService.getInspectionsByProject(projectId);

      return {
        totalDocuments: documents.length,
        totalPayments: payments.length,
        totalInspections: inspections.length,
      };
    } catch (error) {
      throw new DashboardServiceError(
        'Failed to fetch project statistics',
        'FETCH_PROJECT_STATS_ERROR',
        error
      );
    }
  }

  /**
   * Automated monitoring cycle - reduces manual intervention
   * Legacy compatibility method from MonitoringService
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
      
      // Get all projects for monitoring
      const stats = await this.getDashboardStats();
      
      // Generate alerts based on project health
      const alerts: Alert[] = [];
      const automatedActions: string[] = [];
      const manualActionsRequired: string[] = [];


      // Check for high-risk projects
      if (stats.riskMetrics.highRiskProjects > 0) {
        alerts.push({
          id: `alert-${Date.now()}-1`,
          type: 'quality',
          severity: 'high',
          title: 'High Risk Projects Detected',
          description: `${stats.riskMetrics.highRiskProjects} projects require immediate attention`,
          createdAt: new Date().toISOString(),
          status: 'pending',
          actions: ['Review project risk assessment', 'Implement mitigation strategies']
        });
      }

      // Check for overdue payments
      if (stats.riskMetrics.overduePayments > 0) {
        alerts.push({
          id: `alert-${Date.now()}-2`,
          type: 'financial',
          severity: 'critical',
          title: 'Overdue Payments',
          description: `${stats.riskMetrics.overduePayments} payments are overdue`,
          createdAt: new Date().toISOString(),
          status: 'pending',
          actions: ['Contact suppliers', 'Update payment schedules']
        });
      }

      // Check for critical inspections
      if (stats.riskMetrics.criticalInspections > 0) {
        alerts.push({
          id: `alert-${Date.now()}-3`,
          type: 'inspection',
          severity: 'high',
          title: 'Critical Inspections Overdue',
          description: `${stats.riskMetrics.criticalInspections} inspections require immediate attention`,
          createdAt: new Date().toISOString(),
          status: 'pending',
          actions: ['Schedule inspections', 'Review inspection reports']
        });
      }

      // Calculate metrics
      const metrics: MonitoringMetrics = {
        projectHealth: this.calculateProjectHealth(stats),
        automationRate: this.calculateAutomationRate(alerts),
        manualInterventionsRequired: alerts.filter(a => a.severity === 'critical').length,
        alertsResolved: 0,
        alertsPending: alerts.length
      };

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

      return {
        metrics,
        alerts,
        automatedActions,
        manualActionsRequired
      };
    } catch (error) {
      throw new DashboardServiceError(
        'Failed to run automated monitoring',
        'MONITORING_ERROR',
        error
      );
    }
  }

  /**
   * Get monitoring configuration
   * Legacy compatibility method from MonitoringService
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

  /**
   * Calculate project health based on metrics
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
   * Calculate automation rate based on alerts
   */
  private calculateAutomationRate(alerts: Alert[]): number {
    if (alerts.length === 0) return 100;
    const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged').length;
    return Math.round((acknowledgedAlerts / alerts.length) * 100);
  }
}

class DashboardServiceError extends Error {
  constructor(message: string, public code: string, public cause?: Error) {
    super(message);
    this.name = 'DashboardServiceError';
  }
}
