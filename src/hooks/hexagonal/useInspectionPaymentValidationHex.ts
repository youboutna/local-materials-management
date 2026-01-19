import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { 
  GetInspectionWithPaymentRequestUseCase,
  GetProjectWithStakeholdersUseCase,
  UpdateInspectionStatusUseCase,
  GetContractorInfoUseCase,
  GetEngineerInfoUseCase
} from '@/application/use-cases/inspection/InspectionPaymentValidationUseCases';
import { InspectionDetails, ProjectDetails } from '@/domain/repositories/IInspectionPaymentValidationRepository';

export function useInspectionPaymentValidationHex(inspectionId: string) {
  const queryClient = useQueryClient();

  // Singleton instances des use cases
  const getInspectionWithPaymentRequestUseCase = new GetInspectionWithPaymentRequestUseCase();
  const getProjectWithStakeholdersUseCase = new GetProjectWithStakeholdersUseCase();
  const updateInspectionStatusUseCase = new UpdateInspectionStatusUseCase();
  const getContractorInfoUseCase = new GetContractorInfoUseCase();
  const getEngineerInfoUseCase = new GetEngineerInfoUseCase();

  // Fetch inspection details with payment request
  const { data: inspection, isLoading: inspectionLoading } = useQuery<InspectionDetails | null>({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      const result = await getInspectionWithPaymentRequestUseCase.execute(inspectionId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch inspection');
      }
      return result.inspection;
    },
    enabled: !!inspectionId,
  });

  // Fetch project details with external stakeholders (contractors)
  const { data: project } = useQuery({
    queryKey: ['project-summary', inspection?.project_id],
    queryFn: async () => {
      if (!inspection?.project_id) return null;
      const result = await getProjectWithStakeholdersUseCase.execute(inspection.project_id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch project');
      }
      return result.project;
    },
    enabled: !!inspection?.project_id,
  });

  // Update inspection status mutation
  const updateInspectionMutation = useMutation({
    mutationFn: async (data: { status: string; comments: string }) => {
      if (!inspectionId) throw new Error('Inspection ID missing');

      const result = await updateInspectionStatusUseCase.execute(inspectionId, data.status, data.comments);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update inspection');
      }
        
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] });
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Statut de l\'inspection mis à jour avec succès',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut de l\'inspection',
        variant: 'destructive',
      });
    },
  });

  // Get contractor info from project stakeholders
  const getContractorInfo = async (projectId: string) => {
    const result = await getContractorInfoUseCase.execute(projectId);
    return result.success ? result.contractor : null;
  };

  // Get engineer info from project stakeholders
  const getEngineerInfo = async (projectId: string) => {
    const result = await getEngineerInfoUseCase.execute(projectId);
    return result.success ? result.engineer : null;
  };

  return {
    inspection,
    project,
    isLoading: inspectionLoading,
    updateInspectionMutation,
    getContractorInfo,
    getEngineerInfo
  };
}
