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
import { T } from '@/components/i18n/T';
import { useI18n } from '@/hooks/useI18n';

interface KPIDashboardWidgetProps {
  onAlertClick?: (alert: CriticalAlert) => void;
  compact?: boolean;
}

const KPIDashboardWidget: React.FC<KPIDashboardWidgetProps> = ({
  onAlertClick,
  compact = false
}) => {
  const { t } = useI18n();

  const { kpiMetrics, loading, isError } = useKPIMetricsHex();

  const getSPIColor = (spi: number | null) => {
    if (spi === null) return 'text-muted-foreground';
    if (spi >= 1) return 'text-success';
    if (spi >= 0.9) return 'text-warning';
    return 'text-destructive';
  };

  const getCPIColor = (cpi: number | null) => {
    if (cpi === null) return 'text-muted-foreground';
    if (cpi >= 1) return 'text-success';
    if (cpi >= 0.9) return 'text-warning';
    return 'text-destructive';
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'warning':
        return 'bg-warning/10 border-warning/30 text-warning';
      default:
        return 'bg-primary/10 border-primary/30 text-primary';
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

  if (isError) {
    return <Card><CardContent className="p-6 text-sm text-destructive">{t('dashboard.kpi.load_error')}</CardContent></Card>;
  }
  if (!kpiMetrics) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <T k="auto.kpidashboardwidget.indicateurs_de_performance" fallback="Indicateurs de Performance" />
          </span>
          {kpiMetrics.criticalAlerts.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {kpiMetrics.criticalAlerts.length} {t('dashboard.kpi.alerts_suffix')}
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
              <span className="text-sm text-muted-foreground"><T k="auto.kpidashboardwidget.spi" fallback="SPI" /></span>
              {kpiMetrics.spi !== null && kpiMetrics.spi >= 1 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className={cn("text-3xl font-bold", getSPIColor(kpiMetrics.spi))}>
              {kpiMetrics.spi === null ? t('dashboard.kpi.not_evaluable') : formatRatio2(kpiMetrics.spi)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <T k="auto.kpidashboardwidget.schedule_performance_index" fallback="Schedule Performance Index" />
            </div>
          </div>

          {/* CPI Card */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground"><T k="auto.kpidashboardwidget.cpi" fallback="CPI" /></span>
              {kpiMetrics.cpi !== null && kpiMetrics.cpi >= 1 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className={cn("text-3xl font-bold", getCPIColor(kpiMetrics.cpi))}>
              {kpiMetrics.cpi === null ? t('dashboard.kpi.not_evaluable') : formatRatio2(kpiMetrics.cpi)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <T k="auto.kpidashboardwidget.cost_performance_index" fallback="Cost Performance Index" />
            </div>
          </div>
        </div>

        {/* Project Status Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium"><T k="auto.kpidashboardwidget.etat_des_projets" fallback="État des Projets" /></h4>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-success-soft text-success border-success/30 flex-1 justify-center py-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              {kpiMetrics.projectsOnTrack} {t('dashboard.kpi.on_track')}
            </Badge>
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 flex-1 justify-center py-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {kpiMetrics.projectsAtRisk} {t('dashboard.kpi.at_risk')}
            </Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 flex-1 justify-center py-2">
              <XCircle className="h-3 w-3 mr-1" />
              {kpiMetrics.projectsDelayed} {t('dashboard.kpi.delayed')}
            </Badge>
          </div>
        </div>

        {/* Milestones Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium"><T k="auto.kpidashboardwidget.jalons" fallback="Jalons" /></h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress 
                 value={kpiMetrics.milestonesCompleted + kpiMetrics.milestonesPending > 0 ? (kpiMetrics.milestonesCompleted / (kpiMetrics.milestonesCompleted + kpiMetrics.milestonesPending)) * 100 : 0}
                className="h-2"
              />
            </div>
            <span className="text-sm font-medium">
              {kpiMetrics.milestonesCompleted}/{kpiMetrics.milestonesCompleted + kpiMetrics.milestonesPending}
            </span>
          </div>
          {kpiMetrics.milestonesOverdue > 0 && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {kpiMetrics.milestonesOverdue} {t('dashboard.kpi.milestones_overdue_suffix')}
            </div>
          )}
        </div>

        {/* Critical Alerts */}
        {kpiMetrics.criticalAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-destructive" />
              <T k="auto.kpidashboardwidget.alertes_critiques" fallback="Alertes Critiques" />
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
              <span className="text-sm font-medium"><T k="auto.kpidashboardwidget.budget_global" fallback="Budget Global" /></span>
              <span className="text-xs text-muted-foreground">
                 {kpiMetrics.totalBudget > 0 ? formatPercent2((kpiMetrics.totalSpent / kpiMetrics.totalBudget) * 100) : t('dashboard.kpi.not_evaluable')} {t('dashboard.kpi.consumed')}
              </span>
            </div>
            <Progress 
             value={kpiMetrics.totalBudget > 0 ? (kpiMetrics.totalSpent / kpiMetrics.totalBudget) * 100 : 0}
              className="h-2 mb-3"
            />
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-muted-foreground"><T k="auto.kpidashboardwidget.depense" fallback="Dépensé:" /> </span>
                <span className="font-medium">{formatNumber2(kpiMetrics.totalSpent / 1000000)}M</span>
              </div>
              <div>
                <span className="text-muted-foreground"><T k="auto.kpidashboardwidget.budget" fallback="Budget:" /> </span>
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
