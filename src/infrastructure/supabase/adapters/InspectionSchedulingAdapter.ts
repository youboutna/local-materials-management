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
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export class InspectionSchedulingAdapter implements IInspectionSchedulingRepository {
  
  /**
   * Schedule an inspection
   */
  async scheduleInspection(data: InspectionScheduleData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('inspections')
        .insert({
          project_id: data.projectId || '',
          phase_id: data.phaseId || null,
          date: data.scheduledDate,
          inspector: data.inspectorId,
          comments: data.notes || null,
          status: 'scheduled',
          progress_at_inspection: 0,
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
      const supplierRepository = RepositoryFactory.getSupplierRepository();
      
      // Get suppliers with inspection capabilities
      const suppliers = await supplierRepository.findAll();
      
      const inspectors: AssignableInspector[] = [];
      
      // Process suppliers as potential inspectors
      for (const supplier of suppliers) {
        if (supplier.isActive()) {
          inspectors.push({
            id: supplier.id,
            name: supplier.name,
            email: supplier.email || '',
            role: 'inspector',
            specializations: [],
            type: 'supplier',
            availability: {
              startDate,
              endDate
            }
          });
        }
      }

      return inspectors;
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
        .from('inspections')
        .select('id')
        .eq('inspector_id', inspectorId)
        .eq('scheduled_date', date)
        .in('status', ['scheduled', 'in_progress']);

      if (error) throw error;
      return (data?.length || 0) === 0;
    } catch (error) {
      console.error('Error checking inspector availability:', error);
      throw error;
    }
  }

  /**
   * Get assignable inspectors for inspection type
   */
  async getAssignableInspectors(inspectionType: string): Promise<AssignableInspector[]> {
    try {
      const supplierRepository = RepositoryFactory.getSupplierRepository();
      
      // Get suppliers with inspection capabilities
      const suppliers = await supplierRepository.findAll();
      
      const inspectors: AssignableInspector[] = [];
      
      // Process suppliers as potential inspectors
      for (const supplier of suppliers) {
        if (supplier.isActive()) {
          inspectors.push({
            id: supplier.id,
            name: supplier.name,
            email: supplier.email || '',
            role: 'inspector',
            specializations: [],
            type: 'supplier',
            availability: {
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
            }
          });
        }
      }

      return inspectors;
    } catch (error) {
      console.error('Error getting assignable inspectors:', error);
      throw error;
    }
  }

  /**
   * Get inspection schedule by project
   */
  async getProjectInspectionSchedule(projectId: string): Promise<Array<{
    id: string;
    date: string;
    inspector: string;
    status: string;
    comments: string | null;
    progress_at_inspection: number;
    project_id: string;
    phase_id: string | null;
    created_at: string;
    updated_at: string;
    projects?: {
      title: string;
    } | null;
    project_phases?: {
      phase_name: string;
    } | null;
  }>> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          projects (title),
          project_phases (phase_name)
        `)
        .eq('project_id', projectId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting project inspection schedule:', error);
      throw error;
    }
  }

  /**
   * Get inspection types
   */
  async getInspectionTypes(): Promise<InspectionType[]> {
    try {
      // Return default inspection types since inspection_types table doesn't exist
      const defaultTypes: InspectionType[] = [
        {
          id: 'safety',
          name: 'Inspection de sécurité',
          description: 'Vérification des mesures de sécurité sur le chantier',
          requiresDocuments: true,
          estimatedDuration: 120
        },
        {
          id: 'quality',
          name: 'Contrôle qualité',
          description: 'Vérification de la qualité des travaux',
          requiresDocuments: true,
          estimatedDuration: 90
        },
        {
          id: 'progress',
          name: 'Inspection de progrès',
          description: 'Évaluation de l\'avancement des travaux',
          requiresDocuments: false,
          estimatedDuration: 60
        }
      ];

      return defaultTypes;
    } catch (error) {
      console.error('Error getting inspection types:', error);
      throw error;
    }
  }

  /**
   * Update inspection schedule
   */
  async updateInspectionSchedule(scheduleId: string, updates: Partial<{
    comments?: string | null;
    date?: string;
    inspector?: string;
    status?: string;
    progress_at_inspection?: number;
  }>): Promise<void> {
    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating inspection schedule:', error);
      throw error;
    }
  }

  /**
   * Delete inspection schedule
   */
  async deleteInspectionSchedule(scheduleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting inspection schedule:', error);
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

    if (!data.scheduledTime) {
      errors.push('L\'heure de programmation est requise');
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
