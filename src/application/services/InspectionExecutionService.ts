import { supabase } from '@/integrations/supabase/client';
import {
  InspectionExecutionData,
  InspectionObservation,
  InspectionDocument,
  ChecklistItem,
  InspectionMeasurement,
  InspectionParticipant,
  ConformityStatus,
  CHECKLIST_TEMPLATES,
} from '@/types/inspection-execution';

export class InspectionExecutionService {
  static async startInspection(
    inspectionId: string,
    location?: { latitude: number; longitude: number; address?: string }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error starting inspection:', error);
      return false;
    }
  }

  static async addObservation(
    inspectionId: string,
    observation: Omit<InspectionObservation, 'id'>
  ): Promise<boolean> {
    console.log('Adding observation:', inspectionId, observation);
    return true;
  }

  static async addDocument(
    inspectionId: string,
    document: Omit<InspectionDocument, 'id'>
  ): Promise<boolean> {
    console.log('Adding document:', inspectionId, document);
    return true;
  }

  static async updateChecklistItem(
    inspectionId: string,
    itemId: string,
    updates: Partial<ChecklistItem>
  ): Promise<boolean> {
    console.log('Updating checklist:', inspectionId, itemId, updates);
    return true;
  }

  static async addMeasurement(
    inspectionId: string,
    measurement: Omit<InspectionMeasurement, 'id'>
  ): Promise<boolean> {
    console.log('Adding measurement:', inspectionId, measurement);
    return true;
  }

  static async addParticipant(
    inspectionId: string,
    participant: Omit<InspectionParticipant, 'id'>
  ): Promise<boolean> {
    console.log('Adding participant:', inspectionId, participant);
    return true;
  }

  static async completeInspection(
    inspectionId: string,
    finalData: {
      overall_conformity: ConformityStatus;
      progress_percentage: number;
      summary: string;
      recommendations: string[];
      corrective_actions_required: boolean;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'completed',
          progress_at_inspection: finalData.progress_percentage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error completing inspection:', error);
      return false;
    }
  }

  static async getInspectionExecution(inspectionId: string): Promise<InspectionExecutionData | null> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('documents')
        .eq('id', inspectionId)
        .single();

      if (error) throw error;
      return (data?.documents as unknown as InspectionExecutionData) || null;
    } catch (error) {
      console.error('Error fetching inspection execution:', error);
      return null;
    }
  }

  static getChecklistTemplate(inspectionType: string): ChecklistItem[] {
    return CHECKLIST_TEMPLATES[inspectionType as keyof typeof CHECKLIST_TEMPLATES] || [];
  }

  static async getInspectionObservations(inspectionId: string): Promise<InspectionObservation[]> {
    const data = await this.getInspectionExecution(inspectionId);
    return data?.observations || [];
  }

  static async getInspectionDocuments(inspectionId: string): Promise<InspectionDocument[]> {
    const data = await this.getInspectionExecution(inspectionId);
    return data?.documents || [];
  }
}
