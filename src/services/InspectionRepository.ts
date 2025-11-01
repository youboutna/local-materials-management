// Repository pattern for Inspection CRUD operations
import { supabase } from '@/integrations/supabase/client';
import { InspectionEntity } from '@/types/entities';

export class InspectionRepository {
  /**
   * Find inspection by ID
   */
  async findById(id: string): Promise<InspectionEntity | null> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as InspectionEntity | null;
  }

  /**
   * Find all inspections for a specific project
   */
  async findByProjectId(projectId: string): Promise<InspectionEntity[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as InspectionEntity[];
  }

  /**
   * Find inspections by inspector name
   */
  async findByInspector(inspectorName: string): Promise<InspectionEntity[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('inspector', inspectorName)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as InspectionEntity[];
  }

  /**
   * Find inspections for projects where supplier is stakeholder
   */
  async findBySupplierId(supplierId: string): Promise<InspectionEntity[]> {
    // Get projects where this supplier is a stakeholder
    const { data: projectsData, error: projectsError } = await supabase
      .from('project_stakeholders')
      .select('project_id')
      .eq('supplier_id', supplierId)
      .eq('stakeholder_entity_type', 'supplier');

    if (projectsError) throw projectsError;
    
    const projectIds = projectsData?.map(p => p.project_id) || [];

    if (projectIds.length === 0) {
      return [];
    }

    // Get inspections for those projects
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .in('project_id', projectIds)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as InspectionEntity[];
  }

  /**
   * Create new inspection
   */
  async create(inspectionData: Omit<InspectionEntity, 'id' | 'created_at' | 'updated_at'>): Promise<InspectionEntity> {
    const { data, error } = await supabase
      .from('inspections')
      .insert({
        ...inspectionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as InspectionEntity;
  }

  /**
   * Update inspection
   */
  async update(id: string, inspectionData: Partial<InspectionEntity>): Promise<InspectionEntity> {
    const { data, error } = await supabase
      .from('inspections')
      .update({
        ...inspectionData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as InspectionEntity;
  }

  /**
   * Delete inspection
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inspections')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * Get inspections count by status for a supplier
   */
  async getStatsBySupplierId(supplierId: string): Promise<Record<string, number>> {
    const inspections = await this.findBySupplierId(supplierId);
    
    return inspections.reduce((acc, inspection) => {
      const status = inspection.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
