// Supabase Adapter for Inspection Repository
import { supabase } from '@/integrations/supabase/client';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { Inspection, InspectionStatus } from '@/domain/entities/Inspection';

export class SupabaseInspectionAdapter implements IInspectionRepository {
  private mapToEntity(data: any): Inspection {
    return new Inspection(
      data.id,
      data.project_id,
      data.phase_id || null,
      data.step_id || null,
      data.inspector,
      data.date,
      data.status as InspectionStatus,
      data.progress_at_inspection || 0,
      data.comments || null,
      Array.isArray(data.documents) ? data.documents : [],
      data.created_at,
      data.updated_at
    );
  }

  async findById(id: string): Promise<Inspection | null> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .order('date', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async save(inspection: Inspection): Promise<void> {
    const { error } = await supabase
      .from('inspections')
      .insert([{
        id: inspection.id,
        project_id: inspection.projectId,
        phase_id: inspection.phaseId,
        inspector: inspection.inspector,
        date: inspection.date,
        status: inspection.status,
        progress_at_inspection: inspection.progressAtInspection,
        comments: inspection.comments,
        documents: inspection.documents as any
      }]);

    if (error) throw new Error(`Failed to save inspection: ${error.message}`);
  }

  async update(id: string, data: Partial<Inspection>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.progressAtInspection !== undefined) updateData.progress_at_inspection = data.progressAtInspection;
    if (data.comments !== undefined) updateData.comments = data.comments;
    if (data.documents !== undefined) updateData.documents = data.documents;

    const { error } = await supabase
      .from('inspections')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(`Failed to update inspection: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inspections')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete inspection: ${error.message}`);
  }

  async findByProjectId(projectId: string): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByPhaseId(phaseId: string): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('phase_id', phaseId)
      .order('date', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByStepId(stepId: string): Promise<Inspection[]> {
    // Inspections don't have step_id in current schema - return empty for now
    // This could be extended to filter by metadata/documents if needed
    return [];
  }

  async findByStatus(status: InspectionStatus): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('status', status)
      .order('date', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByInspector(inspectorId: string): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('inspector', inspectorId)
      .order('date', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findScheduledBetween(startDate: string, endDate: string): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findUpcoming(days: number): Promise<Inspection[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .gte('date', now.toISOString())
      .lte('date', futureDate.toISOString())
      .in('status', ['scheduled', 'requested'])
      .order('date', { ascending: true });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findOverdue(): Promise<Inspection[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .lt('date', now)
      .in('status', ['scheduled', 'requested', 'in_progress'])
      .order('date', { ascending: false });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async countByStatus(projectId: string): Promise<Record<InspectionStatus, number>> {
    const { data, error } = await supabase
      .from('inspections')
      .select('status')
      .eq('project_id', projectId);

    if (error || !data) {
      return {} as Record<InspectionStatus, number>;
    }

    const counts: Record<string, number> = {};
    data.forEach(d => {
      counts[d.status] = (counts[d.status] || 0) + 1;
    });

    return counts as Record<InspectionStatus, number>;
  }

  async getAverageCompletionTime(projectId: string): Promise<number> {
    // This would need a more complex query or calculation
    return 0;
  }
}
