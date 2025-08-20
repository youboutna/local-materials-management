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
  projectMetrics: ProjectMetrics;
  phases: PhaseMetrics[];
  projectTitle?: string;
}

const WaterfallProjectKPIs: React.FC<WaterfallProjectKPIsProps> = ({
  projectMetrics,
  phases,
  projectTitle = "Projet"
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  // Calculate overall project health
  const getHealthStatus = () => {
    const { schedulePerformanceIndex, costPerformanceIndex } = projectMetrics;
    
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

  // Calculate phase completion rate
  const overallProgress = phases.length > 0 
    ? phases.reduce((sum, phase) => sum + phase.actualProgress, 0) / phases.length 
    : 0;

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
                  projectMetrics.schedulePerformanceIndex >= 1.0 ? 'text-green-600' :
                  projectMetrics.schedulePerformanceIndex >= 0.9 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {projectMetrics.schedulePerformanceIndex.toFixed(2)}
                </span>
                {projectMetrics.schedulePerformanceIndex >= 1.0 ? 
                  <TrendingUp className="h-4 w-4 text-green-600" /> :
                  <TrendingDown className="h-4 w-4 text-red-600" />
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {projectMetrics.schedulePerformanceIndex >= 1.0 ? 'En avance' :
                 projectMetrics.schedulePerformanceIndex >= 0.9 ? 'Légèrement en retard' : 'En retard'}
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
                  projectMetrics.costPerformanceIndex >= 1.0 ? 'text-green-600' :
                  projectMetrics.costPerformanceIndex >= 0.9 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {projectMetrics.costPerformanceIndex.toFixed(2)}
                </span>
                {projectMetrics.costPerformanceIndex >= 1.0 ? 
                  <TrendingUp className="h-4 w-4 text-green-600" /> :
                  <TrendingDown className="h-4 w-4 text-red-600" />
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {projectMetrics.costPerformanceIndex >= 1.0 ? 'Sous budget' :
                 projectMetrics.costPerformanceIndex >= 0.9 ? 'Proche du budget' : 'Dépassement budget'}
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
                  {overallProgress.toFixed(1)}%
                </span>
                <Progress value={overallProgress} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground">
                {phases.filter(p => p.status === 'completed').length} / {phases.length} phases terminées
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
                  {formatCurrency(projectMetrics.actualCost)}
                </span>
                <div className="text-xs text-muted-foreground">
                  <div>Budget: {formatCurrency(projectMetrics.budgetAtCompletion)}</div>
                  <div>EAC: {formatCurrency(projectMetrics.estimateAtCompletion)}</div>
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
                  <span className="font-medium">{formatCurrency(projectMetrics.plannedValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valeur Acquise (EV)</span>
                  <span className="font-medium">{formatCurrency(projectMetrics.earnedValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Coût Réel (AC)</span>
                  <span className="font-medium">{formatCurrency(projectMetrics.actualCost)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Prévisions</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Budget Final (BAC)</span>
                  <span className="font-medium">{formatCurrency(projectMetrics.budgetAtCompletion)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Estimation Finale (EAC)</span>
                  <span className="font-medium">{formatCurrency(projectMetrics.estimateAtCompletion)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reste à faire (ETC)</span>
                  <span className="font-medium">{formatCurrency(projectMetrics.estimateToComplete)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Écarts</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Écart Planning (SV)</span>
                  <span className={`font-medium ${
                    (projectMetrics.earnedValue - projectMetrics.plannedValue) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(projectMetrics.earnedValue - projectMetrics.plannedValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Écart Coût (CV)</span>
                  <span className={`font-medium ${
                    (projectMetrics.earnedValue - projectMetrics.actualCost) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(projectMetrics.earnedValue - projectMetrics.actualCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Écart Final (VAC)</span>
                  <span className={`font-medium ${
                    projectMetrics.varianceAtCompletion >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(projectMetrics.varianceAtCompletion)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Statut des Phases Waterfall
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {phases.map((phase) => (
              <div 
                key={phase.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPhase === phase.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{phase.name}</h4>
                    <Badge 
                      variant={
                        phase.status === 'completed' ? 'default' :
                        phase.status === 'in_progress' ? 'secondary' :
                        phase.status === 'delayed' ? 'destructive' : 'outline'
                      }
                    >
                      {phase.status === 'completed' ? 'Terminé' :
                       phase.status === 'in_progress' ? 'En cours' :
                       phase.status === 'delayed' ? 'Retardé' : 'Non commencé'}
                    </Badge>
                    {phase.procurementStep && (
                      <Badge variant="outline">
                        Étape {phase.procurementStep}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{phase.actualProgress.toFixed(1)}%</span>
                    <span>{formatCurrency(phase.actualCost)} / {formatCurrency(phase.budget)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progression</span>
                    <span>{phase.actualProgress.toFixed(1)}% / {phase.plannedProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={phase.actualProgress} className="h-2" />
                </div>

                {selectedPhase === phase.id && (
                  <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm font-medium mb-2">Période</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(phase.startDate).toLocaleDateString('fr-FR')} - {new Date(phase.endDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Risques & Problèmes</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">{phase.risks} risques</Badge>
                        <Badge variant="outline">{phase.issues} problèmes</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaterfallProjectKPIs;