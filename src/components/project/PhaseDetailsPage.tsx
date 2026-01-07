/**
 * PhaseDetailsPage - Version Simplifiée
 * Focus: Workflow en cascade selon règles Mauritanie
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Eye,
  FileText,
  RefreshCw,
  Target,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

// Hooks
import { usePhaseDetails } from "@/hooks/usePhaseDetails";
import { usePhaseWorkflow } from "@/hooks/usePhaseWorkflow";

// Types
import { PhaseStatus } from "@/types/phase-dto";

// Components
import { PhaseEditDialog, formatCurrency, formatDate, getStatusColor, getStatusLabel } from "./phase";
import UnifiedCascadeWorkflow from "./workflow/UnifiedCascadeWorkflow";
import PhaseDocuments from "./PhaseDocuments";
import PhaseMaterials from "./PhaseMaterials";
import PhaseInspections from "./PhaseInspections";
import PhasePayments from "./PhasePayments";
import { PhaseMilestonesSection } from "./milestones";

const getStatusIcon = (status: PhaseStatus | string) => {
  switch (status) {
    case "completed": return <CheckCircle className="h-4 w-4" />;
    case "in_progress": return <RefreshCw className="h-4 w-4" />;
    case "delayed": return <AlertTriangle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const calculateRemainingDays = (endDate?: string | null): number | string => {
  if (!endDate) return "N/A";
  try {
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch {
    return "N/A";
  }
};

const PhaseDetailsPage: React.FC = () => {
  const { projectId, phaseId } = useParams<{ projectId: string; phaseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("workflow");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const { phase, isLoading, error, metrics, updatePhase, isUpdating } = usePhaseDetails(phaseId);

  const {
    workflowMetrics,
    inspections,
    payments,
    refetch: refetchWorkflow,
    scheduleInspection,
  } = usePhaseWorkflow(projectId || '', phaseId || '', phase);

  const refreshAll = () => {
    try { refetchWorkflow?.(); } catch {}
    if (phaseId) {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
    }
  };

  useEffect(() => {
    if (phase) {
      setEditForm({
        phase_name: phase.phase_name,
        description: phase.description,
        start_date: phase.start_date,
        end_date: phase.end_date,
        estimated_cost: phase.estimated_cost,
        status: phase.status,
        progress: phase.progress,
      });
    }
  }, [phase]);

  const handleSave = () => {
    updatePhase(editForm);
    setIsEditing(false);
  };

  const handleScheduleInspection = async () => {
    try {
      await scheduleInspection({
        date: new Date().toISOString(),
        inspector: 'system',
        comments: 'Inspection programmée',
      });
      refreshAll();
    } catch (err) {
      console.error('Erreur', err);
    }
  };

  const projectProgress = useMemo(() => phase?.progress || 0, [phase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !phase) {
    return (
      <div className="container mt-20 mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Impossible de charger les détails.</AlertDescription>
        </Alert>
        <Button onClick={() => navigate(`/projects/${projectId}`)} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-14 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${projectId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{phase.phase_name}</h1>
                <p className="text-sm text-muted-foreground">ID: {phase.id.slice(0, 8)}</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsEditing(true)} size="sm">
            <Edit className="h-4 w-4 mr-2" /> Modifier
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
          <Badge className={cn(getStatusColor(phase.status), "flex items-center gap-1")}>
            {getStatusIcon(phase.status)}
            {getStatusLabel(phase.status)}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(phase.start_date)} → {formatDate(phase.end_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>{formatCurrency(phase.estimated_cost)}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm font-medium">{phase.progress}%</span>
            <Progress value={phase.progress} className="w-24 h-2" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Workflow
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" /> Vue d'ensemble
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-6">
          {/* Jalons de la phase - positionnés avant les étapes pour la planification */}
          <PhaseMilestonesSection
            projectId={projectId!}
            phaseId={phaseId!}
            phaseName={phase.phase_name}
            constructionPhase={phase.construction_phase}
            phaseStartDate={phase.start_date}
          />

          <UnifiedCascadeWorkflow
            phase={phase}
            projectProgress={projectProgress}
            workflowMetrics={workflowMetrics}
            steps={phase.steps}
            inspections={inspections}
            payments={payments}
            onScheduleInspection={handleScheduleInspection}
            onRequestPayment={() => {}}
            onStepAction={(action, item) => console.log('Step action:', action, item)}
            onMilestoneAction={(action, item) => console.log('Milestone action:', action, item)}
            formatCurrency={formatCurrency}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-base">Inspections</CardTitle></CardHeader>
              <CardContent><PhaseInspections phaseId={phaseId!} projectId={projectId!} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-base">Paiements</CardTitle></CardHeader>
              <CardContent><PhasePayments phaseId={phaseId!} projectId={projectId!} /></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-primary">{phase.progress}%</div><p className="text-sm text-muted-foreground">Progression</p></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{metrics.completedSteps}/{metrics.stepsCount}</div><p className="text-sm text-muted-foreground">Étapes</p></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{formatCurrency(workflowMetrics.totalPaid)}</div><p className="text-sm text-muted-foreground">Payé</p></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{calculateRemainingDays(phase.end_date)}</div><p className="text-sm text-muted-foreground">Jours restants</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Description</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground whitespace-pre-line">{phase.description || "Aucune description."}</p></CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardHeader className="py-3"><CardTitle className="text-base">Matériaux</CardTitle></CardHeader><CardContent><PhaseMaterials phaseId={phaseId!} projectId={projectId!} /></CardContent></Card>
            <Card><CardHeader className="py-3"><CardTitle className="text-base">Documents</CardTitle></CardHeader><CardContent><PhaseDocuments phaseId={phaseId!} projectId={projectId!} /></CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>

      <PhaseEditDialog
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSave}
        isUpdating={isUpdating}
        phaseName={phase.phase_name}
        completionValidation={{ canComplete: true, pendingCheckpoints: [], completedCheckpoints: [], totalCheckpoints: 0, completedCount: 0, message: '', progressMet: true, currentProgress: 100, requiredProgress: 100, progressMessage: '' }}
      />
    </div>
  );
};

export default PhaseDetailsPage;
