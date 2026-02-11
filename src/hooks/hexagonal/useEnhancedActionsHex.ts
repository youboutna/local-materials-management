/**
 * Enhanced Actions Hook - Hexagonal Architecture
 * 
 * Hook for enhanced action functionality using EnhancedActionService
 * Following hexagonal architecture patterns:
 * - Uses EnhancedActionService for business logic
 * - Uses React Query for state management
 * - Exposes clean interface to UI components
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EnhancedActionService } from '@/application/services/EnhancedActionService';
import { EnhancedActionDTO, CreateEnhancedActionRequestDTO } from '@/dtos/entities/ActionDTO';

// =================== INTERFACES ===================

export interface UseEnhancedActionsHexResult {
  // Actions
  actions: EnhancedActionDTO[];
  actionsLoading: boolean;
  actionsError: string | null;
  loading: boolean;
  
  // Actions by entity
  getActionsByEntity: (entityType: EnhancedActionDTO['entityType'], entityId: string) => EnhancedActionDTO[];
  getActionsByAssignee: (assigneeId: string) => EnhancedActionDTO[];
  
  // CRUD operations
  createAction: (request: CreateEnhancedActionRequestDTO) => Promise<EnhancedActionDTO>;
  updateActionStatus: (actionId: string, status: 'pending' | 'inProgress' | 'completed' | 'cancelled') => Promise<EnhancedActionDTO>;
  deleteAction: (actionId: string) => Promise<boolean>;
  
  // Specific action creators
  createInsuranceAction: (request: CreateEnhancedActionRequestDTO) => Promise<EnhancedActionDTO>;
  createBankGuaranteeAction: (request: CreateEnhancedActionRequestDTO) => Promise<EnhancedActionDTO>;
  createPaymentAction: (request: CreateEnhancedActionRequestDTO) => Promise<EnhancedActionDTO>;
  
  // Execution
  executeAction: (actionData: {
    type: 'schedule_inspection' | 'assign_task' | 'approve_payment' | 'escalate_issue' | 'send_notification';
    title: string;
    description: string;
    projectId: string;
    assigneeId?: string;
    entityId?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }) => void;
  
  // State
  isCreating: boolean;
  
  // Refetch
  refetch: () => void;
}

// =================== HOOK IMPLEMENTATION ===================

export function useEnhancedActionsHex(): UseEnhancedActionsHexResult {
  const queryClient = useQueryClient();
  const enhancedActionService = new EnhancedActionService();

  // Get all actions
  const {
    data: actions,
    isLoading: actionsLoading,
    error: actionsError,
    refetch
  } = useQuery({
    queryKey: ['enhanced-actions'],
    queryFn: () => enhancedActionService.getAllActions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create action mutation
  const createActionMutation = useMutation({
    mutationFn: async (request: CreateEnhancedActionRequestDTO) => {
      return await enhancedActionService.createInsuranceAction(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-actions'] });
    },
    onError: (error: any) => {
      console.error('Failed to create action:', error);
    }
  });

  // Update action status mutation
  const updateActionStatusMutation = useMutation({
    mutationFn: async ({ actionId, status }: { actionId: string; status: 'pending' | 'inProgress' | 'completed' | 'cancelled' }) => {
      return await enhancedActionService.updateActionStatus(actionId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-actions'] });
    },
    onError: (error: any) => {
      console.error('Failed to update action status:', error);
    }
  });

  // Delete action mutation
  const deleteActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      return await enhancedActionService.deleteAction(actionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-actions'] });
    },
    onError: (error: any) => {
      console.error('Failed to delete action:', error);
    }
  });

  // Execute action mutation
  const executeActionMutation = useMutation({
    mutationFn: async (actionData: {
      type: 'schedule_inspection' | 'assign_task' | 'approve_payment' | 'escalate_issue' | 'send_notification';
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
        entityType: actionData.type === 'approve_payment' ? 'payment' : 
                   actionData.type === 'schedule_inspection' ? 'inspection' : 
                   actionData.type === 'assign_task' ? 'task' : 'project',
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
      queryClient.invalidateQueries({ queryKey: ['enhanced-actions'] });
    },
    onError: (error: any) => {
      console.error('Failed to execute action:', error);
    }
  });

  // Helper functions
  const getActionsByEntity = (entityType: EnhancedActionDTO['entityType'], entityId: string): EnhancedActionDTO[] => {
    return actions?.filter(action => action.entityType === entityType && action.entityId === entityId) || [];
  };

  const getActionsByAssignee = (assigneeId: string): EnhancedActionDTO[] => {
    return actions?.filter(action => action.assigneeId === assigneeId) || [];
  };

  const createInsuranceAction = async (request: CreateEnhancedActionRequestDTO): Promise<EnhancedActionDTO> => {
    return await enhancedActionService.createInsuranceAction(request);
  };

  const createBankGuaranteeAction = async (request: CreateEnhancedActionRequestDTO): Promise<EnhancedActionDTO> => {
    return await enhancedActionService.createBankGuaranteeAction(request);
  };

  const createPaymentAction = async (request: CreateEnhancedActionRequestDTO): Promise<EnhancedActionDTO> => {
    return await enhancedActionService.createPaymentAction(request);
  };

  return {
    // Actions
    actions: actions || [],
    actionsLoading,
    actionsError: actionsError instanceof Error ? actionsError.message : null,
    loading: actionsLoading,
    
    // Actions by entity
    getActionsByEntity,
    getActionsByAssignee,
    
    // CRUD operations
    createAction: createActionMutation.mutateAsync,
    updateActionStatus: (actionId: string, status: 'pending' | 'inProgress' | 'completed' | 'cancelled') => updateActionStatusMutation.mutateAsync({ actionId, status }),
    deleteAction: deleteActionMutation.mutateAsync,
    
    // Specific action creators
    createInsuranceAction,
    createBankGuaranteeAction,
    createPaymentAction,
    
    // Execution
    executeAction: executeActionMutation.mutate,
    
    // State
    isCreating: createActionMutation.isPending || updateActionStatusMutation.isPending || 
               deleteActionMutation.isPending || executeActionMutation.isPending,
    
    // Refetch
    refetch
  };
}

// Export a simpler version for basic usage
export function useActionsHex() {
  const { actions, loading, error, refetch } = useEnhancedActionsHex();
  
  return {
    actions,
    loading,
    error,
    refetch
  };
}

// Export for entity-specific actions
export function useEntityActionsHex(entityType: EnhancedActionDTO['entityType'], entityId: string) {
  const { getActionsByEntity, createAction, isCreating } = useEnhancedActionsHex();
  
  const entityActions = getActionsByEntity(entityType, entityId);
  
  return {
    actions: entityActions,
    createAction,
    isCreating
  };
}
