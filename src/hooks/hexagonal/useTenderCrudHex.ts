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
  description: string;
  project_id?: string;
  launch_date?: string;
  attribution_date?: string;
  deadline_date?: string;
  submission_deadline?: string;
  evaluation_deadline?: string;
  selection_mode?: string;
  market_type?: string;
  financing_source?: string;
  project_reference?: string;
  current_phase?: string;
  current_stage?: string;
  procurement_type?: string;
  estimated_value?: number;
  status: 'draft' | 'published' | 'closed' | 'awarded';
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
      // Use TenderService - placeholder implementation
      const tenders = await tenderService.getAllTenders();
      return tenders.map(tender => ({
        id: tender.id,
        title: tender.title,
        description: tender.description,
        project_id: tender.projectId,
        launch_date: tender.launchDate,
        attribution_date: tender.attributionDate,
        deadline_date: tender.deadlineDate,
        submission_deadline: tender.submissionDeadline,
        evaluation_deadline: tender.evaluationDeadline,
        selection_mode: tender.selectionMode,
        market_type: tender.marketType,
        financing_source: tender.financingSource,
        project_reference: tender.projectReference,
        current_phase: tender.currentPhase,
        current_stage: tender.currentStage,
        procurement_type: tender.procurementType,
        estimated_value: tender.estimatedValue,
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
      // Use ProjectService - placeholder implementation
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
  const tenderService = new TenderService(RepositoryFactory.getTenderRepository());

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
      
      // Use TenderService - placeholder implementation
      const tenderData = {
        title: formData.title,
        description: formData.description,
        projectId: formData.project_id || null,
        launchDate: formData.launch_date || null,
        attributionDate: formData.attribution_date || null,
        deadlineDate: toISO(formData.deadline_date),
        submissionDeadline: toISO(formData.submission_deadline),
        evaluationDeadline: toISO(formData.evaluation_deadline || ''),
        selectionMode: formData.selection_mode || null,
        marketType: formData.market_type || null,
        financingSource: formData.financing_source || null,
        projectReference: formData.project_reference || null,
        procurementType: formData.procurement_type || null,
        estimatedValue: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        status: formData.status
      };

      if (editingTenderId) {
        return await tenderService.updateTender(editingTenderId, tenderData);
      } else {
        const newTender = await tenderService.createTender(tenderData);
        
        // Add workflow steps if creating new tender
        if (procurementSteps && procurementSteps.length > 0) {
          // This would use a WorkflowService - placeholder implementation
          for (const step of procurementSteps) {
            // await workflowService.addWorkflowStep(newTender.id, step);
          }
        }
        
        return newTender;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast({ title: 'Appel d\'offres enregistré avec succès' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erreur', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });
}

// Hook: Delete tender
export function useDeleteTender() {
  const queryClient = useQueryClient();
  const tenderService = new TenderService(RepositoryFactory.getTenderRepository());

  return useMutation({
    mutationFn: async (id: string) => {
      // Use TenderService - placeholder implementation
      return await tenderService.deleteTender(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast({ title: 'Appel d\'offres supprimé avec succès' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erreur', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });
}
