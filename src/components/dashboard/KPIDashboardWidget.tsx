import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  Activity,
  ChevronRight,
  Bell,
  CheckCircle,
  XCircle,
  Calendar,
  Gauge
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format, parseISO, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface KPIData {
  // Schedule Performance
  spi: number; // Schedule Performance Index
  projectsOnTrack: number;
  projectsDelayed: number;
  projectsAtRisk: number;
  
  // Cost Performance  
  cpi: number; // Cost Performance Index
  totalBudget: number;
  totalSpent: number;
  budgetVariance: number;
  
  // Milestones
  milestonesCompleted: number;
  milestonesPending: number;
  milestonesOverdue: number;
  
  // Alerts
  criticalAlerts: CriticalAlert[];
}

interface CriticalAlert {
  id: string;
  type: 'payment' | 'milestone' | 'delay' | 'inspection' | 'guarantee';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  daysUntil?: number;
  entityId?: string;
  entityType?: string;
  actionUrl?: string;
}

interface KPIDashboardWidgetProps {
  onAlertClick?: (alert: CriticalAlert) => void;
  compact?: boolean;
}

const KPIDashboardWidget: React.FC<KPIDashboardWidgetProps> = ({
  onAlertClick,
  compact = false
}) => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKPIData();
  }, []);

  const loadKPIData = async () => {
    try {
      setLoading(true);

      // Fetch projects for KPI calculation
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, status, progress, budget, start_date, end_date');

      // Fetch milestones
      const { data: milestones } = await supabase
        .from('enhanced_project_milestones')
        .select('*');

      // Fetch payments for budget tracking
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, due_date, project_id');

      // Fetch upcoming inspections
      const { data: inspections } = await supabase
        .from('inspections')
        .select('id, date, status, project_id')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(10);

      // Fetch bank guarantees expiring soon
      const { data: guarantees } = await supabase
        .from('bank_guarantees')
        .select('*')
        .gte('expiry_date', new Date().toISOString())
        .order('expiry_date', { ascending: true })
        .limit(5);

      // Calculate KPIs
      const today = new Date();
      let projectsOnTrack = 0;
      let projectsDelayed = 0;
      let projectsAtRisk = 0;
      let totalBudget = 0;
      let totalSpent = 0;
      let plannedProgress = 0;
      let actualProgress = 0;

      (projects || []).forEach((project: any) => {
        totalBudget += project.budget || 0;
        actualProgress += project.progress || 0;

        // Calculate planned progress based on dates
        if (project.start_date && project.end_date) {
          const startDate = new Date(project.start_date);
          const endDate = new Date(project.end_date);
          const totalDays = differenceInDays(endDate, startDate);
          const elapsedDays = differenceInDays(today, startDate);
          const expectedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
          plannedProgress += expectedProgress;

          // Categorize project status
          const variance = (project.progress || 0) - expectedProgress;
          if (variance >= -5) {
            projectsOnTrack++;
          } else if (variance >= -15) {
            projectsAtRisk++;
          } else {
            projectsDelayed++;
          }
        } else {
          projectsOnTrack++;
        }
      });

      // Calculate SPI
      const spi = plannedProgress > 0 ? actualProgress / plannedProgress : 1;

      // Calculate spent from payments
      (payments || []).forEach((payment: any) => {
        if (payment.status === 'paid' || payment.status === 'completed') {
          totalSpent += payment.amount || 0;
        }
      });

      // Calculate CPI
      const cpi = totalSpent > 0 ? (actualProgress / 100 * totalBudget) / totalSpent : 1;

      // Count milestones
      const milestonesCompleted = (milestones || []).filter((m: any) => m.status === 'completed').length;
      const milestonesPending = (milestones || []).filter((m: any) => m.status !== 'completed').length;
      const milestonesOverdue = (milestones || []).filter((m: any) => {
        if (m.status === 'completed') return false;
        return m.target_date && new Date(m.target_date) < today;
      }).length;

      // Generate critical alerts
      const criticalAlerts: CriticalAlert[] = [];

      // Payment due alerts
      (payments || []).forEach((payment: any) => {
        if (payment.status === 'pending' && payment.due_date) {
          const daysUntil = differenceInDays(new Date(payment.due_date), today);
          if (daysUntil <= 7 && daysUntil >= 0) {
            criticalAlerts.push({
              id: `payment-${payment.project_id}`,
              type: 'payment',
              title: 'Paiement imminent',
              description: `Échéance dans ${daysUntil} jour(s) - ${(payment.amount / 1000000).toFixed(2)}M MRU`,
              severity: daysUntil <= 3 ? 'critical' : 'warning',
              daysUntil,
              entityId: payment.project_id,
              entityType: 'payment',
              actionUrl: '/payment-control'
            });
          }
        }
      });

      // Overdue milestones
      (milestones || []).filter((m: any) => {
        if (m.status === 'completed') return false;
        return m.target_date && new Date(m.target_date) < today;
      }).slice(0, 3).forEach((m: any) => {
        const daysLate = differenceInDays(today, new Date(m.target_date));
        criticalAlerts.push({
          id: `milestone-${m.id}`,
          type: 'milestone',
          title: 'Jalon en retard',
          description: `${m.title} - ${daysLate} jour(s) de retard`,
          severity: daysLate > 7 ? 'critical' : 'warning',
          daysUntil: -daysLate,
          entityId: m.project_id,
          entityType: 'milestone',
          actionUrl: `/projects/${m.project_id}`
        });
      });

      // Guarantee expiry alerts
      (guarantees || []).forEach((g: any) => {
        const daysUntil = differenceInDays(new Date(g.expiry_date), today);
        if (daysUntil <= 30) {
          criticalAlerts.push({
            id: `guarantee-${g.id}`,
            type: 'guarantee',
            title: 'Garantie bancaire',
            description: `Expiration dans ${daysUntil} jour(s) - ${g.bank_name}`,
            severity: daysUntil <= 7 ? 'critical' : 'warning',
            daysUntil,
            entityId: g.id,
            entityType: 'guarantee',
            actionUrl: '/bank-guarantee-monitor'
          });
        }
      });

      // Sort alerts by severity and days
      criticalAlerts.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return (a.daysUntil || 0) - (b.daysUntil || 0);
      });

      setKpiData({
        spi: Math.round(spi * 100) / 100,
        projectsOnTrack,
        projectsDelayed,
        projectsAtRisk,
        cpi: Math.round(cpi * 100) / 100,
        totalBudget,
        totalSpent,
        budgetVariance: totalBudget - totalSpent,
        milestonesCompleted,
        milestonesPending,
        milestonesOverdue,
        criticalAlerts: criticalAlerts.slice(0, 5)
      });

    } catch (error) {
      console.error('Error loading KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!kpiData) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            Indicateurs de Performance
          </span>
          {kpiData.criticalAlerts.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {kpiData.criticalAlerts.length} alerte(s)
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
              {kpiData.spi >= 1 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className={cn("text-3xl font-bold", getSPIColor(kpiData.spi))}>
              {kpiData.spi.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Schedule Performance Index
            </div>
          </div>

          {/* CPI Card */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">CPI</span>
              {kpiData.cpi >= 1 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className={cn("text-3xl font-bold", getCPIColor(kpiData.cpi))}>
              {kpiData.cpi.toFixed(2)}
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
              {kpiData.projectsOnTrack} En bonne voie
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex-1 justify-center py-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {kpiData.projectsAtRisk} À risque
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex-1 justify-center py-2">
              <XCircle className="h-3 w-3 mr-1" />
              {kpiData.projectsDelayed} En retard
            </Badge>
          </div>
        </div>

        {/* Milestones Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Jalons</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress 
                value={(kpiData.milestonesCompleted / (kpiData.milestonesCompleted + kpiData.milestonesPending)) * 100} 
                className="h-2"
              />
            </div>
            <span className="text-sm font-medium">
              {kpiData.milestonesCompleted}/{kpiData.milestonesCompleted + kpiData.milestonesPending}
            </span>
          </div>
          {kpiData.milestonesOverdue > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              {kpiData.milestonesOverdue} jalon(s) en retard
            </div>
          )}
        </div>

        {/* Critical Alerts */}
        {kpiData.criticalAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-red-500" />
              Alertes Critiques
            </h4>
            <div className="space-y-2">
              {kpiData.criticalAlerts.map((alert) => (
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
                {((kpiData.totalSpent / kpiData.totalBudget) * 100).toFixed(1)}% consommé
              </span>
            </div>
            <Progress 
              value={(kpiData.totalSpent / kpiData.totalBudget) * 100} 
              className="h-2 mb-3"
            />
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Dépensé: </span>
                <span className="font-medium">{(kpiData.totalSpent / 1000000).toFixed(1)}M</span>
              </div>
              <div>
                <span className="text-muted-foreground">Budget: </span>
                <span className="font-medium">{(kpiData.totalBudget / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPIDashboardWidget;
