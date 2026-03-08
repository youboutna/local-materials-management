// Hook hexagonal pour les actions de gestion
// Uses EnhancedActionService for event-driven action management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InspectionService } from '@/application/services/InspectionService';
import { ProjectService } from '@/application/services/ProjectService';
import { TaskService } from '@/application/services/TaskService';
import { PaymentService } from '@/application/services/PaymentService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { CreateEnhancedActionRequestDTO, EnhancedActionDTO } from '@/dtos/entities/ActionDTO';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'approval' | 'review' | 'decision' | 'alert';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: 'task' | 'approval' | 'review' | 'decision';
  createdAt: string;
  assignedTo?: string;
  dueDate?: Date;
  projectId?: string;
  projectName?: string;
  inspectionId?: string;
  paymentId?: string;
}

async function fetchManagementActions(): Promise<ActionItem[]> {
  const actions: ActionItem[] = [];

  try {
    const projectService = new ProjectService(RepositoryFactory.getProjectRepository());
    const inspectionService = new InspectionService();

    // Fetch inspections and projects in parallel
    const [allInspections, allProjects] = await Promise.all([
      inspectionService.getAllInspections(),
      projectService.getAllProjects(),
    ]);

    // Process pending/in-progress inspections
    const pendingInspections = allInspections
      .filter(i => ['in_progress', 'scheduled'].includes(i.status as string))
      .slice(0, 5);

    pendingInspections.forEach(inspection => {
      actions.push({
        id: `inspection-payment-${inspection.id}`,
        title: 'Validation paiement inspection',
        description: `Inspection à ${inspection.progressAtInspection || 0}% - ${inspection.inspector}`,
        type: 'approval',
        priority: (inspection.status as string) === 'in_progress' ? 'high' : 'medium',
        status: 'pending',
        urgency: (inspection.status as string) === 'in_progress' ? 'high' : 'medium',
        category: 'approval',
        createdAt: new Date().toISOString(),
        projectId: inspection.projectId || '',
        projectName: '',
        inspectionId: inspection.id,
        dueDate: new Date(inspection.date),
      });
    });

    // Overdue inspections
    const now = new Date();
    const overdueInspections = allInspections
      .filter(i => (i.status as string) === 'pending' && new Date(i.date) < now)
      .slice(0, 3);

    overdueInspections.forEach(inspection => {
      const daysPast = Math.floor((now.getTime() - new Date(inspection.date).getTime()) / (1000 * 60 * 60 * 24));
      actions.push({
        id: `inspection-${inspection.id}`,
        title: 'Inspection en retard',
        description: `${daysPast} jours de retard - Inspecteur: ${inspection.inspector}`,
        type: 'task',
        priority: daysPast > 7 ? 'high' : 'medium',
        status: 'pending',
        urgency: daysPast > 7 ? 'high' : 'medium',
        category: 'task',
        createdAt: new Date().toISOString(),
        projectId: inspection.projectId || '',
        projectName: '',
        dueDate: new Date(inspection.date),
      });
    });

    // Projects with high progress needing budget review
    const highProgressProjects = allProjects
      .filter(p => (p.progress || 0) > 80)
      .slice(0, 2);

    highProgressProjects.forEach(project => {
      actions.push({
        id: `budget-${project.id}`,
        title: 'Revue budgétaire',
        description: `Projet à ${project.progress}% - Vérification budget requise`,
        type: 'review',
        priority: 'medium',
        status: 'pending',
        urgency: 'medium',
        category: 'review',
        createdAt: new Date().toISOString(),
        projectId: project.id,
        projectName: project.title,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });
    });

    // New projects needing team assignment
    const newProjects = allProjects
      .filter(p => (p.progress || 0) === 0 && p.startDate && new Date(p.startDate) >= now)
      .slice(0, 2);

    newProjects.forEach(project => {
      actions.push({
        id: `team-${project.id}`,
        title: 'Affectation équipe',
        description: 'Nouveau projet démarrant bientôt',
        type: 'decision',
        priority: 'medium',
        status: 'pending',
        urgency: 'medium',
        category: 'decision',
        createdAt: new Date().toISOString(),
        projectId: project.id,
        projectName: project.title,
        dueDate: project.startDate ? new Date(project.startDate) : undefined,
      });
    });
  } catch (error) {
    console.error('Error fetching management actions:', error);
  }

  return actions;
}

export function useManagementActionsHex() {
  const queryClient = useQueryClient();
  const enhancedActionService = new EnhancedActionService();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['management-actions'],
    queryFn: fetchManagementActions,
    staleTime: 30000
  });

  // Mutation for executing actions through EnhancedActionService
  const executeActionMutation = useMutation({
    mutationFn: async (actionData: {
      type: 'schedule_inspection' | 'assign_task' | 'approve_payment' | 'escalate_issue';
      title: string;
      description: string;
      projectId: string;
      assigneeId?: string;
      entityId?: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
    }) => {
      const actionEvent = {
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: actionData.type,
        title: actionData.title,
        description: actionData.description,
        priority: actionData.priority,
        assigneeId: actionData.assigneeId,
        projectId: actionData.projectId,
        entityId: actionData.entityId,
        entityType: 'project',
        metadata: {},
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        scheduledFor: undefined,
        recipients: actionData.assigneeId ? [actionData.assigneeId] : []
      };

      await enhancedActionService.executeAction(actionEvent);
      return actionEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-actions'] });
    }
  });

  // Mutation for creating enhanced actions
  const createActionMutation = useMutation({
    mutationFn: async (actionData: {
      actionType: EnhancedActionDTO['actionType'];
      title: string;
      message: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      assigneeId?: string;
      recipientIds: string[];
      projectId?: string;
      contractorId?: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
    }) => {
      let result;
      
      switch (actionData.actionType) {
        case 'taskAssignment':
          result = await enhancedActionService.createInsuranceAction({
            insuranceId: actionData.entityId || '',
            projectId: actionData.projectId || '',
            contractorId: actionData.contractorId,
            actionType: actionData.actionType,
            title: actionData.title,
            message: actionData.message,
            priority: actionData.priority === 'urgent' ? 'high' : actionData.priority,
            assigneeId: actionData.assigneeId,
            recipientIds: actionData.recipientIds,
            metadata: actionData.metadata
          });
          break;
        default:
          // Default to insurance action for other types
          result = await enhancedActionService.createInsuranceAction({
            insuranceId: actionData.entityId || '',
            projectId: actionData.projectId || '',
            contractorId: actionData.contractorId,
            actionType: actionData.actionType,
            title: actionData.title,
            message: actionData.message,
            priority: actionData.priority === 'urgent' ? 'high' : actionData.priority,
            assigneeId: actionData.assigneeId,
            recipientIds: actionData.recipientIds,
            metadata: actionData.metadata
          });
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-actions'] });
    }
  });

  return {
    actions: data || [],
    loading: isLoading,
    error,
    refetch,
    executeAction: executeActionMutation.mutate,
    createAction: createActionMutation.mutate,
    isExecuting: executeActionMutation.isPending || createActionMutation.isPending
  };
}
