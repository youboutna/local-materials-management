// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from './NotificationService';

export interface InspectionData {
  id?: string;
  projectId: string;
  inspectorId: string;
  inspectionType: 'daily' | 'weekly' | 'milestone' | 'safety' | 'quality';
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'failed';
  scheduledDate: string;
  completedDate?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  findings: {
    photos: string[];
    notes: string;
    defects: Array<{
      category: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      correctionRequired: boolean;
    }>;
    complianceChecks: Array<{
      standard: string;
      passed: boolean;
      notes?: string;
    }>;
  };
  consultantApproval?: {
    approved: boolean;
    approvedBy: string;
    approvalDate: string;
    comments?: string;
  };
}

export interface ComplianceAlert {
  projectId: string;
  inspectionId: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  correctionDeadline: string;
  recurringViolation: boolean;
  violationCount: number;
}

// Mandatory inspection fields for quality control
export const MANDATORY_INSPECTION_FIELDS = {
  safety: ['safety_equipment_check', 'site_security', 'worker_training'],
  quality: ['material_compliance', 'workmanship_standard', 'specification_adherence'],
  progress: ['work_completion_percentage', 'milestone_achievement', 'schedule_adherence'],
  environmental: ['waste_management', 'noise_levels', 'environmental_impact']
};

export const createDigitalInspection = async (inspectionData: InspectionData): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('inspections')
      .insert({
        project_id: inspectionData.projectId,
        inspector: inspectionData.inspectorId,
        date: inspectionData.scheduledDate,
        status: inspectionData.status,
        progress_at_inspection: 0, // Will be updated during inspection
        comments: JSON.stringify(inspectionData.findings),
        documents: {
          location: inspectionData.location,
          inspection_type: inspectionData.inspectionType,
          mandatory_checks: MANDATORY_INSPECTION_FIELDS[inspectionData.inspectionType] || [],
          findings: inspectionData.findings
        }
      })
      .select()
      .single();

    if (error) throw error;

    // Notify relevant stakeholders
    await notifyInspectionScheduled(data.id, inspectionData);

    return data.id;
  } catch (error) {
    console.error('Error creating digital inspection:', error);
    throw error;
  }
};

export const detectOverdueInspections = async (): Promise<any[]> => {
  try {
    const currentDate = new Date().toISOString();
    
    const { data: overdueInspections, error } = await supabase
      .from('inspections')
      .select(`
        id,
        project_id,
        inspector,
        date,
        status,
        projects!inner(title)
      `)
      .in('status', ['scheduled', 'in_progress'])
      .lt('date', currentDate);

    if (error) throw error;

    // Send overdue notifications
    for (const inspection of overdueInspections || []) {
      await sendOverdueInspectionAlert(inspection);
    }

    return overdueInspections || [];
  } catch (error) {
    console.error('Error detecting overdue inspections:', error);
    return [];
  }
};

export const validateInspectionCompliance = async (
  inspectionId: string,
  inspectionData: InspectionData
): Promise<ComplianceAlert[]> => {
  const alerts: ComplianceAlert[] = [];

  try {
    // Check for critical defects
    const criticalDefects = inspectionData.findings.defects.filter(
      defect => defect.severity === 'critical'
    );

    if (criticalDefects.length > 0) {
      alerts.push({
        projectId: inspectionData.projectId,
        inspectionId,
        violationType: 'critical_defect',
        severity: 'critical',
        description: `${criticalDefects.length} défaut(s) critique(s) détecté(s)`,
        correctionDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h deadline
        recurringViolation: false,
        violationCount: criticalDefects.length
      });
    }

    // Check compliance failures
    const failedCompliance = inspectionData.findings.complianceChecks.filter(
      check => !check.passed
    );

    if (failedCompliance.length > 0) {
      alerts.push({
        projectId: inspectionData.projectId,
        inspectionId,
        violationType: 'compliance_failure',
        severity: 'high',
        description: `Non-conformité détectée: ${failedCompliance.map(c => c.standard).join(', ')}`,
        correctionDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        recurringViolation: await checkRecurringViolation(inspectionData.projectId, failedCompliance),
        violationCount: failedCompliance.length
      });
    }

    // Send compliance alerts
    for (const alert of alerts) {
      await sendComplianceAlert(alert);
    }

    return alerts;
  } catch (error) {
    console.error('Error validating inspection compliance:', error);
    return alerts;
  }
};

