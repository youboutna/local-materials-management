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
