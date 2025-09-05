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
  Target, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BarChart3
} from 'lucide-react';

import { ProjectData, ActionLabels, EscalationRoles } from '@/types/project';
import { ProjectManager } from '@/services/ projectManagerWithActions';


interface ProjectMetrics {
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  earnedValue: number;
  plannedValue: number;
  actualCost: number;
  budgetAtCompletion: number;
  estimateAtCompletion: number;
  estimateToComplete: number;
  varianceAtCompletion: number;
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
  projectData: ProjectData;
  roles: EscalationRoles;
  actions: ActionLabels;
  projectTitle?: string;
}

const WaterfallProjectKPIs: React.FC<WaterfallProjectKPIsProps> = ({
  projectData,
  roles,
  actions,
  projectTitle = "Projet"
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{projectMetrics: ProjectMetrics; phases: PhaseMetrics[]} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const projectManager = new ProjectManager(projectData, roles, actions);
    
    const updateMetrics = () => {
      setLoading(true);
      const results = projectManager.runAllChecks();
      
      // Convert the results to the expected format
      const evmData = results.evmData;
      const projectMetrics: ProjectMetrics = {
        schedulePerformanceIndex: evmData.schedulePerformanceIndex,
        costPerformanceIndex: evmData.costPerformanceIndex,
        earnedValue: evmData.earnedValue,
        plannedValue: evmData.plannedValue,
        actualCost: evmData.actualCost,
        budgetAtCompletion: projectData.budget || 0,
        estimateAtCompletion: evmData.estimateAtCompletion,
        estimateToComplete: evmData.estimateToComplete,
        varianceAtCompletion: evmData.varianceAtCompletion
      };
      
      // Convert planned phases to phase metrics
      const phases: PhaseMetrics[] = (projectData.plannedPhases || []).map((phase, index) => {
        // Calculate phase progress based on tasks in this phase
        const phaseTasks = projectData.tasks?.filter(task => task.phaseId === index.toString()) || [];
        let actualProgress = 0;
        let actualCost = 0;
        
        if (phaseTasks.length > 0) {
          actualProgress = phaseTasks.reduce((sum, task) => sum + task.progress, 0) / phaseTasks.length;
          actualCost = phaseTasks.reduce((sum, task) => sum + (task.actualCost || 0), 0);
        }
        
        // Calculate planned progress based on time elapsed
        const today = new Date();
        const startDate = new Date(phase.startDate);
        const endDate = new Date(phase.endDate);
        const totalDuration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const elapsedDuration = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const plannedProgress = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
        
        // Count risks and issues for this phase
        const risks = projectData.risks?.filter(risk => 
          risk.relatedTasks?.some(taskId => phaseTasks.some(task => task.id === taskId))
        ).length || 0;
        
        const issues = projectData.inspections?.filter(inspection => 
          inspection.issues?.some(issue => 
            issue.description.toLowerCase().includes(phase.phase.toLowerCase())
          )
        ).length || 0;
        
        return {
          id: index.toString(),
          name: phase.phase,
          plannedProgress,
          actualProgress,
          budget: (projectData.budget || 0) * (phase.weight || 0),
          actualCost,
          startDate: phase.startDate,
          endDate: phase.endDate,
          status: phase.status as 'not_started' | 'in_progress' | 'completed' | 'delayed',
          risks,
          issues
        };
      });
      
      setMetrics({ projectMetrics, phases });
      setLoading(false);
    };

    updateMetrics();
    
    // Update every 5 minutes
    const interval = setInterval(updateMetrics, 300000);
    return () => clearInterval(interval);
  }, [projectData, roles, actions]);

  // Rest of the component remains the same...
  // Calculate overall project health
  const getHealthStatus = () => {
    if (!metrics) return { status: 'critical', color: 'text-red-600', icon: AlertTriangle };
    
    const { schedulePerformanceIndex, costPerformanceIndex } = metrics.projectMetrics;
    
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

  // Calculate phase completion rate
  const overallProgress = metrics && metrics.phases.length > 0 
    ? metrics.phases.reduce((sum, phase) => sum + phase.actualProgress, 0) / metrics.phases.length 
    : 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MRU',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement des métriques...</div>;
  }

  if (!metrics) {
    return <div className="flex justify-center items-center h-64 text-red-600">Erreur lors du chargement des données</div>;
  }

  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon;

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
                  metrics.projectMetrics.schedulePerformanceIndex >= 1.0 ? 'text-green-600' :
                  metrics.projectMetrics.schedulePerformanceIndex >= 0.9 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.projectMetrics.schedulePerformanceIndex.toFixed(2)}
                </span>
                {metrics.projectMetrics.schedulePerformanceIndex >= 1.0 ? 
                  <TrendingUp className="h-4 w-4 text-green-600" /> :
                  <TrendingDown className="h-4 w-4 text-red-600" />
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.projectMetrics.schedulePerformanceIndex >= 1.0 ? 'En avance' :
                 metrics.projectMetrics.schedulePerformanceIndex >= 0.9 ? 'Légèrement en retard' : 'En retard'}
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
                  metrics.projectMetrics.costPerformanceIndex >= 1.0 ? 'text-green-600' :
                  metrics.projectMetrics.costPerformanceIndex >= 0.9 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics.projectMetrics.costPerformanceIndex.toFixed(2)}
                </span>
                {metrics.projectMetrics.costPerformanceIndex >= 1.0 ? 
                  <TrendingUp className="h-4 w-4 text-green-600" /> :
                  <TrendingDown className="h-4 w-4 text-red-600" />
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.projectMetrics.costPerformanceIndex >= 1.0 ? 'Sous budget' :
                 metrics.projectMetrics.costPerformanceIndex >= 0.9 ? 'Proche du budget' : 'Dépassement budget'}
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
                {metrics.phases.filter(p => p.status === 'completed').length} / {metrics.phases.length} phases terminées
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
                  {formatCurrency(metrics.projectMetrics.actualCost)}
                </span>
                <div className="text-xs text-muted-foreground">
                  <div>Budget: {formatCurrency(metrics.projectMetrics.budgetAtCompletion)}</div>
                  <div>EAC: {formatCurrency(metrics.projectMetrics.estimateAtCompletion)}</div>
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
                  <span className="font-medium">{formatCurrency(metrics.projectMetrics.plannedValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valeur Acquise (EV)</span>
                  <span className="font-medium">{formatCurrency(metrics.projectMetrics.earnedValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Coût Réel (AC)</span>
                  <span className="font-medium">{formatCurrency(metrics.projectMetrics.actualCost)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Prévisions</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Budget Final (BAC)</span>
                  <span className="font-medium">{formatCurrency(metrics.projectMetrics.budgetAtCompletion)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Estimation Finale (EAC)</span>
                  <span className="font-medium">{formatCurrency(metrics.projectMetrics.estimateAtCompletion)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reste à faire (ETC)</span>
                  <span className="font-medium">{formatCurrency(metrics.projectMetrics.estimateToComplete)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Écarts</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Écart Planning (SV)</span>
                  <span className={`font-medium ${
                    (metrics.projectMetrics.earnedValue - metrics.projectMetrics.plannedValue) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(metrics.projectMetrics.earnedValue - metrics.projectMetrics.plannedValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Écart Coût (CV)</span>
                  <span className={`font-medium ${
                    (metrics.projectMetrics.earnedValue - metrics.projectMetrics.actualCost) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(metrics.projectMetrics.earnedValue - metrics.projectMetrics.actualCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Écart Final (VAC)</span>
                  <span className={`font-medium ${
                    metrics.projectMetrics.varianceAtCompletion >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(metrics.projectMetrics.varianceAtCompletion)}
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
            {metrics.phases.map((phase) => (
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