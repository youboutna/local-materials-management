/**
 * Hexagonal Hook for Alerts Dashboard
 * Combines data from multiple sources to create unified alerts
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBankGuaranteesHex, usePaymentBlocksHex, useInsurancesHex } from './useMonitoringHex';
import { useInspectionsHex } from './useInspectionsHex';
import { detectProjectDelays } from '@/services/BankGuaranteeService';
import { DELAY_THRESHOLDS } from '@/types/project';

export interface AlertData {
  id: string;
  type: 'delay' | 'payment' | 'inspection' | 'guarantee';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  timestamp: Date;
  status: 'active' | 'resolved' | 'acknowledged';
}

export interface AlertStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export function useAlertsHex() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AlertStats>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  });

  // Use existing hexagonal hooks
  const { blocks: paymentBlocks, loading: blocksLoading } = usePaymentBlocksHex();
  const { guarantees, getExpiringGuarantees, loading: guaranteesLoading } = useBankGuaranteesHex();
  const { inspections, isLoading: inspectionsLoading } = useInspectionsHex();

  const getSeverity = useCallback((delayPercentage: number): AlertData['severity'] => {
    if (delayPercentage >= DELAY_THRESHOLDS.LEGAL_ESCALATION) return 'critical';
    if (delayPercentage >= DELAY_THRESHOLDS.GUARANTEE_TRIGGER) return 'high';
    if (delayPercentage >= DELAY_THRESHOLDS.WARNING) return 'medium';
    return 'low';
  }, []);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allAlerts: AlertData[] = [];

      // Load project delays
      const delays = await detectProjectDelays();
      const delayAlerts: AlertData[] = delays
        .filter((delay) => delay.delayPercentage >= DELAY_THRESHOLDS.WARNING)
        .map((delay) => ({
          id: `delay-${delay.projectId}`,
          type: 'delay' as const,
          severity: getSeverity(delay.delayPercentage),
          title: `Retard projet: ${delay.projectName}`,
          description: `Retard de ${delay.delayPercentage.toFixed(1)}% détecté`,
          projectId: delay.projectId,
          projectName: delay.projectName,
          timestamp: new Date(),
          status: 'active' as const,
        }));
      allAlerts.push(...delayAlerts);

      // Convert payment blocks to alerts
      if (paymentBlocks) {
        paymentBlocks
          .filter(block => !block.resolvedAt)
          .forEach((block) => {
            allAlerts.push({
              id: `payment-block-${block.id}`,
              type: 'payment',
              severity: 'high',
              title: 'Paiement bloqué',
              description: `Montant ${block.amount.toLocaleString()} MRU bloqué - ${block.notes || 'Validation requise'}`,
              projectId: block.projectId,
              timestamp: new Date(block.blockedAt),
              status: 'active',
            });
          });
      }

      // Convert overdue inspections to alerts
      if (inspections) {
        inspections
          .filter(inspection => {
            const inspDate = new Date(inspection.date);
            return inspDate < new Date() && inspection.status !== 'completed';
          })
          .forEach((inspection) => {
            const daysPast = Math.floor(
              (Date.now() - new Date(inspection.date).getTime()) / (1000 * 60 * 60 * 24)
            );
            allAlerts.push({
              id: `inspection-overdue-${inspection.id}`,
              type: 'inspection',
              severity: daysPast > 7 ? 'high' : 'medium',
              title: 'Inspection en retard',
              description: `Inspection en retard de ${daysPast} jours`,
              projectId: inspection.projectId,
              timestamp: new Date(inspection.date),
              status: 'active',
            });
          });
      }

      // Convert expiring guarantees to alerts
      const expiringGuarantees = getExpiringGuarantees(30);
      expiringGuarantees.forEach((guarantee) => {
        const daysLeft = Math.ceil(
          (new Date(guarantee.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        allAlerts.push({
          id: `guarantee-expiring-${guarantee.id}`,
          type: 'guarantee',
          severity: daysLeft <= 7 ? 'critical' : daysLeft <= 14 ? 'high' : 'medium',
          title: 'Garantie expirant',
          description: `Garantie de ${guarantee.guaranteeAmount.toLocaleString()} MRU expire dans ${daysLeft} jours`,
          projectId: guarantee.projectId,
          timestamp: new Date(),
          status: 'active',
        });
      });

      setAlerts(allAlerts);

      // Calculate stats
      const newStats = allAlerts.reduce(
        (acc, alert) => {
          acc[alert.severity]++;
          acc.total++;
          return acc;
        },
        { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
      );

      setStats(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [paymentBlocks, inspections, getExpiringGuarantees, getSeverity]);

  useEffect(() => {
    if (!blocksLoading && !guaranteesLoading && !inspectionsLoading) {
      loadAlerts();
    }
  }, [loadAlerts, blocksLoading, guaranteesLoading, inspectionsLoading]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
      )
    );
  }, []);

  const filterAlertsByType = useCallback((type: string) => {
    if (type === 'all') return alerts;
    return alerts.filter((alert) => alert.type === type);
  }, [alerts]);

  return {
    alerts,
    loading: loading || blocksLoading || guaranteesLoading || inspectionsLoading,
    error,
    stats,
    refetch: loadAlerts,
    acknowledgeAlert,
    filterAlertsByType,
  };
}
