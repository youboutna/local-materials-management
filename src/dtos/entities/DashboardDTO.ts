export interface MonitoringMetrics {
  projectHealth: 'excellent' | 'good' | 'warning' | 'critical';
  automationRate: number; // percentage of automated actions
  manualInterventionsRequired: number;
  alertsResolved: number;
  alertsPending: number;
}

export interface Alert {
  id: string;
  type: 'insurance' | 'delay' | 'inspection' | 'financial' | 'quality' | 'ledged' | 'resolved' | 'escalated';
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
    averagePaymentEfficiency: numb