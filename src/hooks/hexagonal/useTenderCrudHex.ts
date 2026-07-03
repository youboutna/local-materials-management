/**
 * Hexagonal hooks for Tender CRUD operations
 * — Preserves ALL DB fields (no lossy mapping)
 * — Exposes sharing secret hooks aligned with SupabaseTenderSharingAdapter
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { TenderService } from '@/application/services/TenderService';
import { ProjectService } from '@/application/services/ProjectService';
import { toast } from '@/hooks/use-toast';

export interface Tender {
  id: string;
  tender_number?: string | null;
  title: string;
  description: string | null;
  project_id?: string | null;
  launch_date?: string | null;
  attribution_date?: string | null;
  deadline_date?: string | null;
  publication_date?: string | null;
  submission_deadline?: string | null;
  evaluation_deadline?: string | null;
  selection_mode?: string | null;
  market_type?: string | null;
  financing_source?: string | null;
  project_reference?: string | null;
  current_phase?: string | null;
  current_stage?: string | null;
  procurement_type?: string | null;
  estimated_value?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TenderFormData {
  title: string;
  description: string;
  project_id: string;
  launch_date: string;
  attribution_date: string;
  deadline_date: string;
  submission_deadline: string;
  evaluation_deadline: string;
  selection_mode: string;
  market_type: string;
  financing_source: string;
  project_reference: string;
  current_phase: string;
  current_stage: string;
  procurement_type: string;
  estimated_value: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
}

// Hook: Fetch all tenders (raw DB-shape preserved)
export function useTenders() {
  return useQuery({
    queryKey: ['tenders'],
    queryFn: async (): Promise<Tender[]> => {
      const tenderService = new TenderService();
      const tenders = await tenderService.getAllTenders();
      return tenders.map((t: any) => ({
        id: t.id,
        tender_number: t.tenderNumber ?? null,
        tenderNumber: t.tenderNumber ?? null,
        title: t.title,
        description: t.description,
        project_id: t.projectId,
        projectId: t.projectId,
        launch_date: t.launchDate,
        launchDate: t.launchDate,
        attribution_date: t.attributionDate,
        attributionDate: t.attributionDate,
        deadline_date: t.deadlineDate,
        deadlineDate: t.deadlineDate,
        publication_date: t.publicationDate,
        publicationDate: t.publicationDate,
        submission_deadline: t.submissionDeadline ?? t.deadlineDate ?? null,
        submissionDeadline: t.submissionDeadline ?? t.deadlineDate ?? null,
        evaluation_deadline: t.evaluationDeadline ?? null,
        evaluationDeadline: t.evaluationDeadline ?? null,
        selection_mode: t.selectionMode,
        selectionMode: t.selectionMode,
        market_type: t.marketType,
        marketType: t.marketType,
        financing_source: t.financingSource,
        financingSource: t.financingSource,
        project_reference: t.projectReference,
        projectReference: t.projectReference,
        current_phase: t.currentPhase ?? null,
        currentPhase: t.currentPhase ?? null,
        current_stage: t.currentStage ?? null,
        currentStage: t.currentStage ?? null,
        procurement_type: t.procurementType ?? null,
        procurementType: t.procurementType ?? null,
        estimated_value: t.estimatedValue ?? null,
        estimatedValue: t.estimatedValue ?? null,
        budget_min: t.budgetMin ?? null,
        budget_max: t.budgetMax ?? null,
        status: t.status,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      })) as any;
    }
  });
}

// Hook: Fetch projects for tender dropdown
export function useProjectsForTenders() {
  return useQuery({
    queryKey: ['projects-for-tender'],
    queryFn: async () => {
      const projectService = new ProjectService(RepositoryFactory.getProjectRepository());
      const projects = await projectService.getAllProjects();
      return projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description
      }));
    }
  });
}

// Hook: Create/Update tender (full field persistence)
export function useTenderMutation() {
  const queryClient = useQueryClient();
  const tenderRepo = RepositoryFactory.getTenderRepository();

  return useMutation({
    mutationFn: async ({
      formData,
      editingTenderId,
      procurementSteps
    }: {
      formData: TenderFormData;
      editingTenderId?: string;
      procurementSteps?: Array<{ phase: string; stage: { value: string; label: string }; selected_documents?: string[] }>;
    }) => {
      const toISO = (v: string) => (v ? new Date(v).toISOString() : null);
      const toNum = (v: string) => {
        if (!v) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };

      const payload: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        project_id: formData.project_id || null,
        launch_date: toISO(formData.launch_date),
        attribution_date: toISO(formData.attribution_date),
        deadline_date: toISO(formData.deadline_date),
        submission_deadline: toISO(formData.submission_deadline),
        evaluation_deadline: toISO(formData.evaluation_deadline),
        selection_mode: formData.selection_mode || null,
        market_type: formData.market_type || null,
        financing_source: formData.financing_source || null,
        project_reference: formData.project_reference || null,
        current_stage: formData.current_stage || null,
        procurement_type: formData.procurement_type || null,
        estimated_value: toNum(formData.estimated_value),
        status: formData.status,
      };

      // current_phase is a NUMBER column in DB
      if (formData.current_phase !== '') {
        const n = Number(formData.current_phase);
        payload.current_phase = Number.isFinite(n) ? n : null;
      }

      // Persist procurement workflow selection in metadata (best-effort)
      if (procurementSteps && procurementSteps.length > 0) {
        payload.eligibility_requirements = procurementSteps.map(
          (s) => `${s.phase}:${s.stage.value}`
        );
      }

      if (editingTenderId) {
        await tenderRepo.update(editingTenderId, payload as any);
        return { id: editingTenderId, ...payload };
      } else {
        const result = await tenderRepo.save(payload as any);
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast({ title: "Appel d'offres enregistré avec succès" });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error?.message ?? 'Enregistrement impossible', variant: 'destructive' });
    }
  });
}

// Hook: Delete tender
export function useDeleteTender() {
  const queryClient = useQueryClient();
  const tenderRepo = RepositoryFactory.getTenderRepository();

  return useMutation({
    mutationFn: async (id: string) => {
      await tenderRepo.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast({ title: "Appel d'offres supprimé avec succès" });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error?.message ?? 'Suppression impossible', variant: 'destructive' });
    }
  });
}

// ============= SHARING SECRETS (LOT 5) =============

export function useTenderSharingSecrets(tenderId?: string) {
  return useQuery({
    queryKey: ['tender-sharing-secrets', tenderId],
    queryFn: async () => {
      if (!tenderId) return [];
      const repo = RepositoryFactory.getTenderSharingRepository();
      return await repo.getSharingSecretsByTenderId(tenderId);
    },
    enabled: !!tenderId,
  });
}

export function useRevokeTenderSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (secretId: string) => {
      const repo = RepositoryFactory.getTenderSharingRepository();
      await repo.revokeSecret(secretId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-sharing-secrets'] });
      toast({ title: 'Code secret révoqué' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e?.message, variant: 'destructive' })
  });
}

export function useDeleteTenderSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (secretId: string) => {
      const repo = RepositoryFactory.getTenderSharingRepository();
      await repo.deleteSharingSecret(secretId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-sharing-secrets'] });
      toast({ title: 'Code secret supprimé' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e?.message, variant: 'destructive' })
  });
}
