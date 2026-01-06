import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  Zap,
  Percent,
  Sigma,
} from "lucide-react";
import { PERTAnalysisResult } from "@/types/PERTCalculations";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PERTSidebarProps {
  analysis: PERTAnalysisResult;
  targetDate: Date;
  projectStartDate: Date;
  onTargetDateChange?: (date: Date) => void;
  onOptimizeSchedule?: () => void;
  onWhatIfAnalysis?: () => void;
}

const PERTSidebar: React.FC<PERTSidebarProps> = ({
  analysis,
  targetDate,
  projectStartDate,
  onTargetDateChange,
  onOptimizeSchedule,
  onWhatIfAnalysis,
}) => {
  // Calculate probability of meeting target date
  const calculateProbability = () => {
    const targetDuration = Math.ceil(
      (targetDate.getTime() - projectStartDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const zScore =
      (targetDuration - analysis.totalExpectedDuration) /
      analysis.totalStandardDeviation;

    // Standard normal CDF approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(zScore));
    const d = 0.3989423 * Math.exp((-zScore * zScore) / 2);
    let probability =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    if (zScore > 0) probability = 1 - probability;
    return Math.round(probability * 100);
  };

  const probability = calculateProbability();

  // Get color based on probability
  const getProbabilityColor = () => {
    if (probability >= 80) return "text-green-600";
    if (probability >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = () => {
    if (probability >= 80) return "bg-green-500";
    if (probability >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Critical activities stats
  const criticalActivities = analysis.activities.filter((a) => a.isCritical);
  const nonCriticalActivities = analysis.activities.filter(
    (a) => !a.isCritical
  );

  return (
    <div className="space-y-4">
      {/* Probability Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Percent className="h-4 w-4 text-blue-500" />
            Probabilité de réussite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-center">
              <div
                className={`text-4xl font-bold mb-2 ${getProbabilityColor()}`}
              >
                {probability}%
              </div>
              <p className="text-sm text-muted-foreground">
                Probabilité de terminer avant le{" "}
                {format(targetDate, "dd MMM yyyy", { locale: fr })}
              </p>
            </div>

            {/* Custom progress bar with colored indicator */}
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-xs font-semibold inline-block text-muted-foreground">
                    Progression de la probabilité
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-muted-foreground">
                    {probability}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${probability}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getProgressColor()}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                <p className="font-semibold text-green-700">Optimiste</p>
                <p>{analysis.confidenceIntervals["68%"][0].toFixed(1)}j</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                <p className="font-semibold text-red-700">Pessimiste</p>
                <p>{analysis.confidenceIntervals["68%"][1].toFixed(1)}j</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Path Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-red-500" />
            Chemin critique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Activités critiques</span>
              <Badge variant="destructive" className="text-xs">
                {criticalActivities.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Durée totale</span>
              <span className="text-sm font-semibold">
                {analysis.totalExpectedDuration.toFixed(1)} jours
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Écart-type</span>
              <span className="text-sm font-semibold">
                {analysis.totalStandardDeviation.toFixed(1)} jours
              </span>
            </div>

            {/* Critical activities list */}
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium mb-2">Activités critiques:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {criticalActivities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between text-xs p-1 hover:bg-muted rounded"
                  >
                    <span className="truncate">{activity.name}</span>
                    <span className="font-medium">
                      {activity.pertEstimate.toFixed(1)}j
                    </span>
                  </div>
                ))}
                {criticalActivities.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{criticalActivities.length - 5} autres
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sigma className="h-4 w-4 text-purple-500" />
            Statistiques PERT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-700">Moyenne</p>
                <p className="font-semibold">
                  {analysis.totalExpectedDuration.toFixed(1)}j
                </p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded border border-amber-200">
                <p className="text-xs text-amber-700">Écart-type</p>
                <p className="font-semibold">
                  {analysis.totalStandardDeviation.toFixed(1)}j
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium">Intervalles de confiance:</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>68% (1σ)</span>
                  <span className="font-medium">
                    {analysis.confidenceIntervals["68%"][0].toFixed(1)} -{" "}
                    {analysis.confidenceIntervals["68%"][1].toFixed(1)}j
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>95% (2σ)</span>
                  <span className="font-medium">
                    {analysis.confidenceIntervals["95%"][0].toFixed(1)} -{" "}
                    {analysis.confidenceIntervals["95%"][1].toFixed(1)}j
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>99% (3σ)</span>
                  <span className="font-medium">
                    {analysis.confidenceIntervals["99%"][0].toFixed(1)} -{" "}
                    {analysis.confidenceIntervals["99%"][1].toFixed(1)}j
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Basé sur {analysis.activities.length} activités
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights & Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-green-500" />
            Insights & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {probability < 70 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs font-medium text-red-700">
                  Risque élevé de retard
                </p>
                <p className="text-xs text-red-600">
                  Considérez l'accélération du chemin critique
                </p>
              </div>
            </div>
          )}

          {nonCriticalActivities.length > 0 &&
            nonCriticalActivities.some((a) => a.slackTime < 5) && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-200">
                <Clock className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-xs font-medium text-amber-700">
                    Marges faibles détectées
                  </p>
                  <p className="text-xs text-amber-600">
                    {
                      nonCriticalActivities.filter((a) => a.slackTime < 5)
                        .length
                    }{" "}
                    activités avec moins de 5 jours de marge
                  </p>
                </div>
              </div>
            )}

          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={onOptimizeSchedule}
            >
              <Zap className="h-3 w-3 mr-2" />
              Optimiser le planning
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={onWhatIfAnalysis}
            >
              <TrendingUp className="h-3 w-3 mr-2" />
              Analyse "What-If"
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PERTSidebar;
