/**
 * Hexagonal hooks for Inspections CRUD operations
 * Centralizes all inspection operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InspectionFormData {
  projectId: string; // ✅ CAMELCASE: Instead of project_id
  inspector: string;
  date: string;
  status: string;
  progressAtInspection: number; // ✅ CAMELCASE: Instead of progress_at_inspection
  comments?: string;
  phaseId?: string; // ✅ CAMELCASE: Instead of phase_id
  
  // Legacy snake_case for backward compatibility
  project_id?: string; // Legacy snake_case for backward compatibility
  progress_at_inspection?: number; // Legacy snake_case for backward compatibility
  phase_id?: string; // Legacy snake_case for backward compatibility
}

export interface InspectionRow {
  id: string;
  projectId: string; // ✅ CAMELCASE: Instead of project_id
  inspector: string;
  date: string;
  status: string;
  progressAtInspection: number; // ✅ CAMELCASE: Instead of progress_at_inspection
  comments?: string;
  phaseId?: string; // ✅ CAMELCASE: Instead of phase_id
  documents?: any;
  createdAt?: string; // ✅ CAMELCASE: Instead of created_at
  updatedAt?: string; // ✅ CAMELCASE: Instead of updated_at
  
  // Legacy snake_case for backward compatibility
  project_id?: string; // Legacy snake_case for backward compatibility
  progress_at_inspection?: number; // Legacy snake_case for backward compatibility
  phase_id?: string; // Legacy snake_case for backward compatibility
  created_at?: string; // Legacy snake_case for backward compatibility
  updated_at?: string; // Legacy snake_case for backward compatibility
}

// Hook: Fetch all inspections
export function useInspectionsList() {
  return useQuery({
    queryKey: ['inspections-list'],
    queryFn: async (): Promise<InspectionRow[]> => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      
      // ✅ TRANSFORM: Map snake_case database fields to camelCase
      return (data || []).map(item => ({
        id: item.id,
        projectId: item.project_id, // ✅ CAMELCASE: From project_id
        inspector: item.inspector,
        date: item.date,
        status: item.status,
        progressAtInspection: item.progress_at_inspection, // ✅ CAMELCASE: From progress_at_inspection
        comments: item.comments,
        phaseId: item.phase_id, // ✅ CAMELCASE: From phase_id
        documents: item.documents,
        createdAt: item.created_at, // ✅ CAMELCASE: From created_at
        updatedAt: item.updated_at, // ✅ CAMELCASE: From updated_at
        
        // Legacy snake_case for backward compatibility
        project_id: item.project_id,
        progress_at_inspection: item.progress_at_inspection,
        phase_id: item.phase_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })) as InspectionRow[];
    }
  });
}

// Hook: Create inspection
export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InspectionFormData) => {
      const { data: result, error } = await supabase
        .from('inspections')
        .insert({
          // ✅ TRANSFORM: Map camelCase to snake_case for database
          project_id: data.projectId || data.project_id, // ✅ PRIORITY: camelCase first
          inspector: data.inspector,
          date: new Date(data.date).toISOString(),
          status: data.status,
          progress_at_inspection: data.progressAtInspection || data.progress_at_inspection, // ✅ PRIORITY: camelCase first
          comments: data.comments,
          phase_id: data.phaseId || data.phase_id // ✅ PRIORITY: camelCase first
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-list'] });
    }
  });
}

// Hook: Update inspection
export function useUpdateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InspectionFormData }) => {
      const { error } = await supabase
        .from('inspections')
        .update({
          // ✅ TRANSFORM: Map camelCase to snake_case for database
          project_id: data.projectId || data.project_id, // ✅ PRIORITY: camelCase first
          inspector: data.inspector,
          date: new Date(data.date).toISOString(),
          status: data.status,
          progress_at_inspection: data.progressAtInspection || data.progress_at_inspection, // ✅ PRIORITY: camelCase first
          comments: data.comments,
          phase_id: data.phaseId || data.phase_id, // ✅ PRIORITY: camelCase first
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-list'] });
    }
  });
}

// Hook: Delete inspection
export function useDeleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-list'] });
    }
  });
}
