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

/**
 * Service for managing inspection execution on the field
 */
export class InspectionExecutionService {
  
  /**
   * Start an inspection - records start time and location
   */
  static async startInspection(
    inspectionId: string,
    location?: { latitude: number; longitude: number; address?: string }
  ): Promise<boolean> {
    try {
      const executionData: Partial<InspectionExecutionData> = {
        started_at: new Date().toISOString(),
        location: location ? {
          ...location,
          captured_at: new Date().toISOString(),
        } : undefined,
        observations: [],
        documents: [],
        checklist: [],
        measurements: [],
        participants: [],
        overall_conformity: 'partial',
        progress_percentage: 0,
        summary: '',
        recommendations: [],
        corrective_actions_required: false,
      };

      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'in_progress',
          documents: executionData as any,
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

  /**
   * Add observation to inspection
   */
  static async addObservation(
    inspectionId: string,
    observation: Omit<InspectionObservation, 'id' | 'created_at'>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inspection_observations')
        .insert({
          ...observation,
          inspection_id: inspectionId,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding observation:', error);
      return false;
    }
  }

  /**
   * Add document to inspection
   */
  static async addDocument(
    inspectionId: string,
    document: Omit<InspectionDocument, 'id' | 'created_at'>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inspection_documents')
        .insert({
          ...document,
          inspection_id: inspectionId,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding document:', error);
      return false;
    }
  }

  /**
   * Update checklist item
   */
  static async updateChecklistItem(
    inspectionId: string,
    itemId: string,
    updates: Partial<ChecklistItem>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inspection_checklist')
        .update(updates)
        .eq('id', itemId)
        .eq('inspection_id', inspectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating checklist item:', error);
      return false;
    }
  }

  /**
   * Add measurement to inspection
   */
  static async addMeasurement(
    inspectionId: string,
    measurement: Omit<InspectionMeasurement, 'id' | 'created_at'>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inspection_measurements')
        .insert({
          ...measurement,
          inspection_id: inspectionId,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding measurement:', error);
      return false;
    }
  }

  /**
   * Add participant to inspection
   */
  static async addParticipant(
    inspectionId: string,
    participant: Omit<InspectionParticipant, 'id' | 'created_at'>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inspection_participants')
        .insert({
          ...participant,
          inspection_id: inspectionId,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding participant:', error);
      return false;
    }
  }

  /**
   * Complete inspection - sets final status and conformity
   */
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
          overall_conformity: finalData.overall_conformity,
          progress_percentage: finalData.progress_percentage,
          summary: finalData.summary,
          recommendations: finalData.recommendations,
          corrective_actions_required: finalData.corrective_actions_required,
          completed_at: new Date().toISOString(),
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

  /**
   * Get inspection execution data
   */
  static async getInspectionExecution(inspectionId: string): Promise<InspectionExecutionData | null> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('documents')
        .eq('id', inspectionId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return data.documents as InspectionExecutionData;
    } catch (error) {
      console.error('Error fetching inspection execution:', error);
      return null;
    }
  }

  /**
   * Get checklist template for inspection type
   */
  static getChecklistTemplate(inspectionType: string): ChecklistItem[] {
    return CHECKLIST_TEMPLATES[inspectionType as keyof typeof CHECKLIST_TEMPLATES] || [];
  }

  /**
   * Get all observations for inspection
   */
  static async getInspectionObservations(inspectionId: string): Promise<InspectionObservation[]> {
    try {
      const { data, error } = await supabase
        .from('inspection_observations')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching observations:', error);
      return [];
    }
  }

  /**
   * Get all documents for inspection
   */
  static async getInspectionDocuments(inspectionId: string): Promise<InspectionDocument[]> {
    try {
      const { data, error } = await supabase
        .from('inspection_documents')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }
}
