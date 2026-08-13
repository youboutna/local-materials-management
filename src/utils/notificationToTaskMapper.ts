import { NotificationType, NotificationMetadata, TaskType } from '@/dtos/types/notification';
import { supabase } from '@/integrations/supabase/client';
import { btpClient } from '@/integrations/supabase/schema-clients';

interface CreateTaskFromNotificationParams {
  notificationType: NotificationType;
  metadata: NotificationMetadata;
  recipientId: string;
  assignedById: string;
  title: string;
  description?: string;
}

/**
 * Maps notification types to task types and automatically creates task assignments
 */
export const createTaskFromNotification = async (params: CreateTaskFromNotificationParams) => {
  const { notificationType, metadata, recipientId, assignedById, title, description } = params;

  // Determine task type from notification type
  const taskTypeMapping: Partial<Record<NotificationType, TaskType>> = {
    'inspection_required': 'inspection',
    'inspection_overdue': 'inspection',
    'document_review': 'document',
    'document_shared': 'document',
    'document_uploaded': 'document',
    'payment_due': 'payment',
    'payment_pending': 'payment',
    'payment_warning': 'payment',
    'payment_blocked': 'payment',
    'project_update': 'project',
    'project_created': 'project',
    'project_milestone': 'project',
    'insurance_expiry': 'insurance',
    'insurance_update': 'insurance',
    'bank_guarantee_trigger': 'general',
    'delay_warning': 'general',
    'compliance_alert': 'general',
    'escalation_required': 'general',
  };

  const taskType = taskTypeMapping[notificationType] || metadata.task_type || 'general';

  // Only create tasks for notification types that map to actions
  if (!taskTypeMapping[notificationType] && !metadata.task_type) {
    return null;
  }

  // Determine priority from metadata or notification type
  let priority: 'low' | 'medium' | 'high' | 'urgent' = metadata.priority || 'medium';
  
  // Auto-escalate priority for critical notification types
  if (['inspection_overdue', 'payment_blocked', 'compliance_alert', 'escalation_required'].includes(notificationType)) {
    priority = 'urgent';
  } else if (['inspection_required', 'payment_due', 'insurance_expiry'].includes(notificationType)) {
    priority = 'high';
  }

  // Create the task assignment
  const taskData = {
    title,
    description: description || `Action requise suite à: ${title}`,
    assigned_to: recipientId,
    assigned_by: assignedById,
    priority,
    status: 'pending' as const,
    due_date: metadata.due_date,
    project_id: metadata.related_project_id,
    notes: buildTaskNotes(notificationType, metadata),
  };

  const { data: task, error } = await btpClient.from('task_assignments')
    .insert({ ...taskData, action_type: taskType })
    .select()
    .single();

  if (error) {
    console.error('Error creating task from notification:', error);
    return null;
  }

  // Create a notification for the assigned user
  await btpClient.from('notifications')
    .insert({
      user_id: recipientId,
      title: `Nouvelle tâche: ${title}`,
      message: description || `Vous avez été assigné à une nouvelle tâche`,
      type: 'task_assignment',
      related_id: task.id,
      data: {
        task_type: taskType,
        related_project_id: metadata.related_project_id,
        priority: priority,
      } as never,
    });

  console.log('Task created from notification:', task);
  return task;
};

/**
 * Builds descriptive notes for the task based on notification metadata
 */
const buildTaskNotes = (notificationType: NotificationType, metadata: NotificationMetadata): string => {
  const notes: string[] = [];

  // Add type-specific information
  switch (notificationType) {
    case 'inspection_required':
    case 'inspection_overdue':
      if (metadata.inspection_type) {
        notes.push(`Type d'inspection: ${metadata.inspection_type}`);
      }
      if (metadata.engineering_consultant) {
        notes.push(`Consultant: ${metadata.engineering_consultant}`);
      }
      break;

    case 'document_review':
    case 'document_shared':
      if (metadata.document_name) {
        notes.push(`Document: ${metadata.document_name}`);
      }
      if (metadata.document_type) {
        notes.push(`Type: ${metadata.document_type}`);
      }
      if (metadata.action_required) {
        notes.push(`Action requise: ${metadata.action_required}`);
      }
      break;

    case 'payment_due':
    case 'payment_pending':
    case 'payment_blocked':
      if (metadata.payment_amount) {
        notes.push(`Montant: ${metadata.payment_amount} DH`);
      }
      if (metadata.payment_method) {
        notes.push(`Méthode: ${metadata.payment_method}`);
      }
      if (metadata.contractor_name) {
        notes.push(`Entrepreneur: ${metadata.contractor_name}`);
      }
      break;

    case 'insurance_expiry':
      if (metadata.contractor_name) {
        notes.push(`Entrepreneur: ${metadata.contractor_name}`);
      }
      break;

    case 'delay_warning':
      if (metadata.delay_percentage) {
        notes.push(`Retard: ${metadata.delay_percentage}%`);
      }
      break;

    case 'bank_guarantee_trigger':
      if (metadata.contract_guarantee_amount) {
        notes.push(`Montant de garantie: ${metadata.contract_guarantee_amount} DH`);
      }
      if (metadata.bank_liaison_email) {
        notes.push(`Contact bancaire: ${metadata.bank_liaison_email}`);
      }
      break;

    case 'contractor_penalty':
      if (metadata.penalty_amount) {
        notes.push(`Montant de pénalité: ${metadata.penalty_amount} DH`);
      }
      if (metadata.violation_count) {
        notes.push(`Nombre de violations: ${metadata.violation_count}`);
      }
      break;

    case 'compliance_alert':
      if (metadata.compliance_standard) {
        notes.push(`Norme: ${metadata.compliance_standard}`);
      }
      break;

    case 'escalation_required':
      if (metadata.escalation_level) {
        notes.push(`Niveau d'escalade: ${metadata.escalation_level}`);
      }
      break;
  }

  // Add general metadata
  if (metadata.project_phase) {
    notes.push(`Phase: ${metadata.project_phase}`);
  }
  if (metadata.completion_percentage) {
    notes.push(`Avancement: ${metadata.completion_percentage}%`);
  }

  return notes.join('\n');
};

/**
 * Helper to create notification and task in a single transaction
 */
export const createNotificationWithTask = async (params: {
  recipientId: string;
  assignedById: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: NotificationMetadata;
  relatedId?: string;
  createTask?: boolean;
}) => {
  const { recipientId, assignedById, title, message, type, metadata = {}, relatedId, createTask = true } = params;

  // Create the notification
  const { data: notification, error: notifError } = await btpClient.from('notifications')
    .insert({
      user_id: recipientId,
      title,
      message,
      type,
      related_id: relatedId || null,
      data: metadata as never,
    })
    .select()
    .single();

  if (notifError) {
    console.error('Error creating notification:', notifError);
    throw notifError;
  }

  // Create task if requested and applicable
  let task: any = null;
  if (createTask) {
    task = await createTaskFromNotification({
      notificationType: type,
      metadata,
      recipientId,
      assignedById,
      title,
      description: message,
    });
  }

  return { notification, task };
};
