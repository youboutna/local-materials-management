import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Activity, TrendingUp, Wallet } from 'lucide-react';
import { ProjectMetricsOrchestrator, type ProjectMetricsInput } from '@/application/services/ProjectMetricsOrchestrator';
import ProjectGanttTimeline from '@/components/project/ProjectGanttTimeline';

/**
 * ProjectMetricsPanel — Dashboard Monitoring alimenté EXCLUSIVEMENT par
 * ProjectMetricsOrchestrator (mêmes valeurs et même formatage que le tableau
 * Suivi & Évaluation et que le rapport PDF).
 */
interface Props {
  project: any;
  phases?: any[];
  actualCost?: number | null;
  inspectionsCount?: number;
  documentsCount?: number;
  risks?: any[];
  pertExpectedDuration?: number | null;
  /**
   * 'full'    → KPI + alertes + 7 axes + Gantt (détail projet, phases, monitoring)
   * 'compact' → KPI + alertes (workflows création/édition, sous-objets)
   */
  variant?: 'full' | 'compact';
  showAxes?: boolean;
  showAlerts?: boolean;
  showGantt?: boolean;
  className?: string;
}

const APPRECIATION_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  good: 'default',
  warning: 'secondary',
  critical: 'destructive',
  unknown: 'outline',
};

export const ProjectMetricsPanel: React.FC<Props> = ({
  project,
  phases = [],
  actualCost,
  inspectionsCount = 0,
  documentsCount = 0,
  risks = [],
  pertExpectedDuration = null,
  variant = 'full',
  showAxes,
  showAlerts,
  showGantt,
  className,
}) => {
  const isCompact = variant === 'compact';
  const withAxes = showAxes ?? !isCompact;
  const withAlerts = showAlerts ?? true;
  const withGantt = showGantt ?? !isCompact;

  const metrics = useMemo(() => {
    const input: ProjectMetricsInput = {
      project: {
        id: project?.id,
        title: project?.title,
        budget: project?.budget ?? 0,
        progress: project?.progress ?? 0,
        startDate: project?.startDate ?? null,
        endDate: project?.endDate ?? null,
        interventionZones: project?.interventionZones ?? [],
        currency: project?.currency || 'MRU',
      },
      phases: (phases || []).map((p: any) => ({
        id: p.id,
        name: p.phase ?? p.phase_name ?? p.name,
        weight: p.weight ?? p.weight_percentage,
        budget: p.budget ?? p.estimatedCost ?? p.estimated_cost,
        startDate: p.startDate ?? p.start_date,
        endDate: p.endDate ?? p.end_date,
        progress: p.progress ?? p.actualProgress ?? 0,
        actualCost: p.actualCost ?? p.actual_cost,
        status: p.status,
      })),
      actualCost: actualCost ?? project?.actualCost ?? 0,
      inspectionsCount,
      documentsCount,
      risks,
      pertExpectedDuration,
    };
    return ProjectMetricsOrchestrator.compute(input);
  }, [project, phases, actualCost, inspectionsCount, documentsCount, risks, pertExpectedDuration]);

  return (
    <div className={`${isCompact ? 'space-y-3' : 'space-y-6'} ${className ?? ''}`}>
      {/* KPI — source unique */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progression pondérée</p>
                <p className="text-xl font-semibold">{metrics.formatted.progress}</p>
              </div>
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              base de pondération : {metrics.progressBasisLabel} · planifié {metrics.formatted.plannedProgress}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget / Engagé</p>
                <p className="text-xl font-semibold">{metrics.formatted.budget}</p>
              </div>
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              engagé {metrics.formatted.actualCost} ({metrics.formatted.budgetCommitmentRate})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SPI / CPI</p>
                <p className="text-xl font-semibold">
                  {metrics.formatted.spi} / {metrics.formatted.cpi}
                </p>
              </div>
              <Activity className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              délai : {metrics.schedulePerformanceLabel} · coût : {metrics.costPerformanceLabel}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Écart budget / avancement</p>
                <p className="text-xl font-semibold">{metrics.formatted.budgetVariance}</p>
              </div>
              <AlertTriangle className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              écart d'avancement : {metrics.formatted.scheduleGap} · durée référence{' '}
              {metrics.formatted.referenceDuration}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes actives (mêmes règles que le rapport PDF) */}
      {withAlerts && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alertes actives ({metrics.alerts.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune alerte déclenchée par les métriques.</p>
          ) : (
            metrics.alerts.map((alert) => (
              <div key={alert.code} className="flex items-center justify-between rounded-md border p-2">
                <div>
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.detail && <p className="text-xs text-muted-foreground">{alert.detail}</p>}
                </div>
                <Badge variant={alert.level === 'critical' ? 'destructive' : 'secondary'}>
                  {alert.level === 'critical' ? 'CRITIQUE' : 'VIGILANCE'}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      )}

      {/* Suivi & Évaluation — 7 axes */}
      {withAxes && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Suivi &amp; Évaluation (7 axes)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.insights.map((axis) => (
            <div key={axis.code} className="flex items-center justify-between gap-4 border-b pb-2 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{axis.label}</p>
                <p className="truncate text-xs text-muted-foreground">{axis.decisionQuestion}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm tabular-nums">{axis.value}</span>
                <Badge variant={APPRECIATION_VARIANT[axis.appreciation]}>{axis.appreciationLabel}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      )}

      {/* Gantt réutilisable */}
      {withGantt && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Diagramme de Gantt (calendrier réel)</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectGanttTimeline gantt={metrics.gantt} showAsciiBars={!isCompact} />
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default ProjectMetricsPanel;
