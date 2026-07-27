import { InspectionService } from '@/application/services/InspectionService';
import { PaymentRequestService } from '@/application/services/PaymentRequestService';
import { ProjectService } from '@/application/services/ProjectService';
import { InspectionStatus } from '@/domain/entities/Inspection';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useInspectionPaymentValidationHex(inspectionId: string) {
  const queryClient = useQueryClient();

  // Services instances with proper repository arguments
  const inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());
  const paymentRequestService = new PaymentRequestService(RepositoryFactory.getPaymentRepository());
  const projectService = new ProjectService(RepositoryFactory.getProjectRepository());

  // Fetch inspection details with payment request
  const { data: inspection, isLoading: inspectionLoading } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      const result = await inspectionService.getInspectionById(inspectionId);
      if (!result) {
        throw new Error('Inspection not found');
      }
      return result;
    },
    enabled: !!inspectionId,
  });

  // Fetch project details with stakeholders
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', inspection?.projectId],
    queryFn: async () => {
      if (!inspection?.projectId) return null;
      const result = await projectService.getProjectById(inspection.projectId);
      if (!result) {
        throw new Error('Project not found');
      }
      return result;
    },
    enabled: !!inspection?.projectId,
  });

  // Fetch payment requests for inspection
  const { data: paymentRequests, isLoading: paymentLoading } = useQuery({
    queryKey: ['payment-requests', inspectionId],
    queryFn: async () => {
      if (!inspection?.projectId) return [];
      const result = await paymentRequestService.getPaymentRequestsByProject(inspection.projectId);
      // Filter payment requests related to this inspection (using description or notes)
      return result.filter(payment => 
        (payment as any).description?.includes(inspectionId) || 
        (payment as any).notes?.includes(inspectionId)
      );
    },
    enabled: !!inspection?.projectId,
  });

  // Update inspection status
  const updateInspectionStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: InspectionStatus; notes?: string }) => {
      if (!inspectionId) throw new Error('Inspection ID is required');
      
      // Update inspection status using the service
      const updatedInspection = await inspectionService.updateInspection(inspectionId, {
        status,
        comments: notes || '',
      } as any);
      return updatedInspection;
    },
    onSuccess: () => {
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de l\'inspection a été mis à jour avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur de mise à jour',
        description: 'Impossible de mettre à jour le statut de l\'inspection',
        variant: 'destructive',
      });
    },
  });

  // Get contractor info
  const getContractorInfo = async (contractorId: string) => {
    try {
      // Use supplier repository to get contractor info
      const supplierRepository = RepositoryFactory.getSupplierRepository();
      return await supplierRepository.findById(contractorId);
    } catch (error) {
      console.error('Failed to get contractor info:', error);
      return null;
    }
  };

  // Get engineer info
  const getEngineerInfo = async (engineerId: string) => {
    try {
      // Use user repository to get engineer info
      const userRepository = RepositoryFactory.getUserRepository();
      return await userRepository.findById(engineerId);
    } catch (error) {
      console.error('Failed to get engineer info:', error);
      return null;
    }
  };

  return {
    inspection,
    project,
    paymentRequests,
    isLoading: inspectionLoading || projectLoading || paymentLoading,
    updateInspectionStatus: updateInspectionStatusMutation.mutate,
    getContractorInfo,
    getEngineerInfo,
  };
}
