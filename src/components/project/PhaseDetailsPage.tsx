/**
 * PhaseDetailsPage - Version Phase 4
 * Hiérarchie visuelle : Projet → Phase → Étapes/Jalons → Actions
 * Focus: Workflow en cascade avec inspections et paiements intégrés
 */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Banknote,
  Calculator,
  FileText,
  Package,
  Target,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import InitiatePaymentModal from "@/components/payment/InitiatePaymentModal";

// Hooks
import { PhaseDTO, PhaseMilestoneDTO, PhaseStepDTO, PhaseStatus } from '@/dtos/entities/PhaseDTO';
import { usePhaseDetails } from '@/hooks/usePhaseDetails';
import { usePhaseWorkflow } from "@/hooks/usePhaseWorkflow";
import { useWorkflowOrchestrator } from "@/hooks/useWorkflowOrchestrator";

// Hierarchy Components (Phase 4)
import {
  PhaseBreadcrumb,
  PhaseHeader,
  PhaseWithStepsView,
  PhaseWithDirectMilestonesView,
} from "./hierarchy";

// Components
import { PhaseEditDialog, formatCurrency } from "./phase";
import UnifiedCascadeWorkflow from "./workflow/UnifiedCascadeWorkflow";
import CheckpointVerificationPanel from "./workflow/CheckpointVerificationPanel";
import PhaseDocuments from "./PhaseDocuments";
import PhaseInspections from "./PhaseInspections";
import PhasePayments from "./PhasePayments";
import PhaseResourcesTab from "./phase/PhaseResourcesTab";
import PhaseQuantityTakeoffTab from "./phase/PhaseQuantityTakeoffTab";
import PhaseStakeholdersTab from "./phase/PhaseStakeholdersTab";
import ScheduleInspectionModal from "@/components/inspections/ScheduleInspectionModal";

// Phase UI interface for component layer with proper DTO support
// This interface represents the phase data structure needed by the UI layer
// It bridges between raw data from services and the UI display requirements
interface PhaseUIData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedCost: number;
  status: PhaseStatus;
  progress: number;
  steps?: PhaseStepDTO[];
  milestones?: PhaseMilestoneDTO[];
}

