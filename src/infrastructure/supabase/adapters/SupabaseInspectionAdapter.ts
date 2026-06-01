// @ts-nocheck
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { Inspection, InspectionStatus, Document } from '@/domain/entities/Inspection';
import {
  InspectionObservation,
  ChecklistItem
} from '@/dtos/entities/InspectionDTO';

// Database row interface for inspections table
interface InspectionRow {
  id: string;
  project_id: string;
  phase_id?: string;
  step_id?: string;
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: number;
  comments?: string;
  observations?: InspectionObservation[]; // Store as JSON array
  documents: unknown[];
  created_at: string;
  updated_at: string;
}

export class SupabaseInspectionAdapter implements IInspectionRepository {
  private mapToEntity(data: InspectionRow): Inspection {
    // Convert string status to InspectionStatus enum
    const status = Inspection.mapStringToStatus(data.status);

    // Create Inspector object - can be employee, supplier, or external
    // In production, this should query the database to determine inspector type
    // For now, assume inspector string contains type information or lookup is needed
    const inspector: Inspector = {
      id: data.inspector,
      name: data.inspector, // This should be looked up from Employee/Supplier table
      agency: 'SOMELEC',
      type: 'employee', // Default assumption - should be determined by lookup
      employeeId: data.inspector, // If inspector is an employee
      userId: data.inspector // If inspector has a user account
    };

    return Inspection.create({
      id: data.id,
      projectId: data.project_id,
      phaseId: data.phase_id,
      stepId: data.step_id,
      inspector: inspector,
      date: data.date,
      status: status,
      progressAtInspection: data.progress_at_inspection || 0,
      comments: data.comments || undefined,
      progress: data.progress_at_inspection || 0,
      observations: Array.isArray(data.observations) ? data.observations : []
    });
  }

  private mapToRow(inspection: Inspection): Omit<InspectionRow, 'created_at' | 'updated_at'> {
    return {
      id: inspection.id,
      project_id: inspection.projectId || '',
      phase_id: inspection.phaseId || undefined,
      step_id: inspection.stepId || undefined,
      inspector: inspection.inspector.name, // Extract name from Inspector object
      date: inspection.date,
      status: inspection.status.toString().toLowerCase(), // Convert enum to string
      progress_at_inspection: inspection.progressAtInspection,
      comments: inspection.comments || undefined,
      observations: inspection.observations || [], // Store observations as JSON array
      documents: inspection.documents || []
    };
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
    const inspectionData = this.mapToRow(inspection);

    const { error } = await supabase
      .from('inspections')
      .insert([inspectionData]);

    if (error) throw new Error(`Failed to save inspection: ${error.message}`);
  }

  async update(id: string, data: Partial<Inspection>): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.progressAtInspection !== undefined) updateData.progress_at_inspection = data.progressAtInspection;
    if (data.comments !== undefined) updateData.comments = data.comments;
    if (data.documents !== undefined) updateData.documents = data.documents;
    if (data.observations !== undefined) updateData.observations = data.observations;

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

  async create(data: Partial<Inspection>): Promise<Inspection> {
    const inspectionData = this.mapToRow(data as Inspection);

    const { data: inserted, error } = await supabase
      .from('inspections')
      .insert(inspectionData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create inspection: ${error.message}`);
    return this.mapToEntity(inserted);
  }

  async addDocument(document: { inspectionId: string; document: Document; uploadedAt: string; uploadedBy: string }): Promise<void> {
    const { supabase: publicClient } = await import('@/integrations/supabase/client');
    const doc = document.document as unknown as Record<string, unknown>;
    const { error } = await publicClient
      .from('inspection_documents' as any)
      .insert({
        inspection_id: document.inspectionId,
        document_id: (doc.id as string) ?? null,
        document_name: (doc.name as string) ?? 'document',
        document_url: (doc.url as string) ?? '',
        document_type: (doc.type as string) ?? null,
        file_size: (doc.size as number) ?? null,
        uploaded_by: document.uploadedBy,
        uploaded_at: document.uploadedAt,
        metadata: doc,
      } as any);
    if (error) throw new Error(`Failed to add inspection document: ${error.message}`);
  }

  async findDocumentsByInspectionId(inspectionId: string): Promise<Document[]> {
    const { supabase: publicClient } = await import('@/integrations/supabase/client');
    const { data, error } = await publicClient
      .from('inspection_documents' as any)
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('uploaded_at', { ascending: false });
    if (error) {
      console.error('findDocumentsByInspectionId failed:', error);
      return [];
    }
    return ((data ?? []) as any[]).map((row) => ({
      id: row.document_id ?? row.id,
      name: row.document_name,
      url: row.document_url,
      type: row.document_type ?? 'application/octet-stream',
      size: row.file_size ?? 0,
      uploadedAt: row.uploaded_at,
      uploadedBy: row.uploaded_by,
    })) as unknown as Document[];
  }

  async getChecklistTemplate(inspectionType: string): Promise<ChecklistItem[]> {
    // For now, return a basic checklist template based on inspection type
    // In a real implementation, this would fetch from a checklist_templates table
    const templates: Record<string, ChecklistItem[]> = {
      'foundation': [
        { id: '1', title: 'Foundation Excavation', description: 'Check foundation excavation depth and alignment', required: true, completed: false },
        { id: '2', title: 'Rebar Installation', description: 'Verify rebar placement and tying', required: true, completed: false },
        { id: '3', title: 'Formwork Quality', description: 'Inspect formwork for proper alignment and stability', required: true, completed: false }
      ],
      'structural': [
        { id: '1', title: 'Column Alignment', description: 'Check column verticality and alignment', required: true, completed: false },
        { id: '2', title: 'Beam Level', description: 'Verify beam level and camber', required: true, completed: false },
        { id: '3', title: 'Concrete Quality', description: 'Inspect concrete mix and curing', required: true, completed: false }
      ],
      'finishing': [
        { id: '1', title: 'Paint Quality', description: 'Check paint application and coverage', required: false, completed: false },
        { id: '2', title: 'Tile Installation', description: 'Verify tile alignment and grout quality', required: false, completed: false },
        { id: '3', title: 'Fixture Installation', description: 'Inspect fixture mounting and functionality', required: true, completed: false }
      ]
    };

    return templates[inspectionType] || [
      { id: '1', title: 'General Inspection', description: 'Perform general quality inspection', required: true, completed: false }
    ];
  }
}
