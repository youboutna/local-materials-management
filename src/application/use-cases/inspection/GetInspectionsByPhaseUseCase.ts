// Get Inspections by Phase Use Case
import { supabase } from '@/integrations/supabase/client';

export interface PhaseInspection {
  id: string;
  projectId: string;
  phaseId: string | null;
  inspector: string;
  date: string;
  status: string;
  progressAtInspection: number;
  comments: string | null;
  documents: any;
  paymentType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetInspectionsByPhaseResult {
  inspections: PhaseInspection[];
  totalCount: number;
  approvedCount: number;
  pendingCount: number;
}

export class GetInspectionsByPhaseUseCase {
  async execute(phaseId: string): Promise<GetInspectionsByPhaseResult> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('phase_id', phaseId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching inspections:', error);
        return {
          inspections: [],
          totalCount: 0,
          approvedCount: 0,
          pendingCount: 0
        };
      }

      const inspections: PhaseInspection[] = (data || []).map(i => ({
        id: i.id,
        projectId: i.project_id,
        phaseId: i.phase_id,
        inspector: i.inspector,
        date: i.date,
        status: i.status,
        progressAtInspection: i.progress_at_inspection,
        comments: i.comments,
        documents: i.documents,
        paymentType: i.payment_type,
        createdAt: i.created_at,
        updatedAt: i.updated_at
      }));

      return {
        inspections,
        totalCount: inspections.length,
        approvedCount: inspections.filter(i => i.status === 'approved').length,
        pendingCount: inspections.filter(i => ['scheduled', 'in_progress'].includes(i.status)).length
      };
    } catch (error) {
      console.error('GetInspectionsByPhaseUseCase error:', error);
      return {
        inspections: [],
        totalCount: 0,
        approvedCount: 0,
        pendingCount: 0
      };
    }
  }

  async executeByProject(projectId: string): Promise<GetInspectionsByPhaseResult> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching project inspections:', error);
        return {
          inspections: [],
          totalCount: 0,
          approvedCount: 0,
          pendingCount: 0
        };
      }

      const inspections: PhaseInspection[] = (data || []).map(i => ({
        id: i.id,
        projectId: i.project_id,
        phaseId: i.phase_id,
        inspector: i.inspector,
        date: i.date,
        status: i.status,
        progressAtInspection: i.progress_at_inspection,
        comments: i.comments,
        documents: i.documents,
        paymentType: i.payment_type,
        createdAt: i.created_at,
        updatedAt: i.updated_at
      }));

      return {
        inspections,
        totalCount: inspections.length,
        approvedCount: inspections.filter(i => i.status === 'approved').length,
        pendingCount: inspections.filter(i => ['scheduled', 'in_progress'].includes(i.status)).length
      };
    } catch (error) {
      console.error('GetInspectionsByPhaseUseCase error:', error);
      return {
        inspections: [],
        totalCount: 0,
        approvedCount: 0,
        pendingCount: 0
      };
    }
  }
}
