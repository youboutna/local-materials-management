// Create Inspection Request Use Case
import { supabase } from '@/integrations/supabase/client';

export interface InspectionRequestInput {
  projectId: string;
  phaseId?: string;
  stepId?: string;
  inspectionType: string;
  requestedDate?: string;
  requestedBy?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface InspectionRequestResult {
  success: boolean;
  inspectionId?: string;
  message: string;
}

export class CreateInspectionRequestUseCase {
  async execute(input: InspectionRequestInput): Promise<InspectionRequestResult> {
    try {
      // Validate project exists
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, title, status')
        .eq('id', input.projectId)
        .single();

      if (projectError || !project) {
        return {
          success: false,
          message: 'Projet non trouvé'
        };
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create inspection request
      const { data: inspection, error: insertError } = await supabase
        .from('inspections')
        .insert({
          project_id: input.projectId,
          phase_id: input.phaseId,
          inspector: input.requestedBy || user?.id || 'unknown',
          date: input.requestedDate || new Date().toISOString(),
          status: 'scheduled',
          progress_at_inspection: 0,
          comments: input.notes,
          payment_type: input.inspectionType
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating inspection request:', insertError);
        return {
          success: false,
          message: `Erreur lors de la création: ${insertError.message}`
        };
      }

      return {
        success: true,
        inspectionId: inspection.id,
        message: 'Demande d\'inspection créée avec succès'
      };
    } catch (error) {
      console.error('CreateInspectionRequestUseCase error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
}
