/**
 * Reception Management Hook - Hexagonal Architecture
 * Provides reception management functionality with proper service delegation
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ReceptionService } from '@/application/services/ReceptionService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  ReceptionDTO, 
  ReceptionType, 
  ReceptionStatus,
  ReceptionValidationDTO,
  ReceptionWorkflowDTO
} from '@/dtos/entities/ReceptionDTO';

interface UseReceptionManagementProps {
  projectId: string;
}

interface CreateProvisionalReceptionData {
  scheduledDate: string;
  committee: string[];
  chairmanId: string;
  documents: File[];
  notes: string;
}

interface CreateDefinitiveReceptionData {
  scheduledDate: string;
  committee: string[];
  chairmanId: string;
  provisionalReceptionId?: string;
  documents: File[];
  notes: string;
}

interface ApproveReceptionData {
  findings: any[];
  conditions: any[];
  validUntil?: string;
  notes: string;
  approvedBy: string;
  certificateNumber?: string;
}

export function useReceptionManagement({ projectId }: UseReceptionManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize service with hexagonal architecture
  const receptionService = new ReceptionService(
    {} as any, // Reception repository placeholder
    RepositoryFactory.getDocumentRepository(),
    RepositoryFactory.getInspectionRepository(),
    RepositoryFactory.getEmployeeRepository()
  );

  // =================== QUERIES ===================

  const {
    data: receptions = [],
    isLoading: isLoadingReceptions,
    error: receptionsError
  } = useQuery({
    queryKey: ['receptions', projectId],
    queryFn: async (): Promise<ReceptionDTO[]> => {
      return await receptionService.getReceptionsByProject(projectId);
    },
    enabled: !!projectId
  });

  const {
    data: workflow,
    isLoading: isLoadingWorkflow,
    error: workflowError
  } = useQuery({
    queryKey: ['reception-workflow', projectId],
    queryFn: async (): Promise<ReceptionWorkflowDTO> => {
      return await receptionService.getReceptionWorkflow(projectId);
    },
    enabled: !!projectId
  });

  const provisionalReception = receptions.find(r => r.type === ReceptionType.PROVISIONAL);
  const definitiveReception = receptions.find(r => r.type === ReceptionType.DEFINITIVE);

  // =================== MUTATIONS ===================

  const createProvisionalReceptionMutation = useMutation({
    mutationFn: async (data: CreateProvisionalReceptionData): Promise<ReceptionDTO> => {
      return await receptionService.createProvisionalReception(projectId, '', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['reception-workflow', projectId] });
      toast({ title: "Réception Provisoire Créée", description: "La réception provisoire a été créée avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message || "Échec de la création", variant: "destructive" });
    }
  });

  const createDefinitiveReceptionMutation = useMutation({
    mutationFn: async (data: CreateDefinitiveReceptionData): Promise<ReceptionDTO> => {
      return await receptionService.createDefinitiveReception(projectId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['reception-workflow', projectId] });
      toast({ title: "Réception Définitive Créée", description: "La réception définitive a été créée avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message || "Échec de la création", variant: "destructive" });
    }
  });

  const approveProvisionalReceptionMutation = useMutation({
    mutationFn: async ({ receptionId, data }: { receptionId: string; data: ApproveReceptionData }): Promise<ReceptionDTO> => {
      return await receptionService.approveProvisionalReception(receptionId, {
        findings: data.findings,
        conditions: data.conditions,
        validUntil: data.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        notes: data.notes,
        approvedBy: data.approvedBy,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['reception-workflow', projectId] });
      toast({ title: "Réception Provisoire Approuvée", description: "La réception provisoire a été approuvée avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message || "Échec de l'approbation", variant: "destructive" });
    }
  });

  const approveDefinitiveReceptionMutation = useMutation({
    mutationFn: async ({ receptionId, data }: { receptionId: string; data: ApproveReceptionData }): Promise<ReceptionDTO> => {
      return await receptionService.approveDefinitiveReception(receptionId, {
        findings: data.findings,
        conditions: data.conditions,
        validUntil: data.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        notes: data.notes,
        approvedBy: data.approvedBy,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['reception-workflow', projectId] });
      toast({ title: "Réception Définitive Approuvée", description: "La réception définitive a été approuvée avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message || "Échec de l'approbation", variant: "destructive" });
    }
  });

  const validateReceptionMutation = useMutation({
    mutationFn: async (receptionId: string): Promise<ReceptionValidationDTO> => {
      return await receptionService.validateReception(receptionId);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['receptions', projectId] });
      toast({ title: "Validation Terminée", description: `La validation est ${result.isValid ? 'terminée avec succès' : 'échouée'}` });
    },
    onError: (error: any) => {
      toast({ title: "Erreur de Validation", description: error.message || "Échec de la validation", variant: "destructive" });
    }
  });

  // =================== CALLBACK FUNCTIONS ===================

  const createProvisionalReception = useCallback(async (data: CreateProvisionalReceptionData) => {
    return await createProvisionalReceptionMutation.mutateAsync(data);
  }, [createProvisionalReceptionMutation]);

  const createDefinitiveReception = useCallback(async (data: CreateDefinitiveReceptionData) => {
    return await createDefinitiveReceptionMutation.mutateAsync(data);
  }, [createDefinitiveReceptionMutation]);

  const approveProvisionalReception = useCallback(async (receptionId: string, data: ApproveReceptionData) => {
    return await approveProvisionalReceptionMutation.mutateAsync({ receptionId, data });
  }, [approveProvisionalReceptionMutation]);

  const approveDefinitiveReception = useCallback(async (receptionId: string, data: ApproveReceptionData) => {
    return await approveDefinitiveReceptionMutation.mutateAsync({ receptionId, data });
  }, [approveDefinitiveReceptionMutation]);

  const validateReception = useCallback(async (receptionId: string) => {
    return await validateReceptionMutation.mutateAsync(receptionId);
  }, [validateReceptionMutation]);

  // =================== HELPER FUNCTIONS ===================

  const getReceptionByType = useCallback((type: ReceptionType): ReceptionDTO | undefined => {
    return receptions.find(r => r.type === type);
  }, [receptions]);

  const canCreateDefinitiveReception = useCallback((): boolean => {
    return !!provisionalReception && provisionalReception.status === ReceptionStatus.APPROVED;
  }, [provisionalReception]);

  const isProvisionalValid = useCallback((): boolean => {
    if (!provisionalReception) return false;
    const now = new Date();
    const validUntil = provisionalReception.provisionalValidUntil ? new Date(provisionalReception.provisionalValidUntil) : null;
    return !validUntil || validUntil > now;
  }, [provisionalReception]);

  const getReceptionStats = useCallback(() => {
    const total = receptions.length;
    const approved = receptions.filter(r => r.status === ReceptionStatus.APPROVED).length;
    const pending = receptions.filter(r => r.status === ReceptionStatus.PENDING).length;
    const rejected = receptions.filter(r => r.status === ReceptionStatus.REJECTED).length;
    
    return {
      total,
      approved,
      pending,
      rejected,
      provisional: receptions.filter(r => r.type === ReceptionType.PROVISIONAL).length,
      definitive: receptions.filter(r => r.type === ReceptionType.DEFINITIVE).length
    };
  }, [receptions]);

  return {
    receptions,
    provisionalReception,
    definitiveReception,
    workflow,
    stats: getReceptionStats(),
    isLoadingReceptions,
    isLoadingWorkflow,
    receptionsError,
    workflowError,
    isCreatingProvisional: createProvisionalReceptionMutation.isPending,
    isCreatingDefinitive: createDefinitiveReceptionMutation.isPending,
    isApprovingProvisional: approveProvisionalReceptionMutation.isPending,
    isApprovingDefinitive: approveDefinitiveReceptionMutation.isPending,
    isValidating: validateReceptionMutation.isPending,
    createProvisionalReception,
    createDefinitiveReception,
    approveProvisionalReception,
    approveDefinitiveReception,
    validateReception,
    getReceptionByType,
    canCreateDefinitiveReception,
    isProvisionalValid
  };
}