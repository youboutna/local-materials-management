/**
 * Hexagonal hooks for Inspections CRUD operations
 * Centralizes all inspection operations via InspectionService
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { getInspectionService } from '@/application/services/InspectionService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface InspectionFormData {
  projectId: string;
  inspector: string;
  date: string;
  status: string;
  progressAtInspection: number;
  comments?: string;
  phaseId?: string;
  
  // Legacy snake_case for backward compatibility
  project_id?: string;
  progress_at_inspection?: number;
  phase_id?: string;
}

export interface InspectionDocument {
  id: string;
  type: string;
  url: string;
  uploaded_at: string;
}

export interface InspectionRow {
  id: string;
  projectId: string;
  inspector: string;
  date: string;
  status: string;
  progressAtInspection: number;
  comments?: string;
  phaseId?: string;
  documents?: InspectionDocument[];
  createdAt?: string;
  updatedAt?: string;
  
  // Legacy snake_case for backward compatibility
  project_id?: string;
  progress_at_inspection?: number;
  phase_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Hook: Fetch all inspections
export function useInspectionsList() {
  return useQuery({
    queryKey: ['inspections-list'],
    queryFn: async (): Promise<InspectionRow[]> => {
      const repo = RepositoryFactory.getInspectionRepository();
      const data = await repo.findAll();
      
      return (data || []).map((item: any) => ({
        id: item.id,
        projectId: item.project_id || item.projectId,
        inspector: item.inspector,
        date: item.date,
        status: item.status,
        progressAtInspection: item.progress_at_inspection ?? item.progressAtInspection,
        comments: item.comments,
        phaseId: item.phase_id || item.phaseId,
        documents: item.documents,
        createdAt: item.created_at || item.createdAt,
        updatedAt: item.updated_at || item.updatedAt,
        
        // Legacy snake_case
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
      return await getInspectionService().createInspection({
        projectId: data.projectId || data.project_id,
        inspector: data.inspector,
        date: new Date(data.date).toISOString(),
        status: data.status,
        progressAtInspection: data.progressAtInspection ?? data.progress_at_inspection,
        comments: data.comments,
        phaseId: data.phaseId || data.phase_id,
      });
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
      return await getInspectionService().updateInspection(id, {
        projectId: data.projectId || data.project_id,
        inspector: data.inspector,
        date: new Date(data.date).toISOString(),
        status: data.status,
        progressAtInspection: data.progressAtInspection ?? data.progress_at_inspection,
        comments: data.comments,
        phaseId: data.phaseId || data.phase_id,
      });
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
      return await getInspectionService().deleteInspection(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-list'] });
    }
  });
}
