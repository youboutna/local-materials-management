// utils/monitoringCalculations.ts - Monitoring calculations and metrics

export interface MonitoringMetrics {
  projectHealth: 'excellent' | 'good' | 'warning' | 'critical';
  automationRate: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
  alertsResolved: number;
  alertsPending: number;
}

export interface MonitoringThresholds {
  errorRateWarning: number;
  errorRateCritical: number;
  responseTimeWarning: number;
  responseTimeCritical: number;
  uptimeWarning: number;
  uptimeCritical: number;
}

export const defaultThresholds: MonitoringThresholds = {
  errorRateWarning: 5,    // 5%
  errorRateCritical: 10,  // 10%
  responseTimeWarning: 1000, // 1 second
  responseTimeCritical: 3000, // 3 seconds
  uptimeWarning: 99,      // 99%
  uptimeCritical: 95      // 95%
};

export const calculateProjectHealth = (
  errorRate: number,
  responseTime: number,
  uptime: number,
  pendingAlerts: number,
  thresholds: MonitoringThresholds = defaultThresholds
): MonitoringMetrics['projectHealth'] => {
  // Critical conditions
  if (
    errorRate >= thresholds.errorRateCritical ||
    responseTime >= thresholds.responseTimeCritical ||
    uptime <= thresholds.uptimeCritical ||
    pendingAlerts > 5
  ) {
    return 'critical';
  }

  // Warning conditions
  if (
    errorRate >= thresholds.errorRateWarning ||
    responseTime >= thresholds.responseTimeWarning ||
    uptime <= thresholds.uptimeWarning ||
    pendingAlerts > 2
  ) {
    return 'warning';
  }

  // Good conditions
  if (errorRate < 2 && responseTime < 500 && uptime > 99.5 && pendingAlerts <= 1) {
    return 'excellent';
  }

  return 'good';
};

export const calculateAutomationRate = (
  automatedActions: number,
  totalActions: number
): number => {
  if (totalActions === 0) return 100;
  return Math.round((automatedActions / totalActions) * 100);
};

export const calculateErrorRate = (
  errorRequests: number,
  totalRequests: number
): number => {
  if (totalRequests === 0) return 0;
  return (errorRequests / totalRequests) * 100;
};

export const calculateUptime = (
  upMinutes: number,
  totalMinutes: number
): number => {
  if (totalMinutes === 0) return 100;
  return (upMinutes / totalMinutes) * 100;
};

export const getHealthColor = (health: MonitoringMetrics['projectHealth']): string => {
  switch (health) {
    case 'excellent':
      return 'text-green-600';
    case 'good':
      return 'text-blue-600';
    case 'warning':
      return 'text-yellow-600';
    case 'critical':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const getHealthBadgeVariant = (health: MonitoringMetrics['projectHealth']) => {
  switch (health) {
    case 'excellent':
      return 'default';
    case 'good':
      return 'secondary';
    case 'warning':
      return 'outline';
    case 'critical':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const formatMetric = (value: number, type: 'percentage' | 'time' | 'count'): string => {
  switch (type) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'time':
      return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
    case 'count':
      return value.toString();
    default:
      return value.toString();
  }
};