/**
 * InspectionWorkflowService - Service de gestion des workflows d'inspection
 * Gère les transitions entre les états: request → schedule → execute → complete
 */

import { supabase } from '@/integrations/supabase/client';

export type InspectionWorkflowStatus = 
  | 'requested'      // Demandé par chef de projet
  | 'scheduled'      // Programmé par responsable technique
  | 'in_progress'    // En cours de réalisation
  | 'completed'      // Terminé avec documents
  | 'approved'       // Validé par ingénieur conseil
  | 'rejected'       // Rejeté, nécessite reprise
  | 'requires_changes'; // Modifications requises

export type InspectionDocumentType = 
  | 'pv_service_fait'
  | 'pv_main_levee'
  | 'photos'
  | 'geolocation'
  | 'rapport_final'
  | 'decompte'
  | 'attachement';

export interface RequiredDocument {
  type: InspectionDocumentType;
  label: string;
  required: boolean;
  minCount?: number;
  maxCount?: number;
  acceptedFormats?: string[];
}

export interface WorkflowTransition {
  from: InspectionWorkflowStatus;
  to: InspectionWorkflowStatus;
  requiredRole: string[];
  requiredDocuments?: InspectionDocumentType[];
  requiresApproval?: boolean;
}

export interface InspectionRequest {
  project_id: string;
  phase_id?: string;
  step_id?: string;
  inspection_type: string;
  requested_by: string;
  requested_date: string;
  proposed_dates?: string[];
  priority?: 'low' | 'medium' | 'high';
  requirements?: string;
  required_documents?: InspectionDocumentType[];
}

export interface InspectionSchedule extends InspectionRequest {
  scheduled_by: string;
  scheduled_date: string;
  inspector_id: string;
  inspector_name: string;
  backup_inspector_id?: string;
  estimated_duration_hours?: number;
}

export interface InspectionExecution {
  inspection_id: string;
  executed_by: string;
  execution_date: string;
  progress_at_inspection: number;
  findings?: string;
  recommendations?: string;
  documents: UploadedDocument[];
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface UploadedDocument {
  type: InspectionDocumentType;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
}

// Documents requis par type d'inspection
export const INSPECTION_REQUIRED_DOCUMENTS: Record<string, RequiredDocument[]> = {
  progress: [
    { type: 'pv_service_fait', label: 'PV Service Fait', required: true },
    { type: 'photos', label: 'Photos du chantier', required: true, minCount: 3, maxCount: 20 },
    { type: 'geolocation', label: 'Géolocalisation', required: true },
    { type: 'decompte', label: 'Décompte', required: false },
    { type: 'attachement', label: 'Attachement', required: false },
  ],
  quality: [
    { type: 'pv_service_fait', label: 'PV Service Fait', required: true },
    { type: 'photos', label: 'Photos du chantier', required: true, minCount: 5 },
    { type: 'geolocation', label: 'Géolocalisation', required: true },
    { type: 'rapport_final', label: 'Rapport de contrôle qualité', required: true },
  ],
  final: [
    { type: 'pv_service_fait', label: 'PV Service Fait', required: true },
    { type: 'pv_main_levee', label: 'PV Main Levée', required: true },
    { type: 'photos', label: 'Photos finales', required: true, minCount: 10 },
    { type: 'geolocation', label: 'Géolocalisation', required: true },
    { type: 'rapport_final', label: 'Rapport Final', required: true },
    { type: 'decompte', label: 'Décompte Final', required: true },
  ],
  safety: [
    { type: 'pv_service_fait', label: 'PV Service Fait', required: true },
    { type: 'photos', label: 'Photos', required: true, minCount: 3 },
    { type: 'geolocation', label: 'Géolocalisation', required: true },
  ],
  compliance: [
    { type: 'pv_service_fait', label: 'PV Conformité', required: true },
    { type: 'photos', label: 'Photos', required: true, minCount: 3 },
    { type: 'geolocation', label: 'Géolocalisation', required: true },
    { type: 'rapport_final', label: 'Rapport de conformité', required: true },
  ],
  materials: [
    { type: 'pv_service_fait', label: 'PV Contrôle Matériaux', required: true },
    { type: 'photos', label: 'Photos matériaux', required: true, minCount: 5 },
  ],
  structural: [
    { type: 'pv_service_fait', label: 'PV Contrôle Structurel', required: true },
    { type: 'photos', label: 'Photos structure', required: true, minCount: 5 },
    { type: 'rapport_final', label: 'Rapport structurel', required: true },
  ],
};

// Transitions valides dans le workflow
const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // Demande → Programmation
  {
    from: 'requested',
    to: 'scheduled',
    requiredRole: ['admin', 'project_manager', 'technical_manager', 'engineering_consultant'],
  },
  // Programmation → En cours
  {
    from: 'scheduled',
    to: 'in_progress',
    requiredRole: ['admin', 'inspector', 'technical_manager', 'engineering_consultant', 'supervisor'],
  },
  // En cours → Terminé
  {
    from: 'in_progress',
    to: 'completed',
    requiredRole: ['admin', 'inspector', 'technical_manager', 'engineering_consultant'],
    requiredDocuments: ['pv_service_fait', 'photos', 'geolocation'],
  },
  // Terminé → Approuvé
  {
    from: 'completed',
    to: 'approved',
    requiredRole: ['admin', 'engineering_consultant', 'project_manager'],
    requiresApproval: true,
  },
  // Terminé → Modifications requises
  {
    from: 'completed',
    to: 'requires_changes',
    requiredRole: ['admin', 'engineering_consultant', 'project_manager'],
  },
  // Modifications requises → En cours (reprise)
  {
    from: 'requires_changes',
    to: 'in_progress',
    requiredRole: ['admin', 'inspector', 'technical_manager'],
  },
  // Terminé → Rejeté
  {
    from: 'completed',
    to: 'rejected',
    requiredRole: ['admin', 'engineering_consultant', 'director'],
  },
];