export const submitInspectionForApproval = async (
  inspectionId: string,
  consultantId: string,
  requiresDirectorApproval: boolean = false
): Promise<boolean> => {
  try {
    // Update inspection status
    await supabase
      .from('inspections')
      .update({ 
        status: 'pending_approval',
        updated_at: new Date().toISOString()
      })
      .eq('id', inspectionId);

    // Get inspection details
    const { data: inspection } = await supabase
      .from('inspections')
      .select(`
        *,
        projects!inner(title)
      `)
      .eq('id', inspectionId)
      .single();

    if (!inspection) throw new Error('Inspection not found');

    // Notify consultant for approval
    await NotificationService.createNotification({
      recipient_id: consultantId,
      title: 'Approbation inspection requise',
      message: `Inspection du projet "${inspection.projects.title}" en attente d'approbation.`,
      type: 'inspection_required',
      related_id: inspectionId,
      metadata: {
        related_project_id: inspection.project_id,
        related_inspection_id: inspectionId,
        priority: 'high',
        inspection_type: typeof inspection.documents === 'object' && inspection.documents !== null ? 
          (inspection.documents as any).inspection_type : undefined,
        requires_director_approval: requiresDirectorApproval
      }
    });

    // If director approval required, notify director
    if (requiresDirectorApproval) {
      const { data: directors } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role_name', 'director');

      for (const director of directors || []) {
        await NotificationService.createNotification({
          recipient_id: director.user_id,
          title: 'APPROBATION DIRECTEUR - Inspection critique',
          message: `Inspection critique nécessitant votre approbation: "${inspection.projects.title}".`,
          type: 'inspection_required',
          related_id: inspectionId,
          metadata: {
            related_project_id: inspection.project_id,
            related_inspection_id: inspectionId,
            priority: 'urgent',
            inspection_type: typeof inspection.documents === 'object' && inspection.documents !== null ? 
              (inspection.documents as any).inspection_type : undefined,
            escalation_level: 3
          }
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error submitting inspection for approval:', error);
    return false;
  }
};

// Helper functions
const notifyInspectionScheduled = async (inspectionId: string, inspectionData: InspectionData) => {
  // Notify inspector
    await NotificationService.createNotification({
      recipient_id: inspectionData.inspectorId,
      title: 'Nouvelle inspection programmée',
      message: `Inspection ${inspectionData.inspectionType} programmée pour le ${new Date(inspectionData.scheduledDate).toLocaleDateString()}.`,
      type: 'inspection_required',
      related_id: inspectionId,
      metadata: {
        related_project_id: inspectionData.projectId,
        related_inspection_id: inspectionId,
        priority: 'medium',
        inspection_type: inspectionData.inspectionType,
        due_date: inspectionData.scheduledDate
      }
    });

  // Note: project_manager_id doesn't exist in current schema
  // This would need to be implemented when project manager relationships are added
  // For now, we'll skip project manager notification
};

const sendOverdueInspectionAlert = async (inspection: any) => {
  const daysPastDue = Math.ceil((new Date().getTime() - new Date(inspection.date).getTime()) / (1000 * 60 * 60 * 24));
  
  // Alert inspector
  await NotificationService.createNotification({
    recipient_id: inspection.inspector,
    title: 'INSPECTION EN RETARD',
    message: `Inspection en retard de ${daysPastDue} jour(s) sur le projet "${inspection.projects.title}".`,
    type: 'inspection_overdue',
    related_id: inspection.id,
    metadata: {
      related_project_id: inspection.project_id,
      related_inspection_id: inspection.id,
      priority: 'urgent',
      delay_days: daysPastDue
    }
  });

  // Alert supervisor if delay > 2 days
  if (daysPastDue > 2) {
    const { data: supervisor } = await supabase
      .from('employees')
      .select('superior_id')
      .eq('user_id', inspection.inspector)
      .single();

    if (supervisor?.superior_id) {
      await NotificationService.createNotification({
        recipient_id: supervisor.superior_id,
        title: 'Inspection en retard - Intervention requise',
        message: `Inspection en retard de ${daysPastDue} jours nécessite votre intervention.`,
        type: 'escalation_required',
        related_id: inspection.id,
        metadata: {
          related_project_id: inspection.project_id,
          related_inspection_id: inspection.id,
          priority: 'urgent',
          escalation_level: 2
        }
      });
    }
  }
};

const sendComplianceAlert = async (alert: ComplianceAlert) => {
  // Get stakeholders
  const { data: stakeholders } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role_name
    `)
    .in('role_name', ['project_manager', 'director', 'engineering_consultant']);

  for (const stakeholder of stakeholders || []) {
    await NotificationService.createNotification({
      recipient_id: stakeholder.user_id,
      title: `ALERTE CONFORMITÉ - ${alert.severity.toUpperCase()}`,
      message: alert.description,
      type: 'compliance_alert',
      related_id: alert.inspectionId,
      metadata: {
        related_project_id: alert.projectId,
        related_inspection_id: alert.inspectionId,
        priority: alert.severity === 'critical' ? 'urgent' : 'high',
        violation_count: alert.violationCount,
        compliance_standard: alert.violationType,
        correction_deadline: alert.correctionDeadline
      }
    });
  }
};

const checkRecurringViolation = async (projectId: string, violations: any[]): Promise<boolean> => {
  try {
    const violationTypes = violations.map(v => v.standard);
    
    const { data: pastInspections } = await supabase
      .from('inspections')
      .select('documents')
      .eq('project_id', projectId)
      .eq('status', 'completed');

    let recurringCount = 0;
    for (const inspection of pastInspections || []) {
      const documents = inspection.documents as any;
      if (documents?.findings?.complianceChecks) {
        const pastViolations = documents.findings.complianceChecks
          .filter((check: any) => !check.passed && violationTypes.includes(check.standard));
        
        if (pastViolations.length > 0) recurringCount++;
      }
    }

    return recurringCount >= 2; // 2+ occurrences = recurring
  } catch (error) {
    console.error('Error checking recurring violation:', error);
    return false;
  }
};