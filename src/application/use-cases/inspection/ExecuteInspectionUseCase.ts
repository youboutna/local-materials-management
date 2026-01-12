// Execute Inspection Use Case
import { supabase } from '@/integrations/supabase/client';

export interface ExecuteInspectionInput {
  inspectionId: string;
  progressAtInspection: number;
  result: 'approved' | 'rejected' | 'requires_changes';
  findings?: string;
  recommendations?: string;
  photos?: string[];
  documents?: {
    type: string;
    url: string;
    name: string;
  }[];
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  signature?: string;
}

export interface ExecuteInspectionResult {
  success: boolean;
  inspectionId?: string;
  message: string;
  canTriggerPayment?: boolean;
}

export class ExecuteInspectionUseCase {
  async execute(input: ExecuteInspectionInput): Promise<ExecuteInspectionResult> {
    try {
      // Get inspection details
      const { data: inspection, error: inspectionError } = await supabase
        .from('inspections')
        .select('*, projects(id, title, budget, progress)')
        .eq('id', input.inspectionId)
        .single();

      if (inspectionError || !inspection) {
        return {
          success: false,
          message: 'Inspection non trouvée'
        };
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Build documents JSON
      const documentsJson = {
        photos: input.photos || [],
        documents: input.documents || [],
        geolocation: input.geolocation,
        signature: input.signature,
        findings: input.findings,
        recommendations: input.recommendations
      };

      // Update inspection with execution data
      const { data: updatedInspection, error: updateError } = await supabase
        .from('inspections')
        .update({
          status: input.result,
          progress_at_inspection: input.progressAtInspection,
          comments: [
            inspection.comments,
            input.findings,
            input.recommendations
          ].filter(Boolean).join('\n---\n'),
          documents: documentsJson,
          updated_at: new Date().toISOString()
        })
        .eq('id', input.inspectionId)
        .select()
        .single();

      if (updateError) {
        console.error('Error executing inspection:', updateError);
        return {
          success: false,
          message: `Erreur lors de l'exécution: ${updateError.message}`
        };
      }

      // Update project progress if inspection is approved
      if (input.result === 'approved') {
        await supabase
          .from('projects')
          .update({ progress: input.progressAtInspection })
          .eq('id', inspection.project_id);
      }

      // Determine if payment can be triggered
      const canTriggerPayment = input.result === 'approved' && input.progressAtInspection >= 25;

      return {
        success: true,
        inspectionId: updatedInspection.id,
        message: this.getResultMessage(input.result),
        canTriggerPayment
      };
    } catch (error) {
      console.error('ExecuteInspectionUseCase error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private getResultMessage(result: string): string {
    switch (result) {
      case 'approved':
        return 'Inspection approuvée avec succès';
      case 'rejected':
        return 'Inspection rejetée';
      case 'requires_changes':
        return 'Inspection nécessite des modifications';
      default:
        return 'Inspection terminée';
    }
  }
}
