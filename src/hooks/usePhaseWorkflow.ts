/**
 * usePhaseWorkflow - Hook pour gérer l'état du workflow de phase
 * Centralise la logique métier: Étapes → Inspections → Validation → Paiement
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useMemo, useCallback } from 'react';
import { PhaseDTO, PhaseStepDTO } from '@/dtos/entities/PhaseDTO';
import { StepItem } from '@/types/unified-workflow';

export type WorkflowStage = 
  | 'not_started' 
  | 'in_progress' 
  | 'inspection_scheduled' 
  | 'inspection_pending' 
  | 'validation_pending' 
  | 'approved' 
  | 'payment_available' 
  | 'paid';

export interface InspectionRecord {
  id: string;
  status: string;
  progress_at_inspection: number;
  date: string;
  inspector: string;
  phase_id: string | null;
  project_id: string;
  documents?: PhaseDocument[];
  comments?: string | null;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  payment_date: string;
  phase_id: string | null;
  project_id: string;
  contractor_name: string;
  progress_at_payment: number;
  payment_method: string;
}

export interface WorkflowMetrics {
  currentStage: WorkflowStage;
  totalSteps: number;
  completedSteps: number;
  stepProgress: number;
  totalInspections: number;
  approvedInspections: number;
  pendingInspections: number;
  scheduledInspections: number;
  totalPayments: number;
  totalPaid: number;
  lastApprovedProgress: number;
  canRequestPayment: boolean;
  canScheduleInspection: boolean;
  pendingActions: PendingAction[];
  guaranteeReleaseTriggered: boolean;
  insuranceReleaseTriggered: boolean;
}

export interface PendingAction {
  id: string;
  type: 'inspection' | 'validation' | 'payment' | 'document' | 'update';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  relatedId?: string;
}

export interface DecompteData {
  phaseProgress: number;
  validatedProgress: number;
  payablePercentage: number;
  totalContractAmount: number;
  amountToDecompte: number;
  guaranteeRetention: number;
  netPayable: number;
  previousPayments: number;
  remainingAmount: number;
}

interface PhaseDocument {
  id: string;
  type: string;
  url: string;
  uploaded_at: string;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed';
  documents?: PhaseDocument[];
}

export function usePhaseWorkflow(projectId: string, phaseId: string, phase?: PhaseDTO | null) {
  const queryClient = useQueryClient();

  // Fetch inspections
  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ['workflow-inspections', phaseId],
    queryFn: async (): Promise<InspectionRecord[]> => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('phase_id', phaseId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!phaseId,
  });

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['workflow-payments', phaseId],
    queryFn: async (): Promise<PaymentRecord[]> => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('phase_id', phaseId)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!phaseId,
  });

  // Calculate latest approved inspection
  const latestApprovedInspection = useMemo(() => {
    return inspections.find(i => i.status === 'approved');
  }, [inspections]);

  // Calculate workflow metrics
  const workflowMetrics = useMemo((): WorkflowMetrics => {
    const steps = phase?.steps || [];
    const totalSteps = steps.length;
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const stepProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    const approvedInspections = inspections.filter(i => i.status === 'approved');
    const pendingInspections = inspections.filter(i => 
      ['pending', 'in_progress'].includes(i.status)
    );
    const scheduledInspections = inspections.filter(i => i.status === 'scheduled');

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const lastApprovedProgress = latestApprovedInspection?.progress_at_inspection || 0;
    
    // Can request payment if: approved inspection with progress >= 25%
    const canRequestPayment = lastApprovedProgress >= 25;
    
    // Can schedule inspection if: no pending inspections
    const canScheduleInspection = pendingInspections.length === 0 && scheduledInspections.length === 0;

    // Determine current workflow stage
    let currentStage: WorkflowStage = 'not_started';
    if (lastApprovedProgress >= 100) {
      currentStage = 'paid';
    } else if (canRequestPayment) {
      currentStage = 'payment_available';
    } else if (approvedInspections.length > 0) {
      currentStage = 'approved';
    } else if (pendingInspections.length > 0) {
      currentStage = 'validation_pending';
    } else if (scheduledInspections.length > 0) {
      currentStage = 'inspection_scheduled';
    } else if (completedSteps > 0 || (phase?.progress || 0) > 0) {
      currentStage = 'in_progress';
    }

    // Build pending actions list
    const pendingActions: PendingAction[] = [];
    
    if (pendingInspections.length > 0) {
      pendingActions.push({
        id: 'validate-inspection',
        type: 'validation',
        title: 'Validation inspection en attente',
        description: `${pendingInspections.length} inspection(s) en attente de validation`,
        priority: 'high',
        relatedId: pendingInspections[0].id,
      });
    }

    if (canRequestPayment && payments.length === 0) {
      pendingActions.push({
        id: 'request-payment',
        type: 'payment',
        title: 'Demande de paiement disponible',
        description: `Progression validée: ${lastApprovedProgress}% - Paiement disponible`,
        priority: 'high',
      });
    }

    if ((phase?.progress || 0) > 0 && inspections.length === 0) {
      pendingActions.push({
        id: 'schedule-inspection',
        type: 'inspection',
        title: 'Programmer une inspection',
        description: 'Aucune inspection programmée pour cette phase',
        priority: 'medium',
      });
    }

    // Guarantee and insurance release triggers
    const guaranteeReleaseTriggered = lastApprovedProgress >= 100;
    const insuranceReleaseTriggered = lastApprovedProgress >= 100;

    return {
      currentStage,
      totalSteps,
      completedSteps,
      stepProgress,
      totalInspections: inspections.length,
      approvedInspections: approvedInspections.length,
      pendingInspections: pendingInspections.length,
      scheduledInspections: scheduledInspections.length,
      totalPayments: payments.length,
      totalPaid,
      lastApprovedProgress,
      canRequestPayment,
      canScheduleInspection,
      pendingActions,
      guaranteeReleaseTriggered,
      insuranceReleaseTriggered,
    };
  }, [phase, inspections, payments, latestApprovedInspection]);

  // Calculate decompte data
  const calculateDecompte = useCallback((
    contractAmount: number,
    guaranteeRetentionRate: number = 5
  ): DecompteData => {
    const phaseProgress = phase?.progress || 0;
    const validatedProgress = workflowMetrics.lastApprovedProgress;
    
    // Payable percentage based on validated progress (step increments)
    const payablePercentage = Math.floor(validatedProgress / 25) * 25;
    
    const previousPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const amountToDecompte = (contractAmount * payablePercentage / 100) - previousPayments;
    const guaranteeRetention = amountToDecompte * (guaranteeRetentionRate / 100);
    const netPayable = Math.max(0, amountToDecompte - guaranteeRetention);
    const remainingAmount = contractAmount - previousPayments - amountToDecompte;

    return {
      phaseProgress,
      validatedProgress,
      payablePercentage,
      totalContractAmount: contractAmount,
      amountToDecompte: Math.max(0, amountToDecompte),
      guaranteeRetention,
      netPayable,
      previousPayments,
      remainingAmount: Math.max(0, remainingAmount),
    };
  }, [phase, payments, workflowMetrics.lastApprovedProgress]);

  // Schedule inspection mutation
  const scheduleInspectionMutation = useMutation({
    mutationFn: async (inspectionData: {
      date: string;
      inspector: string;
      comments?: string;
    }) => {
      const { data, error } = await supabase
        .from('inspections')
        .insert({
          project_id: projectId,
          phase_id: phaseId,
          date: inspectionData.date,
          inspector: inspectionData.inspector,
          comments: inspectionData.comments,
          status: 'scheduled',
          progress_at_inspection: phase?.progress || 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-inspections', phaseId] });
      toast({
        title: 'Inspection programmée',
        description: 'L\'inspection a été programmée avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Approve inspection mutation
  const approveInspectionMutation = useMutation({
    mutationFn: async (inspectionId: string) => {
      const { error } = await supabase
        .from('inspections')
        .update({ status: 'approved' })
        .eq('id', inspectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-inspections', phaseId] });
      toast({
        title: 'Inspection approuvée',
        description: 'L\'inspection a été validée. Paiement disponible si progression ≥25%.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update step progress mutation
  const updateStepProgressMutation = useMutation({
    mutationFn: async ({ 
      stepId, 
      progress, 
      status 
    }: { 
      stepId: string; 
      progress: number; 
      status?: string 
    }) => {
      if (!phase) throw new Error('Phase data required');
      
      const updatedSteps = phase.steps.map((step: WorkflowStep) => ({
        ...step,
        status: step.status === 'delayed' ? 'in_progress' : step.status
      }));

      const { error } = await supabase
        .from('project_phases')
        .update({
          custom_phase_data: {
            steps: updatedSteps,
          },
        })
        .eq('id', phaseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-dto', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-inspections', phaseId] });
      toast({
        title: 'Progression mise à jour',
        description: 'L\'avancement de l\'étape a été enregistré.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get step status with inspection info
  const getStepWorkflowStatus = useCallback((step: WorkflowStep | StepItem) => {
    const stepProgress = step.progress ?? 0;
    const stepInspections = inspections.filter(i => 
      // Match inspection by progress range
      i.progress_at_inspection >= stepProgress - 10 &&
      i.progress_at_inspection <= stepProgress + 10
    );
    
    const hasApprovedInspection = stepInspections.some(i => i.status === 'approved');
    const hasPendingInspection = stepInspections.some(i => ['pending', 'scheduled', 'in_progress'].includes(i.status));
    
    const stepPayments = payments.filter(p => 
      p.progress_at_payment >= stepProgress - 10 &&
      p.progress_at_payment <= stepProgress + 10
    );
    const totalStepPayment = stepPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const hasPaid = totalStepPayment > 0;

    return {
      inspectionStatus: hasApprovedInspection ? 'approved' : hasPendingInspection ? 'pending' : 'none',
      paymentStatus: hasPaid ? 'paid' : hasApprovedInspection ? 'available' : 'blocked',
      totalPaid: totalStepPayment,
      latestInspection: stepInspections[0] || null,
    };
  }, [inspections, payments]);

  return {
    // Data
    inspections,
    payments,
    latestApprovedInspection,
    workflowMetrics,
    
    // Loading states
    isLoading: inspectionsLoading || paymentsLoading,
    
    // Calculations
    calculateDecompte,
    getStepWorkflowStatus,
    
    // Mutations
    scheduleInspection: scheduleInspectionMutation.mutateAsync,
    approveInspection: approveInspectionMutation.mutateAsync,
    updateStepProgress: updateStepProgressMutation.mutateAsync,
    
    // Mutation states
    isSchedulingInspection: scheduleInspectionMutation.isPending,
    isApprovingInspection: approveInspectionMutation.isPending,
    isUpdatingProgress: updateStepProgressMutation.isPending,
    
    // Refetch
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-inspections', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-payments', phaseId] });
    },
  };
}
