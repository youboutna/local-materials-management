/**
 * PERTDiagram - Program Evaluation and Review Technique visualization
 * Shows optimistic/pessimistic estimates, critical path, and variance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  GitBranch,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Target,
  BarChart3,
  Sigma
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGanttPertService, UnifiedPERTData } from '@/services/GanttPertDataService';

interface PERTDiagramProps {
  projectId: string;
  projectData?: any;
  phaseId?: string; // Optional: filter to specific phase
  compact?: boolean;
}

const PERTDiagram: React.FC<PERTDiagramProps> = ({
  projectId,
  projectData,
  phaseId,
  compact = false
}) => {
  const [data, setData] = useState<UnifiedPERTData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId && projectData) {
      loadPERTData();
    }
  }, [projectId, projectData]);

  const loadPERTData = async () => {
    try {
      setLoading(true);
      const service = getGanttPertService();
      const pertData = await service.getUnifiedPERTData(projectId, projectData);
      setData(pertData);
    } catch (error) {
      console.error('Error loading PERT data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Aucune donnée PERT disponible</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate confidence metrics
  const confidencePercent = data.totalExpectedDuration > 0 
    ? ((data.confidenceLevel95Days - data.totalExpectedDuration) / data.totalExpectedDuration) * 100 
    : 0;

  return (
    <Card className={cn(compact && "border-0 shadow-none")}>
      <CardHeader className={cn("pb-3", compact && "px-0")}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitBranch className="h-5 w-5 text-primary" />
          Analyse PERT
        </CardTitle>
      </CardHeader>

      <CardContent className={cn("space-y-6", compact && "px-0")}>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Expected Duration */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Durée estimée</span>
            </div>
            <p className="text-2xl font-bold">{data.projectDurationDays} j</p>
            <p className="text-xs text-muted-foreground mt-1">
              TE = (O + 4M + P) / 6
            </p>
          </div>

          {/* Standard Deviation */}
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-lg p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <Sigma className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Écart-type</span>
            </div>
            <p className="text-2xl font-bold">±{data.standardDeviation} j</p>
            <p className="text-xs text-muted-foreground mt-1">
              σ = (P - O) / 6
            </p>
          </div>

          {/* 95% Confidence */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">IC 95%</span>
            </div>
            <p className="text-2xl font-bold">{data.confidenceLevel95Days} j</p>
            <p className="text-xs text-muted-foreground mt-1">
              +{confidencePercent.toFixed(1)}% de marge
            </p>
          </div>

          {/* Critical Path */}
          <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-lg p-4 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Chemin critique</span>
            </div>
            <p className="text-2xl font-bold">{data.criticalPath.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Activités sans marge
            </p>
          </div>
        </div>

        {/* Activities Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Activité</TableHead>
                <TableHead className="text-center">O (j)</TableHead>
                <TableHead className="text-center">M (j)</TableHead>
                <TableHead className="text-center">P (j)</TableHead>
                <TableHead className="text-center">TE (j)</TableHead>
                <TableHead className="text-center">σ</TableHead>
                <TableHead className="text-right">Distribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.activities.slice(0, compact ? 5 : undefined).map((activity, idx) => {
                const isCritical = data.criticalPath.includes(activity.name);
                const variancePercent = activity.mostLikely > 0 
                  ? (activity.standardDeviation / activity.mostLikely) * 100 
                  : 0;

                return (
                  <TableRow 
                    key={idx}
                    className={cn(isCritical && "bg-destructive/5")}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isCritical && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                              </TooltipTrigger>
                              <TooltipContent>Chemin critique</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <span className="truncate max-w-[200px]">{activity.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      {activity.optimistic.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center">
                      {activity.mostLikely.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center text-orange-600">
                      {activity.pessimistic.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {activity.pertEstimate.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      ±{activity.standardDeviation.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {/* Visual distribution bar */}
                      <div className="flex items-center gap-1 justify-end">
                        <div className="w-20 h-4 bg-muted rounded-full overflow-hidden relative">
                          {/* Optimistic */}
                          <div 
                            className="absolute h-full bg-green-400/50"
                            style={{ 
                              left: '0%',
                              width: `${(activity.optimistic / activity.pessimistic) * 100}%` 
                            }}
                          />
                          {/* Most Likely marker */}
                          <div 
                            className="absolute h-full w-0.5 bg-primary"
                            style={{ 
                              left: `${(activity.mostLikely / activity.pessimistic) * 100}%` 
                            }}
                          />
                          {/* TE marker */}
                          <div 
                            className="absolute h-full w-1 bg-primary rounded"
                            style={{ 
                              left: `${(activity.pertEstimate / activity.pessimistic) * 100}%` 
                            }}
                          />
                        </div>
                        <Badge 
                          variant={variancePercent > 30 ? 'destructive' : variancePercent > 15 ? 'secondary' : 'outline'}
                          className="text-xs h-5 w-12 justify-center"
                        >
                          {variancePercent.toFixed(0)}%
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* PERT Formula Reference */}
        <div className="bg-muted/30 rounded-lg p-4 text-sm">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Formules PERT
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-muted-foreground">
            <div>
              <span className="font-mono text-xs">TE = (O + 4M + P) / 6</span>
              <p className="text-xs mt-1">Durée attendue (moyenne pondérée)</p>
            </div>
            <div>
              <span className="font-mono text-xs">σ = (P - O) / 6</span>
              <p className="text-xs mt-1">Écart-type (incertitude)</p>
            </div>
            <div>
              <span className="font-mono text-xs">IC₉₅ = TE + 1.645σ</span>
              <p className="text-xs mt-1">Intervalle de confiance 95%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PERTDiagram;
