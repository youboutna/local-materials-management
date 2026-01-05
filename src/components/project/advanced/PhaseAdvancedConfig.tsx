/**
 * PhaseAdvancedConfig - Configuration avancée et statistiques de la phase
 * Remplace le contenu actuel du tab Avancé avec un design compact
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  BarChart3, 
  Target, 
  Calendar, 
  DollarSign,
  MapPin,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { MilestoneProgressDTO, MilestoneSummaryDTO } from '@/types/milestone-dto';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PhaseAdvancedConfigProps {
  phase: any;
  milestoneProgress: MilestoneProgressDTO | null;
  actualCost: number;
  onRefresh?: () => void;
}

const PhaseAdvancedConfig: React.FC<PhaseAdvancedConfigProps> = ({
  phase,
  milestoneProgress,
  actualCost,
  onRefresh
}) => {
  const budgetVariance = phase.budget ? ((actualCost - phase.budget) / phase.budget * 100) : 0;
  const isBudgetOverrun = budgetVariance > 0;

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Schedule Performance */}
        <Card className={cn(
          "border-l-4",
          (milestoneProgress?.schedule_performance_index ?? 1) >= 1 
            ? "border-l-success" 
            : "border-l-destructive"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Performance planning</p>
                <p className={cn(
                  "text-2xl font-bold",
                  (milestoneProgress?.schedule_performance_index ?? 1) >= 1 
                    ? "text-success" 
                    : "text-destructive"
                )}>
                  {milestoneProgress?.schedule_performance_index?.toFixed(2) ?? 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">SPI</p>
              </div>
              <TrendingUp className={cn(
                "h-8 w-8",
                (milestoneProgress?.schedule_performance_index ?? 1) >= 1 
                  ? "text-success/30" 
                  : "text-destructive/30"
              )} />
            </div>
          </CardContent>
        </Card>

        {/* Budget Performance */}
        <Card className={cn(
          "border-l-4",
          !isBudgetOverrun ? "border-l-success" : "border-l-destructive"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Variance budget</p>
                <p className={cn(
                  "text-2xl font-bold",
                  !isBudgetOverrun ? "text-success" : "text-destructive"
                )}>
                  {isBudgetOverrun ? '+' : ''}{budgetVariance.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {actualCost.toLocaleString()} / {phase.budget?.toLocaleString() || 0} MRU
                </p>
              </div>
              <DollarSign className={cn(
                "h-8 w-8",
                !isBudgetOverrun ? "text-success/30" : "text-destructive/30"
              )} />
            </div>
          </CardContent>
        </Card>

        {/* Milestones Progress */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Jalons terminés</p>
                <p className="text-2xl font-bold text-primary">
                  {milestoneProgress?.completed_milestones ?? 0} / {milestoneProgress?.total_milestones ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {milestoneProgress?.weighted_progress ?? 0}% pondéré
                </p>
              </div>
              <Target className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        {/* Critical Path Status */}
        <Card className={cn(
          "border-l-4",
          milestoneProgress?.critical_path_status === 'on_track' ? "border-l-success" :
          milestoneProgress?.critical_path_status === 'at_risk' ? "border-l-warning" :
          "border-l-destructive"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Chemin critique</p>
                <p className={cn(
                  "text-lg font-bold",
                  milestoneProgress?.critical_path_status === 'on_track' ? "text-success" :
                  milestoneProgress?.critical_path_status === 'at_risk' ? "text-warning" :
                  "text-destructive"
                )}>
                  {milestoneProgress?.critical_path_status === 'on_track' ? 'Dans les temps' :
                   milestoneProgress?.critical_path_status === 'at_risk' ? 'À risque' :
                   milestoneProgress?.critical_path_status === 'delayed' ? 'En retard' : 'N/A'}
                </p>
                {milestoneProgress?.delayed_milestones !== undefined && milestoneProgress.delayed_milestones > 0 && (
                  <p className="text-xs text-destructive">
                    {milestoneProgress.delayed_milestones} jalon(s) en retard
                  </p>
                )}
              </div>
              <AlertTriangle className={cn(
                "h-8 w-8",
                milestoneProgress?.critical_path_status === 'on_track' ? "text-success/30" :
                milestoneProgress?.critical_path_status === 'at_risk' ? "text-warning/30" :
                "text-destructive/30"
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phase Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </CardTitle>
              {onRefresh && (
                <Button size="sm" variant="ghost" onClick={onRefresh}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Durée</span>
                </div>
                <p className="font-medium">{phase.estimatedDuration || 'N/A'} jours</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Budget</span>
                </div>
                <p className="font-medium">{phase.budget?.toLocaleString() || 'N/A'} MRU</p>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Période</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{phase.startDate || 'N/A'}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{phase.endDate || 'N/A'}</span>
              </div>
            </div>

            {phase.location && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Localisation</span>
                </div>
                <p className="font-medium">{phase.location}</p>
              </div>
            )}

            {/* Cost Breakdown */}
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Répartition des coûts</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Budget alloué</span>
                  <span className="font-medium">{phase.budget?.toLocaleString() || 0} MRU</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Coût réel</span>
                  <span className={cn(
                    "font-medium",
                    isBudgetOverrun ? "text-destructive" : "text-success"
                  )}>
                    {actualCost.toLocaleString()} MRU
                  </span>
                </div>
                <Progress 
                  value={phase.budget ? Math.min((actualCost / phase.budget) * 100, 100) : 0} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones Statistics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistiques des jalons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {milestoneProgress && milestoneProgress.total_milestones > 0 ? (
              <div className="space-y-4">
                {/* Progress Ring */}
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        className="text-muted stroke-current"
                        strokeWidth="8"
                        fill="transparent"
                        r="40"
                        cx="48"
                        cy="48"
                      />
                      <circle
                        className="text-primary stroke-current transition-all duration-500"
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="transparent"
                        r="40"
                        cx="48"
                        cy="48"
                        strokeDasharray={`${(milestoneProgress.weighted_progress / 100) * 251.2} 251.2`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">{milestoneProgress.weighted_progress}%</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-success" />
                        Terminés
                      </span>
                      <span className="font-medium">{milestoneProgress.completed_milestones}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-blue-500" />
                        En cours
                      </span>
                      <span className="font-medium">
                        {milestoneProgress.total_milestones - milestoneProgress.completed_milestones - milestoneProgress.delayed_milestones}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                        En retard
                      </span>
                      <span className="font-medium text-destructive">{milestoneProgress.delayed_milestones}</span>
                    </div>
                  </div>
                </div>

                {/* Upcoming Milestones */}
                {milestoneProgress.upcoming_milestones && milestoneProgress.upcoming_milestones.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Prochains jalons (14j)</p>
                    <div className="space-y-2">
                      {milestoneProgress.upcoming_milestones.slice(0, 3).map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-2 bg-warning/10 rounded-lg border border-warning/20">
                          <div className="flex items-center gap-2">
                            <Target className="h-3 w-3 text-warning" />
                            <span className="text-sm font-medium">{m.title}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {m.target_date}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overdue Milestones */}
                {milestoneProgress.overdue_milestones && milestoneProgress.overdue_milestones.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-destructive mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Jalons en retard
                    </p>
                    <div className="space-y-2">
                      {milestoneProgress.overdue_milestones.slice(0, 3).map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg border border-destructive/20">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                            <span className="text-sm font-medium">{m.title}</span>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {m.target_date}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground mb-1">Aucun jalon configuré</p>
                <p className="text-xs text-muted-foreground">
                  Créez des jalons pour suivre l'avancement de la phase
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PhaseAdvancedConfig;
