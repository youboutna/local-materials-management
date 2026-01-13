/**
 * Hexagonal hooks for Tender CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery({
    queryKey: ['tenders'],
    queryFn: async (): Promise<Tender[]> => {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(tender => ({
        ...tender,
        current_phase: tender.current_phase?.toString() || '',
        current_stage: tender.current_stage?.toString() || ''
      })) as Tender[];
    }
  });
}

// Hook: Fetch projects for tender dropdown
export function useProjectsForTenders() {
  return useQuery({
    queryKey: ['projects-for-tender'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description')
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });
}

// Hook: Create/Update tender
export function useTenderMutation() {
  const queryClient = useQueryClient();

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
      const dataToSubmit = {
        title: formData.title,
        description: formData.description,
        project_id: formData.project_id || null,
        launch_date: formData.launch_date || null,
        attribution_date: formData.attribution_date || null,
        deadline_date: toISO(formData.deadline_date),
        submission_deadline: toISO(formData.submission_deadline),
        evaluation_deadline: toISO(formData.evaluation_deadline || ''),
        selection_mode: formData.selection_mode || null,
        market_type: formData.market_type || null,
        financing_source: formData.financing_source || null,
        project_reference: formData.project_reference || null,
        procurement_type: formData.procurement_type || null,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        status: formData.status
      };

      if (editingTenderId) {
        const { data, error } = await supabase
          .from('tenders')
          .update(dataToSubmit)
          .eq('id', editingTenderId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('tenders')
          .insert([dataToSubmit])
          .select()
          .single();
        if (error) throw error;
        
        // Add workflow steps if creating new tender
        if (procurementSteps && procurementSteps.length > 0) {
          let stepNumber = 1;
          const stepsToInsert = procurementSteps.map(({ phase, stage, selected_documents }) => ({
            tender_id: data.id,
            title: stage.label,
            description: `Phase: ${phase} - ${stage.label}`,
            step_number: stepNumber++,
            required_documents: selected_documents || [],
            procurement_phase: phase,
            procurement_stage: stage.value,
            status: 'pending'
          }));

          const { error: stepsError } = await supabase
            .from('tender_steps')
            .insert(stepsToInsert);
          
          if (stepsError) {
            console.error('Error adding workflow steps:', stepsError);
          }
        }
        
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
    }
  });
}

// Hook: Delete tender
export function useDeleteTender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenderId: string) => {
      const { error } = await supabase
        .from('tenders')
        .delete()
        .eq('id', tenderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
    }
  });
}
