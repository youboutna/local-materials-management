import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  BarChart3, 
  Workflow, 
  Target, 
  Clock,
  Users,
  DollarSign,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import WaterfallGanttChart from './WaterfallGanttChart';
import WaterfallProjectKPIs from './WaterfallProjectKPIs';
import PublicProcurementWorkflow from '../tenders/PublicProcurementWorkflow';
import ConstructionPhaseManager from './ConstructionPhaseManager';

const WaterfallProjectManager = () => {
  const [activeTab, setActiveTab] = useState('gantt');
  const [isLoading, setIsLoading] = useState(false);

  // Sample data for Gantt chart
  const sampleTasks = [
    {
      id: '1',
      name: 'Planification des achats',
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 0, 15),
      progress: 100,
      phase: 'Pre-construction',
      status: 'completed' as const,
      procurementStep: 1,
      assignedTo: 'Équipe Planning',
      budget: 50000
    },
    {
      id: '2',
      name: 'Appel d\'offres',
      startDate: new Date(2024, 0, 16),
      endDate: new Date(2024, 1, 5),
      progress: 80,
      phase: 'Pre-construction',
      status: 'in_progress' as const,
      procurementStep: 2,
      assignedTo: 'Commission CPMP',
      budget: 75000
    },
    {
      id: '3',
      name: 'Analyse des offres',
      startDate: new Date(2024, 1, 6),
      endDate: new Date(2024, 1, 20),
      progress: 30,
      phase: 'Analysis',
      status: 'in_progress' as const,
      procurementStep: 3,
      assignedTo: 'Sous-commission',
      budget: 100000
    },
    {
      id: '4',
      name: 'Attribution marché',
      startDate: new Date(2024, 1, 21),
      endDate: new Date(2024, 2, 5),
      progress: 0,
      phase: 'Attribution',
      status: 'not_started' as const,
      procurementStep: 4,
      assignedTo: 'Direction',
      budget: 25000
    }
  ];

  // Sample KPI data
  const sampleMetrics = {
    schedulePerformanceIndex: 1.05,
    costPerformanceIndex: 0.95,
    earnedValue: 180000,
    plannedValue: 200000,
    actualCost: 190000,
    budgetAtCompletion: 500000,
    estimateAtCompletion: 525000,
    estimateToComplete: 335000,
    varianceAtCompletion: -25000
  };

  const samplePhases = [
    {
      id: '1',
      name: 'Planification et conception',
      plannedProgress: 100,
      actualProgress: 100,
      budget: 150000,
      actualCost: 145000,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      status: 'completed' as const,
      procurementStep: 1,
      risks: 2,
      issues: 0
    },
    {
      id: '2',
      name: 'Appels d\'offres et sélection',
      plannedProgress: 80,
      actualProgress: 70,
      budget: 100000,
      actualCost: 105000,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      status: 'in_progress' as const,
      procurementStep: 2,
      risks: 3,
      issues: 1
    },
    {
      id: '3',
      name: 'Exécution des travaux',
      plannedProgress: 30,
      actualProgress: 25,
      budget: 200000,
      actualCost: 50000,
      startDate: '2024-03-01',
      endDate: '2024-06-30',
      status: 'in_progress' as const,
      procurementStep: 5,
      risks: 5,
      issues: 2
    }
  ];

  const [phases, setPhases] = useState(samplePhases);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion de Projet Waterfall</h1>
            <p className="text-muted-foreground">
              Méthodologie cascade avec diagramme de Gantt et workflow des marchés publics mauritaniens
            </p>
          </div>
          <Button>
            <Target className="h-4 w-4 mr-2" />
            Nouveau Projet
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Projets Actifs
                  </p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Phases Terminées
                  </p>
                  <p className="text-2xl font-bold">34</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    SPI Moyen
                  </p>
                  <p className="text-2xl font-bold">{sampleMetrics.schedulePerformanceIndex.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    CPI Moyen
                  </p>
                  <p className="text-2xl font-bold">{sampleMetrics.costPerformanceIndex.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Gantt & KPIs
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Workflow Mauritanie
            </TabsTrigger>
            <TabsTrigger value="phases" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Phases Waterfall
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Analytics EVM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gantt" className="space-y-4">
            <WaterfallGanttChart 
              tasks={sampleTasks}
              projectStartDate={new Date(2024, 0, 1)}
              projectEndDate={new Date(2024, 11, 31)}
            />
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4">
            <PublicProcurementWorkflow />
          </TabsContent>

          <TabsContent value="phases" className="space-y-4">
            <ConstructionPhaseManager
              phases={phases.map(p => ({
                id: p.id,
                title: p.name,
                description: `Phase ${p.name}`,
                startDate: p.startDate,
                endDate: p.endDate,
                estimatedDuration: 30,
                status: p.status,
                budget: p.budget,
                actualCost: p.actualCost,
                progress: p.actualProgress,
                materials: [],
                humanResources: [],
                suppliers: [],
                location: '',
                notes: ''
              }))}
              onChange={(newPhases) => {
                // Convert back to sample phases format if needed
                console.log('Phases updated:', newPhases);
              }}
              projectBudget={500000}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <WaterfallProjectKPIs
              projectMetrics={sampleMetrics}
              phases={samplePhases}
              projectTitle="Projet Infrastructure Mauritanie"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WaterfallProjectManager;