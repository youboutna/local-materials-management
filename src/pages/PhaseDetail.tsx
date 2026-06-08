/**
 * PhaseDetail — Lifecycle-grouped tabs (Planification / Exécution / Contrôle / Clôture).
 * Cross-module navigation buttons link to inspections, payments, documents and reports.
 * Vue typée via `toPhaseViewModel` — plus de (phase as any) ni de @ts-nocheck (M3 / L3).
 */
import React, { useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePhaseDetails } from '@/hooks/usePhaseDetails';
import PhaseTasks from '@/components/project/PhaseTasks';
import PhaseMaterials from '@/components/project/PhaseMaterials';
import PhaseEmployees from '@/components/project/PhaseEmployees';
import PhaseDocuments from '@/components/project/PhaseDocuments';
import PhasePayments from '@/components/project/PhasePayments';
import PhaseInspections from '@/components/project/PhaseInspections';
import PhaseMilestones from '@/components/project/PhaseMilestones';
import { GanttChart, PERTDiagram, CriticalPathView } from '@/components/planning';
import { AppLayout } from '@/components/layout/AppLayout';
import DeviationBadges from '@/components/common/DeviationBadges';
import { toPhaseViewModel } from '@/utils/phaseViewModel';
import {
  getPhaseLifecycleStage,
  getLifecycleStageMeta,
  getStatusColor,
  getStatusLabel,
} from '@/utils/phaseHelpers';
import {
  ArrowLeft, Calendar, DollarSign, MapPin, Users, Package, FileText, BarChart3,
  Target, Layers, ClipboardCheck, CreditCard, Flag, Compass, HardHat, ShieldCheck,
  ExternalLink, AlertTriangle,
} from 'lucide-react';

