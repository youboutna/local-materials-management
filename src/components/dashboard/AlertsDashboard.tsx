import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, DollarSign, Shield, TrendingDown, Bell } from 'lucide-react';
import { detectProjectDelays, DELAY_THRESHOLDS } from '@/services/bankGuaranteeService';
import { toast } from '@/hooks/use-toast';

interface AlertData {
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

const AlertsDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0
  });

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      // Load project delays
      const delays = await detectProjectDelays();
      const delayAlerts: AlertData[] = delays
        .filter(delay => delay.delayPercentage >= DELAY_THRESHOLDS.WARNING)
        .map(delay => ({
          id: `delay-${delay.projectId}`,
          type: 'delay' as const,
          severity: getSeverity(delay.delayPercentage),
          title: `Retard Projet: ${delay.projectName}`,
          description: `Retard de ${delay.delayPercentage.toFixed(1)}% détecté`,
          projectId: delay.projectId,
          projectName: delay.projectName,
          timestamp: new Date(),
          status: 'active' as const
        }));

      // Simulate other alerts
      const mockAlerts: AlertData[] = [
        {
          id: 'payment-001',
          type: 'payment',
          severity: 'high',
          title: 'Paiement Bloqué',
          description: 'Paiement suspendu en attente de validation',
          timestamp: new Date(Date.now() - 3600000),
          status: 'active'
        },
        {
          id: 'inspection-001',
          type: 'inspection',
          severity: 'medium',
          title: 'Inspection en Retard',
          description: 'Inspection programmée non réalisée',
          timestamp: new Date(Date.now() - 7200000),
          status: 'active'
        }
      ];

      const allAlerts = [...delayAlerts, ...mockAlerts];
      setAlerts(allAlerts);

      // Calculate stats
      const newStats = allAlerts.reduce((acc, alert) => {
        acc[alert.severity]++;
        acc.total++;
        return acc;
      }, { critical: 0, high: 0, medium: 0, low: 0, total: 0 });

      setStats(newStats);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les alertes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (delayPercentage: number): AlertData['severity'] => {
    if (delayPercentage >= DELAY_THRESHOLDS.LEGAL_ESCALATION) return 'critical';
    if (delayPercentage >= DELAY_THRESHOLDS.GUARANTEE_TRIGGER) return 'high';
    if (delayPercentage >= DELAY_THRESHOLDS.WARNING) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'delay': return Clock;
      case 'payment': return DollarSign;
      case 'inspection': return TrendingDown;
      case 'guarantee': return Shield;
      default: return AlertTriangle;
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
    ));
    toast({
      title: 'Alerte Acquittée',
      description: 'L\'alerte a été marquée comme acquittée'
    });
  };

  const filterAlertsByType = (type: string) => {
    if (type === 'all') return alerts;
    return alerts.filter(alert => alert.type === type);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alertes</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Élevées</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyennes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faibles</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="delay">Retards</TabsTrigger>
          <TabsTrigger value="payment">Paiements</TabsTrigger>
          <TabsTrigger value="inspection">Inspections</TabsTrigger>
          <TabsTrigger value="guarantee">Garanties</TabsTrigger>
        </TabsList>

        {['all', 'delay', 'payment', 'inspection', 'guarantee'].map(type => (
          <TabsContent key={type} value={type} className="mt-6">
            <div className="space-y-4">
              {filterAlertsByType(type).length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      Aucune alerte {type !== 'all' ? `de type ${type}` : ''} trouvée
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filterAlertsByType(type).map(alert => {
                  const IconComponent = getSeverityIcon(alert.type);
                  return (
                    <Alert key={alert.id} className={`${alert.status === 'acknowledged' ? 'opacity-60' : ''}`}>
                      <IconComponent className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {alert.title}
                          <Badge className={`${getSeverityColor(alert.severity)} text-white`}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                          {alert.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              Acquitter
                            </Button>
                          )}
                        </div>
                      </AlertTitle>
                      <AlertDescription>
                        {alert.description}
                        {alert.projectName && (
                          <div className="mt-1 text-sm">
                            <strong>Projet:</strong> {alert.projectName}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  );
                })
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AlertsDashboard;