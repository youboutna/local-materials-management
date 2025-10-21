import { supabase } from '@/integrations/supabase/client';
import { InspectionDTO, CreateInspectionDTO, UpdateInspectionDTO } from '@/types/inspection.dto';

/**
 * Service for managing inspections with proper separation of concerns
 * Provides CRUD operations and business logic for inspections
 */
export class InspectionService {
  /**
   * Get all inspections for a specific supplier
   * Fetches inspections from projects where the supplier is a stakeholder
   */
  static async getInspectionsForSupplier(supplierId: string): Promise<InspectionDTO[]> {
    try {
      console.log('[InspectionService] Getting inspections for supplier:', supplierId);
      
      // Get projects where this supplier is a stakeholder
      const { data: projectsData, error: projectsError } = await supabase
        .from('project_stakeholders')
        .select('project_id')
        .eq('supplier_id', supplierId)
        .eq('stakeholder_entity_type', 'supplier');

      if (projectsError) {
        console.error('[InspectionService] Error fetching supplier projects:', projectsError);
        throw projectsError;
      }

      console.log('[InspectionService] Found projects for supplier:', projectsData);
      
      const projectIds = projectsData?.map(p => p.project_id) || [];

      if (projectIds.length === 0) {
        console.log('[InspectionService] No projects found for supplier');
        return [];
      }

      console.log('[InspectionService] Fetching inspections for projects:', projectIds);

      // Get inspections for those projects
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          projects (title, status)
        `)
        .in('project_id', projectIds)
        .order('date', { ascending: false });

      if (error) {
        console.error('[InspectionService] Error fetching inspections:', error);
        throw error;
      }

      console.log('[InspectionService] Successfully fetched inspections:', data);
      return (data || []) as InspectionDTO[];
    } catch (error) {
      console.error('[InspectionService] getInspectionsForSupplier error:', error);
      return [];
    }
  }

  /**
   * Get all inspections for a specific project
   */
  static async getInspectionsByProject(projectId: string): Promise<InspectionDTO[]> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          projects (title, status)
        `)
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching project inspections:', error);
        throw error;
      }

      return (data || []) as InspectionDTO[];
    } catch (error) {
      console.error('InspectionService.getInspectionsByProject error:', error);
      return [];
    }
  }

  /**
   * Get inspections assigned to a specific inspector
   */
  static async getInspectionsByInspector(inspectorName: string): Promise<InspectionDTO[]> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          projects (title, status)
        `)
        .eq('inspector', inspectorName)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching inspector inspections:', error);
        throw error;
      }

      return (data || []) as InspectionDTO[];
    } catch (error) {
      console.error('InspectionService.getInspectionsByInspector error:', error);
      return [];
    }
  }

  /**
   * Get a single inspection by ID
   */
  static async getInspectionById(inspectionId: string): Promise<InspectionDTO | null> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          projects (title, status)
        `)
        .eq('id', inspectionId)
        .single();

      if (error) {
        console.error('Error fetching inspection:', error);
        throw error;
      }

      return data as InspectionDTO;
    } catch (error) {
      console.error('InspectionService.getInspectionById error:', error);
      return null;
    }
  }

  /**
   * Create a new inspection
   */
  static async createInspection(inspection: CreateInspectionDTO): Promise<InspectionDTO | null> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .insert({
          project_id: inspection.project_id,
          date: inspection.date,
          inspector: inspection.inspector,
          status: inspection.status || 'scheduled',
          comments: inspection.comments || null,
          progress_at_inspection: inspection.progress_at_inspection || 0,
          phase_id: inspection.phase_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          projects (title, status)
        `)
        .single();

      if (error) {
        console.error('Error creating inspection:', error);
        throw error;
      }

      return data as InspectionDTO;
    } catch (error) {
      console.error('InspectionService.createInspection error:', error);
      return null;
    }
  }

  /**
   * Update an existing inspection
   */
  static async updateInspection(
    inspectionId: string, 
    updates: UpdateInspectionDTO
  ): Promise<InspectionDTO | null> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', inspectionId)
        .select(`
          *,
          projects (title, status)
        `)
        .single();

      if (error) {
        console.error('Error updating inspection:', error);
        throw error;
      }

      return data as InspectionDTO;
    } catch (error) {
      console.error('InspectionService.updateInspection error:', error);
      return null;
    }
  }

  /**
   * Delete an inspection
   */
  static async deleteInspection(inspectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', inspectionId);

      if (error) {
        console.error('Error deleting inspection:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('InspectionService.deleteInspection error:', error);
      return false;
    }
  }

  /**
   * Get inspections count by status for a supplier
   */
  static async getInspectionStats(supplierId: string): Promise<Record<string, number>> {
    try {
      const inspections = await this.getInspectionsForSupplier(supplierId);
      
      const stats = inspections.reduce((acc, inspection) => {
        const status = inspection.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return stats;
    } catch (error) {
      console.error('InspectionService.getInspectionStats error:', error);
      return {};
    }
  }
}
