// components/monitoring/PerformanceMetrics.tsx - Performance metrics dashboard with real HTTP integration

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Zap, 
  Clock, 
  Database, 
  Activity,
  BarChart3,
  Gauge
} from 'lucide-react';
import { formatMetric } from '@/utils/monitoringCalculations';
import { httpMetricsCollector } from '@/utils/httpMetricsCollector';
import { getPerformanceMonitoringService } from '@/application/services/PerformanceMonitoringService';
import {
  classifyPerformance,
  PERFORMANCE_STATUS_TEXT_CLASS,
} from '@/config/referentials/kpi/health-thresholds.referential';

// Create service instance once
const performanceService = getPerformanceMonitoringService();

interface PerformanceData {
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number;
    slowQueries: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  requests: {
    perSecond: number;
    averageResponseTime: number;
    totalToday: number;
  };
  errors: {
    rate: number;
    total: number;
    recent: Array<{
      timestamp: string;
      url: string;
      status: number;
      responseTime: number;
    }>;
  };
  http: {
    activeRequests: number;
    successRate: number;
    retryAttempts: number;
  };
}

const PerformanceMetrics: React.FC = () => {
  const [data, setData] = useState<PerformanceData>({
    database: {
      connections: 0,
      maxConnections: 100,
      queryTime: 0,
      slowQueries: 0
    },
    memory: {
      used: 0,
      total: 8,
      percentage: 0
    },
    requests: {
      perSecond: 0,
      averageResponseTime: 0,
      totalToday: 0
    },
    errors: {
      rate: 0,
      total: 0,
      recent: []
    },
    http: {
      activeRequests: 0,
      successRate: 0,
      retryAttempts: 0
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealPerformanceData();
    const interval = setInterval(loadRealPerformanceData, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadRealPerformanceData = async () => {
    try {
      // Get real HTTP metrics from httpMetricsCollector
      const httpMetrics = getHttpMetricsFromCollector();
      
      // Get database performance metrics
      const dbMetrics = await getDatabaseMetrics();
      
      // Get system metrics
      const systemMetrics = getSystemMetrics();

      setData(prevData => ({
        ...prevData,
        ...httpMetrics,
        database: dbMetrics.database || prevData.database,
        memory: systemMetrics.memory || prevData.memory
      }));
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHttpMetricsFromCollector = (): Partial<PerformanceData> => {
    // Get real metrics from httpMetricsCollector
    const metrics = httpMetricsCollector.getMetrics();
    
    return {
      requests: {
        perSecond: metrics.requestCount > 0 ? metrics.requestCount / 60 : 0,
        averageResponseTime: metrics.averageResponseTime,
        totalToday: metrics.requestCount
      },
      errors: {
        rate: metrics.errorRate,
        total: metrics.totalErrors,
        recent: metrics.recentRequests.filter(r => r.status >= 400).slice(0, 5)
      },
      http: {
        activeRequests: metrics.activeRequests,
        successRate: 100 - metrics.errorRate,
        retryAttempts: metrics.retryAttempts
      }
    };
  };

  const getDatabaseMetrics = async (): Promise<Partial<PerformanceData>> => {
    try {
      const dbMetrics = await performanceService.getDatabaseMetrics();
      
      return {
        database: dbMetrics
      };
    } catch (error) {
      console.error('Error getting database metrics:', error);
      return {
        database: {
          connections: 0,
          maxConnections: 100,
          queryTime: 0,
          slowQueries: 0
        }
      };
    }
  };

  const getSystemMetrics = (): Partial<PerformanceData> => {
    // Use Performance API if available
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as any).memory;
      if (memory) {
        return {
          memory: {
            used: memory.usedJSHeapSize / 1024 / 1024 / 1024, // Convert to GB
            total: memory.totalJSHeapSize / 1024 / 1024 / 1024,
            percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
          }
        };
      }
    }
    
    // Fallback
    return {
      memory: {
        used: 2.4,
        total: 8,
        percentage: 30
      }
    };
  };

  const getPerformanceColor = (value: number, code: string) =>
    PERFORMANCE_STATUS_TEXT_CLASS[classifyPerformance(code, value)];


  if (loading) {
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

  return (
    <div className="space-y-6">
      {/* HTTP Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métriques HTTP en Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Taux de succès</span>
                <span className="font-medium">{data.http.successRate.toFixed(1)}%</span>
              </div>
              <Progress value={data.http.successRate} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Requêtes actives</span>
                <Badge variant="outline">{data.http.activeRequests}</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tentatives de retry</span>
                <Badge variant={data.http.retryAttempts > 5 ? 'destructive' : 'secondary'}>
                  {data.http.retryAttempts}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requêtes/sec</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.requests.perSecond.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">
              {data.requests.totalToday.toLocaleString()} aujourd'hui
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de Réponse</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(data.requests.averageResponseTime, 'HTTP_RESPONSE_MS')}`}>
              {formatMetric(data.requests.averageResponseTime, 'time')}
            </div>
            <div className="text-xs text-muted-foreground">Moyenne mobile</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisation Mémoire</CardTitle>
            <Gauge className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.memory.percentage.toFixed(0)}%</div>
            <Progress 
              value={data.memory.percentage} 
              className="mt-2" 
            />
            <div className="text-xs text-muted-foreground mt-1">
              {data.memory.used.toFixed(1)}GB / {data.memory.total}GB
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Erreur</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(data.errors.rate, 'ERROR_RATE_PCT')}`}>
              {data.errors.rate.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {data.errors.total} erreurs récentes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Performance Base de Données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Connexions actives</span>
                <span>{Math.round(data.database.connections)} / {data.database.maxConnections}</span>
              </div>
              <Progress 
                value={(data.database.connections / data.database.maxConnections) * 100} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                {((data.database.connections / data.database.maxConnections) * 100).toFixed(1)}% utilisées
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Temps requête moyen</span>
                <span className={getPerformanceColor(data.database.queryTime, 'DB_QUERY_MS')}>
                  {formatMetric(data.database.queryTime, 'time')}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Dernière mesure
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Requêtes lentes</span>
                <Badge variant={data.database.slowQueries > 5 ? 'destructive' : 'secondary'}>
                  {data.database.slowQueries}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {data.database.slowQueries > 0 ? 'Optimisation recommandée' : 'Performance optimale'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent HTTP Errors */}
      {data.errors.recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Erreurs HTTP Récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.errors.recent.map((error, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      Status {error.status} - {error.url}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(error.timestamp).toLocaleString()} - {error.responseTime}ms
                    </div>
                  </div>
                  <Badge variant="destructive">{error.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceMetrics;