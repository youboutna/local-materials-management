// @ts-nocheck
/**
 * InspectionSchedulingService - Service pour la programmation d'inspections
 * Gère la création, validation et notifications des inspections programmées
 */

import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from './NotificationService';
import { InspectionService } from './InspectionService';

export interface InspectionScheduleData {
  project_id: string;
  phase_id?: string | null;
  inspection_type: InspectionType;
  scheduled_date: string;
  scheduled_time?: string;
  estimated_duration_hours: number;
  inspector_id: string;
  inspector_name: string;
  backup_inspector_id?: string | null;
  required_documents: string[];
  validation_criteria?: string;
  priority: 'high' | 'medium' | 'low';
  notify_contractor?: boolean;
  reminders?: {
    seven_days: boolean;
    one_day: boolean;
    two_hours: boolean;
  };
  comments?: string;
}

export type InspectionType = 
  | 'GEOTECH' 
  | 'SAFETY' 
  | 'QUALITY' 
  | 'PROGRESS' 
  | 'FINAL'
  | 'MATERIALS'
  | 'STRUCTURAL'
  | 'COMPLIANCE';

export interface InspectionTypeConfig {
  code: InspectionType;
  name: string;
  duration_hours: number;
  required_documents: string[];
  approval_workflow: string[];
}

export interface AvailabilityCheckResult {
  available: boolean;
  conflicting_inspections?: Array<{
    id: string;
    project_name: string;
    date: string;
    duration: number;
  }>;
  suggested_slots?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Configuration des types d'inspection
export const INSPECTION_TYPES: InspectionTypeConfig[] = [
  {
    code: 'GEOTECH',
    name: 'Étude Géotechnique',
    duration_hours: 4,
    required_documents: ['Plan terrain', 'Rapport géotechnique préliminaire'],
    approval_workflow: ['engineering_consultant', 'project_manager'],
  },
  {
    code: 'SAFETY',
    name: 'Sécurité Chantier',
    duration_hours: 2,
    required_documents: ['Checklist sécurité', 'Registre incidents'],
    approval_workflow: ['safety_officer', 'project_manager'],
  },
  {
    code: 'QUALITY',
    name: 'Contrôle Qualité',
    duration_hours: 3,
    required_documents: ['Normes qualité', 'Fiches techniques matériaux'],
    approval_workflow: ['engineering_consultant', 'project_manager'],
  },
  {
    code: 'PROGRESS',
    name: 'Avancement des Travaux',
    duration_hours: 2,
    required_documents: ['Planning phase', 'Photos avant/après'],
    approval_workflow: ['project_manager'],
  },
  {
    code: 'FINAL',
    name: 'Réception Définitive',
    duration_hours: 6,
    required_documents: ['PV réception provisoire', 'Liste réserves', 'Attestation conformité'],
    approval_workflow: ['engineering_consultant', 'project_manager', 'client'],
  },
  {
    code: 'MATERIALS',
    name: 'Contrôle Matériaux',
    duration_hours: 2,
    required_documents: ['Bons de livraison', 'Certificats conformité'],
    approval_workflow: ['engineering_consultant'],
  },
  {
    code: 'STRUCTURAL',
    name: 'Contrôle Structurel',
    duration_hours: 4,
    required_documents: ['Plans structure', 'Calculs béton armé'],
    approval_workflow: ['engineering_consultant', 'project_manager'],
  },
  {
    code: 'COMPLIANCE',
    name: 'Conformité Réglementaire',
    duration_hours: 3,
    required_documents: ['Permis construction', 'Normes locales'],
    approval_workflow: ['project_manager', 'client'],
  },
];

export class InspectionSchedulingService {
  
