// @ts-nocheck
/**
 * PhaseDetail — Lifecycle-grouped tabs (Planification / Exécution / Contrôle / Clôture).
 * Cross-module navigation buttons link to inspections, payments, documents and reports.
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
  const { t } = useLanguage();

  const { phase, loading } = usePhaseDetails(phaseId);

  const stage = useMemo(
    () => (phase ? getPhaseLifecycleStage({ type: phase.type, status: phase.status }) : 'PLANIFICATION'),
    [phase]
  );
  const stageMeta = getLifecycleStageMeta(stage);

  const defaultStageTab = (searchParams.get('stage') as any) || stage.toLowerCase();

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

  if (!phase) {
    return (
      <AppLayout pageTitle="Phase">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Phase non trouvée</h1>
          <Button onClick={() => navigate(`/projects/${projectId}`)}>Retour au projet</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle={phase.title} pageDescription={stageMeta.description}>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}`)}
              className="flex items-center gap-2"
              aria-label="Retour au projet"
            >
              <ArrowLeft className="h-4 w-4" /> Retour au projet
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{phase.title}</h1>
              <p className="text-muted-foreground mt-1">{phase.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={stageMeta.tokenClass} variant="outline">
              {stageMeta.label}
            </Badge>
            <Badge className={getStatusColor(phase.status)} variant="outline">
              {getStatusLabel(phase.status)}
            </Badge>
          </div>
        </div>

        {/* Overview KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progression</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{phase.progress ?? 0}%</div>
              <Progress value={phase.progress ?? 0} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(phase.budget ?? 0).toLocaleString()} MRU</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durée</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{phase.estimatedDuration ?? 0} jours</div>
              <p className="text-xs text-muted-foreground">{phase.startDate} → {phase.endDate}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Localisation</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{phase.location || 'Non spécifiée'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Cross-module quick navigation */}
        <Card>
          <CardContent className="py-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-2">Navigation rapide :</span>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/inspections?phase=${phaseId}`)}>
              <ClipboardCheck className="h-4 w-4 mr-1" /> Inspections <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/payment-control?phase=${phaseId}`)}>
              <CreditCard className="h-4 w-4 mr-1" /> Paiements <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/documents?phase=${phaseId}`)}>
              <FileText className="h-4 w-4 mr-1" /> Documents <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/comprehensive-monitoring?phase=${phaseId}`)}>
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
                {(phase.progress ?? 0) < 100 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>La phase n'est pas encore achevée ({phase.progress ?? 0}%). La clôture nécessite la réception définitive et la levée des réserves.</span>
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
