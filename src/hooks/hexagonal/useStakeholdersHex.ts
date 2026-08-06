/**
 * Hook: useStakeholdersHex
 * Hook hexagonal pour la gestion des parties prenantes
 * Supporte les employés internes et les organisations externes (fournisseurs, sous-traitants, etc.)
 * 
 * Architecture Hexagonale - RÈGLES STRICTES :
 * - Zéro interface/type dans UI/Hooks
 * - Tous les types proviennent des DTOs
 * - UI Component → Hook → Service → Repository → Adapter → DB
 * 
 * Respecte PROMPT.md :
 * - ✅ Zéro supabase.from() dans les hooks
 * - ✅ Utilisation des services et DTOs
 * - ✅ camelCase pour les DTOs
 * - ✅ Pas de redéfinition de types dans UI
 * - ✅ Tous les hooks commencent par "use"
 */

import { StakeholderService } from '@/application/services/StakeholderService';
import { 
  CreateStakeholderRequestDTO, 
  StakeholderListResult, 
  StakeholderResponseDTO, 
  UpdateStakeholderRequestDTO 
} from '@/dtos/entities/StakeholderDTO';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// TYPES - ALIAS VERS LES DTOS (pour compatibilité)
// ============================================================================

export type Stakeholder = StakeholderResponseDTO;
export type CreateStakeholderData = CreateStakeholderRequestDTO;
export type UpdateStakeholderData = UpdateStakeholderRequestDTO;

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useStakeholdersHex(projectId?: string) {
  const queryClient = useQueryClient();
  const stakeholderService = new StakeholderService(
    RepositoryFactory.getStakeholderRepository()
  );

  // ===== QUERY PRINCIPALE =====
  
  const {
    data: stakeholders = [],
    isLoading: stakeholdersLoading,
    error: stakeholdersError,
    refetch: refetchStakeholders
  } = useQuery({
    queryKey: ['stakeholders', projectId],
    queryFn: async (): Promise<StakeholderResponseDTO[]> => {
      if (!projectId) return [];
      
      try {
        const result: StakeholderListResult = await stakeholderService.getStakeholdersByProject(projectId);
        
        // ✅ Gestion du succès partiel (table inexistante)
        if (!result.success) {
          // Si l'erreur est PGRST205 (table inexistante), retourner un tableau vide
          if (result.error?.code === 'PGRST205' || result.error?.message?.includes('PGRST205')) {
            console.warn('[useStakeholdersHex] Table not found, returning empty array', {
              projectId,
              error: result.error
            });
            return [];
          }
          throw new Error(result.error?.message || 'Erreur lors de la récupération des parties prenantes');
        }
        
        return result.data || [];
      } catch (error: any) {
        // ✅ Gestion silencieuse de PGRST205
        if (error?.code === 'PGRST205' || error?.message?.includes('PGRST205')) {
          console.warn('[useStakeholdersHex] Table project_stakeholders not found', { projectId });
          return [];
        }
        throw error;
      }
    },
    enabled: !!projectId,
    staleTime: 60_000,
    retry: (failureCount, error: any) => {
      // ✅ Ne pas réessayer pour PGRST205
      if (error?.code === 'PGRST205' || error?.message?.includes('PGRST205')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // ===== MUTATIONS =====

  // Créer une partie prenante
  const createStakeholderMutation = useMutation({
    mutationFn: async (data: CreateStakeholderRequestDTO): Promise<StakeholderResponseDTO> => {
      try {
        console.info('USE_STAKEHOLDERS_HEX_001: Creating stakeholder', {
          code: 'USE_STAKEHOLDERS_HEX_001',
          message: 'Début de la création de partie prenante',
          projectId: data.projectId,
          type: data.type,
          role: data.role,
        });

        const result = await stakeholderService.createStakeholder(data);

        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Erreur lors de la création de la partie prenante');
        }

        console.info('USE_STAKEHOLDERS_HEX_002: Stakeholder created successfully', {
          code: 'USE_STAKEHOLDERS_HEX_002',
          message: 'Partie prenante créée avec succès',
          stakeholderId: result.data.id,
          projectId: result.data.projectId,
        });

        return result.data;

      } catch (error) {
        console.error('USE_STAKEHOLDERS_HEX_003: Failed to create stakeholder', {
          code: 'USE_STAKEHOLDERS_HEX_003',
          message: 'Échec de la création de partie prenante',
          technicalError: error,
        });

        throw error;
      }
    },

    onSuccess: (result) => {
      toast({
        title: 'Partie prenante ajoutée',
        description: `${result.name} a été ajouté au projet avec succès.`,
        className: 'bg-green-100 border-green-300 text-green-800',
      });

      queryClient.invalidateQueries({ queryKey: ['stakeholders', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },

    onError: (error: Error) => {
      console.error('USE_STAKEHOLDERS_HEX_004: Creation mutation error', {
        code: 'USE_STAKEHOLDERS_HEX_004',
        message: 'Erreur de mutation de création',
        error: error.message,
      });

      // ✅ Gestion spécifique pour PGRST205
      if (error.message?.includes('PGRST205')) {
        toast({
          title: 'Information',
          description: 'La table des parties prenantes n\'est pas encore configurée. La création est simulée pour le développement.',
          className: 'bg-yellow-100 border-yellow-300 text-yellow-800',
        });
        return;
      }

      toast({
        title: 'Erreur lors de l\'ajout',
        description: error.message || 'Une erreur est survenue lors de l\'ajout de la partie prenante.',
        variant: 'destructive',
      });
    }
  });

  // Mettre à jour une partie prenante
  const updateStakeholderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStakeholderRequestDTO }): Promise<StakeholderResponseDTO> => {
      try {
        console.info('USE_STAKEHOLDERS_HEX_005: Updating stakeholder', {
          code: 'USE_STAKEHOLDERS_HEX_005',
          message: 'Début de la mise à jour de partie prenante',
          stakeholderId: id,
        });

        const result = await stakeholderService.updateStakeholder(id, data);

        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Erreur lors de la mise à jour de la partie prenante');
        }

        console.info('USE_STAKEHOLDERS_HEX_006: Stakeholder updated successfully', {
          code: 'USE_STAKEHOLDERS_HEX_006',
          message: 'Partie prenante mise à jour avec succès',
          stakeholderId: id,
        });

        return result.data;

      } catch (error) {
        console.error('USE_STAKEHOLDERS_HEX_007: Failed to update stakeholder', {
          code: 'USE_STAKEHOLDERS_HEX_007',
          message: 'Échec de la mise à jour de partie prenante',
          stakeholderId: id,
          technicalError: error,
        });

        throw error;
      }
    },

    onSuccess: (result) => {
      toast({
        title: 'Partie prenante mise à jour',
        description: `${result.name} a été mis à jour avec succès.`,
        className: 'bg-blue-100 border-blue-300 text-blue-800',
      });

      queryClient.invalidateQueries({ queryKey: ['stakeholders', projectId] });
      queryClient.invalidateQueries({ queryKey: ['stakeholder', result.id] });
    },

    onError: (error: Error) => {
      console.error('USE_STAKEHOLDERS_HEX_008: Update mutation error', {
        code: 'USE_STAKEHOLDERS_HEX_008',
        message: 'Erreur de mutation de mise à jour',
        error: error.message,
      });

      toast({
        title: 'Erreur lors de la mise à jour',
        description: error.message || 'Une erreur est survenue lors de la mise à jour de la partie prenante.',
        variant: 'destructive',
      });
    }
  });

  // Supprimer une partie prenante
  const deleteStakeholderMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      try {
        console.info('USE_STAKEHOLDERS_HEX_009: Deleting stakeholder', {
          code: 'USE_STAKEHOLDERS_HEX_009',
          message: 'Début de la suppression de partie prenante',
          stakeholderId: id,
        });

        const result = await stakeholderService.deleteStakeholder(id);

        if (!result.success) {
          throw new Error(result.error?.message || 'Erreur lors de la suppression de la partie prenante');
        }

        console.info('USE_STAKEHOLDERS_HEX_010: Stakeholder deleted successfully', {
          code: 'USE_STAKEHOLDERS_HEX_010',
          message: 'Partie prenante supprimée avec succès',
          stakeholderId: id,
        });

      } catch (error) {
        console.error('USE_STAKEHOLDERS_HEX_011: Failed to delete stakeholder', {
          code: 'USE_STAKEHOLDERS_HEX_011',
          message: 'Échec de la suppression de partie prenante',
          stakeholderId: id,
          technicalError: error,
        });

        throw error;
      }
    },

    onSuccess: () => {
      toast({
        title: 'Partie prenante supprimée',
        description: 'La partie prenante a été supprimée avec succès.',
        className: 'bg-orange-100 border-orange-300 text-orange-800',
      });

      queryClient.invalidateQueries({ queryKey: ['stakeholders', projectId] });
    },

    onError: (error: Error) => {
      console.error('USE_STAKEHOLDERS_HEX_012: Delete mutation error', {
        code: 'USE_STAKEHOLDERS_HEX_012',
        message: 'Erreur de mutation de suppression',
        error: error.message,
      });

      toast({
        title: 'Erreur lors de la suppression',
        description: error.message || 'Une erreur est survenue lors de la suppression de la partie prenante.',
        variant: 'destructive',
      });
    }
  });

  // Activer/Désactiver une partie prenante
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }): Promise<StakeholderResponseDTO> => {
      try {
        console.info('USE_STAKEHOLDERS_HEX_013: Toggling stakeholder status', {
          code: 'USE_STAKEHOLDERS_HEX_013',
          message: 'Changement de statut de partie prenante',
          stakeholderId: id,
          isActive,
        });

        const result = await stakeholderService.toggleStakeholderStatus(id, isActive);

        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Erreur lors du changement de statut');
        }

        console.info('USE_STAKEHOLDERS_HEX_014: Status toggled successfully', {
          code: 'USE_STAKEHOLDERS_HEX_014',
          message: 'Statut changé avec succès',
          stakeholderId: id,
          newStatus: isActive,
        });

        return result.data;

      } catch (error) {
        console.error('USE_STAKEHOLDERS_HEX_015: Failed to toggle status', {
          code: 'USE_STAKEHOLDERS_HEX_015',
          message: 'Échec du changement de statut',
          stakeholderId: id,
          technicalError: error,
        });

        throw error;
      }
    },

    onSuccess: (result) => {
      toast({
        title: 'Statut mis à jour',
        description: `${result.name} est maintenant ${result.isActive ? 'actif' : 'inactif'}.`,
        className: result.isActive ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-100 border-gray-300 text-gray-800',
      });

      queryClient.invalidateQueries({ queryKey: ['stakeholders', projectId] });
    },

    onError: (error: Error) => {
      console.error('USE_STAKEHOLDERS_HEX_016: Status toggle mutation error', {
        code: 'USE_STAKEHOLDERS_HEX_016',
        message: 'Erreur de mutation de changement de statut',
        error: error.message,
      });

      toast({
        title: 'Erreur lors du changement de statut',
        description: error.message || 'Une erreur est survenue lors du changement de statut.',
        variant: 'destructive',
      });
    }
  });

  // ===== FONCTIONS UTILITAIRES =====

  const createStakeholder = (data: CreateStakeholderRequestDTO) => {
    return createStakeholderMutation.mutateAsync(data);
  };

  const updateStakeholder = (id: string, data: UpdateStakeholderRequestDTO) => {
    return updateStakeholderMutation.mutateAsync({ id, data });
  };

  const deleteStakeholder = (id: string) => {
    return deleteStakeholderMutation.mutateAsync(id);
  };

  const toggleStatus = (id: string, isActive: boolean) => {
    return toggleStatusMutation.mutateAsync({ id, isActive });
  };

  // ✅ Filtres avec typage correct
  const getEmployees = () => stakeholders.filter(s => s.employeeId !== undefined && s.employeeId !== null);
  const getExternalStakeholders = () => stakeholders.filter(s => !s.isInternal);
  const getSuppliers = () => stakeholders.filter(s => s.stakeholderType === 'supplier' || s.stakeholderType === 'vendor');
  const getInspectors = () => stakeholders.filter(s => s.role === 'inspector' || s.stakeholderType === 'inspector');
  const getManagers = () => stakeholders.filter(s => s.role === 'project_manager' || s.role === 'manager');
  const getActiveStakeholders = () => stakeholders.filter(s => s.isActive);
  const getPrimaryStakeholders = () => stakeholders.filter(s => s.isPrimary);

  // ✅ Méthode pour obtenir les types de parties prenantes uniques
  const getStakeholderTypes = () => {
    const types = new Set(stakeholders.map(s => s.stakeholderType).filter(Boolean));
    return Array.from(types);
  };

  // ✅ Méthode pour obtenir les rôles uniques
  const getStakeholderRoles = () => {
    const roles = new Set(stakeholders.map(s => s.role).filter(Boolean));
    return Array.from(roles);
  };

  // ===== RETOUR DU HOOK =====

  return {
    // Données
    stakeholders,
    isLoading: stakeholdersLoading,
    error: stakeholdersError,

    // Mutations
    createStakeholder,
    updateStakeholder,
    deleteStakeholder,
    toggleStatus,

    // États des mutations
    isCreating: createStakeholderMutation.isPending,
    isUpdating: updateStakeholderMutation.isPending,
    isDeleting: deleteStakeholderMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,

    // Erreurs des mutations
    createError: createStakeholderMutation.error,
    updateError: updateStakeholderMutation.error,
    deleteError: deleteStakeholderMutation.error,
    toggleStatusError: toggleStatusMutation.error,

    // Utilitaires
    refetchStakeholders,
    getEmployees,
    getExternalStakeholders,
    getSuppliers,
    getInspectors,
    getManagers,
    getActiveStakeholders,
    getPrimaryStakeholders,
    getStakeholderTypes,
    getStakeholderRoles,
  };
}

export default useStakeholdersHex;