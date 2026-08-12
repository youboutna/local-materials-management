/**
 * UnifiedPhaseWorkflow - Workflow unifié pour le suivi de phase
 * Fusionne Étapes et Suivi & Jalons en un processus cohérent selon le workflow:
 * 
 * 1. Jalons avec étapes intégrées (timeline/cards)
 * 2. Points de contrôle actionnables:
 *    - Créer inspection → Ajouter documents → Mettre à jour progression
 *    - Décision: Approuver? → OUI: Synchronisation → Paiement disponible
 * 3. Après approbation avec progression ≥25%: Demande paiement automatique
 * 4. Après progression ≥100%: Mainlevée garanties & assurances
 */

import { getMilestoneService } from '@/application/services/MilestoneService';
import { InspectionFormWithContext } from '@/components/project/inspection';
import { MilestoneActionContext } from '@/components/project/milestones/MilestoneCheckpointActions';
import { PaymentFormWithContext } from '@/components/project/payment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { MILESTONE_TYPES, MilestoneSummaryDTO } from '@/dtos/entities/MilestoneDTO';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInDays, format, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    ClipboardCheck,
    Clock,
    DollarSign,
    FileCheck,
    FileText,
    Layers,
    Play,
    Plus,
    ShieldCheck,
    Target,
    Zap
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

// Workflow stage types
type WorkflowStage = 'scheduled' | 'in_progress' | 'documents_pending' | 'validation_pending' | 'approved' | 'rejected' | 'payment_available';

interface StageData {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
}

interface InspectionData {
  id: string;
  status: string;
  progress_at_inspection: number;
  date: string;
  inspector: string;
  documents?: Array<{
  id: string;
  name: string;
  type: string;
  url?: string;
  uploaded_at?: string;
}>;
}

interface UnifiedPhaseWorkflowProps {
  projectId: string;
  phaseId: string;
  phaseName?: string;
  stages?: StageData[];
  phaseProgress?: number;
  phaseBudget?: number;
}

