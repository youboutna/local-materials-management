import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  DollarSign, 
  Users, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BarChart3
} from 'lucide-react';

import { useProjectManager } from "@/hooks/useProjectManager";

interface ProjectMetrics {
  schedulePerformanceIndex: number; // SPI
  costPerformanceIndex: number; // CPI
  earnedValue: number; // EV
  plannedValue: number; // PV
  actualCost: number; // AC
  budgetAtCompletion: number; // BAC
  estimateAtCompletion: number; // EAC
  estimateToComplete: number; // ETC
  varianceAtCompletion: number; // VAC
}

interface PhaseMetrics {
  id: string;
  name: string;
  plannedProgress: number;
  actualProgress: number;
  budget: number;
  actualCost: number;
  startDate: string;
  endDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  procurementStep?: number;
  risks: number;
  issues: number;
}

interface WaterfallProjectKPIsProps {
  projectTitle?: string;
  projectBudget?: number;
}

const WaterfallProjectKPIs: React.FC<WaterfallProjectKPIsProps> = ({
  projectTitle = "Projet"
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const { data, runChecks, acknowledgeAlert } = useProjectManager();

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  if (!data) {
    return (
      <div className="p-4">
        <span className="text-muted-foreground">Chargement des indicateurs...</span>
      </div>
    );
  }

  const { progress, evmData, alerts, pertData, ganttData } = data;

  // Calculate overall project health
  const getHealthStatus = () => {
    const { schedulePerformanceIndex, costPerformanceIndex } = evmData;
    
    if (schedulePerformanceIndex >= 1.0 && costPerformanceIndex >= 1.0) {
      return { status: 'excellent', color: 'text-green-600', icon: CheckCircle2 };
    } else if (schedulePerformanceIndex >= 0.9 && costPerformanceIndex >= 0.9) {
      return { status: 'good', color: 'text-blue-600', icon: Activity };
    } else if (schedulePerformanceIndex >= 0.8 && costPerformanceIndex >= 0.8) {
      return { status: 'warning', color: 'text-yellow-600', icon: AlertTriangle };
    } else {
      return { status: 'critical', color: 'text-red-600', icon: AlertTriangle };
    }
  };

  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MRU',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Project Health Dashboard */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tableau de Bord Waterfall - {projectTitle}
            </div>
            <div className="flex items-center gap-2">
              <HealthIcon className={`h-5 w-5 ${healthStatus.color}`} />
              <Badge 
                variant={healthStatus.status === 'excellent' ? 'default' : 
                        healthStatus.status === 'good' ? 'secondary' :
                        healthStatus.status === 'warning' ? 'outline' : 'destructive'}
              >
                {healthStatus.status === 'excellent' ? 'Excellent' :
                 healthStatus.status === 'good' ? 'Bon' :
                 healthStatus.status === 'warning' ? 'Attention' : 'Critique'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Schedule Performance Index */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">SPI (Schedule)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${
                  evmData.schedulePerformanceIndex >= 1.0 ? 'text-green-600' :
                  evmData.schedulePerformanceIndex >= 0.9 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {evmData.schedulePerformanceIndex.toFixed(2)}
                </span>
                {evmData.schedulePerformanceIndex >= 1.0 ? 
                  <TrendingUp className="h-4 w-4 text-green-600" /> :
                  <TrendingDown className="h-4 w-4 text-red-600" />
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {evmData.schedulePerformanceIndex >= 1.0 ? 'En avance' :
                 evmData.schedulePerformanceIndex >= 0.9 ? 'Légèrement en retard' : 'En retard'}
              </p>
            </div>

            {/* Cost Performance Index */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">CPI (Coût)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${
                  evmData.costPerformanceIndex >= 1.0 ? 'text-green-600' :
                  evmData.costPerformanceIndex >= 0.9 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {evmData.costPerformanceIndex.toFixed(2)}
                </span>
                {evmData.costPerformanceIndex >= 1.0 ? 
                  <TrendingUp className="h-4 w-4 text-green-600" /> :
                  <TrendingDown className="h-4 w-4 text-red-600" />
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {evmData.costPerformanceIndex >= 1.0 ? 'Sous budget' :
                 evmData.costPerformanceIndex >= 0.9 ? 'Proche du budget' : 'Dépassement budget'}
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Progression</span>
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-bold text-primary">
                  {progress.toFixed(1)}%
                </span>
                <Progress value={progress} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground">
                Progression globale du projet
              </p>
            </div>

            {/* Budget Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Budget</span>
              </div>
              <div className="space-y-1">
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(evmData.actualCost)}
                </span>
                <div className="text-xs text-muted-foreground">
                  <div>EV: {formatCurrency(evmData.earnedValue)}</div>
                  <div>EAC: {formatCurrency(evmData.estimateAtCompletion)}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earned Value Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analyse de la Valeur Acquise (EVM)
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Valeurs de Base</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valeur Planifiée (PV)</span>
                  <span className="font-medium">{formatCurrency(evmData.plannedValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valeur Acquise (EV)</span>
                  <span className="font-medium">{formatCurrency(evmData.earnedValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Coût Réel (AC)</span>
                  <span className="font-medium">{formatCurrency(evmData.actualCost)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Prévisions</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Estimation Finale (EAC)</span>
                  <span className="font-medium">{formatCurrency(evmData.estimateAtCompletion)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reste à faire (ETC)</span>
                  <span className="font-medium">{formatCurrency(evmData.estimateToComplete)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Écart Final (VAC)</span>
                  <span className="font-medium">{formatCurrency(evmData.varianceAtCompletion)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Écarts</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Écart Planning (SV)</span>
                  <span className={`font-medium ${
                    (evmData.earnedValue - evmData.plannedValue) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(evmData.earnedValue - evmData.plannedValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Écart Coût (CV)</span>
                  <span className={`font-medium ${
                    (evmData.earnedValue - evmData.actualCost) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(evmData.earnedValue - evmData.actualCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">PERT Durée</span>
                  <span className="font-medium">{pertData.totalExpectedDuration.toFixed(1)} j</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Gantt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Aucune alerte
              </Badge>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between bg-red-50 p-3 rounded text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="text-red-500 h-4 w-4 flex-shrink-0" />
                      <div>
                        <div className="font-medium">[{alert.severity.toUpperCase()}] {alert.title}</div>
                        <div className="text-xs text-muted-foreground">{alert.message}</div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() =>
                          acknowledgeAlert(alert.id, "user123", "Ack via KPIs")
                        }
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex-shrink-0"
                      >
                        Ack
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gantt Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Diagramme de Gantt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ganttData.tasks.length > 0
                ? ganttData.tasks.slice(0, 8).map((task, i) => (
                    <div key={i} className="p-2 bg-muted rounded border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{task.text}</span>
                        <div className="text-xs text-muted-foreground">
                          {(task.progress * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">{task.start_date}</span>
                        <span className="text-xs text-muted-foreground">{task.duration}j</span>
                      </div>
                      <Progress value={task.progress * 100} className="h-1" />
                    </div>
                  ))
                : (
                  <div className="text-center text-muted-foreground">
                    Pas de données Gantt disponibles
                  </div>
                )}
              {ganttData.tasks.length > 8 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{ganttData.tasks.length - 8} autres tâches
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaterfallProjectKPIs;