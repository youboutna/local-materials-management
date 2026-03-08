/**

 * useProjectCheckpoints - Hook pour contexte projet avec jalons et vérifications

 * Centralise les données de checkpoints au niveau projet

 */



import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

import type { AutomaticDecompteDTO, CheckpointVerificationResultDTO, MilestoneDTO } from '@/dtos/entities';



interface ProjectMetrics {

  totalBudget: number;

  totalPaid: number;

  totalRetained: number;

  verifiedProgress: number;

  pendingCheckpoints: number;

  completedCheckpoints: number;

}



interface ProjectCheckpoint {
  id: string;
  phase_id: string;
  phase_name?: string;
  phaseName?: string;
  estimated_cost?: number;
  estimatedCost?: number;
  status: 'pending' | 'completed';
  progress: number;
  documents: {
    id: string;
    type: string;
    url: string;
  }[];
}



interface InspectionResult {
  id: string;
  status: string;
  phase_id: string | null;
  [key: string]: any;
}



interface ProjectVerificationSummary {
  allVerified: boolean;
  hasCompletedInspection: boolean;
  hasDocuments: boolean;
  hasPV: boolean;
  budgetConsumed: number;
  paymentsMade: number;
  verificationScore?: number;
  inspectionVerified?: boolean;
  documentVerified?: boolean;
  approvalVerified?: boolean;
  pvVerified?: boolean;
}



interface ProjectDecompteSummary {

  netPayable: number;

  retentionAmount: number;

  canRequestPayment: boolean;

  nextPaymentThreshold: number;

  progressToNextThreshold: number;

}



interface PhaseDecompteSummary {

  totalAlreadyPaid: number;

  retentionAmount: number;

  netPayable: number;

  canRequestPayment: boolean;

}



interface ProjectCheckpointsResult {

  phases: ProjectCheckpoint[];

  inspections: InspectionResult[];

  documents: ProjectDocument[];

  payments: ProjectPayment[];

  milestones: ProjectMilestone[];

  projectVerification: ProjectVerificationSummary | null;

  phaseVerifications: Map<string, ProjectVerificationSummary>;

  projectDecompte: ProjectDecompteSummary | null;

  phaseDecomptes: Map<string, PhaseDecompteSummary>;

  metrics: ProjectMetrics;

  isLoading: boolean;

  error: Error | null;

  refetch: () => void;

}



interface ProjectDocument {
  id: string;
  phase_id: string | null;
  [key: string]: any;
}



interface ProjectPayment {
  id: string;
  phase_id: string | null;
  amount: number;
  [key: string]: any;
}



interface ProjectMilestone {
  id: string;
  phase_id: string | null;
  status: string;
  [key: string]: any;
}



interface ProjectPhase {

  id: string;

  project_id: string;

  estimated_cost?: number;

  progress?: number;

  created_at?: string;

}



export function useProjectCheckpoints(projectId: string | undefined): ProjectCheckpointsResult {

  // Fetch phases

  const { data: phases = [], isLoading: phasesLoading, refetch: refetchPhases } = useQuery({

    queryKey: ['project-phases-checkpoints', projectId],

    queryFn: async () => {

      if (!projectId) return [];

      const { data, error } = await supabase

        .from('project_phases')

        .select('*')

        .eq('project_id', projectId)

        .order('created_at');

      if (error) throw error;

      return data || [];

    },

    enabled: !!projectId,

    staleTime: 30_000,

  });



  // Fetch inspections

  const { data: inspections = [], isLoading: inspLoading, refetch: refetchInsp } = useQuery({

    queryKey: ['project-inspections-checkpoints', projectId],

    queryFn: async () => {

      if (!projectId) return [];

      const { data, error } = await supabase

        .from('inspections')

        .select('*')

        .eq('project_id', projectId)

        .order('date', { ascending: false });

      if (error) throw error;

      return data || [];

    },

    enabled: !!projectId,

    staleTime: 30_000,

  });



  // Fetch documents

  const { data: documents = [], isLoading: docsLoading, refetch: refetchDocs } = useQuery({

    queryKey: ['project-documents-checkpoints', projectId],

    queryFn: async () => {

      if (!projectId) return [];

      const { data, error } = await supabase

        .from('documents')

        .select('*')

        .eq('project_id', projectId);

      if (error) throw error;

      return data || [];

    },

    enabled: !!projectId,

    staleTime: 30_000,

  });



  // Fetch payments

  const { data: payments = [], isLoading: payLoading, refetch: refetchPay } = useQuery({

    queryKey: ['project-payments-checkpoints', projectId],

    queryFn: async () => {

      if (!projectId) return [];

      const { data, error } = await supabase

        .from('payments')

        .select('*')

        .eq('project_id', projectId)

        .order('payment_date', { ascending: false });

      if (error) throw error;

      return data || [];

    },

    enabled: !!projectId,

    staleTime: 30_000,

  });



  // Fetch milestones

  const { data: milestones = [], isLoading: msLoading, refetch: refetchMs } = useQuery({

    queryKey: ['project-milestones-checkpoints', projectId],

    queryFn: async () => {

      if (!projectId) return [];

      const { data, error } = await supabase

        .from('enhanced_project_milestones')

        .select('*')

        .eq('project_id', projectId)

        .order('target_date');

      if (error) throw error;

      return data || [];

    },

    enabled: !!projectId,

    staleTime: 30_000,

  });



  // Calculer vérifications et décomptes

  const computed = useMemo(() => {

    if (!projectId || phases.length === 0) {

      return {

        projectVerification: null,

        phaseVerifications: new Map<string, ProjectVerificationSummary>(),

        projectDecompte: null,

        phaseDecomptes: new Map<string, PhaseDecompteSummary>(),

        metrics: {

          totalBudget: 0,

          totalPaid: 0,

          totalRetained: 0,

          verifiedProgress: 0,

          pendingCheckpoints: 0,

          completedCheckpoints: 0,

        },

      };

    }



    const phaseVerificationsMap = new Map<string, ProjectVerificationSummary>();

    const phaseDecomptesMap = new Map<string, PhaseDecompteSummary>();

    

    let totalBudget = 0;

    let totalPaid = 0;

    let totalRetained = 0;

    let weightedProgress = 0;

    let totalWeight = 0;

    let pendingCheckpoints = 0;

    let completedCheckpoints = 0;



    for (const phase of phases) {

      const phaseInspections = inspections.filter((i: any) => i.phase_id === phase.id);

      const phaseDocuments = documents.filter((d: any) => d.phase_id === phase.id);

      const phasePayments = payments.filter((p: any) => p.phase_id === phase.id);

      const phaseMilestones = milestones.filter((m: any) => m.phase_id === phase.id);

      

      const phaseBudget = phase.estimated_cost ?? 0;

      const phasePaid = phasePayments.reduce((sum: number, p: any) => sum + ((p as any).amount ?? 0), 0);

      

      // Calculate verification status

      const hasCompletedInspection = phaseInspections.some((i: any) => i.status === 'completed');

      const hasDocuments = phaseDocuments.length > 0;

      const hasPV = phaseDocuments.some((d: any) => (d as any).type?.toLowerCase().includes('pv') ?? false);

      

      const phaseVerification: ProjectVerificationSummary = {

        allVerified: hasCompletedInspection && hasDocuments,

        hasCompletedInspection,

        hasDocuments,

        hasPV,

        budgetConsumed: phasePaid,

        paymentsMade: phasePaid,

      };

      phaseVerificationsMap.set(phase.id || '', phaseVerification);



      // Calculate decompte

      const progress = phase.progress ?? 0;

      const payableThreshold = Math.floor(progress / 25) * 25;

      const grossPayable = phaseBudget * (payableThreshold / 100);

      const retention = grossPayable * 0.10;

      const netPayable = Math.max(0, grossPayable - retention - phasePaid);

      

      const phaseDecompte: PhaseDecompteSummary = {

        totalAlreadyPaid: phasePaid,

        retentionAmount: retention,

        netPayable,

        canRequestPayment: netPayable > 0 && phaseVerification.hasCompletedInspection,

      };

      phaseDecomptesMap.set(phase.id || '', phaseDecompte);



      // Aggregate metrics

      totalBudget += phaseBudget;

      totalPaid += phasePaid;

      totalRetained += retention;

      

      if (phaseBudget > 0) {

        weightedProgress += (progress || 0) * phaseBudget;

        totalWeight += phaseBudget;

      }



      pendingCheckpoints += phaseMilestones.filter((m: any) => m.status !== 'completed').length;

      completedCheckpoints += phaseMilestones.filter((m: any) => m.status === 'completed').length;

    }



    // Project-level aggregation

    const verifiedProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

    const allPhasesVerified = Array.from(phaseVerificationsMap.values()).every(v => v.allVerified);



    const projectVerificationResult: ProjectVerificationSummary = {

      allVerified: allPhasesVerified,

      hasCompletedInspection: inspections.some((i: InspectionResult) => i.status === 'completed'),

      hasDocuments: documents.length > 0,

      hasPV: documents.some((d: ProjectDocument) => d.type?.toLowerCase().includes('pv') ?? false),

      budgetConsumed: totalPaid,

      paymentsMade: totalPaid,

    };



    const nextThreshold = Math.ceil(verifiedProgress / 25) * 25;

    const projectDecompteResult: ProjectDecompteSummary = {

      netPayable: Array.from(phaseDecomptesMap.values()).reduce((s, d) => s + d.netPayable, 0),

      retentionAmount: totalRetained,

      canRequestPayment: Array.from(phaseDecomptesMap.values()).some(d => d.canRequestPayment),

      nextPaymentThreshold: nextThreshold,

      progressToNextThreshold: nextThreshold - verifiedProgress,

    };



    return {

      projectVerification: projectVerificationResult,

      phaseVerifications: phaseVerificationsMap,

      projectDecompte: projectDecompteResult,

      phaseDecomptes: phaseDecomptesMap,

      metrics: {

        totalBudget,

        totalPaid,

        totalRetained,

        verifiedProgress,

        pendingCheckpoints,

        completedCheckpoints,

      },

    };

  }, [projectId, phases, inspections, documents, payments, milestones]);



  const isLoading = phasesLoading || inspLoading || docsLoading || payLoading || msLoading;



  const refetch = () => {

    refetchPhases();

    refetchInsp();

    refetchDocs();

    refetchPay();

    refetchMs();

  };



  return {

    phases: phases as any,

    inspections: inspections as any,

    documents: documents as any,

    payments: payments as any,

    milestones: milestones as any,

    ...computed,

    isLoading,

    error: null,

    refetch,

  };

}