const UnifiedPhaseWorkflow: React.FC<UnifiedPhaseWorkflowProps> = ({
  projectId,
  phaseId,
  phaseName,
  stages = [],
  phaseProgress = 0,
  phaseBudget = 0
}) => {
  const queryClient = useQueryClient();
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<MilestoneActionContext | null>(null);
  const [activeView, setActiveView] = useState<'workflow' | 'stages'>('workflow');

  // Fetch milestones
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['phase-milestones-workflow', projectId, phaseId],
    queryFn: async () => {
      const service = getMilestoneService();
      const raw = await service.getProjectMilestonesDTO(projectId);
      return raw.filter((m) => m.phaseId === phaseId).map((m) => ({
        id: m.id, title: m.title, targetDate: m.targetDate, status: m.status,
        type: m.type || 'checkpoint', priority: m.priority || 'normal',
        weight: m.weight || 0.2, phaseId: m.phaseId, phaseName: undefined,
        completionDate: m.completionDate, isCritical: m.priority === 'critical',
        isFromTemplate: false,
      })) as MilestoneSummaryDTO[];
    },
    enabled: !!projectId && !!phaseId,
  });

  // Fetch inspections for this phase via InspectionService
  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ['phase-inspections-workflow', phaseId],
    queryFn: async () => {
      const { getInspectionService } = await import('@/application/services/InspectionService');
      const service = getInspectionService();
      return await service.getInspectionsByPhase(phaseId);
    },
  });

  // Fetch payments for this phase via PaymentService
  const { data: payments = [] } = useQuery({
    queryKey: ['phase-payments-workflow', phaseId],
    queryFn: async () => {
      const { getPaymentService } = await import('@/application/services/PaymentService');
      const service = getPaymentService();
      const result = await service.getPaymentsByPhase(phaseId);
      return (result.data || []).sort((a: any, b: any) =>
        new Date(b.paymentDate || 0).getTime() - new Date(a.paymentDate || 0).getTime()
      );
    },
  });

  // Helper to normalize status for comparison (domain entity uses enum, DB uses string)
  const statusStr = (i: any) => String(i.status).toLowerCase();

  // Get latest approved inspection
  const latestApprovedInspection = useMemo(() => {
    return inspections.find((i: any) => statusStr(i) === 'approved');
  }, [inspections]);

  // Check if payment is available (after approved inspection with progress >= 25%)
  const isPaymentAvailable = useMemo(() => {
    return latestApprovedInspection && (latestApprovedInspection as any).progressAtInspection >= 25;
  }, [latestApprovedInspection]);

  // Check if guarantees release is triggered (progress >= 100%)
  const isGuaranteeReleaseTriggered = useMemo(() => {
    return latestApprovedInspection && (latestApprovedInspection as any).progressAtInspection >= 100;
  }, [latestApprovedInspection]);

  // Get current workflow stage for the phase
  const currentWorkflowStage = useMemo((): WorkflowStage => {
    if (isPaymentAvailable) return 'payment_available';
    if (latestApprovedInspection) return 'approved';
    
    const pendingInspection = inspections.find((i: any) => statusStr(i) === 'inprogress' || statusStr(i) === 'pending');
    if (pendingInspection) {
      if (statusStr(pendingInspection) === 'inprogress') return 'in_progress';
      return 'validation_pending';
    }
    
    const scheduledInspection = inspections.find((i: any) => statusStr(i) === 'scheduled');
    if (scheduledInspection) return 'scheduled';
    
    return 'scheduled';
  }, [inspections, latestApprovedInspection, isPaymentAvailable]);

  // Get milestone status with workflow context
  const getMilestoneWorkflowStatus = useCallback((milestone: MilestoneSummaryDTO) => {
    const today = new Date();
    const targetDate = parseISO(milestone.targetDate);
    
    if (milestone.status === 'completed') {
      return {
        icon: CheckCircle,
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success',
        label: 'Terminé',
        canAction: false
      };
    }

    if (isBefore(targetDate, today)) {
      const daysLate = differenceInDays(today, targetDate);
      return {
        icon: AlertTriangle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive',
        label: `Retard ${daysLate}j`,
        canAction: true
      };
    }

    const daysUntil = differenceInDays(targetDate, today);
    if (daysUntil <= 7) {
      return {
        icon: Clock,
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning',
        label: `Dans ${daysUntil}j`,
        canAction: true
      };
    }

    return {
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary',
      label: 'À venir',
      canAction: true
    };
  }, []);

  // Handle inspection creation
  const handleCreateInspection = useCallback((milestone?: MilestoneSummaryDTO) => {
    const context: MilestoneActionContext = {
      milestoneId: milestone?.id || '',
      milestoneTitle: milestone?.title || 'Inspection de phase',
      milestoneType: milestone?.type || 'checkpoint',
      phaseId,
      phaseName,
      suggestedProgress: phaseProgress
    };
    setSelectedContext(context);
    setInspectionDialogOpen(true);
  }, [phaseId, phaseName, phaseProgress]);

  // Handle payment creation (only available after approved inspection)
  const handleCreatePayment = useCallback((context?: Partial<MilestoneActionContext>) => {
    if (!isPaymentAvailable) {
      toast({
        title: "Action non disponible",
        description: "Une inspection approuvée avec progression ≥25% est requise pour effectuer un paiement.",
        variant: "destructive"
      });
      return;
    }

    const paymentContext: MilestoneActionContext = {
      milestoneId: context?.milestoneId || '',
      milestoneTitle: context?.milestoneTitle || `Paiement suite à inspection (${(latestApprovedInspection as any)?.progressAtInspection}%)`,
      milestoneType: context?.milestoneType || 'checkpoint',
      phaseId,
      phaseName,
      suggestedProgress: (latestApprovedInspection as any)?.progressAtInspection
    };
    setSelectedContext(paymentContext);
    setPaymentDialogOpen(true);
  }, [isPaymentAvailable, latestApprovedInspection, phaseId, phaseName]);

  // Mark milestone as complete
  const completeMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      await getMilestoneService().updateMilestone(milestoneId, { status: 'completed' } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-milestones-workflow'] });
      toast({ title: "Jalon marqué comme terminé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de marquer le jalon", variant: "destructive" });
    }
  });

  // Summary stats - Optimized to avoid repeated filtering
  const stats = useMemo(() => {
    let completedMilestones = 0;
    let approvedInspections = 0;
    let pendingInspections = 0;
    let completedStages = 0;
    let totalPaid = 0;

    // Single loop for milestones
    milestones.forEach(m => {
      if (m.status === 'completed') {
        completedMilestones++;
      }
    });

    // Single loop for inspections
    inspections.forEach((i: any) => {
      if (statusStr(i) === 'approved') {
        approvedInspections++;
      } else if (['pending', 'inprogress', 'scheduled'].includes(statusStr(i))) {
        pendingInspections++;
      }
    });

    // Single loop for payments
    payments.forEach(p => {
      totalPaid += (p.amount || 0);
    });

    // Single loop for stages
    stages.forEach(s => {
      if (s.status === 'completed') {
        completedStages++;
      }
    });

    return {
      totalMilestones: milestones.length,
      completedMilestones,
      totalInspections: inspections.length,
      approvedInspections,
      pendingInspections,
      totalPayments: payments.length,
      totalPaid,
      totalStages: stages.length,
      completedStages
    };
  }, [milestones, inspections, payments, stages]);

  // Memoized filtered milestones for gates and checkpoints
  const gateCheckpoints = useMemo(() => 
    milestones.filter(m => m.type === 'gate' || m.type === 'checkpoint'),
    [milestones]
  );

  if (milestonesLoading || inspectionsLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Chargement du workflow...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with workflow status */}
      <Card className={cn(
        "overflow-hidden",
        isPaymentAvailable 
          ? "bg-gradient-to-r from-success/10 to-success/5 border-success/30" 
          : currentWorkflowStage === 'approved'
            ? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30"
            : "bg-gradient-to-r from-muted to-background"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                isPaymentAvailable ? "bg-success/20" : "bg-primary/10"
              )}>
                <Target className={cn(
                  "h-5 w-5",
                  isPaymentAvailable ? "text-success" : "text-primary"
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Workflow de Phase - {phaseName || 'Phase'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stats.completedMilestones}/{stats.totalMilestones} jalons • {stats.approvedInspections}/{stats.totalInspections} inspections approuvées
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Workflow stage indicator */}
              {isPaymentAvailable && (
                <Badge className="bg-success text-success-foreground gap-1">
                  <Zap className="h-3 w-3" />
                  Paiement disponible
                </Badge>
              )}
              {isGuaranteeReleaseTriggered && (
                <Badge variant="outline" className="border-success text-success gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Mainlevée déclenchée
                </Badge>
              )}
              
              {/* View toggle */}
              <div className="flex items-center bg-muted rounded-md p-1">
                <Button
                  variant={activeView === 'workflow' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-3"
                  onClick={() => setActiveView('workflow')}
                >
                  <Target className="h-4 w-4 mr-1" />
                  Workflow
                </Button>
                <Button
                  variant={activeView === 'stages' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-3"
                  onClick={() => setActiveView('stages')}
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Étapes
                </Button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression phase</span>
              <span className="font-medium">{phaseProgress}%</span>
            </div>
            <Progress value={phaseProgress} className="h-2" />
          </div>

          {/* Workflow steps indicator */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t overflow-x-auto pb-2">
            {[
              { key: 'scheduled', label: 'Programmée', icon: Clock },
              { key: 'in_progress', label: 'En cours', icon: Play },
              { key: 'documents_pending', label: 'Documents', icon: FileCheck },
              { key: 'validation_pending', label: 'Validation', icon: ClipboardCheck },
              { key: 'approved', label: 'Approuvée', icon: CheckCircle },
              { key: 'payment_available', label: 'Paiement', icon: DollarSign },
            ].map((step, index, arr) => {
              const isActive = step.key === currentWorkflowStage;
              const isPast = arr.findIndex(s => s.key === currentWorkflowStage) > index;
              const StepIcon = step.icon;
              
              return (
                <React.Fragment key={step.key}>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs whitespace-nowrap",
                    isActive ? "bg-primary text-primary-foreground" :
                    isPast ? "bg-success/20 text-success" :
                    "bg-muted text-muted-foreground"
                  )}>
                    <StepIcon className="h-3 w-3" />
                    {step.label}
                  </div>
                  {index < arr.length - 1 && (
                    <ChevronRight className={cn(
                      "h-4 w-4 shrink-0",
                      isPast ? "text-success" : "text-muted-foreground/50"
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main content based on view */}
      {activeView === 'workflow' ? (
        <div className="space-y-4">
          {/* Actionable Checkpoints */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Points de contrôle actionnables
                </span>
                <Button size="sm" variant="outline" onClick={() => handleCreateInspection()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvelle inspection
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gateCheckpoints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Aucun point de contrôle défini</p>
                  <p className="text-xs">Créez des jalons de type "Checkpoint" ou "Porte" pour activer le workflow</p>
                </div>
              ) : (
                gateCheckpoints
                  .map(milestone => {
                    const status = getMilestoneWorkflowStatus(milestone);
                    const StatusIcon = status.icon;
                    const isExpanded = expandedMilestone === milestone.id;

                    return (
                      <div key={milestone.id} className="border rounded-lg overflow-hidden">
                        {/* Milestone header */}
                        <div
                          className={cn(
                            "flex items-center justify-between p-3 cursor-pointer transition-all",
                            status.bgColor,
                            "hover:opacity-90"
                          )}
                          onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("p-1.5 rounded-full bg-background", status.borderColor, "border")}>
                              <StatusIcon className={cn("h-4 w-4", status.color)} />
                            </div>
                            <div>
                              <p className={cn(
                                "font-medium",
                                milestone.status === 'completed' && "line-through text-muted-foreground"
                              )}>
                                {milestone.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{format(parseISO(milestone.targetDate), 'd MMM yyyy', { locale: fr })}</span>
                                <Badge variant="outline" className="text-xs h-4">
                                  {MILESTONE_TYPES[milestone.type]?.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn(status.bgColor, status.color, "border-0 text-xs")}>
                              {status.label}
                            </Badge>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </div>

                        {/* Expanded actions */}
                        {isExpanded && (
                          <div className="p-4 bg-muted/30 border-t space-y-4">
                            {/* Related inspections */}
                            <div>
                              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <ClipboardCheck className="h-4 w-4" />
                                Inspections liées
                              </h5>
                              {inspections.length > 0 ? (
                                <div className="space-y-2">
                                  {inspections.slice(0, 3).map((inspection: any) => (
                                    <div key={inspection.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={
                                          statusStr(inspection) === 'approved' ? 'default' :
                                          statusStr(inspection) === 'rejected' ? 'destructive' : 'secondary'
                                        } className="text-xs">
                                          {statusStr(inspection) === 'approved' ? 'Approuvée' :
                                           statusStr(inspection) === 'rejected' ? 'Rejetée' :
                                           statusStr(inspection) === 'inprogress' ? 'En cours' : 'En attente'}
                                        </Badge>
                                        <span className="text-sm">{typeof inspection.inspector === 'object' ? inspection.inspector?.name || '' : inspection.inspector}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {format(parseISO(inspection.date), 'd MMM', { locale: fr })}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{inspection.progressAtInspection}%</span>
                                        {inspection.documents && typeof inspection.documents === 'object' && 
                                         !Array.isArray(inspection.documents) && 
                                         'validation_documents' in inspection.documents && 
                                         ((inspection.documents as { validation_documents?: unknown[] })?.validation_documents?.length ?? 0) > 0 && (
                                          <Badge variant="outline" className="text-xs">
                                            <FileText className="h-3 w-3 mr-1" />
                                            {(inspection.documents as { validation_documents: unknown[] }).validation_documents.length}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Aucune inspection</p>
                              )}
                            </div>

                            <Separator />

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCreateInspection(milestone)}
                                className="gap-1"
                              >
                                <ClipboardCheck className="h-4 w-4" />
                                Créer inspection
                              </Button>
                              
                              <Button
                                size="sm"
                                variant={isPaymentAvailable ? "default" : "outline"}
                                disabled={!isPaymentAvailable}
                                onClick={() => handleCreatePayment({
                                  milestoneId: milestone.id,
                                  milestoneTitle: milestone.title,
                                  milestoneType: milestone.type
                                })}
                                className={cn("gap-1", isPaymentAvailable && "bg-success hover:bg-success/90")}
                              >
                                <DollarSign className="h-4 w-4" />
                                Demande paiement
                                {!isPaymentAvailable && (
                                  <span className="text-xs ml-1">(inspection requise)</span>
                                )}
                              </Button>

                              {status.canAction && milestone.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => completeMilestoneMutation.mutate(milestone.id)}
                                  className="gap-1"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Marquer terminé
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>

          {/* Quick summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveView('stages')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Étapes</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalStages}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.completedStages} terminées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Inspections</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalInspections}</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    {stats.approvedInspections} ✓
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                    {stats.pendingInspections} ⏳
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Paiements</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalPayments}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalPaid.toLocaleString()} MRU
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Jalons</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalMilestones}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.completedMilestones} terminés
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment availability banner */}
          {isPaymentAvailable && (
            <Card className="bg-success/10 border-success/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium text-success">Demande de paiement disponible</p>
                      <p className="text-sm text-muted-foreground">
                        Inspection approuvée avec {(latestApprovedInspection as any)?.progressAtInspection}% de progression
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => handleCreatePayment()} className="bg-success hover:bg-success/90">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Créer demande de paiement
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Stages view */
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Étapes de la phase ({stages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stages.map((stage, index) => (
                  <div key={stage.id || index} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{stage.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {stage.status === 'completed' ? 'Terminé' :
                         stage.status === 'in_progress' ? 'En cours' : 'À faire'}
                      </Badge>
                    </div>
                    {stage.description && (
                      <p className="text-sm text-muted-foreground mb-3">{stage.description}</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Progression</span>
                        <span className="font-medium">{stage.progress || 0}%</span>
                      </div>
                      <Progress value={stage.progress || 0} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">Aucune étape définie</h3>
                <p className="text-sm text-muted-foreground">
                  Les étapes seront créées lors de la configuration de la phase.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inspection Dialog */}
      <InspectionFormWithContext
        projectId={projectId}
        milestoneContext={selectedContext || undefined}
        isOpen={inspectionDialogOpen}
        onClose={() => setInspectionDialogOpen(false)}
        onInspectionCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['phase-inspections-workflow'] });
          queryClient.invalidateQueries({ queryKey: ['phase-milestones-workflow'] });
          setInspectionDialogOpen(false);
        }}
      />

      {/* Payment Dialog */}
      <PaymentFormWithContext
        projectId={projectId}
        milestoneContext={selectedContext || undefined}
        isOpen={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onPaymentCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['phase-payments-workflow'] });
          setPaymentDialogOpen(false);
        }}
      />
    </div>
  );
};

export default UnifiedPhaseWorkflow;