const PhaseDetail: React.FC = () => {
  const { projectId, phaseId } = useParams<{ projectId: string; phaseId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  useLanguage();

  const { phase, isLoading: loading, error } = usePhaseDetails(phaseId);

  const vm = useMemo(() => (phase ? toPhaseViewModel(phase as unknown as Record<string, unknown>) : null), [phase]);

  const stage = useMemo(
    () => (vm ? getPhaseLifecycleStage({ type: vm.type, status: vm.status }) : 'PLANIFICATION'),
    [vm]
  );
  const stageMeta = getLifecycleStageMeta(stage);

  const defaultStageTab = (searchParams.get('stage') as string) || stage.toLowerCase();

  const onStageChange = (v: string) => {
    setSearchParams((sp) => {
      sp.set('stage', v);
      return sp;
    });
  };

  if (loading) {
    return (
      <AppLayout pageTitle="Phase">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-label="Chargement" />
        </div>
      </AppLayout>
    );
  }

  if (!vm) {
    return (
      <AppLayout pageTitle="Phase">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Phase non trouvée</h1>
          {error && <p className="text-sm text-muted-foreground mb-4">{(error as Error).message}</p>}
          <Button onClick={() => navigate(`/projects/${projectId}`)}>Retour au projet</Button>
        </div>
      </AppLayout>
    );
  }

  const { title, description, progress, budget, estimatedDuration, startDate, endDate, location } = vm;


  return (
    <AppLayout pageTitle={title} pageDescription={stageMeta.description}>
      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}`)}
              className="flex items-center gap-2"
              aria-label="Retour au projet"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{title}</h1>
              {description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={stageMeta.tokenClass} variant="outline">
              {stageMeta.label}
            </Badge>
            <Badge className={getStatusColor(vm.status)} variant="outline">
              {getStatusLabel(vm.status)}
            </Badge>
          </div>
        </div>

        {/* Overview KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
              <CardTitle className="text-xs font-medium">Progression</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">{progress}%</div>
              <Progress value={progress} className="mt-1.5 h-1.5" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
              <CardTitle className="text-xs font-medium">Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">{(budget).toLocaleString()} MRU</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
              <CardTitle className="text-xs font-medium">Durée</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">{estimatedDuration} j</div>
              <p className="text-[11px] text-muted-foreground truncate">{startDate} → {endDate}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
              <CardTitle className="text-xs font-medium">Localisation</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-sm font-medium truncate">{location || 'Non spécifiée'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Écarts planifié vs réalisé (DeviationEngine + deviation-rules) */}
        <Card>
          <CardContent className="py-3 px-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Écarts :</span>
            <DeviationBadges
              scope="phase"
              input={{
                plannedEndDate: endDate,
                actualEndDate: vm.actualEndDate,
                plannedBudget: budget,
                actualCost: vm.actualCost,
                plannedProgress: vm.plannedProgress,
                actualProgress: progress,
              }}
            />
          </CardContent>
        </Card>

        {/* Cross-module quick navigation */}
        <Card>
          <CardContent className="py-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-2">Navigation rapide :</span>
            <Button size="sm" variant="ghost" aria-label="Voir les inspections de la phase" onClick={() => navigate(`/inspections?phase=${phaseId}`)}>
              <ClipboardCheck className="h-4 w-4 mr-1" /> Inspections <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <Button size="sm" variant="ghost" aria-label="Voir les paiements de la phase" onClick={() => navigate(`/payment-control?phase=${phaseId}`)}>
              <CreditCard className="h-4 w-4 mr-1" /> Paiements <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <Button size="sm" variant="ghost" aria-label="Voir les documents de la phase" onClick={() => navigate(`/documents?phase=${phaseId}`)}>
              <FileText className="h-4 w-4 mr-1" /> Documents <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <Button size="sm" variant="ghost" aria-label="Voir les rapports liés à la phase" onClick={() => navigate(`/comprehensive-monitoring?phase=${phaseId}`)}>
              <BarChart3 className="h-4 w-4 mr-1" /> Rapports <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Lifecycle stage tabs */}
        <Tabs value={defaultStageTab} onValueChange={onStageChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="planification" className="flex items-center gap-2">
              <Compass className="h-4 w-4" /> <span className="hidden sm:inline">Planification</span>
            </TabsTrigger>
            <TabsTrigger value="execution" className="flex items-center gap-2">
              <HardHat className="h-4 w-4" /> <span className="hidden sm:inline">Exécution</span>
            </TabsTrigger>
            <TabsTrigger value="controle" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> <span className="hidden sm:inline">Contrôle</span>
            </TabsTrigger>
            <TabsTrigger value="cloture" className="flex items-center gap-2">
              <Flag className="h-4 w-4" /> <span className="hidden sm:inline">Clôture</span>
            </TabsTrigger>
          </TabsList>

          {/* Planification: tasks, planning (gantt/pert), milestones, team */}
          <TabsContent value="planification" className="space-y-6">
            <Tabs defaultValue="tasks" className="space-y-4">
              <TabsList>
                <TabsTrigger value="tasks"><Layers className="h-3 w-3 mr-1" />Tâches</TabsTrigger>
                <TabsTrigger value="gantt">Gantt</TabsTrigger>
                <TabsTrigger value="pert">PERT</TabsTrigger>
                <TabsTrigger value="critical">Chemin critique</TabsTrigger>
                <TabsTrigger value="milestones"><Target className="h-3 w-3 mr-1" />Jalons</TabsTrigger>
                <TabsTrigger value="team"><Users className="h-3 w-3 mr-1" />Équipe</TabsTrigger>
              </TabsList>
              <TabsContent value="tasks"><PhaseTasks phaseId={phaseId!} projectId={projectId!} /></TabsContent>
              <TabsContent value="gantt"><GanttChart projectId={projectId!} phaseId={phaseId} /></TabsContent>
              <TabsContent value="pert"><PERTDiagram projectId={projectId!} phaseId={phaseId} /></TabsContent>
              <TabsContent value="critical"><CriticalPathView projectId={projectId!} phaseId={phaseId} /></TabsContent>
              <TabsContent value="milestones"><PhaseMilestones phaseId={phaseId!} projectId={projectId!} /></TabsContent>
              <TabsContent value="team"><PhaseEmployees phaseId={phaseId!} /></TabsContent>
            </Tabs>
          </TabsContent>

          {/* Exécution: materials, documents (livrables), payments échéances */}
          <TabsContent value="execution" className="space-y-6">
            <Tabs defaultValue="materials" className="space-y-4">
              <TabsList>
                <TabsTrigger value="materials"><Package className="h-3 w-3 mr-1" />Matériaux</TabsTrigger>
                <TabsTrigger value="documents"><FileText className="h-3 w-3 mr-1" />Livrables</TabsTrigger>
                <TabsTrigger value="payments"><CreditCard className="h-3 w-3 mr-1" />Échéances</TabsTrigger>
              </TabsList>
              <TabsContent value="materials"><PhaseMaterials phaseId={phaseId!} projectId={projectId!} /></TabsContent>
              <TabsContent value="documents"><PhaseDocuments phaseId={phaseId!} projectId={projectId!} /></TabsContent>
              <TabsContent value="payments"><PhasePayments phaseId={phaseId!} projectId={projectId!} /></TabsContent>
            </Tabs>
          </TabsContent>

          {/* Contrôle: inspections + conformité */}
          <TabsContent value="controle" className="space-y-6">
            <PhaseInspections phaseId={phaseId!} projectId={projectId!} />
          </TabsContent>

          {/* Clôture: réception, archives */}
          <TabsContent value="cloture" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" /> Clôture de la phase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {progress < 100 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>La phase n'est pas encore achevée ({progress}%). La clôture nécessite la réception définitive et la levée des réserves.</span>
                  </div>
                )}
                <PhaseDocuments phaseId={phaseId!} projectId={projectId!} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default PhaseDetail;
