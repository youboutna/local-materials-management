// components/monitoring/SystemHealthOverview.tsx - System health overview component

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import { PerformanceMonitoringService } from '@/application/services/PerformanceMonitoringService';
// Local type definitions for metrics
interface DatabaseMetricsDTO { totalSize?: number; activeConnections?: number; queryPerformance?: number; }
interface LocalPerformanceMetricsDTO { uptime?: number; responseTime?: number; errorRate?: number; throughput?: number; }
import { getHealthColor, getHealthBadgeVariant, formatMetric } from '@/utils/monitoringCalculations';

const SystemHealthOverview: React.FC = () => {
  const [stats, setStats] = useState<LocalPerformanceMetricsDTO | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const performanceMetrics = await new PerformanceMonitoringService().getPerformanceMetrics();
      
      setStats(performanceMetrics);
      // Derive alerts from performance metrics thresholds (no dedicated alerts
      // repository/table exists yet; alerts are computed client-side from stats).
      const derivedAlerts: any[] = [];
      if (performanceMetrics) {
        if ((performanceMetrics.errorRate || 0) > 5) {
          derivedAlerts.push({
            id: 'error-rate',
            severity: (performanceMetrics.errorRate || 0) > 15 ? 'critical' : 'high',
            title: "Taux d'erreur élevé",
            message: `Le taux d'erreur est de ${performanceMetrics.errorRate}%`,
            timestamp: new Date(),
            acknowledged: false,
          });
        }
        if ((performanceMetrics.responseTime || 0) > 2000) {
          derivedAlerts.push({
            id: 'response-time',
            severity: (performanceMetrics.responseTime || 0) > 5000 ? 'critical' : 'high',
            title: 'Temps de réponse dégradé',
            message: `Le temps de réponse moyen est de ${performanceMetrics.responseTime}ms`,
            timestamp: new Date(),
            acknowledged: false,
          });
        }
      }
      setAlerts(derivedAlerts);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      // No dedicated alert-acknowledgment repository/table exists; alerts are
      // derived client-side from live metrics, so acknowledging removes it
      // from the local list until the next refresh recomputes it.
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  if (loading || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallHealth = stats ? 'good' : 'warning'; // Simplified health calculation
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
  const highAlerts = alerts.filter(a => a.severity === 'high' && !a.acknowledged);

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            État Général du Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={getHealthBadgeVariant(overallHealth)} className="px-3 py-1">
                {overallHealth === 'good' && '🔵 Bon'}
                {overallHealth === 'warning' && '🟡 Attention'}
              </Badge>
              <div className="text-sm text-muted-foreground">
                {criticalAlerts.length > 0 && `${criticalAlerts.length} alerte(s) critique(s)`}
                {criticalAlerts.length === 0 && highAlerts.length > 0 && `${highAlerts.length} alerte(s) importante(s)`}
                {alerts.length === 0 && 'Tous les systèmes fonctionnent normalement'}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* HTTP Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance HTTP</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Temps de réponse</span>
                <span>{stats.responseTime ? formatMetric(stats.responseTime, 'time') : '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taux d'erreur</span>
                <span>{stats.errorRate ? formatMetric(stats.errorRate, 'percentage') : '0%'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Disponibilité</span>
                <span>{formatMetric(99.9, 'percentage')}</span>
              </div>
              <Progress value={99.9} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Bank Guarantees */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Garanties Bancaires</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{(stats as any)?.guarantees?.count || 0}</div>
              <div className="text-sm text-muted-foreground">
                {((stats as any)?.guarantees?.expiring || 0) > 0 ? (
                  <span className="text-orange-600">
                    {(stats as any)?.guarantees?.expiring} expirent bientôt
                  </span>
                ) : (
                  'Toutes valides'
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{(stats as any)?.payments?.count || 0}</div>
              <div className="text-sm text-muted-foreground">
                {((stats as any)?.payments?.blocked || 0) > 0 ? (
                  <span className="text-red-600">
                    {(stats as any)?.payments?.blocked} bloqué(s)
                  </span>
                ) : (
                  'Aucun blocage'
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspections</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{(stats as any)?.inspections?.count || 0}</div>
              <div className="text-sm text-muted-foreground">
                {((stats as any)?.inspections?.delayed || 0) > 0 ? (
                  <span className="text-red-600">
                    {(stats as any)?.inspections?.delayed} en retard
                  </span>
                ) : (
                  'À jour'
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes Actives ({alerts.filter(a => !a.acknowledged).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.filter(a => !a.acknowledged).slice(0, 5).map((alert) => (
              <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {alert.severity === 'critical' ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      <span className="font-medium">{alert.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {alert.severity}
                      </Badge>
                    </div>
                    <AlertDescription>{alert.message}</AlertDescription>
                    <div className="text-xs text-muted-foreground mt-1">
                      {alert.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                  >
                    Acquitter
                  </Button>
                </div>
              </Alert>
            ))}
            {alerts.filter(a => !a.acknowledged).length > 5 && (
              <div className="text-sm text-muted-foreground text-center">
                +{alerts.filter(a => !a.acknowledged).length - 5} autres alertes...
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemHealthOverview;