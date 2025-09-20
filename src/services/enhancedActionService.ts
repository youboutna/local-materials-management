import { supabase } from '@/integrations/supabase/client';
import { createBankGuaranteeAction } from './bankGuaranteeActionService';
import { createInspectionAction } from './inspectionActionService';
import { createInsuranceAction } from './insuranceActionService';
import { createPaymentControlAction } from './paymentControlActionService';
import { createProjectAction } from './projectActionService';

export interface UnifiedActionRequest {
  entityType: 'bank_guarantee' | 'inspection' | 'insurance' | 'payment' | 'project';
  entityId: string;
  projectId: string;
  contractorId?: string;
  actionType: 'task_assignment' | 'hierarchy_notification' | 'sms' | 'call' | 'email' | 'mail';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  recipientIds: string[];
  dueDate?: string;
  escalationLevel?: 'team' | 'supervisor' | 'manager' | 'director';
  metadata?: any;
}

export interface ActionExecutionResult {
  success: boolean;
  actionId?: string;
  notificationsSent: number;
  error?: string;
  warnings?: string[];
}

export class EnhancedActionService {
  static async executeAction(request: UnifiedActionRequest): Promise<ActionExecutionResult> {
    try {
      let actionResult;
      
      switch (request.entityType) {
        case 'bank_guarantee':
          actionResult = await createBankGuaranteeAction({
            bankGuaranteeId: request.entityId,
            projectId: request.projectId,
            contractorId: request.contractorId || '',
            actionType: request.actionType,
            title: request.title,
            message: request.message,
            priority: request.priority,
            assigneeId: request.assigneeId,
            recipientIds: request.recipientIds,
            dueDate: request.dueDate,
            escalationLevel: request.escalationLevel,
            metadata: request.metadata
          });
          break;

        case 'inspection':
          actionResult = await createInspectionAction({
            inspectionId: request.entityId,
            projectId: request.projectId,
            inspectorId: request.contractorId || '',
            actionType: request.actionType,
            title: request.title,
            message: request.message,
            priority: request.priority,
            assigneeId: request.assigneeId,
            recipientIds: request.recipientIds,
            dueDate: request.dueDate,
            escalationLevel: request.escalationLevel,
            metadata: request.metadata
          });
          break;

        case 'insurance':
          actionResult = await createInsuranceAction({
            insuranceId: request.entityId,
            projectId: request.projectId,
            contractorId: request.contractorId || '',
            actionType: request.actionType,
            title: request.title,
            message: request.message,
            priority: request.priority,
            assigneeId: request.assigneeId,
            recipientIds: request.recipientIds,
            dueDate: request.dueDate,
            escalationLevel: request.escalationLevel,
            metadata: request.metadata
          });
          break;

        case 'payment':
          actionResult = await createPaymentControlAction({
            paymentId: request.entityId,
            projectId: request.projectId,
            contractorId: request.contractorId || '',
            actionType: request.actionType,
            title: request.title,
            message: request.message,
            priority: request.priority,
            assigneeId: request.assigneeId,
            recipientIds: request.recipientIds,
            dueDate: request.dueDate,
            escalationLevel: request.escalationLevel,
            metadata: request.metadata
          });
          break;

        case 'project':
          actionResult = await createProjectAction({
            projectId: request.projectId,
            actionType: request.actionType,
            title: request.title,
            message: request.message,
            priority: request.priority,
            assigneeId: request.assigneeId,
            recipientIds: request.recipientIds,
            dueDate: request.dueDate,
            escalationLevel: request.escalationLevel,
            metadata: request.metadata
          });
          break;

        default:
          throw new Error(`Unsupported entity type: ${request.entityType}`);
      }

      return {
        success: true,
        actionId: actionResult?.id,
        notificationsSent: request.recipientIds.length
      };

    } catch (error: any) {
      console.error('Error executing action:', error);
      return {
        success: false,
        notificationsSent: 0,
        error: error.message || 'Failed to execute action'
      };
    }
  }

  static async getActionHistory(
    entityType: string,
    entityId?: string,
    projectId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .in('type', [
          'bank_guarantee_action',
          'inspection_action', 
          'insurance_action',
          'payment_action',
          'project_action'
        ]);

      if (entityId) {
        query = query.eq('related_id', entityId);
      }

      if (projectId) {
        query = query.eq('metadata->projectId', projectId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching action history:', error);
      return [];
    }
  }

  static async getActionStatistics(
    startDate: Date,
    endDate: Date,
    entityType?: string
  ): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByPriority: Record<string, number>;
    actionsByStatus: Record<string, number>;
    averageResponseTime: number;
  }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('type', [
          'bank_guarantee_action',
          'inspection_action',
          'insurance_action', 
          'payment_action',
          'project_action'
        ]);