const PhaseDetailsPage: React.FC = () => {
  const { projectId, phaseId } = useParams<{ projectId: string; phaseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Debug logging for URL parameters
  useEffect(() => {
    console.log('PhaseDetailsPage - URL Parameters Debug:', {
      projectId,
      phaseId,
      hasProjectId: !!projectId,
      hasPhaseId: !!phaseId,
      url: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [projectId, phaseId]);

  const [activeTab, setActiveTab] = useState("hierarchy");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PhaseDTO>>({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [inspectionContext, setInspectionContext] = useState({});

  const { phase: rawPhase, isLoading, error, metrics, updatePhase, isUpdating } = usePhaseDetails(phaseId);

  // Map raw phase to UI format with dual-casing support
  const phase: PhaseUIData | null = useMemo(() => {
    if (!rawPhase) return null;
    return {
      id: rawPhase.id,
      name: (rawPhase as any).name || (rawPhase as any).phaseName || 'Phase',
      phaseName: (rawPhase as any).phaseName || (rawPhase as any).name || 'Phase',
      description: rawPhase.description || '',
      startDate: rawPhase.startDate || null,
      endDate: rawPhase.endDate || null,
      estimatedCost: rawPhase.estimatedCost || (rawPhase as any).estimated_cost || 0,
      status: rawPhase.status,
      progress: rawPhase.progress || 0,
      steps: (rawPhase as any).steps || [],
      milestones: (rawPhase as any).milestones || []
    } as PhaseUIData;
  }, [rawPhase]);

  const phaseName = (phase as any)?.phaseName || phase?.name || 'Phase';
  const estimatedCost = phase?.estimatedCost || 0;

  const {
    workflowMetrics,
    inspections,
    payments,
    latestApprovedInspection,
    refetch: refetchWorkflow,
  } = usePhaseWorkflow(projectId || '', phaseId || '', rawPhase as any);

  // Workflow orchestrator for automatic verification and payments
  const { 
    state: workflowState,
    getStatus,
    triggerPayment,
  } = useWorkflowOrchestrator(projectId);

  // Get workflow status on mount
  useEffect(() => {
    if (phaseId) {
      getStatus(phaseId);
    }
  }, [phaseId, getStatus]);

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
        name: phase.name,
        description: phase.description,
        startDate: phase.startDate,
        endDate: phase.endDate,
        estimatedCost: estimatedCost,
        status: phase.status,
        progress: phase.progress
      });
    }
  }, [phase]);

  const handleSave = () => {
    updatePhase(editForm);
    setIsEditing(false);
  };

  // Handlers pour inspections et paiements depuis la hiérarchie
  const handleScheduleInspection = (stepId?: string, milestoneId?: string) => {
    setInspectionContext({ stepId, milestoneId });
    setShowScheduleModal(true);
  };

  const handleRequestPayment = (stepId?: string, milestoneId?: string) => {
    // On peut utiliser le contexte pour pré-remplir le modal
    setShowPaymentModal(true);
  };

  const handleMilestoneAction = (action: string, milestone: any, stepId?: string) => {
    console.log('Milestone action:', action, milestone, stepId);
    switch (action) {
      case 'schedule_inspection':
        handleScheduleInspection(stepId, milestone.id);
        break;
      case 'request_payment':
        handleRequestPayment(stepId, milestone.id);
        break;
      case 'validate':
        // TODO: Validation modal
        break;
      case 'view':
        // TODO: View milestone details
        break;
    }
  };

  const handleInspectionScheduled = () => {
    refreshAll();
    setInspectionContext({});
  };

  // Détermine si la phase a des étapes ou des jalons directs
  const hasSteps = useMemo(() => {
    return (phase?.steps?.length || 0) > 0;
  }, [phase]);

  const hasMilestones = useMemo(() => {
    return (phase?.milestones?.length || 0) > 0;
  }, [phase]);

  const canRequestPayment = useMemo(() => {
    return (phase?.progress || 0) >= 100 || !!latestApprovedInspection;
  }, [phase, latestApprovedInspection]);

  const projectProgress = useMemo(() => phase?.progress || 0, [phase]);

  // Calcul des métriques pour PhaseHeader
  const phaseMetrics = useMemo(() => {
    const milestones = Array.isArray(phase?.milestones) ? phase.milestones : [];
    return {
      stepsCount: phase?.steps?.length || 0,
      completedSteps: phase?.steps?.filter((s: any) => s.status === 'completed').length || 0,
      milestonesCount: milestones.length,
      completedMilestones: milestones.filter((m: any) => m.status === 'completed').length,
      inspectionsCount: inspections?.length || 0,
      paymentsTotal: workflowMetrics?.totalPaid || 0,
    };
  }, [phase, inspections, workflowMetrics]);

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
          <AlertDescription>Impossible de charger les détails de la phase.</AlertDescription>
        </Alert>
        <Button onClick={() => navigate(`/projects/${projectId}`)} className="mt-4">
          Retour au projet
        </Button>
      </div>
    );
  }

  // Create compatible phase object for child components
  const phaseForComponents = {
    ...rawPhase,
    name: phaseName,
    startDate: phase.startDate,
    endDate: phase.endDate,
    estimatedCost: estimatedCost,
    projectId: projectId
  };

  return (
    <div className="container mx-auto mt-14 py-6 space-y-6">
      {/* Breadcrumb hiérarchique */}
      <PhaseBreadcrumb
        project={{ id: projectId || '', title: 'Projet' }}
        phase={phaseForComponents as any}
      />

      {/* Header Phase avec KPIs et actions */}
      <PhaseHeader
        phase={phaseForComponents as any}
        metrics={phaseMetrics}
        onEdit={() => setIsEditing(true)}
        onScheduleInspection={() => handleScheduleInspection()}
        onRequestPayment={() => setShowPaymentModal(true)}
        canRequestPayment={canRequestPayment}
      />

      {/* Tabs de navigation — alignées sur le cycle de vie d'une phase */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 mb-4">
          <TabsTrigger value="hierarchy" className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Hiérarchie
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" /> Workflow
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Package className="h-4 w-4" /> Ressources
          </TabsTrigger>
          <TabsTrigger value="metre" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Métré / DQE
          </TabsTrigger>
          <TabsTrigger value="stakeholders" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Parties prenantes
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Documents
          </TabsTrigger>
        </TabsList>

        {/* Tab Hiérarchie */}
        <TabsContent value="hierarchy" className="space-y-6">
          {hasSteps ? (
            <PhaseWithStepsView
              phase={phaseForComponents as any}
              projectId={projectId}
              onStepClick={(step) => console.log('Navigate to step:', step)}
              onScheduleInspection={(stepId) => handleScheduleInspection(stepId)}
              onRequestPayment={(stepId) => handleRequestPayment(stepId)}
              onMilestoneAction={handleMilestoneAction}
            />
          ) : hasMilestones ? (
            <PhaseWithDirectMilestonesView
              phase={phaseForComponents as any}
              projectId={projectId}
              onScheduleInspection={(milestoneId) => handleScheduleInspection(undefined, milestoneId)}
              onRequestPayment={(milestoneId) => handleRequestPayment(undefined, milestoneId)}
              onValidateMilestone={(milestoneId) => console.log('Validate:', milestoneId)}
              onViewMilestoneDetails={(milestoneId) => console.log('View:', milestoneId)}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Phase vide</h3>
                <p className="text-muted-foreground mb-4">
                  Cette phase n'a ni étapes ni jalons configurés.
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline">Ajouter une étape</Button>
                  <Button variant="outline">Ajouter un jalon</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Inspections</CardTitle>
              </CardHeader>
              <CardContent>
                <PhaseInspections phaseId={phaseId!} projectId={projectId!} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <PhasePayments phaseId={phaseId!} projectId={projectId!} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Workflow */}
        <TabsContent value="workflow" className="space-y-6">
          <CheckpointVerificationPanel
            projectId={projectId!}
            phaseId={phaseId!}
            compact
          />

          <UnifiedCascadeWorkflow
            phase={phaseForComponents as any}
            projectProgress={projectProgress}
            workflowMetrics={workflowMetrics}
            steps={phase.steps}
            inspections={inspections}
            payments={payments}
            onScheduleInspection={() => handleScheduleInspection()}
            onRequestPayment={() => {
              if (phaseId && workflowState.pendingPayment > 0) {
                triggerPayment(phaseId, workflowState.pendingPayment);
              }
            }}
            onStepAction={(action, item) => {
              console.log('Step action:', action, item);
            }}
            onMilestoneAction={(action, item) => handleMilestoneAction(action, item)}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        {/* Tab Ressources : matériaux + main d'œuvre */}
        <TabsContent value="resources" className="space-y-6">
          <PhaseResourcesTab phaseId={phaseId!} projectId={projectId!} />
        </TabsContent>

        {/* Tab Métré / DQE */}
        <TabsContent value="metre" className="space-y-6">
          <PhaseQuantityTakeoffTab
            phaseId={phaseId!}
            projectId={projectId!}
            phaseName={phaseName}
          />
        </TabsContent>

        {/* Tab Parties prenantes filtrées par concern métier */}
        <TabsContent value="stakeholders" className="space-y-6">
          <PhaseStakeholdersTab projectId={projectId!} phaseId={phaseId!} />
        </TabsContent>

        {/* Tab Documents */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">
                {phase.description || "Aucune description."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Documents de la phase</CardTitle>
            </CardHeader>
            <CardContent>
              <PhaseDocuments phaseId={phaseId!} projectId={projectId!} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PhaseEditDialog
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        editForm={editForm}
        setEditForm={setEditForm as any}
        onSave={handleSave}
        isUpdating={isUpdating}
        phaseName={phaseName}
        completionValidation={{ 
          canComplete: true, 
          pendingCheckpoints: [], 
          completedCheckpoints: [], 
          totalCheckpoints: 0, 
          completedCount: 0, 
          message: '', 
          progressMet: true, 
          currentProgress: 100, 
          requiredProgress: 100, 
          progressMessage: '' 
        }}
      />

      {/* Modal de programmation d'inspection */}
      <ScheduleInspectionModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        projectId={projectId || ''}
        phaseId={phaseId}
        phaseName={phaseName}
        onSuccess={handleInspectionScheduled}
      />

      {/* Modal d'initiation de paiement */}
      <InitiatePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        projectId={projectId || ''}
        phaseId={phaseId}
        inspectionId={latestApprovedInspection?.id}
        suggestedAmount={estimatedCost}
        initiatorRole="project_manager"
        onSuccess={() => {
          refreshAll();
          setShowPaymentModal(false);
        }}
      />
    </div>
  );
};

export default PhaseDetailsPage;
