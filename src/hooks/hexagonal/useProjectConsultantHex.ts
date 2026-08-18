/**
 * useProjectConsultantHex
 * Désignation / révocation du consultant projet via ProjectConsultantService.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import {
  CONSULTANT_DESIGNATION_REFERENTIAL,
  canDesignateConsultant,
} from '@/config/referentials/consultant-designation.referential';
import type { ProjectConsultantDTO } from '@/application/services/ProjectConsultantService';

export function useProjectConsultantHex(projectId?: string) {
  const queryClient = useQueryClient();
  const { userRoles } = useCurrentUserRoles();
  const canDesignate = canDesignateConsultant(userRoles);

  const { data: stakeholders = [], isLoading } = useQuery<ProjectConsultantDTO[]>({
    queryKey: ['project-consultant-stakeholders', projectId],
    enabled: !!projectId,
    staleTime: 30_000,
    queryFn: async () => {
      const { getProjectConsultantService } = await import(
        '@/application/services/ProjectConsultantService'
      );
      return getProjectConsultantService().getProjectStakeholders(projectId!);
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['project-consultant-stakeholders', projectId] });
    queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
    queryClient.invalidateQueries({ queryKey: ['consultant-projects'] });
  };

  const designateMutation = useMutation({
    mutationFn: async (stakeholderId: string) => {
      const { getProjectConsultantService } = await import(
        '@/application/services/ProjectConsultantService'
      );
      await getProjectConsultantService().designateConsultant(projectId!, stakeholderId);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (stakeholderId: string) => {
      const { getProjectConsultantService } = await import(
        '@/application/services/ProjectConsultantService'
      );
      await getProjectConsultantService().revokeConsultant(stakeholderId);
    },
  });

  const labels = CONSULTANT_DESIGNATION_REFERENTIAL.labels.fr;

  const designateConsultantAction = async (stakeholderId: string) => {
    if (!canDesignate) {
      toast({ title: 'Action non autorisée', description: labels.unauthorized, variant: 'destructive' });
      return false;
    }
    try {
      await designateMutation.mutateAsync(stakeholderId);
      invalidate();
      toast({ title: labels.badge, description: 'Consultant désigné avec succès.' });
      return true;
    } catch (error) {
      toast({
        title: 'Échec de la désignation',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
      return false;
    }
  };

  const revokeConsultantAction = async (stakeholderId: string) => {
    if (!canDesignate) {
      toast({ title: 'Action non autorisée', description: labels.unauthorized, variant: 'destructive' });
      return false;
    }
    try {
      await revokeMutation.mutateAsync(stakeholderId);
      invalidate();
      toast({ title: labels.badge, description: 'Rôle consultant retiré.' });
      return true;
    } catch (error) {
      toast({
        title: 'Échec de la révocation',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    stakeholders,
    consultants: stakeholders.filter((s) => s.isConsultant),
    isLoading,
    canDesignate,
    labels,
    designateConsultant: designateConsultantAction,
    revokeConsultant: revokeConsultantAction,
    isPending: designateMutation.isPending || revokeMutation.isPending,
  };
}

export default useProjectConsultantHex;
