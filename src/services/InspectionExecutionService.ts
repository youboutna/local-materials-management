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
      console.error('[InspectionExecutionService] startInspection error:', error);
      return false;
    }
  }

  /**
   * Get execution data for an inspection
   */
  static async getExecutionData(inspectionId: string): Promise<InspectionExecutionData | null> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('documents')
        .eq('id', inspectionId)
        .single();

      if (error) throw error;
      return (data?.documents as unknown as InspectionExecutionData) || null;
    } catch (error) {
      console.error('[InspectionExecutionService] getExecutionData error:', error);
      return null;
    }
  }

  /**
   * Update execution data
   */
  static async updateExecutionData(
    inspectionId: string,
    data: Partial<InspectionExecutionData>
  ): Promise<boolean> {
    try {
      const existing = await this.getExecutionData(inspectionId);
      const merged = { ...existing, ...data };

      const { error } = await supabase
        .from('inspections')
        .update({
          documents: merged as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[InspectionExecutionService] updateExecutionData error:', error);
      return false;
    }
  }

  /**
   * Add observation to inspection
   */
  static async addObservation(
    inspectionId: string,
    observation: Omit<InspectionObservation, 'id' | 'created_at'>
  ): Promise<string | null> {
    try {
      const existing = await this.getExecutionData(inspectionId);
      if (!existing) return null;

      const newObservation: InspectionObservation = {
        ...observation,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };

      const observations = [...(existing.observations || []), newObservation];
      await this.updateExecutionData(inspectionId, { observations });

      return newObservation.id;
    } catch (error) {
      console.error('[InspectionExecutionService] addObservation error:', error);
      return null;
    }
  }

  /**
   * Upload document/photo for inspection
   */
  static async uploadDocument(
    inspectionId: string,
    projectId: string,
    file: File,
    metadata?: { latitude?: number; longitude?: number; caption?: string }
  ): Promise<InspectionDocument | null> {
    try {
      // Upload to storage
      const filePath = `inspections/${projectId}/${inspectionId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

      const document: InspectionDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'photo' : 
              file.type === 'application/pdf' ? 'scan' : 'report',
        url: publicUrl,
        size: file.size,
        mime_type: file.type,
        metadata: {
          ...metadata,
          captured_at: new Date().toISOString(),
        },
        uploaded_at: new Date().toISOString(),
      };

      // Add to execution data
      const existing = await this.getExecutionData(inspectionId);
      if (existing) {
        const documents = [...(existing.documents || []), document];
        await this.updateExecutionData(inspectionId, { documents });
      }

      // Also create document record
      const user = (await supabase.auth.getUser()).data.user;
      const docInsert: any = {
        title: `Inspection - ${file.name}`,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        document_type: 'inspection_report',
        project_id: projectId,
        inspection_id: inspectionId,
        uploaded_by: user?.id,
        status: 'pending',
        metadata: metadata,
      };
      await supabase.from('documents').insert(docInsert);

      return document;
    } catch (error) {
      console.error('[InspectionExecutionService] uploadDocument error:', error);
      return null;
    }
  }

  /**
   * Get default checklist for inspection type
   */
  static getDefaultChecklist(inspectionType: string): ChecklistItem[] {
    const templateKey = inspectionType.toLowerCase();
    const template = CHECKLIST_TEMPLATES[templateKey] || CHECKLIST_TEMPLATES.technical;
    return template.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      checked: false,
    }));
  }

  /**
   * Update checklist
   */
  static async updateChecklist(
    inspectionId: string,
    checklist: ChecklistItem[]
  ): Promise<boolean> {
    return this.updateExecutionData(inspectionId, { checklist });
  }

  /**
   * Add measurement
   */
  static async addMeasurement(
    inspectionId: string,
    measurement: Omit<InspectionMeasurement, 'id'>
  ): Promise<boolean> {
    try {
      const existing = await this.getExecutionData(inspectionId);
      if (!existing) return false;

      const newMeasurement: InspectionMeasurement = {
        ...measurement,
        id: crypto.randomUUID(),
      };

      const measurements = [...(existing.measurements || []), newMeasurement];
      return this.updateExecutionData(inspectionId, { measurements });
    } catch (error) {
      console.error('[InspectionExecutionService] addMeasurement error:', error);
      return false;
    }
  }

  /**
   * Add participant
   */
  static async addParticipant(
    inspectionId: string,
    participant: Omit<InspectionParticipant, 'id'>
  ): Promise<boolean> {
    try {
      const existing = await this.getExecutionData(inspectionId);
      if (!existing) return false;

      const newParticipant: InspectionParticipant = {
        ...participant,
        id: crypto.randomUUID(),
      };

      const participants = [...(existing.participants || []), newParticipant];
      return this.updateExecutionData(inspectionId, { participants });
    } catch (error) {
      console.error('[InspectionExecutionService] addParticipant error:', error);
      return false;
    }
  }

  /**
   * Complete inspection - finalize execution data
   */
  static async completeInspection(
    inspectionId: string,
    summary: string,
    recommendations: string[],
    overallConformity: ConformityStatus,
    progressPercentage: number
  ): Promise<boolean> {
    try {
      const existing = await this.getExecutionData(inspectionId);
      if (!existing) return false;

      const completionData: Partial<InspectionExecutionData> = {
        completed_at: new Date().toISOString(),
        duration_minutes: existing.started_at 
          ? Math.round((Date.now() - new Date(existing.started_at).getTime()) / 60000)
          : undefined,
        overall_conformity: overallConformity,
        quality_score: this.calculateQualityScore(existing, overallConformity),
        progress_percentage: progressPercentage,
        summary,
        recommendations,
        corrective_actions_required: existing.observations?.some(
          o => o.conformity === 'non_conform' && o.severity === 'critical'
        ) || false,
      };

      await this.updateExecutionData(inspectionId, completionData);

      // Update inspection status
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'completed',
          progress_at_inspection: progressPercentage,
          comments: summary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[InspectionExecutionService] completeInspection error:', error);
      return false;
    }
  }

  /**
   * Calculate quality score based on checklist and observations
   */
  private static calculateQualityScore(
    data: InspectionExecutionData,
    conformity: ConformityStatus
  ): number {
    let score = 50; // Base score

    // Checklist completion
    const checkedCount = data.checklist?.filter(c => c.checked).length || 0;
    const totalChecklist = data.checklist?.length || 1;
    score += (checkedCount / totalChecklist) * 30;

    // Conformity bonus
    if (conformity === 'conform') score += 20;
    else if (conformity === 'partial') score += 10;

    // Deduct for non-conformities
    const nonConformities = data.observations?.filter(o => o.conformity === 'non_conform') || [];
    score -= nonConformities.length * 5;
    score -= nonConformities.filter(o => o.severity === 'critical').length * 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Validate inspection readiness for PV generation
   */
  static validateReadiness(data: InspectionExecutionData): {
    isReady: boolean;
    missing: string[];
  } {
    const missing: string[] = [];

    if (!data.started_at) missing.push('Heure de début');
    if (!data.completed_at) missing.push('Heure de fin');
    if ((data.participants?.length || 0) === 0) missing.push('Participants');
    if ((data.checklist?.length || 0) === 0) missing.push('Checklist');
    if (!data.summary) missing.push('Résumé');
    if ((data.documents?.filter(d => d.type === 'photo').length || 0) === 0) {
      missing.push('Photos (minimum 1)');
    }

    const requiredChecks = data.checklist?.filter(c => c.required && !c.checked) || [];
    if (requiredChecks.length > 0) {
      missing.push(`Points de contrôle obligatoires (${requiredChecks.length})`);
    }

    return {
      isReady: missing.length === 0,
      missing,
    };
  }
}
