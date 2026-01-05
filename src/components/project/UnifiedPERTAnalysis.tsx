/**
 * Unified PERT Analysis Component
 * Uses GanttPertDataService for data (clean architecture)
 * Shows PERT metrics for both tasks and milestones
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { getGanttPertService, UnifiedPERTData } from '@/services/GanttPertDataService';
import { ProjectDetailDTO } from '@/types/dto';
import { useQuery } from '@tanstack/react-query';

interface UnifiedPERTAnalysisProps {
  projectId: string;
  projectDetail: ProjectDetailDTO;
}

const UnifiedPERTAnalysis: React.FC<UnifiedPERTAnalysisProps> = ({
  projectId,
  projectDetail
}) => {
  const { data: pertData, isLoading } = useQuery<UnifiedPERTData>({
    queryKey: ['unified-pert', projectId],
    queryFn: async () => {
      const service = getGanttPertService();
      return service.getUnifiedPERTData(projectId, projectDetail);
    },
    enabled: !!projectId && !!projectDetail,
    staleTime: 30_000
  });

  if (isLoading || !pertData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { 
    activities, 
    milestoneActivities, 
    totalExpectedDuration, 
    projectDurationDays,
    standardDeviation,
    confidenceLevel95Days,
    criticalPath
  } = pertData;

  // Risk assessment based on std deviation
  const riskLevel = standardDeviation / projectDurationDays;
  const riskStatus = riskLevel < 0.1 ? 'low' : riskLevel < 0.2 ? 'medium' : 'high';

  return (
    <div className="space-y-6">
      {/* Header KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Durée estimée</p>
                <p className="text-2xl font-bold">{projectDurationDays} jours</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Écart-type</p>
                <p className="text-2xl font-bold">±{standardDeviation} j</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confiance 95%</p>
                <p className="text-2xl font-bold">{confidenceLevel95Days} j</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chemin critique</p>
                <p className="text-2xl font-bold">{criticalPath.length} tâches</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${riskStatus === 'high' ? 'text-destructive' : riskStatus === 'medium' ? 'text-orange-500' : 'text-green-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Évaluation des Risques de Délai
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Badge 
              variant={riskStatus === 'low' ? 'default' : 'destructive'}
              className={riskStatus === 'low' ? 'bg-success' : riskStatus === 'medium' ? 'bg-orange-500' : ''}
            >
              Risque {riskStatus === 'low' ? 'Faible' : riskStatus === 'medium' ? 'Modéré' : 'Élevé'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Variance relative: {(riskLevel * 100).toFixed(1)}%
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Estimation optimiste</span>
              <span className="font-medium">{Math.round(projectDurationDays - 1.645 * standardDeviation)} jours</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Estimation probable</span>
              <span className="font-medium">{projectDurationDays} jours</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Estimation pessimiste (95%)</span>
              <span className="font-medium">{confidenceLevel95Days} jours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activités PERT - Tâches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Activité</th>
                  <th className="text-right p-2">Optimiste (O)</th>
                  <th className="text-right p-2">Probable (M)</th>
                  <th className="text-right p-2">Pessimiste (P)</th>
                  <th className="text-right p-2">PERT (O+4M+P)/6</th>
                  <th className="text-right p-2">σ (P-O)/6</th>
                </tr>
              </thead>
              <tbody>
                {activities.filter((_, i) => i < activities.length - milestoneActivities.length).slice(0, 10).map((activity, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{activity.name}</td>
                    <td className="p-2 text-right">{activity.optimistic.toFixed(1)}j</td>
                    <td className="p-2 text-right">{activity.mostLikely.toFixed(1)}j</td>
                    <td className="p-2 text-right">{activity.pessimistic.toFixed(1)}j</td>
                    <td className="p-2 text-right font-semibold text-primary">{activity.pertEstimate.toFixed(1)}j</td>
                    <td className="p-2 text-right">{activity.standardDeviation.toFixed(2)}j</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Milestones PERT */}
      {milestoneActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Activités PERT - Jalons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Jalon</th>
                    <th className="text-right p-2">Optimiste</th>
                    <th className="text-right p-2">Probable</th>
                    <th className="text-right p-2">Pessimiste</th>
                    <th className="text-right p-2">Estimation PERT</th>
                    <th className="text-right p-2">Écart-type</th>
                  </tr>
                </thead>
                <tbody>
                  {milestoneActivities.slice(0, 10).map((activity, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{activity.name}</td>
                      <td className="p-2 text-right">{activity.optimistic.toFixed(1)}j</td>
                      <td className="p-2 text-right">{activity.mostLikely.toFixed(1)}j</td>
                      <td className="p-2 text-right">{activity.pessimistic.toFixed(1)}j</td>
                      <td className="p-2 text-right font-semibold text-primary">{activity.pertEstimate.toFixed(1)}j</td>
                      <td className="p-2 text-right">{activity.standardDeviation.toFixed(2)}j</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {milestoneActivities.length > 10 && (
              <p className="text-sm text-muted-foreground mt-2">
                +{milestoneActivities.length - 10} autres jalons
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formula Reference */}
      <Card>
        <CardContent className="pt-4">
          <h4 className="font-medium mb-2">Formules PERT utilisées</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p><strong>Estimation PERT:</strong> (O + 4M + P) / 6</p>
              <p><strong>Écart-type:</strong> σ = (P - O) / 6</p>
            </div>
            <div>
              <p><strong>Variance:</strong> σ²</p>
              <p><strong>Intervalle 95%:</strong> μ ± 1.645σ</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedPERTAnalysis;
