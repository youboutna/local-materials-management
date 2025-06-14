
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PaymentTransferForm } from './PaymentTransferForm';
import { ProjectWithPayments } from '@/types/project';
import { useCreateProjectPayment } from '@/hooks/useProjectPayments';

interface PaymentDialogProps {
  project: ProjectWithPayments;
  onPaymentComplete?: () => void;
}

export function PaymentDialog({ project, onPaymentComplete }: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutateAsync: createPayment, isPending } = useCreateProjectPayment();

  const handleSubmit = async (paymentData: {
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
  }) => {
    try {
      await createPayment({
        projectId: project.id,
        payment: {
          amount: paymentData.amount,
          paymentDate: paymentData.paymentDate,
          paymentMethod: paymentData.paymentMethod,
          contractorId: paymentData.contractorId,
          contractorName: paymentData.contractorName,
          contractorContact: paymentData.contractorContact,
          bankName: paymentData.bankName,
          accountNumber: paymentData.accountNumber,
          checkNumber: paymentData.checkNumber,
          mobileNumber: paymentData.mobileNumber,
          mobileOperator: paymentData.mobileOperator,
          receiverName: paymentData.receiverName,
        }
      });
      setOpen(false);
      if (onPaymentComplete) onPaymentComplete();
    } catch (error) {
      console.error('Failed to create payment:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Effectuer un paiement</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Paiement du projet</DialogTitle>
          <DialogDescription>
            {project.title}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <PaymentTransferForm 
            project={project} 
            onSubmit={handleSubmit} 
            isSubmitting={isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
