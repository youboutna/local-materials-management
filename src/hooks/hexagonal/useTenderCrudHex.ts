/**
 * Hexagonal hooks for Tender CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { TenderService } from '@/application/services/TenderService';
import { ProjectService } from '@/application/services/ProjectService';
import { toast } from '@/hooks/use-toast';

export interface Tender {
  id: string;
  title: string;
  description: string | null;
  project_id?: string | null;
  launch_date?: string | null;
  attribution_date?: string | null;
  deadline_date?: string | null;
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

// Hook: Fetch all tenders
export function useTenders() {
  const tenderService = new TenderService(RepositoryFactory.getTenderRepository());
  
  return useQuery({
    queryKey: ['tenders'],
    queryFn: async (): Promise<Tender[]> => {
      const tenders = await tenderService.getAllTenders();
      return tenders.map(tender => ({
        id: tender.id,
        title: tender.title,
        description: tender.description,
        project_id: tender.projectId,
        launch_date: tender.launchDate,
        attribution_date: tender.attributionDate,
        deadline_date: tender.deadlineDate,
        submission_deadline: null,
        evaluation_deadline: null,
        selection_mode: tender.selectionMode,
        market_type: tender.marketType,
        financing_source: tender.financingSource,
        project_reference: tender.projectReference,
        current_phase: null,
        current_stage: null,
        procurement_type: null,
        estimated_value: tender.budgetMax || tender.budgetMin || null,
        status: tender.status,
        created_at: tender.createdAt,
        updated_at: tender.updatedAt
      }));
    }
  });
}

// Hook: Fetch projects for tender dropdown
export function useProjectsForTenders() {
  const projectService = new ProjectService(RepositoryFactory.getProjectRepository());
  
  return useQuery({
    queryKey: ['projects-for-tender'],
    queryFn: async () => {
      const projects = await projectService.getAllProjects();
      return projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description
      }));
    }
  });
}

// Hook: Create/Update tender
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
      
      const tenderData: any = {
        title: formData.title,
        description: formData.description,
        project_id: formData.project_id || null,
        launch_date: formData.launch_date || null,
        attribution_date: formData.attribution_date || null,
        deadline_date: toISO(formData.deadline_date),
        selection_mode: formData.selection_mode || null,
        market_type: formData.market_type || null,
        financing_source: formData.financing_source || null,
        project_reference: formData.project_reference || null,
        status: formData.status
      };

      if (editingTenderId) {
        await tenderRepo.update(editingTenderId, tenderData);
        return { id: editingTenderId, ...tenderData };
      } else {
        const result = await tenderRepo.save(tenderData);
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast({ title: 'Appel d\'offres enregistré avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
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
      toast({ title: 'Appel d\'offres supprimé avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });
}