  /**
   * Programme une nouvelle inspection
   */
  static async scheduleInspection(data: InspectionScheduleData): Promise<{ success: boolean; inspectionId?: string; error?: string }> {
    try {
      console.log('[InspectionSchedulingService] Scheduling inspection:', data);
      
      // Validation préalable
      const validation = await this.validateScheduleData(data);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Vérifier disponibilité inspecteur
      const availability = await this.checkInspectorAvailability(
        data.inspector_id,
        data.scheduled_date,
        data.estimated_duration_hours
      );
      
      if (!availability.available) {
        return { 
          success: false, 
          error: `Inspecteur non disponible. Conflits: ${availability.conflicting_inspections?.map(c => c.project_name).join(', ')}`
        };
      }

      // Créer l'inspection via InspectionService
      const inspection = await InspectionService.createInspection({
        project_id: data.project_id,
        phase_id: data.phase_id || undefined,
        date: data.scheduled_date,
        inspector: data.inspector_name,
        status: 'scheduled',
        comments: this.buildCommentsFromData(data),
        progress_at_inspection: 0, // Will be updated during inspection
      });

      if (!inspection) {
        return { success: false, error: 'Échec de la création de l\'inspection' };
      }

      // Envoyer notifications
      await this.sendScheduledNotifications(data, inspection.id);

      // Programmer les rappels si demandés
      if (data.reminders) {
        await this.scheduleReminders(inspection.id, data);
      }

      console.log('[InspectionSchedulingService] Inspection scheduled successfully:', inspection.id);
      
      return { success: true, inspectionId: inspection.id };
    } catch (error) {
      console.error('[InspectionSchedulingService] Error scheduling inspection:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }

  /**
   * Vérifie la disponibilité d'un inspecteur
   */
  static async checkInspectorAvailability(
    inspectorId: string,
    date: string,
    durationHours: number
  ): Promise<AvailabilityCheckResult> {
    try {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();

      // Get inspector name
      const { data: employeeData } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', inspectorId)
        .maybeSingle();

      if (!employeeData?.full_name) {
        return { available: true }; // If no employee found, assume available
      }

      const inspectorName = employeeData?.full_name;

      // Check for conflicting inspections
      const { data: existingInspections, error } = await supabase
        .from('inspections')
        .select(`
          id,
          date,
          inspector,
          project_id,
          projects (title)
        `)
        .eq('inspector', inspectorName)
        .gte('date', startOfDay)
        .lte('date', endOfDay)
        .in('status', ['scheduled', 'in_progress']);

      if (error) throw error;

      if (existingInspections && existingInspections.length > 0) {
        return {
          available: false,
          conflicting_inspections: existingInspections.map(insp => ({
            id: insp.id,
            project_name: (insp as any).projects?.title || 'Projet inconnu',
            date: insp.date,
            duration: 2, // Default duration
          })),
          suggested_slots: this.suggestAlternativeSlots(date, durationHours),
        };
      }

      return { available: true };
    } catch (error) {
      console.error('[InspectionSchedulingService] Error checking availability:', error);
      return { available: true }; // Default to available if check fails
    }
  }

  /**
   * Valide les données de programmation
   */
  static async validateScheduleData(data: InspectionScheduleData): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.project_id) errors.push('Projet requis');
    if (!data.inspection_type) errors.push('Type d\'inspection requis');
    if (!data.scheduled_date) errors.push('Date requise');
    if (!data.inspector_id) errors.push('Inspecteur requis');

    // Date validation
    const scheduledDate = new Date(data.scheduled_date);
    const now = new Date();
    if (scheduledDate < now) {
      errors.push('La date doit être dans le futur');
    }

    // Phase date validation
    if (data.phase_id) {
      const { data: phase } = await supabase
        .from('project_phases')
        .select('start_date, end_date, phase_name')
        .eq('id', data.phase_id)
        .single();

      if (phase && phase.start_date && phase.end_date) {
        const phaseStart = new Date(phase.start_date);
        const phaseEnd = new Date(phase.end_date);
        
        if (scheduledDate < phaseStart || scheduledDate > phaseEnd) {
          warnings.push(`La date est hors de la période de la phase "${phase.phase_name}"`);
        }
      }
    }

    // Budget validation (if needed in future)
    // TODO: Implement budget check

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Récupère les templates d'inspection par type de phase
   */
  static getInspectionTemplates(phaseType?: string): InspectionTypeConfig[] {
    // Could filter based on phase type in the future
    return INSPECTION_TYPES;
  }

  /**
   * Récupère la configuration d'un type d'inspection
   */
  static getInspectionTypeConfig(code: InspectionType): InspectionTypeConfig | undefined {
    return INSPECTION_TYPES.find(t => t.code === code);
  }

  /**
   * Construit les commentaires à partir des données
   */
  private static buildCommentsFromData(data: InspectionScheduleData): string {
    const parts: string[] = [];
    
    parts.push(`Type: ${this.getInspectionTypeConfig(data.inspection_type)?.name || data.inspection_type}`);
    parts.push(`Durée estimée: ${data.estimated_duration_hours}h`);
    parts.push(`Priorité: ${data.priority}`);
    
    if (data.validation_criteria) {
      parts.push(`Critères: ${data.validation_criteria}`);
    }
    
    if (data.required_documents.length > 0) {
      parts.push(`Documents requis: ${data.required_documents.join(', ')}`);
    }
    
    if (data.comments) {
      parts.push(`Notes: ${data.comments}`);
    }

    return parts.join(' | ');
  }

  /**
   * Envoie les notifications de programmation
   */
  private static async sendScheduledNotifications(
    data: InspectionScheduleData,
    inspectionId: string
  ): Promise<void> {
    try {
      // Notify inspector
      await NotificationService.createNotification({
        recipient_id: data.inspector_id,
        title: 'Nouvelle inspection assignée',
        message: `Une inspection ${this.getInspectionTypeConfig(data.inspection_type)?.name} a été programmée pour le ${new Date(data.scheduled_date).toLocaleDateString('fr-FR')}.`,
        type: 'inspection_assigned',
        related_id: inspectionId,
        metadata: {
          inspection_type: data.inspection_type,
          scheduled_date: data.scheduled_date,
          project_id: data.project_id,
          phase_id: data.phase_id,
          priority: data.priority,
        },
      });

      // Notify backup inspector if assigned
      if (data.backup_inspector_id) {
        await NotificationService.createNotification({
          recipient_id: data.backup_inspector_id,
          title: 'Inspection assignée (suppléant)',
          message: `Vous êtes désigné comme inspecteur suppléant pour une inspection le ${new Date(data.scheduled_date).toLocaleDateString('fr-FR')}.`,
          type: 'inspection_backup',
          related_id: inspectionId,
          metadata: {
            inspection_type: data.inspection_type,
            scheduled_date: data.scheduled_date,
          },
        });
      }

      // Notify project stakeholders if contractor notification requested
      if (data.notify_contractor) {
        const { data: stakeholders } = await supabase
          .from('project_stakeholders')
          .select('supplier_id')
          .eq('project_id', data.project_id);

        for (const stakeholder of stakeholders || []) {
          const supplierId = stakeholder.supplier_id;
          if (supplierId) {
            await NotificationService.createNotification({
              recipient_id: supplierId,
              title: 'Inspection programmée',
              message: `Une inspection est programmée pour le ${new Date(data.scheduled_date).toLocaleDateString('fr-FR')}. Veuillez préparer les documents requis.`,
              type: 'inspection_scheduled',
              related_id: inspectionId,
            });
          }
        }
      }
    } catch (error) {
      console.error('[InspectionSchedulingService] Error sending notifications:', error);
    }
  }

  /**
   * Programme les rappels automatiques
   */
  private static async scheduleReminders(
    inspectionId: string,
    data: InspectionScheduleData
  ): Promise<void> {
    // In a real implementation, this would create scheduled jobs
    // For now, we just log the intent
    console.log('[InspectionSchedulingService] Scheduling reminders for inspection:', inspectionId, {
      seven_days: data.reminders?.seven_days,
      one_day: data.reminders?.one_day,
      two_hours: data.reminders?.two_hours,
    });
    
    // TODO: Implement actual reminder scheduling via cron or edge functions
  }

  /**
   * Suggère des créneaux alternatifs
   */
  private static suggestAlternativeSlots(date: string, durationHours: number): string[] {
    const baseDate = new Date(date);
    const suggestions: string[] = [];

    // Suggest next 3 days
    for (let i = 1; i <= 3; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + i);
      suggestions.push(nextDate.toISOString());
    }

    return suggestions;
  }
}
