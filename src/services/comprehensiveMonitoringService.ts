// services/comprehensiveMonitoringService.ts - Service for comprehensive monitoring data

import { supabase } from '@/integrations/supabase/client';
import { MonitoringMetrics, calculateProjectHealth, calculateErrorRate, calculateUptime } from '@/utils/monitoringCalculations';

export interface MonitoringStats {
  http: {
    status: 'active' | 'warning' | 'critical';
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
  guarantees: {
    count: number;
    expiring: number;
    status: string;
  };
  payments: {
    count: number;
    blocked: number;
    status: string;
  };
  inspections: {
    count: number;
    delayed: number;
    status: string;
  };
  insurance: {
    count: number;
    expiring: number;
    status: string;
  };
}

export interface SystemAlert {
  id: string;
  type: 'guarantees' | 'payments' | 'inspections' | 'insurance' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  metadata?: any;
}

class ComprehensiveMonitoringService {
  async getMonitoringStats(): Promise<MonitoringStats> {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Load guarantees data
      const { data: guarantees } = await supabase
        .from('bank_guarantees')
        .select('*')
        .eq('status', 'active');

      const expiringGuarantees = guarantees?.filter(g => 
        new Date(g.expiry_date) <= thirtyDaysFromNow
      ) || [];

      // Load payment blocks
      const { data: paymentBlocks } = await supabase
        .from('payment_blocks')
        .select('*')
        .is('resolved_at', null);

      // Load inspections
      const { data: inspections } = await supabase
        .from('inspections')
        .select('*');

      const delayedInspections = inspections?.filter(i => 
        i.status === 'scheduled' && new Date(i.date) < now
      ) || [];

      // Load insurance certificates
      const { data: insuranceCerts } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('status', 'active');

      const expiringInsurance = insuranceCerts?.filter(cert => 
        new Date(cert.valid_until) <= thirtyDaysFromNow
      ) || [];

      // Calculate HTTP metrics from localStorage or service
      const httpMetrics = this.getHttpMetrics();

      return {
        http: {
          status: httpMetrics.errorRate > 10 ? 'critical' : 
                 httpMetrics.errorRate > 5 ? 'warning' : 'active',
          responseTime: httpMetrics.averageResponseTime,
          errorRate: httpMetrics.errorRate,
          uptime: httpMetrics.uptime
        },
        guarantees: {
          count: guarantees?.length || 0,
          expiring: expiringGuarantees.length,
          status: expiringGuarantees.length > 0 ? `${expiringGuarantees.length} Expirent` : 'Surveillées'
        },
        payments: {
          count: paymentBlocks?.length || 0,
          blocked: paymentBlocks?.length || 0,
          status: paymentBlocks?.length ? `${paymentBlocks.length} Bloqués` : 'Actif'
        },
        inspections: {
          count: inspections?.length || 0,
          delayed: delayedInspections.length,
          status: delayedInspections.length > 0 ? `${delayedInspections.length} En Retard` : 'Suivi'
        },
        insurance: {
          count: insuranceCerts?.length || 0,
          expiring: expiringInsurance.length,
          status: expiringInsurance.length > 0 ? `${expiringInsurance.length} Expirent` : 'Actives'
        }
      };
    } catch (error) {
      console.error('Error loading monitoring stats:', error);
      throw error;
    }
  }

  async getSystemAlerts(): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];
    const stats = await this.getMonitoringStats();

    // Generate alerts based on monitoring stats
    if (stats.guarantees.expiring > 0) {
      alerts.push({
        id: 'guarantees-expiring',
        type: 'guarantees',
        severity: stats.guarantees.expiring > 3 ? 'critical' : 'high',
        title: 'Garanties Bancaires Expirant',
        message: `${stats.guarantees.expiring} garantie(s) bancaire(s) expirent dans les 30 prochains jours`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    if (stats.payments.blocked > 0) {
      alerts.push({
        id: 'payments-blocked',
        type: 'payments',
        severity: 'high',
        title: 'Paiements Bloqués',
        message: `${stats.payments.blocked} paiement(s) sont actuellement bloqués`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    if (stats.inspections.delayed > 0) {
      alerts.push({
        id: 'inspections-delayed',
        type: 'inspections',
        severity: stats.inspections.delayed > 5 ? 'critical' : 'medium',
        title: 'Inspections En Retard',
        message: `${stats.inspections.delayed} inspection(s) sont en retard`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    if (stats.insurance.expiring > 0) {
      alerts.push({
        id: 'insurance-expiring',
        type: 'insurance',
        severity: 'medium',
        title: 'Assurances Expirant',
        message: `${stats.insurance.expiring} certificat(s) d'assurance expirent bientôt`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    if (stats.http.errorRate > 10) {
      alerts.push({
        id: 'http-errors',
        type: 'system',
        severity: 'critical',
        title: 'Taux d\'Erreur HTTP Élevé',
        message: `Taux d'erreur de ${stats.http.errorRate.toFixed(1)}% détecté`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private getHttpMetrics() {
    const stored = localStorage.getItem('httpMetrics');
    if (stored) {
      const data = JSON.parse(stored);
      return {
        averageResponseTime: data.averageResponseTime || 0,
        errorRate: data.errorRate || 0,
        uptime: data.uptime || 100
      };
    }
    return {
      averageResponseTime: 0,
      errorRate: 0,
      uptime: 100
    };
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    // In a real implementation, this would update the database
    console.log(`Alert ${alertId} acknowledged`);
  }

  calculateOverallHealth(stats: MonitoringStats): MonitoringMetrics['projectHealth'] {
    const pendingAlerts = 
      (stats.guarantees.expiring > 0 ? 1 : 0) +
      (stats.payments.blocked > 0 ? 1 : 0) +
      (stats.inspections.delayed > 0 ? 1 : 0) +
      (stats.insurance.expiring > 0 ? 1 : 0);

    return calculateProjectHealth(
      stats.http.errorRate,
      stats.http.responseTime,
      stats.http.uptime,
      pendingAlerts
    );
  }
}

export const comprehensiveMonitoringService = new ComprehensiveMonitoringService();