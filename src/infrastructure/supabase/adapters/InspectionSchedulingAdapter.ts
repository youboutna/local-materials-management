/**
 * Inspection Scheduling Adapter - Supabase Implementation
 * Implements IInspectionSchedulingRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  IInspectionSchedulingRepository, 
  InspectionScheduleData, 
  InspectionType, 
  AssignableInspector 
} from '@/domain/repositories/IInspectionSchedulingRepository';

export class InspectionSchedulingAdapter implements IInspectionSchedulingRepository {
  
  /**
   * Schedule an inspection
   */
  async scheduleInspection(data: InspectionScheduleData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inspection_schedules')
        .insert({
          inspection_id: data.inspectionId,
          scheduled_date: data.scheduledDate,
          scheduled_time: data.scheduledTime,
          estimated_duration: data.estimatedDuration,
          inspector_id: data.inspectorId,
          backup_inspector_id: data.backupInspectorId,
          required_documents: data.requiredDocuments,
          notes: data.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      throw error;
    }
  }

  /**
   * Get available inspectors for date range
   */
  async getAvailableInspectors(startDate: string, endDate: string): Promise<AssignableInspector[]> {
    try {
      const { data, error } = await supabase
        .from('inspectors')
        .select('*')
        .eq('status', 'active')
        .gte('availability_start_date', startDate)
        .lte('availability_end_date', endDate);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting available inspectors:', error);
      throw error;
    }
  }

  /**
   * Check inspector availability
   */
  async checkInspectorAvailability(inspectorId: string, date: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('inspector_availability')
        .select('*')
        .eq('inspector_id', inspectorId)
        .eq('date', date)
        .single();

      if (error) throw error;
      return data?.is_available || false;
    } catch (error) {
      console.error('Error checking inspector availability:', error);
      throw error;
    }
  }

  /**
   * Get inspection types
   */
  async getInspectionTypes(): Promise<InspectionType[]> {
    try {
      const { data, error } = await supabase
        .from('inspection_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting inspection types:', error);
      throw error;
    }
  }

  /**
   * Validate inspection schedule data
   */
  validateScheduleData(data: Partial<InspectionScheduleData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.scheduledDate) {
      errors.push('La date de programmation est requise');
    }

    if (!data.inspectorId) {
      errors.push('L\'inspecteur est requis');
    }

    if (data.estimatedDuration && data.estimatedDuration <= 0) {
      errors.push('La durée estimée doit être positive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
