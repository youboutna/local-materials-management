// Schedule Inspection Use Case
import { supabase } from '@/integrations/supabase/client';

export interface ScheduleInspectionInput {
  inspectionId?: string;
  projectId: string;
  phaseId?: string;
  stepId?: string;
  inspectionType: string;
  scheduledDate: string;
  scheduledTime?: string;
  assignedInspectorId?: string;
  assignedInspectorName: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration?: number; // minutes
  notes?: string;
  requiredDocuments?: string[];
}

export interface ScheduleInspectionResult {
  success: boolean;
  inspectionId?: string;
  message: string;
}

export class ScheduleInspectionUseCase {
  async execute(input: ScheduleInspectionInput): Promise<ScheduleInspectionResult> {
    try {
      // Validate project exists
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, title, status, budget, progress')
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

      // Build the full datetime
      const scheduledDateTime = input.scheduledTime 
        ? `${input.scheduledDate}T${input.scheduledTime}:00`
        : input.scheduledDate;

      if (input.inspectionId) {
        // Update existing inspection
        const { data: inspection, error: updateError } = await supabase
          .from('inspections')
          .update({
            inspector: input.assignedInspectorName,
            date: scheduledDateTime,
            status: 'scheduled',
            comments: input.notes,
            payment_type: input.inspectionType,
            documents: input.requiredDocuments ? { required: input.requiredDocuments } : null
          })
          .eq('id', input.inspectionId)
          .select()
          .single();

        if (updateError) {
          console.error('Error scheduling inspection:', updateError);
          return {
            success: false,
            message: `Erreur lors de la programmation: ${updateError.message}`
          };
        }

        return {
          success: true,
          inspectionId: inspection.id,
          message: 'Inspection programmée avec succès'
        };
      } else {
        // Create new scheduled inspection
        const { data: inspection, error: insertError } = await supabase
          .from('inspections')
          .insert({
            project_id: input.projectId,
            phase_id: input.phaseId,
            inspector: input.assignedInspectorName,
            date: scheduledDateTime,
            status: 'scheduled',
            progress_at_inspection: project.progress || 0,
            comments: input.notes,
            payment_type: input.inspectionType,
            documents: input.requiredDocuments ? { required: input.requiredDocuments } : null
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating scheduled inspection:', insertError);
          return {
            success: false,
            message: `Erreur lors de la création: ${insertError.message}`
          };
        }

        return {
          success: true,
          inspectionId: inspection.id,
          message: 'Inspection programmée avec succès'
        };
      }
    } catch (error) {
      console.error('ScheduleInspectionUseCase error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
}
