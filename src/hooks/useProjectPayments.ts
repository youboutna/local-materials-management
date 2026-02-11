import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ProjectWithPayments, Payment } from '@/types/project';
import { useQuery } from '@tanstack/react-query';
import { PaymentService } from '@/application/services/PaymentService';
import { ProjectService } from '@/application/services/ProjectService';
import { InspectionService } from '@/application/services/InspectionService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { CreatePaymentDTO, PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';

interface CreatePaymentPayload {
  projectId: string;
  payment: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    contractorId?: string;
    contractorName: string;
    contractorContact: string;
    // Method-specific fields
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
      // Initialize services
      const projectService = new ProjectService(RepositoryFactory.getProjectRepository());
      const paymentService = new PaymentService(RepositoryFactory.getPaymentRepository());
      const inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());

      // First get the project to validate the payment
      const project = await projectService.getProjectById(projectId);
      if (!project) throw new Error('Project not found');

      // Get latest inspection for this project
      const inspections = await inspectionService.getInspectionsByProject(projectId);
      const latestInspection = inspections.length > 0 ? inspections[0] : undefined;
      
      // Create the new payment record using service
      const paymentDTO: CreatePaymentDTO = {
        projectId,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        progressAtPayment: project.progress || 0,
        inspectionId: latestInspection?.id,
        transactionId: `TX-${Date.now()}`,
        contractorId: payment.contractorId,
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

      // Update project status to 'payé' if full amount
      if (payment.amount >= (project.budget || 0)) {
        await projectService.updateProject(projectId, { status: 'payé' });
      }
      
      return createdPayment as Payment;
    },
    onSuccess: (data: Payment, variables) => {
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

interface ProjectWithBudget {
  progress?: number;
  budget?: number;
}

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

export const useProjectPayments = (projectId: string) => {
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project-with-payments', projectId],
    queryFn: async (): Promise<ProjectWithPayments | null> => {
      // Initialize services
      const projectService = new ProjectService(RepositoryFactory.getProjectRepository());
      const paymentService = new PaymentService(RepositoryFactory.getPaymentRepository());
      const inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());

      // Get project data
      const projectData = await projectService.getProjectById(projectId);
      if (!projectData) throw new Error('Project not found');

      // Get payments data
      const paymentsData = await paymentService.getPaymentsByProject(projectId);

      // Get inspections data
      const inspectionsData = await inspectionService.getInspectionsByProject(projectId);

      return {
        ...projectData,
        payments: paymentsData || [],
        inspections: inspectionsData || [],
      };
    },
    enabled: !!projectId,
  });

  const createPayment = async (paymentData: ProjectPayment) => {
    try {
      const paymentService = new PaymentService(RepositoryFactory.getPaymentRepository());
      const projectService = new ProjectService(RepositoryFactory.getProjectRepository());

      const paymentDTO: CreatePaymentDTO = {
        projectId,
        amount: paymentData.amount,
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
        progressAtPayment: paymentData.progress,
        contractorId: paymentData.contractorId,
        mobileNumber: paymentData.mobileNumber,
        mobileOperator: paymentData.mobileOperator,
        receiverName: paymentData.receiverName
      };

      const createdPayment = await paymentService.createPayment(paymentDTO);
      if (!createdPayment) throw new Error('Failed to create payment');

      // Update project progress if needed
      if (createdPayment.progressAtPayment !== undefined) {
        await projectService.updateProject(projectId, { 
          progress: createdPayment.progressAtPayment 
        });
      }

      toast({
        title: "Paiement ajouté",
        description: "Le paiement a été enregistré avec succès.",
      });

      return createdPayment as Payment;
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