export class InspectionWorkflowService {

  /**
   * Récupère les documents requis pour un type d'inspection
   */
  static getRequiredDocuments(inspectionType: string): RequiredDocument[] {
    return INSPECTION_REQUIRED_DOCUMENTS[inspectionType] || INSPECTION_REQUIRED_DOCUMENTS.progress;
  }

  /**
   * Vérifie si une transition est valide
   */
  static canTransition(
    currentStatus: InspectionWorkflowStatus,
    targetStatus: InspectionWorkflowStatus,
    userRole: string,
    uploadedDocuments?: InspectionDocumentType[]
  ): { allowed: boolean; reason?: string } {
    const transition = WORKFLOW_TRANSITIONS.find(
      t => t.from === currentStatus && t.to === targetStatus
    );

    if (!transition) {
      return { allowed: false, reason: `Transition de "${currentStatus}" vers "${targetStatus}" non autorisée` };
    }

    if (!transition.requiredRole.includes(userRole)) {
      return { allowed: false, reason: `Votre rôle "${userRole}" n'est pas autorisé pour cette action` };
    }

    if (transition.requiredDocuments && uploadedDocuments) {
      const missingDocs = transition.requiredDocuments.filter(
        doc => !uploadedDocuments.includes(doc)
      );
      if (missingDocs.length > 0) {
        return { 
          allowed: false, 
          reason: `Documents manquants: ${missingDocs.join(', ')}` 
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Crée une demande d'inspection
   */
  static async createInspectionRequest(request: InspectionRequest): Promise<{ success: boolean; inspectionId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .insert({
          project_id: request.project_id,
          phase_id: request.phase_id,
          date: request.requested_date,
          status: 'scheduled', // Map to existing status
          inspector: request.requested_by,
          payment_type: request.inspection_type,
          progress_at_inspection: 0,
          comments: request.requirements || '',
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, inspectionId: data.id || undefined };
    } catch (error) {
      console.error('[InspectionWorkflowService] Error creating request:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Programme une inspection (transition: requested → scheduled)
   */
  static async scheduleInspection(schedule: InspectionSchedule): Promise<{ success: boolean; inspectionId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .insert({
          project_id: schedule.project_id,
          phase_id: schedule.phase_id,
          date: schedule.scheduled_date,
          status: 'scheduled',
          inspector: schedule.inspector_name,
          payment_type: schedule.inspection_type,
          progress_at_inspection: 0,
          comments: schedule.requirements || '',
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, inspectionId: data.id || undefined };
    } catch (error) {
      console.error('[InspectionWorkflowService] Error scheduling:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Démarre une inspection (transition: scheduled → in_progress)
   */
  static async startInspection(inspectionId: string, executorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('[InspectionWorkflowService] Error starting inspection:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Complète une inspection avec les documents
   */
  static async completeInspection(
    inspectionId: string,
    execution: InspectionExecution
  ): Promise<{ success: boolean; error?: string; triggerPayment?: boolean }> {
    try {
      // Convert documents to JSON-compatible format
      const documentsJson = {
        files: execution.documents.map(doc => ({
          type: doc.type,
          file_url: doc.file_url,
          file_name: doc.file_name,
          file_size: doc.file_size,
          mime_type: doc.mime_type,
          uploaded_at: doc.uploaded_at,
        })),
        geolocation: execution.geolocation ? {
          latitude: execution.geolocation.latitude,
          longitude: execution.geolocation.longitude,
          accuracy: execution.geolocation.accuracy,
        } : null,
        recommendations: execution.recommendations || null,
      };

      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'approved',
          progress_at_inspection: execution.progress_at_inspection,
          comments: execution.findings || '',
          documents: documentsJson,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId);

      if (error) throw error;

      // Trigger payment workflow if progress threshold met
      const triggerPayment = execution.progress_at_inspection >= 25; // 25% threshold

      return { success: true, triggerPayment };
    } catch (error) {
      console.error('[InspectionWorkflowService] Error completing inspection:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Approuve une inspection
   */
  static async approveInspection(
    inspectionId: string,
    approverId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'approved',
          comments: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('[InspectionWorkflowService] Error approving inspection:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Rejette une inspection avec motif
   */
  static async rejectInspection(
    inspectionId: string,
    rejecterId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'rejected',
          comments: `REJETÉ: ${reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('[InspectionWorkflowService] Error rejecting inspection:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Demande des modifications
   */
  static async requestChanges(
    inspectionId: string,
    requesterId: string,
    changes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'requires_changes',
          comments: `MODIFICATIONS REQUISES: ${changes}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('[InspectionWorkflowService] Error requesting changes:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Récupère l'historique du workflow pour une inspection
   */
  static async getWorkflowHistory(inspectionId: string): Promise<any[]> {
    // For now, return empty array - would need audit log table
    return [];
  }
}
