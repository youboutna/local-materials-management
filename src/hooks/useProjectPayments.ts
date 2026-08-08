import { getInspectionService } from '@/application/services/InspectionService';
import { PaymentService, getPaymentService} from '@/application/services/PaymentService';
import { ProjectService, getProjectService} from '@/application/services/ProjectService';
import { CreatePaymentDTO, PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface CreatePaymentPayload {
  projectId: string;
  payment: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    contractorId?: string;
    contractorName: string;
    contractorContact: string;
    bankName?: string;
    accountNumber?: string;
    checkNumber?: string;
    mobileNumber?: string;
    mobileOperator?: string;
    receiverName?: string;
  };
}

export const useCreateProjectPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, payment }: CreatePaymentPayload) => {
      const projectService = getProjectService();
      const paymentService = getPaymentService();
      const inspectionService = getInspectionService();

      const project = await projectService.getProjectById(projectId);
      if (!project) throw new Error('Project not found');

      const inspections = await inspectionService.getInspectionsByProject(projectId);
      const latestInspection = inspections.length > 0 ? inspections[0] : undefined;
      
      const paymentDTO: CreatePaymentDTO = {
        projectId,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        progressAtPayment: project.progress || 0,
        inspectionId: latestInspection?.id,
        transactionId: `TX-${Date.now()}`,
        contractorId: payment.contractorId || '',
        contractorName: payment.contractorName,
        contractorContact: payment.contractorContact,
        bankName: payment.bankName,
        accountNumber: payment.accountNumber,
        checkNumber: payment.checkNumber,
        mobileNumber: payment.mobileNumber,
        mobileOperator: payment.mobileOperator,
        receiverName: payment.receiverName,
      };

      const createdPayment = await paymentService.createPayment(paymentDTO);
      if (!createdPayment) throw new Error('Failed to create payment');

      if (payment.amount >= (project.budget || 0)) {
        await projectService.updateProject(projectId, { id: projectId, status: ProjectStatus.TERMINE });
      }
      
      return createdPayment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      toast({
        title: 'Paiement réussi',
        description: `Transfert de ${data.amount.toLocaleString()} MRU complété`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Échec du paiement',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

interface ProjectPayment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  progress?: number;
  contractorId?: string;
  mobileNumber?: string;
  mobileOperator?: string;
  receiverName?: string;
}

interface ProjectWithPaymentsData {
  id: string;
  title: string;
  description: string;
  budget: number;
  progress: number;
  status: string;
  payments: PaymentDTO[];
  inspections: Array<{
    id: string;
    date: string;
    status: string;
    inspector?: string;
    progress_at_inspection?: number;
    comments?: string;
  }>;
}

export const useProjectPayments = (projectId: string) => {
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project-with-payments', projectId],
    queryFn: async (): Promise<ProjectWithPaymentsData | null> => {
      const projectService = getProjectService();
      const paymentService = getPaymentService();
      const inspectionService = getInspectionService();

      const projectData = await projectService.getProjectById(projectId);
      if (!projectData) throw new Error('Project not found');

      const paymentsData = await paymentService.getPaymentsByProject(projectId);
      const inspectionsData = await inspectionService.getInspectionsByProject(projectId);

      return {
        id: projectData.id,
        title: projectData.title,
        description: projectData.description,
        budget: projectData.budget,
        progress: projectData.progress,
        status: projectData.status as string,
        payments: paymentsData || [],
        inspections: (inspectionsData || []).map(i => ({
          id: i.id,
          date: i.date || '',
          status: i.status as string,
          inspector: typeof i.inspector === 'string' ? i.inspector : (i.inspector as any)?.name,
          progress_at_inspection: i.progressAtInspection,
          comments: i.comments || undefined,
        })),
      };
    },
    enabled: !!projectId,
  });

  const createPayment = async (paymentData: ProjectPayment) => {
    try {
      const paymentService = getPaymentService();
      const projectService = getProjectService();

      const paymentDTO: CreatePaymentDTO = {
        projectId,
        amount: paymentData.amount,
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
        progressAtPayment: paymentData.progress || 0,
        contractorId: paymentData.contractorId || '',
        contractorName: '',
        contractorContact: '',
        transactionId: `TX-${Date.now()}`,
        mobileNumber: paymentData.mobileNumber,
        mobileOperator: paymentData.mobileOperator,
        receiverName: paymentData.receiverName
      };

      const createdPayment = await paymentService.createPayment(paymentDTO);
      if (!createdPayment) throw new Error('Failed to create payment');

      if (createdPayment.progressAtPayment !== undefined) {
        await projectService.updateProject(projectId, { 
          id: projectId,
          progress: createdPayment.progressAtPayment 
        });
      }

      toast({
        title: "Paiement ajouté",
        description: "Le paiement a été enregistré avec succès.",
      });

      return createdPayment;
    } catch (err) {
      console.error('Error creating payment:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le paiement.",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { project, isLoading: projectLoading, createPayment };
};
