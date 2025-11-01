import { supabase } from '@/integrations/supabase/client';
import { InspectionDTO, CreateInspectionDTO, UpdateInspectionDTO } from '@/types/inspection.dto';
import { InspectionRepository } from './InspectionRepository';
import { EntityToDTOMapper } from './EntityToDTOMapper';

/**
 * Service for managing inspections with proper separation of concerns
 * Uses repository pattern and DTO mapping
 */
export class InspectionService {
  private static repository = new InspectionRepository();
  /**
   * Get all inspections for a specific supplier with project info
   * Fetches inspections from projects where the supplier is a stakeholder
   */
  static async getInspectionsForSupplier(supplierId: string): Promise<InspectionDTO[]> {
    try {
      console.log('[InspectionService] Getting inspections for supplier:', supplierId);
      
      const entities = await this.repository.findBySupplierId(supplierId);
      
      // Fetch project info for each inspection
      const inspectionsWithProject = await Promise.all(
        entities.map(async (entity) => {
          const { data: projectData } = await supabase
            .from('projects')
            .select('title, status')
            .eq('id', entity.project_id)
            .maybeSingle();
          
          return EntityToDTOMapper.inspectionEntityToDTOWithProject(
            entity,
            projectData ? { title: projectData.title, status: projectData.status } : undefined
          );
        })
      );

      console.log('[InspectionService] Successfully fetched inspections:', inspectionsWithProject);
      return inspectionsWithProject;
    } catch (error) {
      console.error('[InspectionService] getInspectionsForSupplier error:', error);
      return [];
    }
  }

  /**
   * Get all inspections for a specific project with project info
   */
  static async getInspectionsByProject(projectId: string): Promise<InspectionDTO[]> {
    try {
      const entities = await this.repository.findByProjectId(projectId);
      
      const { data: projectData } = await supabase
        .from('projects')
        .select('title, status')
        .eq('id', projectId)
        .maybeSingle();

      return entities.map(entity => 
        EntityToDTOMapper.inspectionEntityToDTOWithProject(
          entity,
          projectData ? { title: projectData.title, status: projectData.status } : undefined
        )
      );
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
      return await this.repository.getStatsBySupplierId(supplierId);
    } catch (error) {
      console.error('InspectionService.getInspectionStats error:', error);
      return {};
    }
  }
}