      if (entityType) {
        query = query.eq('type', `${entityType}_action`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const actions = data || [];

      const actionsByType = actions.reduce((acc, action) => {
        acc[action.type] = (acc[action.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const actionsByPriority = actions.reduce((acc, action) => {
        const metadata = action.metadata as any;
        const priority = metadata?.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const actionsByStatus = actions.reduce((acc, action) => {
        const status = action.read ? 'completed' : 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate average response time (mock for now)
      const averageResponseTime = 2.5; // days

      return {
        totalActions: actions.length,
        actionsByType,
        actionsByPriority,
        actionsByStatus,
        averageResponseTime
      };

    } catch (error) {
      console.error('Error calculating action statistics:', error);
      return {
        totalActions: 0,
        actionsByType: {},
        actionsByPriority: {},
        actionsByStatus: {},
        averageResponseTime: 0
      };
    }
  }

  static async scheduleRecurringAction(
    actionRequest: UnifiedActionRequest,
    recurringPattern: {
      frequency: 'daily' | 'weekly' | 'monthly';
      interval: number;
      endDate?: string;
    }
  ): Promise<ActionExecutionResult> {
    try {
      // Store the recurring action pattern
      const { data: schedule, error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: 'system',
          title: `Scheduled Action: ${actionRequest.title}`,
          message: `Recurring ${actionRequest.actionType} for ${actionRequest.entityType}`,
          type: 'scheduled_action',
          related_id: actionRequest.entityId,
          metadata: {
            actionRequest: JSON.stringify(actionRequest),
            recurringPattern: JSON.stringify(recurringPattern),
            nextExecution: new Date().toISOString()
          } as any
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        actionId: schedule.id,
        notificationsSent: 0
      };

    } catch (error: any) {
      console.error('Error scheduling recurring action:', error);
      return {
        success: false,
        notificationsSent: 0,
        error: error.message || 'Failed to schedule recurring action'
      };
    }
  }

  static async cancelAction(actionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          metadata: { 
            ...{}, 
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
          }
        })
        .eq('id', actionId);

      if (error) throw error;
      return true;

    } catch (error) {
      console.error('Error cancelling action:', error);
      return false;
    }
  }

  static async escalateAction(
    actionId: string,
    newEscalationLevel: 'team' | 'supervisor' | 'manager' | 'director'
  ): Promise<ActionExecutionResult> {
    try {
      // Get the original action
      const { data: originalAction, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', actionId)
        .single();

      if (fetchError) throw fetchError;

      // Get escalation targets
      const metadata = originalAction.metadata as any;
      const projectId = metadata?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found in action metadata');
      }

      const { data: targets } = await supabase
        .rpc('get_escalation_targets', { 
          project_id_param: projectId, 
          escalation_level_param: newEscalationLevel 
        });

      let notificationsSent = 0;

      // Send escalated notifications
      for (const target of (targets || [])) {
        await supabase
          .from('notifications')
          .insert({
            recipient_id: target.employee_id,
            title: `[ESCALÉ] ${originalAction.title}`,
            message: `Action escalée au niveau ${newEscalationLevel}: ${originalAction.message}`,
            type: `${originalAction.type}_escalation`,
            related_id: originalAction.related_id,
            metadata: {
              ...(originalAction.metadata as any),
              escalatedFrom: actionId,
              escalationLevel: newEscalationLevel,
              escalatedAt: new Date().toISOString()
            } as any
          });
        notificationsSent++;
      }

      // Update original action
      await supabase
        .from('notifications')
        .update({ 
          metadata: { 
            ...(originalAction.metadata as any), 
            escalated: true,
            escalationLevel: newEscalationLevel,
            escalatedAt: new Date().toISOString()
          } as any
        })
        .eq('id', actionId);

      return {
        success: true,
        actionId,
        notificationsSent
      };

    } catch (error: any) {
      console.error('Error escalating action:', error);
      return {
        success: false,
        notificationsSent: 0,
        error: error.message || 'Failed to escalate action'
      };
    }
  }
}