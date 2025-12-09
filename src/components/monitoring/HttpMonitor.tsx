import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface HttpMetrics {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  errorRate: number;
  recentErrors: Array<{
    timestamp: Date;
    status: number;
    url: string;
    message: string;
  }>;
}

const HttpMonitor: React.FC = () => {
  const { t } = useLanguage();

  const [metrics, setMetrics] = useState<HttpMetrics>({
    totalRequests: 0,
    successRequests: 0,
    errorRequests: 0,
    averageResponseTime: 0,
    errorRate: 0,
    recentErrors: []
  });

  useEffect(() => {
    // Simuler la collecte de métriques depuis le localStorage ou un service
    const collectMetrics = () => {
      const stored = localStorage.getItem('httpMetrics');
      if (stored) {
        const data = JSON.parse(stored);
        setMetrics({
          ...data,
          recentErrors: data.recentErrors.map((error: any) => ({
            ...error,
            timestamp: new Date(error.timestamp)
          }))
        });
      }
    };

    collectMetrics();
    const interval = setInterval(collectMetrics, 5000); // Actualiser toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-500';
    if (status >= 300 && status < 400) return 'bg-yellow-500';
    if (status >= 400 && status < 500) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusText = (status: number) => {
    if (status >= 200 && status < 300) return t('dashboard.monitoring.status_success');
    if (status >= 300 && status < 400) return t('dashboard.monitoring.status_redirect');
    if (status >= 400 && status < 500) return t('dashboard.monitoring.status_client_error');
    return t('dashboard.monitoring.status_server_error');
  };

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.monitoring.total_requests')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.monitoring.success_rate')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalRequests > 0 
                ? ((metrics.successRequests / metrics.totalRequests) * 100).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.monitoring.error_rate')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.monitoring.avg_response_time')}</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResponseTime}ms</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes pour taux d'erreur élevé */}
      {metrics.errorRate > 10 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('dashboard.monitoring.error_alert_message')} ({metrics.errorRate.toFixed(1)}%).
          </AlertDescription>
        </Alert>
      )}

      {/* Erreurs récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('dashboard.monitoring.recent_errors')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.monitoring.recent_errors_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recentErrors.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.monitoring.no_recent_errors')}</p>
          ) : (
            <div className="space-y-3">
              {metrics.recentErrors.slice(0, 10).map((error, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(error.status)} text-white`}>
                      {error.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{getStatusText(error.status)}</p>
                      <p className="text-xs text-muted-foreground">{error.url}</p>
                      <p className="text-xs text-muted-foreground">{error.message}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {error.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HttpMonitor;