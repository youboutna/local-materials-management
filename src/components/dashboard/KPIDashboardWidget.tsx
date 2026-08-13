import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  ChevronRight,
  Bell,
  CheckCircle,
  XCircle,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useKPIMetricsHex, CriticalAlert } from '@/hooks/hexagonal';
import { formatNumber2, formatAmount2, formatPercent2, formatRatio2 } from '@/utils/reportNumbers';

interface KPIDashboardWidgetProps {
  onAlertClick?: (alert: CriticalAlert) => void;
  compact?: boolean;
}

const KPIDashboardWidget: React.FC<KPIDashboardWidgetProps> = ({
  onAlertClick,
  compact = false
}) => {
  const { kpiMetrics, loading } = useKPIMetricsHex();

  const getSPIColor = (spi: number) => {
    if (spi >= 1) return 'text-green-600';
    if (spi >= 0.9) return 'text-orange-500';
    return 'text-red-600';
  };

  const getCPIColor = (cpi: number) => {
    if (cpi >= 1) return 'text-green-600';
    if (cpi >= 0.9) return 'text-orange-500';
    return 'text-red-600';
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'milestone':
        return <Target className="h-4 w-4" />;
      case 'guarantee':
        return <Clock className="h-4 w-4" />;
      case 'inspection':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!kpiMetrics) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            Indicateurs de Performance
          </span>
          {kpiMetrics.criticalAlerts.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {kpiMetrics.criticalAlerts.length} alerte(s)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-6">
        {/* Performance Indices */}
        <div className="grid grid-cols-2 gap-4">
          {/* SPI Card */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">SPI</span>
              {kpiMetrics.spi >= 1 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className={cn("text-3xl font-bold", getSPIColor(kpiMetrics.spi))}>
              {formatRatio2(kpiMetrics.spi)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Schedule Performance Index
            </div>
          </div>

          {/* CPI Card */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">CPI</span>
              {kpiMetrics.cpi >= 1 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className={cn("text-3xl font-bold", getCPIColor(kpiMetrics.cpi))}>
              {formatRatio2(kpiMetrics.cpi)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Cost Performance Index
            </div>
          </div>
        </div>

        {/* Project Status Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">État des Projets</h4>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex-1 justify-center py-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              {kpiMetrics.projectsOnTrack} En bonne voie
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex-1 justify-center py-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {kpiMetrics.projectsAtRisk} À risque
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex-1 justify-center py-2">
              <XCircle className="h-3 w-3 mr-1" />
              {kpiMetrics.projectsDelayed} En retard
            </Badge>
          </div>
        </div>

        {/* Milestones Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Jalons</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress 
                value={(kpiMetrics.milestonesCompleted / (kpiMetrics.milestonesCompleted + kpiMetrics.milestonesPending)) * 100} 
                className="h-2"
              />
            </div>
            <span className="text-sm font-medium">
              {kpiMetrics.milestonesCompleted}/{kpiMetrics.milestonesCompleted + kpiMetrics.milestonesPending}
            </span>
          </div>
          {kpiMetrics.milestonesOverdue > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              {kpiMetrics.milestonesOverdue} jalon(s) en retard
            </div>
          )}
        </div>

        {/* Critical Alerts */}
        {kpiMetrics.criticalAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-red-500" />
              Alertes Critiques
            </h4>
            <div className="space-y-2">
              {kpiMetrics.criticalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:opacity-80",
                    getSeverityStyles(alert.severity)
                  )}
                  onClick={() => onAlertClick?.(alert)}
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs opacity-80 truncate">{alert.description}</p>
                  </div>
                  {alert.actionUrl && (
                    <Link to={alert.actionUrl}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Summary */}
        {!compact && (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Budget Global</span>
              <span className="text-xs text-muted-foreground">
                {formatPercent2((kpiMetrics.totalSpent / kpiMetrics.totalBudget) * 100)} consommé
              </span>
            </div>
            <Progress 
              value={(kpiMetrics.totalSpent / kpiMetrics.totalBudget) * 100} 
              className="h-2 mb-3"
            />
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Dépensé: </span>
                <span className="font-medium">{formatNumber2(kpiMetrics.totalSpent / 1000000)}M</span>
              </div>
              <div>
                <span className="text-muted-foreground">Budget: </span>
                <span className="font-medium">{formatNumber2(kpiMetrics.totalBudget / 1000000)}M</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPIDashboardWidget;
