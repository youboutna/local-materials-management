// components/monitoring/PerformanceMetrics.tsx - Performance metrics dashboard

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
      timestamp: Date;
      type: string;
      message: string;
    }>;
  };
}

const PerformanceMetrics: React.FC = () => {
  const [data, setData] = useState<PerformanceData>({
    database: {
      connections: 12,
      maxConnections: 100,
      queryTime: 45,
      slowQueries: 2
    },
    memory: {
      used: 2.4,
      total: 8,
      percentage: 30
    },
    requests: {
      perSecond: 15,
      averageResponseTime: 250,
      totalToday: 12500
    },
    errors: {
      rate: 0.5,
      total: 8,
      recent: []
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time data updates
      setData(prev => ({
        ...prev,
        database: {
          ...prev.database,
          connections: Math.max(1, prev.database.connections + (Math.random() - 0.5) * 4),
          queryTime: Math.max(10, prev.database.queryTime + (Math.random() - 0.5) * 20)
        },
        memory: {
          ...prev.memory,
          percentage: Math.max(10, Math.min(90, prev.memory.percentage + (Math.random() - 0.5) * 10))
        },
        requests: {
          ...prev.requests,
          perSecond: Math.max(1, prev.requests.perSecond + (Math.random() - 0.5) * 8),
          averageResponseTime: Math.max(50, prev.requests.averageResponseTime + (Math.random() - 0.5) * 100)
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
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
            <div className={`text-2xl font-bold ${getPerformanceColor(data.requests.averageResponseTime, { good: 200, warning: 500 })}`}>
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
            <div className={`text-2xl font-bold ${getPerformanceColor(data.errors.rate, { good: 1, warning: 5 })}`}>
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
                <span className={getPerformanceColor(data.database.queryTime, { good: 50, warning: 100 })}>
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

      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Ressources Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Utilisation des Ressources</h4>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Mémoire</span>
                    <span>{data.memory.percentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={data.memory.percentage} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disque</span>
                    <span>67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Métriques Temps Réel</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Utilisateurs connectés</span>
                  <Badge variant="outline">24</Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">Sessions actives</span>
                  <Badge variant="outline">18</Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">Tâches en file</span>
                  <Badge variant="outline">3</Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">Cache hit ratio</span>
                  <Badge variant="secondary">94.2%</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetrics;